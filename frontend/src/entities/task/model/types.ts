import type { Tag } from '@entities/tag'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  key: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  /** legacy: pre-tag system */
  labels?: string[]
  tagIds?: string[]
  tags?: Tag[]
  projectId: string
  createdBy: 'freelancer' | 'client'
  createdAt?: string
  updatedAt?: string
}
