import { http, HttpResponse } from 'msw'
import type { ApiProject, ApiTask } from '@shared/api/crmV1.types'

/** Базовый путь API в тестах совпадает с client: `/api` + `/v1/...` */
const projectsListPattern = '*/api/v1/projects'
const projectByIdPattern = '*/api/v1/projects/:id'
const tasksByProjectPattern = '*/api/v1/tasks/project/:projectId'
const tasksPattern = '*/api/v1/tasks'
const taskByIdPattern = '*/api/v1/tasks/:id'

export const mockApiProject = (overrides: Partial<ApiProject> = {}): ApiProject => ({
  id: 'p-1',
  key: 'proj-1',
  title: 'Test project',
  userId: 'u-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  description: null,
  client: 'ACME',
  status: 'active',
  budget: null,
  deadline: null,
  ...overrides,
})

export const projectsHandlers = {
  listSuccess: (items: ApiProject[] = [mockApiProject()]) =>
    http.get(projectsListPattern, () =>
      HttpResponse.json({ ok: true as const, items })
    ),

  listError: (status: number, body: string) =>
    http.get(projectsListPattern, () => new HttpResponse(body, { status })),

  detailSuccess: (project: ApiProject) =>
    http.get(projectByIdPattern, () =>
      HttpResponse.json({ ok: true as const, project })
    ),

  detailNotFound: () =>
    http.get(projectByIdPattern, () =>
      new HttpResponse(JSON.stringify({ message: 'Not found' }), { status: 404 })
    ),

  createSuccess: (project: ApiProject) =>
    http.post(projectsListPattern, async ({ request }) => {
      await request.json()
      return HttpResponse.json({ ok: true as const, project }, { status: 201 })
    }),

  updateSuccess: (project: ApiProject) =>
    http.patch(projectByIdPattern, async ({ request }) => {
      await request.json()
      return HttpResponse.json({ ok: true as const, project })
    }),

  deleteNoContent: () =>
    http.delete(projectByIdPattern, () => new HttpResponse(null, { status: 204 })),

  /** DELETE с ошибкой (например 500) — для server.use в тестах */
  deleteError: (status: number = 500, body = 'Internal Server Error') =>
    http.delete(projectByIdPattern, () => new HttpResponse(body, { status })),

  /** PATCH с ошибкой (например 500) — для server.use в тестах */
  patchError: (status: number = 500, body = 'Internal Server Error') =>
    http.patch(projectByIdPattern, () => new HttpResponse(body, { status })),
}

export const mockApiTask = (overrides: Partial<ApiTask> = {}): ApiTask => ({
  id: 't-1',
  key: 'task-1',
  title: 'Test task',
  projectId: 'p-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  description: null,
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  labels: null,
  ...overrides,
})

export const tasksHandlers = {
  listSuccess: (projectId: string, items: ApiTask[] = [mockApiTask({ projectId })]) =>
    http.get(tasksByProjectPattern, ({ params }) => {
      const pid = params.projectId as string
      return HttpResponse.json({
        ok: true as const,
        projectId: pid,
        items: pid === projectId ? items : [],
      })
    }),

  listError: (status: number, body: string) =>
    http.get(tasksByProjectPattern, () => new HttpResponse(body, { status })),

  createSuccess: (task: ApiTask) =>
    http.post(tasksPattern, async ({ request }) => {
      await request.json()
      return HttpResponse.json({ ok: true as const, task }, { status: 201 })
    }),

  updateSuccess: (task: ApiTask) =>
    http.patch(taskByIdPattern, async ({ request }) => {
      await request.json()
      return HttpResponse.json({ ok: true as const, task })
    }),

  deleteNoContent: () =>
    http.delete(taskByIdPattern, () => new HttpResponse(null, { status: 204 })),

  deleteError: (status: number = 500, body = 'Internal Server Error') =>
    http.delete(taskByIdPattern, () => new HttpResponse(body, { status })),

  postError: (status: number = 400, body = 'Bad Request') =>
    http.post(tasksPattern, () => new HttpResponse(body, { status })),

  patchError: (status: number = 500, body = 'Internal Server Error') =>
    http.patch(taskByIdPattern, () => new HttpResponse(body, { status })),
}
