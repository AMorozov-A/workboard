export type Project = {
  id: string
  /** Ключ как в Jira: proj-1, crm-2 — для ссылок и отображения */
  key: string
  /** Только при создании: префикс ключа на бэкенде (по умолчанию proj) */
  keyPrefix?: string | null
  name: string
  description?: string
  client?: string
  status?: 'active' | 'paused' | 'done'
  budget?: number
  deadline?: string
}
