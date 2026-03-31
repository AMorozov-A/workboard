import os from 'node:os'
import path from 'node:path'

/**
 * БД вне рабочей копии репозитория: в sandboxed-средах запись в workspace из дочернего
 * процесса webServer может давать SQLite "attempt to write a readonly database".
 */
export const e2eDbFilePath = path.join(os.tmpdir(), 'freelance-crm-e2e.db')

/** Абсолютный SQLite URL для globalSetup и webServer бэкенда. */
export const e2eDatabaseUrl = `file:${e2eDbFilePath.replace(/\\/g, '/')}`
