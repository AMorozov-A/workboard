# WorkBoard — Backend

REST API for the WorkBoard demo. Built with Express, Prisma and SQLite. All routes are mounted under `/api/v1` (see `src/app.ts`).

This package is part of the WorkBoard monorepo. The product overview and screenshots live in the [root README](../README.md).

## Responsibilities

- Authenticate users (register, login, `/me`, change password) and issue JWTs.
- Provide a one-call demo workspace bootstrap (`POST /auth/ensure-demo`).
- Own the data model and persistence for projects, tasks, comments and personal task notes.
- Enforce ownership: every request only sees projects, tasks, comments and notes that belong to the authenticated user.
- Expose a consistent JSON shape for errors and successful responses.

## Data model overview

```
User ─▶ Project ─▶ Task ─▶ Comment   (author = User)
                       └─▶ TaskNote  (personal, per-task)
```

- A `User` owns many `Project`s; a project belongs to exactly one user.
- A `Project` has a `taskKeyPrefix` used to format task keys (e.g. `T-1`, `WEB-12`).
- A `Task` belongs to a project; cascades on project delete.
- A `Comment` belongs to a task and carries an `author` (User).
- A `TaskNote` is a personal, per-task note for the project owner.

Full schema: [prisma/schema.prisma](prisma/schema.prisma). Migrations are committed under [prisma/migrations/](prisma/migrations/).

## Stack

| Layer      | Technology           |
| ---------- | -------------------- |
| Runtime    | Node.js              |
| Language   | TypeScript           |
| HTTP       | Express              |
| Database   | SQLite (file)        |
| ORM        | Prisma               |
| Passwords  | bcryptjs             |
| Auth       | JWT (`jsonwebtoken`) |
| Dev server | `tsx watch`          |

## Layout

