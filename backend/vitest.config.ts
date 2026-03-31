import { defineConfig } from 'vitest/config';

/**
 * test.env задаётся здесь (до загрузки модулей), чтобы Prisma и src/config/env.ts
 * подхватили тестовую БД и JWT_SECRET до первого импорта `src/db/client`.
 * Дублируется в `.env.test` для справки / ручного запуска.
 */
export default defineConfig({
  test: {
    /**
     * Одна SQLite `test.db` на все воркеры → гонки с `beforeEach` в setup.
     * В Vitest 4 `poolOptions.forks.singleFork` снят; аналог — `fileParallelism: false`
     * (принудительно `maxWorkers: 1`, см. документацию Vitest).
     */
    pool: 'forks',
    fileParallelism: false,
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'test-jwt-secret-min-32-chars-long-for-testing!!',
      JWT_EXPIRES_IN: '7d',
    },
    coverage: {
      provider: 'v8',
    },
  },
});
