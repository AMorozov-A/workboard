import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { e2eDatabaseUrl, e2eDbFilePath } from './e2e-database'

const repoRoot = path.join(__dirname, '..')
const backendDir = path.join(repoRoot, 'backend')
const frontendDir = path.join(repoRoot, 'frontend')

const jwtSecretForE2e = 'dev-only-secret-change-in-production-min-32-chars'

function shSingleQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`
}

const resetE2eDb = `rm -f ${shSingleQuote(e2eDbFilePath)} ${shSingleQuote(`${e2eDbFilePath}-wal`)} ${shSingleQuote(`${e2eDbFilePath}-shm`)} 2>/dev/null; `

const backendShellCommand = `${resetE2eDb}cd ${shSingleQuote(backendDir)} && export DATABASE_URL=${shSingleQuote(e2eDatabaseUrl)} && export JWT_SECRET=${shSingleQuote(jwtSecretForE2e)} && export PORT=3001 && export NODE_ENV=test && npx prisma migrate deploy && exec npx tsx src/index.ts`

const frontendShellCommand = `cd ${shSingleQuote(frontendDir)} && exec npm run dev`

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `sh -c ${shSingleQuote(backendShellCommand)}`,
      url: 'http://localhost:3001/api/v1/ping',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `sh -c ${shSingleQuote(frontendShellCommand)}`,
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
