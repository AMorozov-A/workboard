import type { CreateTaskBody, UpdateTaskBody } from '@shared/api/crmV1.types'
import type { Task } from '../model/types'

function dueDateToIso(due?: string | null): string | null {
  if (!due) return null
  return due.includes('T') ? due : `${due}T00:00:00.000Z`
}

export function taskToCreateBody(task: Task): CreateTaskBody {
  return {
    projectId: task.projectId,
    title: task.title.trim(),
    description: task.description?.trim() ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: dueDateToIso(task.dueDate),
    labels: task.labels?.length ? task.labels : null,
  }
}

export function taskToUpdateBody(task: Task): UpdateTaskBody {
  return {
    title: task.title.trim(),
    description: task.description?.trim() ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: dueDateToIso(task.dueDate),
    labels: task.labels?.length ? task.labels : null,
  }
}
