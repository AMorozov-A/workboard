# Freelance CRM

Демо-приложение для портфолио: **логин** → рабочая область → **проекты** → **задачи** и комментарии (частично). Монорепозиторий без общего `node_modules`: у каждой части свой `package.json` и свои зависимости.

| Часть | Стек (кратко) | Подробнее |
|--------|----------------|-----------|
| [frontend/](frontend/) | React, TypeScript, Vite, Ant Design, TanStack Query, Redux Toolkit, FSD | **[frontend/README.md](frontend/README.md)** |
| [backend/](backend/) | Node.js, Express, Prisma, SQLite, JWT | **[backend/README.md](backend/README.md)** |
| [e2e/](e2e/) | Playwright (Chromium), отдельный npm-пакет | раздел [E2E](#e2e-playwright) ниже |

---

## Требования

- **Node.js** — см. [frontend/.nvmrc](frontend/.nvmrc) (в проекте задано ≥ 20.19 для фронта).

---

## Быстрый старт

### Backend

```bash
cd backend
npm install
cp .env.example .env   # при первом клонировании
npx prisma migrate dev
npm run dev
```

| | |
|--|--|
| API (dev) | `http://localhost:3001/api/v1` |
| Health | [GET `/api/v1/ping`](http://localhost:3001/api/v1/ping) |
| Prisma Studio | `cd backend && npx prisma studio` → [http://localhost:5555](http://localhost:5555) |
| SQLite (dev) | обычно [`backend/prisma/dev.db`](backend/prisma/dev.db) при `DATABASE_URL` из [backend/.env.example](backend/.env.example) |
| Схема БД | [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

| | |
|--|--|
| Приложение | [http://localhost:5173](http://localhost:5173) |
| Прокси `/api` → backend | [`frontend/vite.config.ts`](frontend/vite.config.ts) |

Подробности по экранам, FSD и ограничениям UI — **[frontend/README.md](frontend/README.md)**.

---

## База данных (Prisma + SQLite)

| Файл / тема | Ссылка |
|-------------|--------|
| Схема и модели | [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) |
| Миграции | [`backend/prisma/migrations/`](backend/prisma/migrations/) |
| Переменные (`DATABASE_URL` и др.) | [`backend/.env.example`](backend/.env.example) |
| Команды Prisma (migrate, studio) | **[backend/README.md](backend/README.md)** (разделы Prisma и «Где лежит SQLite») |

**Тестовая БД (Vitest, backend):** см. [backend/README.md](backend/README.md) и [`backend/vitest.config.ts`](backend/vitest.config.ts).

**E2E:** отдельный файл SQLite в системном temp — логика пути в [`e2e/e2e-database.ts`](e2e/e2e-database.ts); перед прогоном e2e миграции накатываются в команде старта API (см. [`e2e/playwright.config.ts`](e2e/playwright.config.ts)).

---

## Тесты

### Backend — Vitest (+ Supertest)

```bash
cd backend
npm test              # однократно
npm run test:watch
npm run test:coverage
```

| | |
|--|--|
| Конфиг | [`backend/vitest.config.ts`](backend/vitest.config.ts) |
| Setup | [`backend/tests/setup.ts`](backend/tests/setup.ts) |
| Тесты | `backend/tests/**/*.test.ts` |

### Frontend — Vitest (+ Testing Library)

```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

| | |
|--|--|
| Конфиг (секция `test`) | [`frontend/vite.config.ts`](frontend/vite.config.ts) |
| Setup | [`frontend/tests/setup.ts`](frontend/tests/setup.ts) |
| Тесты | `frontend/src/**/*.test.ts`, `*.test.tsx` |

### E2E — Playwright

Из **корня** репозитория (скрипты делегируют в пакет [`e2e/package.json`](e2e/package.json)):

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI
npm run test:e2e:headed   # видимый браузер
```

Или из каталога `e2e/`:

```bash
cd e2e
npm install               # первый раз / после клона
npx playwright install chromium
npm test
```

| | |
|--|--|
| Конфиг | [`e2e/playwright.config.ts`](e2e/playwright.config.ts) |
| Спеки | [`e2e/*.spec.ts`](e2e/) (например [`e2e/auth.spec.ts`](e2e/auth.spec.ts)) |
| Хелперы | [`e2e/helpers/auth.ts`](e2e/helpers/auth.ts) |
| Заготовка фикстур | [`e2e/fixtures/index.ts`](e2e/fixtures/index.ts) |

Playwright поднимает **оба** сервера (backend `:3001`, frontend `:5173`). Отчёты и артефакты — в `playwright-report/`, `test-results/` (см. [.gitignore](.gitignore)).

### Все тесты подряд

```bash
npm run test:all
```

(запускает backend → frontend unit-тесты → e2e.)

---

## API

Полное описание маршрутов, тел запросов и ошибок — **[backend/README.md](backend/README.md)** (раздел **API**). Базовый префикс: `/api/v1`.

---

## Переменные окружения

- **Backend:** [`backend/.env.example`](backend/.env.example) → скопировать в `backend/.env`.
- **Frontend:** опционально `VITE_API_BASE_URL`; в dev обычно `/api` через Vite proxy — см. [frontend/README.md](frontend/README.md).

---

## Архитектура и соглашения

- **Фронт:** Feature-Sliced Design — см. дерево в [frontend/README.md](frontend/README.md).
- **Правила для Cursor / агентов:** [`.cursor/rules/`](.cursor/rules/) (в т.ч. TDD workflow, если используете).

---

## Прочее

| Тема | Куда смотреть |
|------|----------------|
| Линт фронта | `cd frontend && npm run lint` |
| Сборка фронта | `cd frontend && npm run build` |
| Сборка бэкенда | `cd backend && npm run build` |

Старая закладка на «панель разработчика»: [DEVELOPER_DASHBOARD.md](DEVELOPER_DASHBOARD.md) (переход сюда).
