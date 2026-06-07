export type AuthUserDto = {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

/** GET /v1/ping */
export type PingResponse = {
  ok: true
  message: string
}

/** POST /v1/auth/register | login */
export type AuthSuccessResponse = {
  ok: true
  user: AuthUserDto
  accessToken: string
  tokenType: string
  expiresIn: string
}

export type LoginResponse = AuthSuccessResponse
export type RegisterResponse = AuthSuccessResponse

/** GET /v1/auth/me */
export type MeResponse = {
  ok: true
  user: AuthUserDto
}

/** PATCH /v1/auth/password */
export type ChangePasswordResponse = {
  ok: true
}

/** POST /v1/auth/ensure-demo */
export type EnsureDemoResponse = {
  ok: true
}

export type ApiTag = {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export type ApiProject = {
  id: string
  key: string
  taskKeyPrefix: string
  title: string
  userId: string
  createdAt: string
  updatedAt: string
  description?: string | null
  client?: string | null
  status?: 'active' | 'paused' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  health?: 'on_track' | 'at_risk' | 'off_track'
  budget?: number | null
  deadline?: string | null
  tags?: ApiTag[]
  tasksCount?: number
  tasksDoneCount?: number
  progress?: number
}

/** GET /v1/projects */
export type ProjectsListResponse = {
  ok: true
  items: ApiProject[]
}

/** GET /v1/projects/:id */
export type ProjectDetailResponse = {
  ok: true
  project: ApiProject
}

export type CreateProjectBody = {
  title: string
  keyPrefix?: string | null
  taskKeyPrefix?: string | null
  description?: string | null
  client?: string | null
  status?: 'active' | 'paused' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  health?: 'on_track' | 'at_risk' | 'off_track'
  budget?: number | null
  deadline?: string | null
  tagIds?: string[]
}

export type UpdateProjectBody = Partial<CreateProjectBody>

/** POST /v1/projects → 201, PATCH /v1/projects/:id → 200 */
export type ProjectMutationResponse = {
  ok: true
  project: ApiProject
}

/** GET /v1/tasks/project/:projectId */
export type ApiTask = {
  id: string
  key: string
  title: string
  projectId: string
  createdAt: string
  updatedAt: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'review' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  labels?: string[] | null
  tags?: ApiTag[]
}

export type TasksByProjectResponse = {
  ok: true
  projectId: string
  items: ApiTask[]
}

export type CreateTaskBody = {
  projectId: string
  title: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'review' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  labels?: string[] | null
  tagIds?: string[]
}

export type UpdateTaskBody = Partial<
  Omit<CreateTaskBody, 'projectId'>
>

/** POST /v1/tasks → 201, PATCH /v1/tasks/:id → 200 */
export type TaskMutationResponse = {
  ok: true
  task: ApiTask
}

/** GET /v1/tags */
export type TagsListResponse = {
  ok: true
  items: ApiTag[]
}

/** POST /v1/tags → 201, PATCH /v1/tags/:id → 200 */
export type TagMutationResponse = {
  ok: true
  tag: ApiTag
}

