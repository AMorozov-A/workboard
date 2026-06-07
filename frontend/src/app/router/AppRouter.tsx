import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage/LoginPage'
import { ProfilePage } from '@pages/ProfilePage/ProfilePage'
import { ProjectsPage } from '@pages/ProjectsPage/ProjectsPage'
import { ProjectPage } from '@pages/ProjectPage/ProjectPage'
import { TagsSettingsPage } from '@pages/TagsSettingsPage/TagsSettingsPage'
import { AppLayout } from '@widgets/AppLayout/AppLayout'
import { routes } from '@shared/config/routes'
import { AuthRoot } from './AuthRoot'
import { GuestRoute, RequireAuth, WildcardRedirect } from './AuthGuards'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthRoot />,
    children: [
      { index: true, element: <Navigate to={routes.projects} replace /> },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'projects',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <ProjectsPage /> },
          { path: ':projectId', element: <ProjectPage /> },
        ],
      },
      {
        path: 'tags',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [{ index: true, element: <TagsSettingsPage /> }],
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [{ index: true, element: <ProfilePage /> }],
      },
      { path: '*', element: <WildcardRedirect /> },
    ],
  },
])

export const AppRouter = () => <RouterProvider router={router} />
