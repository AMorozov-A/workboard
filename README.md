# Freelance CRM

A portfolio-grade demo of a small **freelance project workspace**: sign in, browse **projects**, open a **project**, manage **tasks** in a **table or kanban** view and in the task drawer, with **persisted comments** (API + Prisma). This is a **monorepo without a root `node_modules`**: each package (`frontend/`, `backend/`, `e2e/`) has its own `package.json` and dependencies.

The goal is a clean, interactive showcase (React + Express + Prisma) with automated tests—not a production SaaS.

## Stack


| Area         | Technologies                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite, Ant Design, TanStack Query, Redux Toolkit, React Router, i18next (en/ru), React Hook Form + Zod, MSW (unit tests) |
| **Backend**  | Node.js, Express, Prisma, SQLite, JWT (bcryptjs)                                                                                              |
| **Tests**    | Vitest (backend + frontend), Playwright (e2e, Chromium)                                                                                       |


Details: **[frontend/README.md](frontend/README.md)** · **[backend/README.md](backend/README.md)**

## Requirements

- **Node.js** — see [frontend/.nvmrc](frontend/.nvmrc) (≥ 20.19 for the frontend package).

## Run locally

### Backend

```bash
cd backend
npm install
cp .env.example .env   # first clone only
npx prisma migrate dev
npm run dev
```


|               |                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| API (dev)     | `http://localhost:3001/api/v1`                                                     |
| Health        | `GET /api/v1/ping`                                                                 |
| Prisma Studio | `cd backend && npx prisma studio` → [http://localhost:5555](http://localhost:5555) |
| Env template  | [backend/.env.example](backend/.env.example)                                       |


### Frontend

```bash
cd frontend
npm install
npm run dev
```


|           |                                                                             |
| --------- | --------------------------------------------------------------------------- |
| App       | [http://localhost:5173](http://localhost:5173)                              |
| API proxy | [frontend/vite.config.ts](frontend/vite.config.ts) proxies `/api` → backend |


Run the backend in another terminal when you need auth and CRUD.

### E2E (Playwright)

From the **repository root**:

```bash
cd e2e && npm install && npx playwright install chromium   # first time
cd .. && npm run test:e2e
```

Config: [e2e/playwright.config.ts](e2e/playwright.config.ts) (starts API + Vite).

### All tests

```bash
npm run test:all
```

Runs **backend** Vitest → **frontend** Vitest → **e2e** Playwright.

Individual packages:

```bash
cd backend && npm test
cd frontend && npm test
npm run test:e2e    # from repo root
```

## Repo layout (top level)

```
.
├── backend/          # Express API, Prisma schema & migrations
├── e2e/              # Playwright tests (separate package)
├── frontend/         # Vite + React app (FSD)
├── package.json      # root scripts only (test:e2e, test:all)
└── README.md         # this file
```

## What is covered by tests


| Suite             | Files         | Tests / scenarios                                                    |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| Backend (Vitest)  | 9 test files  | **94** tests (**93** passed, **1** skipped — rate-limit placeholder) |
| Frontend (Vitest) | 14 test files | **100** tests                                                        |
| E2E (Playwright)  | 2 spec files  | **15** scenarios (auth + projects/tasks flows)                       |


## Known limitations

- **Comments**: full list/create/delete under `**/api/v1/tasks/:taskId/comments`** (JWT); comments are stored with an **author** (`User`). There is no PATCH/edit endpoint yet.
- **Backend Tasks API**: full CRUD is implemented; there are **no dedicated HTTP integration tests** for `/tasks` (unlike projects).
- **Task inline edit** (`TaskTitleInlineEdit`, `TaskDescriptionInlineEdit`): covered indirectly; **no dedicated component test suite** like for delete/create modals.
- **i18n in e2e**: scenarios use **Russian** UI strings for stability.
- **Portfolio scope**: no production hardening (rate limiting optional, single-user demo data patterns).

---

## Environment variables

- **Backend:** copy [backend/.env.example](backend/.env.example) → `backend/.env`.
- **Frontend:** optional `VITE_API_BASE_URL`; in dev, `/api` via Vite proxy is typical — see [frontend/README.md](frontend/README.md).

## Database (Prisma + SQLite)


| Topic      | Location                                                     |
| ---------- | ------------------------------------------------------------ |
| Schema     | [backend/prisma/schema.prisma](backend/prisma/schema.prisma) |
| Migrations | [backend/prisma/migrations/](backend/prisma/migrations/)     |


E2E uses a temporary SQLite file under the system temp directory (see [e2e/e2e-database.ts](e2e/e2e-database.ts)); local `*.db` files are gitignored.

## API

Full route list: **[backend/README.md](backend/README.md)** (all paths under `/api/v1`).

## Conventions

- Frontend follows **Feature-Sliced Design** — see [frontend/README.md](frontend/README.md).

## Misc


| Task           | Command                        |
| -------------- | ------------------------------ |
| Lint frontend  | `cd frontend && npm run lint`  |
| Build frontend | `cd frontend && npm run build` |
| Build backend  | `cd backend && npm run build`  |


Legacy note: [DEVELOPER_DASHBOARD.md](DEVELOPER_DASHBOARD.md).