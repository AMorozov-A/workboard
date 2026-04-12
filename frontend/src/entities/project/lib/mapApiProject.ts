import type { ApiProject } from '@shared/api/crmV1.types'
import type { Project } from '../types'

export function mapApiProjectToProject(p: ApiProject): Project {
  return {
    id: p.id,
    key: p.key,
    name: p.title,
    description: p.description ?? undefined,
    client: p.client ?? undefined,
    status: p.status ?? 'active',
    budget: p.budget ?? undefined,
    deadline: p.deadline ? p.deadline.slice(0, 10) : undefined,
  }
}
