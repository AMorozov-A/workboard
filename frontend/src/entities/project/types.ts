export type Project = {
  id: string
  key: string
  keyPrefix?: string | null
  taskKeyPrefix: string
  name: string
  description?: string
  client?: string
  status?: 'active' | 'paused' | 'done'
  budget?: number
  deadline?: string
}
