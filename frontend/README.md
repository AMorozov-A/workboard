# Freelance CRM — фронтенд

## Назначение

Демо-проект для портфолио (не production CRM). Основной сценарий: **логин** → **рабочая область** → **список проектов** → **карточка проекта** → **задачи** (список и drawer; данные проектов и задач с backend).

## Стек

- React, TypeScript, Vite  
- Ant Design  
- TanStack Query (серверное состояние)  
- Redux Toolkit (сессия)  
- i18next (ru / en)  
- React Router  
- React Hook Form + Zod  
- Архитектура: **Feature-Sliced Design** (`app`, `pages`, `widgets`, `features`, `entities`, `shared`)

## API и переменные окружения

- Базовый URL для `fetch`: `VITE_API_BASE_URL` из env; если **не задан**, используется **`/api`** (относительный путь от origin фронта).
- В **dev** (`npm run dev`) в [vite.config.ts](vite.config.ts) настроен **proxy**: запросы на `/api` проксируются на backend (по умолчанию `http://localhost:3001`), чтобы не упираться в CORS.
- Для реальных данных backend должен быть **запущен и актуален** (см. корневой [README.md](../README.md)). Старый процесс на порту API без нужных маршрутов (например без `POST /api/v1/projects`) даст 404 — перезапустите backend из текущего кода репозитория.

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Отдельно в другом терминале поднимите backend (`cd ../backend && npm run dev`), если нужны авторизация и CRUD проектов/задач.

---

## Что уже реализовано

### Авторизация

- Страница входа с переключением **«Войти» / «Зарегистрироваться»** ([`pages/LoginPage`](src/pages/LoginPage/LoginPage.tsx), [`features/auth/login-form`](src/features/auth/login-form), [`features/auth/register-form`](src/features/auth/register-form)).
- JWT: **`accessToken`** в `localStorage` + синхронизация с Redux; заголовок **`Authorization: Bearer`** в HTTP-клиенте.
- Восстановление сессии: при наличии токена — запрос **`GET /api/v1/auth/me`** ([`features/auth/session`](src/features/auth/session)).
- Защита маршрутов: workspace под `/app`, редиректы для гостя / залогиненного ([`app/router`](src/app/router)).
- Выход из аккаунта в шапке layout.

### HTTP-слой

- Единый сервис v1: [`shared/api/crmV1Service.ts`](src/shared/api/crmV1Service.ts) — ping, auth, projects, tasks, comments (GET).
- Обёртка [`shared/api/client.ts`](src/shared/api/client.ts): Bearer, опция `skipAuth` для логина/регистрации, обработка **401** (сброс сессии), **204** без тела.

### Данные и домен

- **Проекты**: список и деталка с API; в UI поле **`name`** маппится из API-поля **`title`** ([`entities/project/lib/mapApiProject.ts`](src/entities/project/lib/mapApiProject.ts)).
- **Задачи**: загрузка по проекту с API; маппинг в доменную модель UI ([`entities/task`](src/entities/task)).
- **Создание проекта** из модалки — `POST /api/v1/projects`; **создание/обновление задачи** — через API ([`pages/ProjectPage`](src/pages/ProjectPage/ProjectPage.tsx)).
- **Комментарии**: в сервисе есть `GET` к API; в drawer комментарии/история пока локальное состояние в UI (без полного цикла с backend).

### После входа

- После успешного логина/регистрации список проектов **предзагружается** (`prefetchQuery`), затем редирект на список проектов.

### i18n

- Русский и английский: тексты auth, layout, проектов, задач, ошибок ([`shared/lib/i18n/locales`](src/shared/lib/i18n/locales)).

---

## Архитектура (куда смотреть в коде)

| Слой | Назначение |
|------|------------|
| `src/app` | Провайдеры, Redux store, роутер, guards (`AuthRoot`, `RequireAuth`) |
| `src/pages` | Экраны: логин, список проектов, карточка проекта |
| `src/widgets` | Крупные блоки: layout, drawer задачи |
| `src/features` | Фичи: формы auth, создание проекта/задачи, inline-редактирование задачи |
| `src/entities` | Типы, query/mutation API проектов и задач, маппинг DTO |
| `src/shared` | UI-обвязка, i18n, HTTP-клиент, конфиг маршрутов |

Ключевые точки: [`app/router/AppRouter.tsx`](src/app/router/AppRouter.tsx), [`app/store`](src/app/store), [`features/auth/session`](src/features/auth/session).

---

## Ограничения и пробелы

- **Комментарии к задачам**: backend может отдавать заглушку; UI не завязан на полноценный CRUD комментариев.
- **Удаление**: в [`crmV1Service`](src/shared/api/crmV1Service.ts) есть `deleteProject` / `deleteTask`; в [`entities/task/api`](src/entities/task/api.ts) экспортируется `useDeleteTaskMutation`, но **кнопки удаления в интерфейсе не подключены**; отдельной мутации удаления проекта в entity-слое нет.
- **Стабильность API**: после смены кода backend всегда перезапускайте процесс, иначе возможны 404 на новых маршрутах.

---

## Возможные следующие шаги (идеи)

- Подключить комментарии к задачам к реальному API и убрать демо-блоки в drawer по мере готовности backend.
- Кнопки «Удалить проект / задачу» + подтверждение + вызов существующих методов/мутаций.
- Тесты (unit / e2e) для критичных сценариев auth и CRUD.
- Доп. полировка UX и единообразие empty/error-состояний.
- Явный `.env.example` для фронта с `VITE_API_BASE_URL` под staging/production.
