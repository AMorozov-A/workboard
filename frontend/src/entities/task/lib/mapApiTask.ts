import type { ApiTask } from '@shared/api/crmV1.types'
import type { Task } from '../model/types'

export function mapApiTaskToTask(t: ApiTask): Task {
  return {
    id: t.id,
    key: t.key,
    title: t.title,
    description: t.description ?? undefined,
    projectId: t.projectId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    status: t.status ?? 'todo',
    priority: t.priority ?? 'medium',
    dueDate: t.dueDate ? t.dueDate.slice(0, 10) : undefined,
    labels: t.labels ?? undefined,
    createdBy: 'freelancer',
  }
}
