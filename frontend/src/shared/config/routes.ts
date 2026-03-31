export const routes = {
  root: '/',
  login: '/login',
  app: '/app',
  projects: '/app/projects',
  /** projectRef — uuid или ключ проекта (напр. proj-1) */
  project: (projectRef: string) => `/app/projects/${encodeURIComponent(projectRef)}`,
}
