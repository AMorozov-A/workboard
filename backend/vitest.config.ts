import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
