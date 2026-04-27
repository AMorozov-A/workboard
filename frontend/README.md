# WorkBoard — Frontend

React + TypeScript app that powers the WorkBoard demo. It owns the entire user-facing flow: authentication, projects list, project detail with task table or kanban view, and a side drawer for task details with persisted comments and personal notes.

This package is part of the WorkBoard monorepo. Repo overview, screenshots and live demo links live in the [root README](../README.md).

## UI preview


| Screen        | Preview     |
| ------------- | ----------- |
| Auth          | Auth        |
| Projects list | Projects    |
| Project tasks | Tasks       |
| Task drawer   | Task drawer |
| Kanban board  | Kanban      |


Interactive flows (recorded in the running app):

- Task table interactions: [../docs/screenshots/actions_table.gif](../docs/screenshots/actions_table.gif)
- Task filtering: [../docs/screenshots/filter.gif](../docs/screenshots/filter.gif)

## What the frontend demonstrates

- Clean Feature-Sliced Design layout (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- TanStack Query for server state (projects, tasks, comments, task notes) with proper invalidation on mutations.
- Redux Toolkit for session / token state only — no over-engineered global store.
- Forms built with React Hook Form + Zod validation.
- Two parallel views of the same task list: a sortable / filterable table and a drag-and-drop kanban board.
- Task drawer with inline title and description editing, status changes, persisted comments and personal task notes.
- i18n (English / Russian) wired through all main screens.
- Unit tests with Vitest, with API mocked through MSW.

## Tech stack

- React 19, TypeScript, Vite
- Ant Design
- TanStack Query (server state)
- Redux Toolkit (session / token)
- React Router
- React Hook Form + Zod
- i18next (en / ru)
- MSW for unit-test API mocks
- Architecture: Feature-Sliced Design

## App flow

```
/login (login + register tabs, "Try Demo Account")
   │
   ▼
/projects (list, create / edit / delete)
   │
   ▼
/projects/:id (table or kanban view)
   │
   ├── Task drawer (inline edits, comments, notes)
   └── Profile / change password
```


| Layer          | Role                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| `src/app`      | Providers, Redux store, router, auth guards                                            |
| `src/pages`    | Login, projects list, project detail, profile                                          |
| `src/widgets`  | App shell, task drawer                                                                 |
| `src/features` | Auth forms, change password, project CRUD modals, task create/delete, task inline edit |
| `src/entities` | Types, query/mutation hooks, API mappers                                               |
| `src/shared`   | UI helpers, i18n, HTTP client, API service                                             |


Entry points: [src/app/router/AppRouter.tsx](src/app/router/AppRouter.tsx), [src/app/store](src/app/store).

## Development

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173).


| What          | Command                 |
| ------------- | ----------------------- |
| Dev server    | `npm run dev`           |
| Lint          | `npm run lint`          |
| Build         | `npm run build`         |
| Tests (once)  | `npm test`              |
| Tests (watch) | `npm run test:watch`    |
| Test UI       | `npm run test:ui`       |
| Coverage      | `npm run test:coverage` |


Backend pairing:

- HTTP base: `VITE_API_BASE_URL` if set, otherwise `/api` (same origin).
- In dev, [vite.config.ts](vite.config.ts) proxies `/api` to the backend (default `http://localhost:3001`).
- Start the backend separately when you need auth and CRUD: `cd ../backend && npm run dev`.

Test config and setup live in [vite.config.ts](vite.config.ts) (`test` section) and [tests/setup.ts](tests/setup.ts).