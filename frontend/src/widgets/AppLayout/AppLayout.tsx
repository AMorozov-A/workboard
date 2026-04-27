import { routes } from '@shared/config/routes'
import { APP_CONTEXT_ACTION_EVENT, APP_CONTEXT_ACTIONS } from '@shared/config/appContextActions'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  AppContent,
  ContentShell,
  MainColumn,
  ShellLayout,
} from './AppLayout.styles'

export const AppLayout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isProfilePage = location.pathname === routes.profile

  const appContextMenuItems = useMemo((): NonNullable<MenuProps['items']> => {
    const isProjectsListPage = location.pathname === routes.projects

    return [
      {
        key: 'projects',
        label: t('layout.menu.projects'),
      },
      ...(isProjectsListPage
        ? ([
            { type: 'divider' as const },
            { key: APP_CONTEXT_ACTIONS.projectsCreateProject, label: t('projects.actions.create') },
          ] satisfies NonNullable<MenuProps['items']>)
        : []),
      { type: 'divider' },
      {
        key: 'profile',
        label: t('layout.profile'),
        onClick: () => navigate(routes.profile),
      },
    ]
  }, [location.pathname, navigate, t])

  if (isProfilePage) {
    return (
      <ShellLayout>
        <MainColumn>
          <AppContent>
            <ContentShell>
              <Outlet />
            </ContentShell>
          </AppContent>
        </MainColumn>
      </ShellLayout>
    )
  }

  return (
    <Dropdown
      trigger={['contextMenu']}
      menu={{
        items: appContextMenuItems,
        onClick: ({ key }) => {
          if (key === 'projects') {
            navigate(routes.projects)
            return
          }

          if (key === APP_CONTEXT_ACTIONS.projectsCreateProject) {
            window.dispatchEvent(
              new CustomEvent(APP_CONTEXT_ACTION_EVENT, {
                detail: { key: APP_CONTEXT_ACTIONS.projectsCreateProject },
              })
            )
            return
          }

          if (String(key).startsWith('project:')) {
            window.dispatchEvent(new CustomEvent(APP_CONTEXT_ACTION_EVENT, { detail: { key } }))
          }
        },
      }}
    >
      <ShellLayout>
        <MainColumn>
          <AppContent>
            <ContentShell>
              <Outlet />
            </ContentShell>
          </AppContent>
        </MainColumn>
      </ShellLayout>
    </Dropdown>
  )
}
