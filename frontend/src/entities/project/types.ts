export type Project = {
  id: string
  key: string
  keyPrefix?: string | null
  name: string
  description?: string
  client?: string
  status?: 'active' | 'paused' | 'done'
  budget?: number
  deadline?: string
}
