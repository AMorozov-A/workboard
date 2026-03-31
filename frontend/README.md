# Freelance CRM — Frontend

Portfolio demo (not a production CRM). Main flow: **login / register** → **workspace** → **projects list** → **project page** → **tasks** (table + drawer). Data for projects and tasks comes from the backend API.

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

- HTTP base: `VITE_API_BASE_URL`; if unset, **`/api`** (same origin).  
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
- Logout in the app header.  
- **Change password** modal (`PATCH /api/v1/auth/password`).  
- Protected routes under `/app`; redirects for guests vs authenticated users.

### Projects

- List, create (modal), **edit** (modal), **delete** (confirm).  
- Mapping: UI **name** ↔ API **title** ([entities/project](src/entities/project)).

### Tasks

- List by project; create (modal); **inline** title/description edit in the drawer; status / meta; **delete** with confirmation.  
- Mutations invalidate the correct TanStack Query keys.

### Comments

- **GET** client exists (`listCommentsByTask`, `useTaskCommentsQuery`), but the API returns an empty list.  
- The task drawer implements a **comments tab with local React state** only (not persisted across reloads).

### Other

- i18n for auth, layout, projects, tasks, notifications.  
- MSW used in unit tests ([src/mocks](src/mocks)).

---

## FSD layout

| Layer | Role |
|-------|------|
| `src/app` | Providers, Redux store, router, auth guards |
| `src/pages` | Login, projects list, project detail |
| `src/widgets` | App shell, task drawer |
| `src/features` | Auth forms, change password, project CRUD modals, task create/delete, task inline edit |
| `src/entities` | Types, query/mutation hooks, API mappers |
| `src/shared` | UI helpers, i18n, HTTP client, API service |

Entry points: [app/router/AppRouter.tsx](src/app/router/AppRouter.tsx), [app/store](src/app/store).

---

## Tests

| | |
|--|--|
| Test files | **13** (files named `*.test.ts` / `*.test.tsx` under `src/`) |
| Tests (Vitest) | **95** |
| Config | [vite.config.ts](vite.config.ts) (`test` section) |
| Setup | [tests/setup.ts](tests/setup.ts) |

```bash
cd frontend
npm test              # once
npm run test:watch
npm run test:ui
npm run test:coverage
```

---

## Known limitations

- **Comments**: no full CRUD vs backend; drawer comments are **in-memory** for the session.  
- **Task editing**: inline editors are not covered by a large dedicated test file (unlike delete/create flows).  
- **E2E** lives in the root `e2e/` package (Russian UI selectors).
