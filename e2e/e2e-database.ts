import os from 'node:os'
import path from 'node:path'

export const e2eDbFilePath = path.join(os.tmpdir(), 'freelance-crm-e2e.db')

export const e2eDatabaseUrl = `file:${e2eDbFilePath.replace(/\\/g, '/')}`
