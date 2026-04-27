export const routes = {
  root: '/',
  login: '/login',
  projects: '/projects',
  project: (projectRef: string) => `/projects/${encodeURIComponent(projectRef)}`,
  profile: '/profile',
}
