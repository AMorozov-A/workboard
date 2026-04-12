# WorkBoard — Backend

REST API for the WorkBoard demo. All routes are mounted under `**/api/v1**` (see `src/app.ts`).

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


Scripts and dependencies: `package.json`.

## Layout


| Path                     | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `src/server.ts`          | Entry: Prisma, `listen`, graceful shutdown                                 |
| `src/app.ts`             | Express: `json`, logging, `/api/v1` router, 404, error handler             |
| `src/config/env.ts`      | `PORT`, `DATABASE_URL`, `JWT_*`                                            |
| `src/db/client.ts`       | `PrismaClient`                                                             |
| `src/routes/v1/index.ts` | `ping`, `auth`, `projects`, `tasks`, `comments`                            |
| `src/modules/auth/`      | Register, login, `/me`, logout, change password, JWT, `requireAuth`        |
| `src/modules/projects/`  | Project CRUD (owner-only)                                                  |
| `src/modules/tasks/`     | Task CRUD (within user’s projects)                                         |
| `src/modules/comments/`  | List / create / delete for a task (nested under `/tasks/:taskId/comments`) |
| `prisma/schema.prisma`   | Data model                                                                 |
| `prisma/migrations/`     | SQL migrations (committed to git)                                          |


## Environment

Copy `**.env.example**` → `**.env**`. Do not commit real secrets.


| Variable           | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `PORT`             | HTTP port (default `3001` in code if unset)                                 |
| `ALLOWED_ORIGINS`  | Comma-separated CORS origins (e.g. `http://localhost:5173,https://app.netlify.app`). Default if unset: `http://localhost:5173` |
| `DATABASE_URL`     | SQLite URL, e.g. `file:./dev.db` (path relative to `prisma/`)                 |
| `JWT_SECRET`       | JWT signing secret (use a long random string in production)                 |
| `JWT_EXPIRES_IN`   | Token lifetime (e.g. `7d`)                                                  |


Template: [.env.example](.env.example)

## Commands

```bash
cd backend
npm install
npm run dev          # tsx watch
npm run build        # prisma generate + tsc → dist/
npm start            # node dist/server.js (after build)
```

### Prisma

```bash
npx prisma migrate dev      # develop / create migrations
npx prisma migrate deploy   # CI / production
npx prisma studio           # browse data
npx prisma generate         # client (also part of npm run build)
```

### SQLite file

With `DATABASE_URL="file:./dev.db"`, the file is usually:

`backend/prisma/dev.db`

---

## Data model (short)

- **User** → **Project** → **Task** → **Comment** (comments persist in SQLite; each comment has an **author** user).

Full fields: `prisma/schema.prisma`.

---

## API

Base URL in examples: `http://localhost:3001`. Paths are relative to `**/api/v1`**.

### Public (no JWT)


| Method | Path             | Description                                           |
| ------ | ---------------- | ----------------------------------------------------- |
| GET    | `/ping`          | Health: `{ ok: true, message: "pong" }`               |
| POST   | `/auth/register` | Body: `{ email, password, name? }` → 201 + user + JWT |
| POST   | `/auth/login`    | Body: `{ email, password }` → 200 + user + JWT        |


### Auth (JWT: `Authorization: Bearer <token>`)


| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/auth/me`       | Current user `{ ok: true, user }`        |
| POST   | `/auth/logout`   | 204 — stateless JWT; client drops token  |
| PATCH  | `/auth/password` | Body: `{ currentPassword, newPassword }` |


### Projects (JWT, own projects only)


| Method | Path            | Description                                                                                    |
| ------ | --------------- | ---------------------------------------------------------------------------------------------- |
| GET    | `/projects`     | List projects for the user                                                                     |
| POST   | `/projects`     | Create (`title` required; optional `description`, `client`, `status`, `budget`, `deadline`, …) |
| GET    | `/projects/:id` | One project (404 if missing or not owned)                                                      |
| PATCH  | `/projects/:id` | Partial update                                                                                 |
| DELETE | `/projects/:id` | Delete (**204** empty body)                                                                    |


### Tasks (JWT, tasks only inside user’s projects)


| Method | Path                        | Description                                                                                   |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------- |
| POST   | `/tasks`                    | Body: `projectId`, `title`, optional `description`, `status`, `priority`, `dueDate`, `labels` |
| GET    | `/tasks/project/:projectId` | List tasks for project                                                                        |
| PATCH  | `/tasks/:id`                | Partial update                                                                                |
| DELETE | `/tasks/:id`                | Delete (**204**)                                                                              |


### Comments (JWT; task must belong to the user)

Nested under `**/tasks/:taskId/comments`** (see `src/routes/v1/index.ts` — registered **before** the generic `/tasks` router).


| Method | Path                                 | Description                                                                   |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| GET    | `/tasks/:taskId/comments`            | `{ ok: true, items: Comment[] }` — each item includes `author: { id, email }` |
| POST   | `/tasks/:taskId/comments`            | Body: `{ body: string }` → **201** `{ ok: true, comment }`                    |
| DELETE | `/tasks/:taskId/comments/:commentId` | **403** if not the comment author; **200** `{ ok: true }` on success          |


---

## Errors

- `HttpError` (`src/shared/http-error.ts`) with `statusCode`.  
- Global handler: JSON `{ ok: false, message }`.  
- Typical: **400** validation, **401** auth, **404** not found, **409** duplicate email.

---

## Tests


|                |                                                                                        |
| -------------- | -------------------------------------------------------------------------------------- |
| Test files     | **9** (`tests/**/*.test.ts`, `src/**/*.test.ts`)                                       |
| Tests (Vitest) | **94** total (**93** passed, **1** skipped — rate limit placeholder in register suite) |
| Config         | [vitest.config.ts](vitest.config.ts)                                                   |
| Setup          | [tests/setup.ts](tests/setup.ts)                                                       |


```bash
cd backend
npm test
npm run test:watch
npm run test:ui
npm run test:coverage
```

Coverage highlights: **auth/register** (integration), **projects** CRUD + integration, **comments** (integration), **auth** service unit tests, **smoke** (register/login/me), project **mapper/parse** unit tests. **No dedicated HTTP test file for `/tasks` yet.**

---

## Frontend

The React app lives in `**../frontend`**. It usually calls `/api` via the Vite proxy in development.

---

## Known limitations

- **Comments**: no **PATCH** (edit) endpoint yet.  
- **Tasks**: no Supertest suite under `tests/` for generic task routes (manual / frontend e2e exercise the API).  
- **Production**: use a strong `JWT_SECRET`, `prisma migrate deploy`, structured logging, CORS if needed.

Update this file when routes in `src/routes/v1` or `prisma/schema.prisma` change.