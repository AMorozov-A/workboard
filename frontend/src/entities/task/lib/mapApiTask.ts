import type { ApiTask } from '@shared/api/crmV1.types'
import type { Tag } from '@entities/tag'
import type { Task } from '../model/types'

export function mapApiTaskToTask(t: ApiTask): Task {
  const tags = (t.tags ?? []) as Tag[]
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
    tags,
    tagIds: tags.map((x) => x.id),
    labels: tags.length > 0 ? tags.map((x) => x.name) : (t.labels ?? undefined),
    createdBy: 'freelancer',
  }
}
