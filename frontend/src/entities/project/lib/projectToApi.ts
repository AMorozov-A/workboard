import type { CreateProjectBody, UpdateProjectBody } from '@shared/api/crmV1.types'
import type { Project } from '../types'

/** UI-модель (name) → тело POST /projects (title). */
export function projectUiToCreateBody(p: Project): CreateProjectBody {
  return {
    title: p.name.trim(),
    keyPrefix: p.keyPrefix?.trim() || null,
    description: p.description?.trim() ?? null,
    client: p.client?.trim() ?? null,
    status: p.status ?? 'active',
    budget: p.budget ?? null,
    deadline: p.deadline ? `${p.deadline}T00:00:00.000Z` : null,
  }
}

/** UI-модель → PATCH /projects/:id (без keyPrefix — ключ задаётся при создании). */
export function projectUiToUpdateBody(p: Project): UpdateProjectBody {
  return {
    title: p.name.trim(),
    description: p.description?.trim() ?? null,
    client: p.client?.trim() ?? null,
    status: p.status ?? 'active',
    budget: p.budget ?? null,
    deadline: p.deadline ? `${p.deadline}T00:00:00.000Z` : null,
  }
}
