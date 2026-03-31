import { setupServer } from 'msw/node'

/** Стартует с пустым набором — в тестах подключают `server.use(...)` */
export const server = setupServer()
