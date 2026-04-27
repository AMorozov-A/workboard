# WorkBoard — E2E

Playwright end-to-end suite for WorkBoard. Drives the real frontend against the real backend with a dedicated SQLite database, so the same code paths users hit in the demo are also covered by tests.

This package is part of the WorkBoard monorepo. The product overview and screenshots live in the [root README](../README.md).

## Covered flows

| Spec                                       | What it verifies                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| [auth.spec.ts](auth.spec.ts)               | Login / register tabs, registration → workspace, re-login after logout, duplicate email error, redirect for unauthenticated users |
| [projects.spec.ts](projects.spec.ts)       | Create / edit / delete a project (with cancel-confirmation), navigation into a project, full task lifecycle (create → drawer → delete), validation, server-error notifications |

The suite touches the same screens shown in the product tour:

- Demo login flow: [../docs/screenshots/login_demo.gif](../docs/screenshots/login_demo.gif)
- Projects list: [../docs/screenshots/projects.png](../docs/screenshots/projects.png)
- Task table: [../docs/screenshots/tasks.png](../docs/screenshots/tasks.png)
- Task filtering: [../docs/screenshots/filter.gif](../docs/screenshots/filter.gif)
- Kanban view: [../docs/screenshots/kanban.png](../docs/screenshots/kanban.png)
- Task drawer: [../docs/screenshots/taskDrawer.png](../docs/screenshots/taskDrawer.png)

## Why this package matters

- Real stack, no mocks: each test boots the actual Express API and Vite dev server, then drives Chromium against `http://localhost:5173`.
- Isolated database: tests run on a temporary SQLite file under the system temp directory (see [e2e-database.ts](e2e-database.ts)). The previous file is removed before the API starts, so suites are deterministic.
- Treats the system as a black box: assertions go through visible UI (roles, placeholders, dialogs) instead of internal selectors.
- Shared helpers ([helpers/auth.ts](helpers/auth.ts), [helpers/projects.ts](helpers/projects.ts)) keep specs short while still exercising the API where it makes the test cheaper (e.g. registering a user via API before a UI login).
- Russian UI selectors are pinned via Playwright `storageState` ([ru-language.storage.json](ru-language.storage.json)) so locale changes in the app do not break specs silently.

## Run tests

From the repository root, the recommended way to run Playwright is via the root script:

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:headed   # headed Chromium
```

First-time setup for this package:

```bash
cd e2e
npm install
npx playwright install chromium
```

Direct invocation from inside `e2e/`:

```bash
npm test           # playwright test
npm run test:ui    # playwright test --ui
npm run test:headed
```

Playwright is configured to start both the backend and the Vite dev server itself — see [playwright.config.ts](playwright.config.ts). The backend is launched with a separate `DATABASE_URL` pointing at the temporary e2e SQLite file, so it never touches your local `dev.db`.