| Path                      | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `src/index.ts`            | Entry: Prisma, `listen`, graceful shutdown                          |
| `src/app.ts`              | Express: `json`, logging, `/api/v1` router, 404, error handler      |
| `src/config/env.ts`       | `PORT`, `DATABASE_URL`, `JWT_*`                                     |
| `src/db/client.ts`        | `PrismaClient`                                                      |
| `src/routes/v1/index.ts`  | `ping`, `auth`, `projects`, `tasks`, `comments`, `task-notes`       |
| `src/modules/auth/`       | Register, login, `/me`, logout, change password, JWT, `requireAuth` |
| `src/modules/projects/`   | Project CRUD (owner-only)                                           |
| `src/modules/tasks/`      | Task CRUD (within user's projects)                                  |
| `src/modules/comments/`   | List / create / delete on `/tasks/:taskId/comments`                 |
| `src/modules/task-notes/` | Task notes CRUD on `/tasks/:taskId/notes`                           |
| `prisma/schema.prisma`    | Data model                                                          |
| `prisma/migrations/`      | SQL migrations (committed)                                          |

## Environment

Copy `.env.example` → `.env`. Do not commit real secrets.

| Variable          | Description                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`            | HTTP port (default `3001` in code if unset)                                                                                    |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. `http://localhost:5173,https://app.netlify.app`). Default if unset: `http://localhost:5173` |
| `DATABASE_URL`    | SQLite URL, e.g. `file:./dev.db` (path relative to `prisma/`)                                                                  |
| `JWT_SECRET`      | JWT signing secret (use a long random string in production)                                                                    |
| `JWT_EXPIRES_IN`  | Token lifetime (e.g. `7d`)                                                                                                     |

Template: [.env.example](.env.example).

## Development

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

| Command         | What it does                                                |
| --------------- | ----------------------------------------------------------- |
| `npm run dev`   | `tsx watch` dev server                                      |
| `npm run build` | `prisma generate` + `tsc` → `dist/`                         |
| `npm start`     | `prisma migrate deploy` + `prisma db seed` + `node dist/`   |

### Prisma

```bash
npx prisma migrate dev      # develop / create migrations
npx prisma migrate deploy   # CI / production
npx prisma studio           # browse data
npx prisma generate         # client (also part of npm run build)
```

### SQLite file

With `DATABASE_URL="file:./dev.db"`, the database file lives at `backend/prisma/dev.db`. Local `*.db` files are gitignored.

## Testing

```bash
cd backend
npm test
npm run test:watch
npm run test:ui
npm run test:coverage
```

Stack: Vitest + Supertest. Config in [vitest.config.ts](vitest.config.ts), setup in [tests/setup.ts](tests/setup.ts).

Coverage highlights: `auth/register` (integration), projects CRUD + integration, comments (integration), auth service unit tests, smoke (register/login/me), project mapper/parse unit tests. There is no dedicated HTTP test file for `/tasks` yet — task routes are exercised through the frontend and e2e suites.

## API overview

Base URL in examples: `http://localhost:3001`. Paths are relative to `/api/v1`.

### Public (no JWT)

| Method | Path                  | Description                                           |
| ------ | --------------------- | ----------------------------------------------------- |
| GET    | `/ping`               | Health: `{ ok: true, message: "pong" }`               |
| POST   | `/auth/register`      | Body: `{ email, password, name? }` → 201 + user + JWT |
| POST   | `/auth/login`         | Body: `{ email, password }` → 200 + user + JWT        |
| POST   | `/auth/ensure-demo`   | Creates demo user + demo workspace if missing         |

### Auth (JWT: `Authorization: Bearer <token>`)

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/auth/me`       | Current user `{ ok: true, user }`        |
| POST   | `/auth/logout`   | 204 — stateless JWT; client drops token  |
| PATCH  | `/auth/password` | Body: `{ currentPassword, newPassword }` |

### Projects (JWT, own projects only)

| Method | Path            | Description                                                                                                     |
| ------ | --------------- | --------------------------------------------------------------------------------------------------------------- |
| GET    | `/projects`     | List projects for the user                                                                                      |
| POST   | `/projects`     | Create (`title` required; optional `description`, `client`, `status`, `budget`, `deadline`, `taskKeyPrefix`, …) |
| GET    | `/projects/:id` | One project (404 if missing or not owned)                                                                       |
| PATCH  | `/projects/:id` | Partial update                                                                                                  |
| DELETE | `/projects/:id` | Delete (204 empty body)                                                                                         |

### Tasks (JWT; tasks must belong to one of the user's projects)

| Method | Path                        | Description                                                                                   |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------- |
| POST   | `/tasks`                    | Body: `projectId`, `title`, optional `description`, `status`, `priority`, `dueDate`, `labels` |
| GET    | `/tasks/project/:projectId` | List tasks for project                                                                        |
| PATCH  | `/tasks/:id`                | Partial update                                                                                |
| DELETE | `/tasks/:id`                | Delete (204)                                                                                  |

### Comments (JWT; task must belong to the user)

Nested under `/tasks/:taskId/comments`. Registered before the generic `/tasks` router in `src/routes/v1/index.ts`.

| Method | Path                                 | Description                                                                   |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| GET    | `/tasks/:taskId/comments`            | `{ ok: true, items: Comment[] }` — each item includes `author: { id, email }` |
| POST   | `/tasks/:taskId/comments`            | Body: `{ body: string }` → 201 `{ ok: true, comment }`                        |
| DELETE | `/tasks/:taskId/comments/:commentId` | 403 if not the comment author; 204 empty body on success                      |

### Task notes (JWT; task must belong to the user)

Nested under `/tasks/:taskId/notes`.

| Method | Path                           | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/tasks/:taskId/notes`         | `{ ok: true, items: TaskNote[] }`    |
| POST   | `/tasks/:taskId/notes`         | Body: `{ key, title?, body }` → 201  |
| PATCH  | `/tasks/:taskId/notes/:noteId` | Body: `{ title?, body? }` → 200      |
| DELETE | `/tasks/:taskId/notes/:noteId` | 204 empty body                       |

### Errors

- `HttpError` (`src/shared/http-error.ts`) carries a `statusCode`.
- Global handler returns `{ ok: false, message }` as JSON.
- Common codes: 400 validation, 401 auth, 404 not found, 409 duplicate email, 403 not the comment author.

## Known limitations

- Comments: no PATCH (edit) endpoint yet.
- Tasks: no Supertest suite under `tests/` for generic task routes (covered indirectly).
- Production: pick a strong `JWT_SECRET`, run `prisma migrate deploy`, add structured logging and tighten CORS as needed.

Update this file when routes in `src/routes/v1` or `prisma/schema.prisma` change.
