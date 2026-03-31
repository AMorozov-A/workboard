export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  /** Ключ внутри проекта: task-1, task-2 */
  key: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  labels?: string[]
  projectId: string
  createdBy: 'freelancer' | 'client'
  createdAt?: string
  updatedAt?: string
}
