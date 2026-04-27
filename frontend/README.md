# WorkBoard — Frontend

Portfolio demo (not a production CRM). Main flow: **login / register** → **workspace** → **projects list** → **project page** → **tasks** (table **or kanban** + drawer). Data for projects, tasks, and comments comes from the backend API.

## Stack

- React, TypeScript, Vite  
- Ant Design  
- TanStack Query (server state)  
- Redux Toolkit (session / token)  
- i18next (en / ru)  
- React Router  
- React Hook Form + Zod  
- Architecture: **Feature-Sliced Design** — `app`, `pages`, `widgets`, `features`, `entities`, `shared`

## API & env

- HTTP base: `VITE_API_BASE_URL`; if unset, `**/api`** (same origin).  
- In **dev**, [vite.config.ts](vite.config.ts) proxies `/api` to the backend (default `http://localhost:3001`).  
- Restart the backend after API changes to avoid stale 404s.

## Run

```bash
cd frontend
npm install
npm run dev
```

Start the backend separately when you need auth and CRUD: `cd ../backend && npm run dev`.

---

## Features

### Auth

- Login / register on one screen (segmented control).  
- JWT `accessToken` in `localStorage` + Redux; `Authorization: Bearer` on API calls.  
- Session bootstrap: `GET /api/v1/auth/me` when a token exists.  
- “Try Demo Account” button: calls `POST /api/v1/auth/ensure-demo`, then logs in with the demo credentials.  
- Logout in the app header.  
- **Change password** modal (`PATCH /api/v1/auth/password`).  
- Protected routes under `/projects` and `/profile`; redirects for guests vs authenticated users.

### Projects

- List, create (modal), **edit** (modal), **delete** (confirm).  
- Mapping: UI **name** ↔ API **title** ([entities/project](src/entities/project)).
- Project creation includes `taskKeyPrefix` (used for task keys like `T-1`). It cannot be changed after project creation (UI shows it as read-only).

### Tasks

- List by project; create (modal); **inline** title/description edit in the drawer; status / meta; **delete** with confirmation.  
- **Kanban** view on the project page (drag-and-drop between status columns where implemented).  
- Task notes (personal): create/update/delete notes in the task modal (API: `/api/v1/tasks/:taskId/notes`).  
- Mutations invalidate the correct TanStack Query keys.

### Comments

- **TanStack Query** hooks in `@entities/comment` load, create, and delete comments for the open task (`GET/POST/DELETE` → `/api/v1/tasks/:taskId/comments`).  
- Comments are **persisted** in the database; the drawer shows **author** (from the API).

### Other

- i18n for auth, layout, projects, tasks, notifications.  
- MSW used in unit tests ([src/mocks](src/mocks)).

---

## FSD layout


| Layer          | Role                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| `src/app`      | Providers, Redux store, router, auth guards                                            |
| `src/pages`    | Login, projects list, project detail, profile                                          |
| `src/widgets`  | App shell, task drawer                                                                 |
| `src/features` | Auth forms, change password, project CRUD modals, task create/delete, task inline edit |
| `src/entities` | Types, query/mutation hooks, API mappers                                               |
| `src/shared`   | UI helpers, i18n, HTTP client, API service                                             |


Entry points: [app/router/AppRouter.tsx](src/app/router/AppRouter.tsx), [app/store](src/app/store).

---

## Tests


|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| Tests (Vitest) | See `npm test` output for current counts                     |
| Config         | [vite.config.ts](vite.config.ts) (`test` section)            |
| Setup          | [tests/setup.ts](tests/setup.ts)                             |


```bash
cd frontend
npm test              # once
npm run test:watch
npm run test:ui
npm run test:coverage
```

---

## Known limitations

- **Comments**: no **edit** (PATCH) in the API or UI yet.  
- **Task editing**: inline editors are not covered by a large dedicated test file (unlike delete/create flows).  
- **E2E** lives in the root `e2e/` package (Russian UI selectors).

