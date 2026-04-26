import type { ApiProject } from '@shared/api/crmV1.types'
import type { Project } from '../types'

function deriveTaskKeyPrefixFromProjectKey(projectKey: string): string {
  const raw = projectKey.split('-')[0] ?? ''
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return cleaned.slice(0, 10) || 'T'
}

export function mapApiProjectToProject(p: ApiProject): Project {
  return {
    id: p.id,
    key: p.key,
    taskKeyPrefix: p.taskKeyPrefix ?? deriveTaskKeyPrefixFromProjectKey(p.key),
    name: p.title,
    description: p.description ?? undefined,
    client: p.client ?? undefined,
    status: p.status ?? 'active',
    budget: p.budget ?? undefined,
    deadline: p.deadline ? p.deadline.slice(0, 10) : undefined,
  }
}
