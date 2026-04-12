export const routes = {
  root: '/',
  login: '/login',
  app: '/app',
  projects: '/app/projects',
  project: (projectRef: string) => `/app/projects/${encodeURIComponent(projectRef)}`,
}
