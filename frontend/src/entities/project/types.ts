import type { Tag } from '@entities/tag'

export type Project = {
  id: string
  key: string
  keyPrefix?: string | null
  taskKeyPrefix: string
  name: string
  description?: string
  client?: string
  status?: 'active' | 'paused' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  health?: 'on_track' | 'at_risk' | 'off_track'
  budget?: number
  deadline?: string
  tagIds?: string[]
  tags?: Tag[]
  tasksCount?: number
  tasksDoneCount?: number
  progress?: number
}
