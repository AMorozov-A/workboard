import { apiRequest } from './client'
import type {
  ChangePasswordResponse,
  CreateProjectBody,
  CreateTaskBody,
  EnsureDemoResponse,
  LoginResponse,
  MeResponse,
  PingResponse,
  ProjectDetailResponse,
  ProjectMutationResponse,
  ProjectsListResponse,
  RegisterResponse,
  TagMutationResponse,
  TaskMutationResponse,
  TagsListResponse,
  TasksByProjectResponse,
  UpdateProjectBody,
  UpdateTaskBody,
} from './crmV1.types'

const V1 = '/v1'

/** GET /api/v1/ping */
export async function ping(): Promise<PingResponse> {
  return apiRequest<PingResponse>(`${V1}/ping`, { method: 'GET' }, { skipAuth: true })
}

/** POST /api/v1/auth/register → 201 */
export async function registerRequest(payload: {
  email: string
  password: string
  name?: string
}): Promise<RegisterResponse> {
  const body: { email: string; password: string; name?: string } = {
    email: payload.email,
    password: payload.password,
  }
  const trimmed = payload.name?.trim()
  if (trimmed) body.name = trimmed

  return apiRequest<RegisterResponse>(
    `${V1}/auth/register`,
    { method: 'POST', body: JSON.stringify(body) },
    { skipAuth: true }
  )
}

/** POST /api/v1/auth/login */
export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    `${V1}/auth/login`,
    { method: 'POST', body: JSON.stringify({ email, password }) },
    { skipAuth: true }
  )
}

/** POST /api/v1/auth/ensure-demo */
export async function ensureDemo(): Promise<EnsureDemoResponse> {
  return apiRequest<EnsureDemoResponse>(`${V1}/auth/ensure-demo`, { method: 'POST' }, { skipAuth: true })
}

/** GET /api/v1/auth/me */
export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>(`${V1}/auth/me`)
}

/** POST /api/v1/auth/logout → 204 */
export async function logoutRequest(): Promise<void> {
  await apiRequest<void>(`${V1}/auth/logout`, { method: 'POST' })
}

/** PATCH /api/v1/auth/password */
export async function changePasswordRequest(payload: {
  currentPassword: string
  newPassword: string
}): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordResponse>(`${V1}/auth/password`, {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    }),
  })
}

/** GET /api/v1/projects */
export async function listProjects(): Promise<ProjectsListResponse> {
  return apiRequest<ProjectsListResponse>(`${V1}/projects`, { method: 'GET' })
}

/** GET /api/v1/projects/:id */
export async function getProject(projectId: string): Promise<ProjectDetailResponse> {
  return apiRequest<ProjectDetailResponse>(`${V1}/projects/${encodeURIComponent(projectId)}`, {
    method: 'GET',
  })
}

/** POST /api/v1/projects → 201 */
export async function createProject(body: CreateProjectBody): Promise<ProjectMutationResponse> {
  return apiRequest<ProjectMutationResponse>(`${V1}/projects`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PATCH /api/v1/projects/:id */
export async function updateProject(
  projectId: string,
  body: UpdateProjectBody
): Promise<ProjectMutationResponse> {
  return apiRequest<ProjectMutationResponse>(
    `${V1}/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  )
}

/** DELETE /api/v1/projects/:id → 204 */
export async function deleteProject(projectId: string): Promise<void> {
  await apiRequest<void>(`${V1}/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  })
}

/** GET /api/v1/tasks/project/:projectId */
export async function listTasksByProject(projectId: string): Promise<TasksByProjectResponse> {
  return apiRequest<TasksByProjectResponse>(
    `${V1}/tasks/project/${encodeURIComponent(projectId)}`,
    { method: 'GET' }
  )
}

/** POST /api/v1/tasks → 201 */
export async function createTask(body: CreateTaskBody): Promise<TaskMutationResponse> {
  return apiRequest<TaskMutationResponse>(`${V1}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PATCH /api/v1/tasks/:id */
export async function updateTask(taskId: string, body: UpdateTaskBody): Promise<TaskMutationResponse> {
  return apiRequest<TaskMutationResponse>(`${V1}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** DELETE /api/v1/tasks/:id → 204 */
export async function deleteTask(taskId: string): Promise<void> {
  await apiRequest<void>(`${V1}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  })
}

/** GET /api/v1/tags */
export async function listTags(): Promise<TagsListResponse> {
  return apiRequest<TagsListResponse>(`${V1}/tags`, { method: 'GET' })
}

/** POST /api/v1/tags → 201 */
export async function createTag(body: { name: string; color: string }): Promise<TagMutationResponse> {
  return apiRequest<TagMutationResponse>(`${V1}/tags`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PATCH /api/v1/tags/:id */
export async function updateTag(
  tagId: string,
  body: Partial<{ name: string; color: string }>
): Promise<TagMutationResponse> {
  return apiRequest<TagMutationResponse>(`${V1}/tags/${encodeURIComponent(tagId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** DELETE /api/v1/tags/:id → 204 */
export async function deleteTag(tagId: string): Promise<void> {
  await apiRequest<void>(`${V1}/tags/${encodeURIComponent(tagId)}`, { method: 'DELETE' })
}

