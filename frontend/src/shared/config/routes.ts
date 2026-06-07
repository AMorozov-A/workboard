export const routes = {
  root: '/',
  login: '/login',
  projects: '/projects',
  project: (projectRef: string) => `/projects/${encodeURIComponent(projectRef)}`,
  tags: '/tags',
  profile: '/profile',
}
