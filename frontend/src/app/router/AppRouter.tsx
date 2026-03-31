import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage/LoginPage'
import { ProjectsPage } from '@pages/ProjectsPage/ProjectsPage'
import { ProjectPage } from '@pages/ProjectPage/ProjectPage'
import { AppLayout } from '@widgets/AppLayout/AppLayout'
import { routes } from '@shared/config/routes'
import { AuthRoot } from './AuthRoot'
import { GuestRoute, RequireAuth, WildcardRedirect } from './AuthGuards'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthRoot />,
    children: [
      { index: true, element: <Navigate to={routes.app} replace /> },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'app',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to={routes.projects} replace /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:projectId', element: <ProjectPage /> },
        ],
      },
      { path: '*', element: <WildcardRedirect /> },
    ],
  },
])

export const AppRouter = () => <RouterProvider router={router} />
