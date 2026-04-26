import { getProjectInitials } from '@entities/project/lib/initials'
import { ChangePasswordModal } from '@features/auth/change-password'
import { useLogout } from '@features/auth/session'
import { routes } from '@shared/config/routes'
import { APP_CONTEXT_ACTION_EVENT, APP_CONTEXT_ACTIONS } from '@shared/config/appContextActions'
import { useAppSelector } from '@shared/lib/store'
import { normalizeLanguage, setAppLanguage } from '@shared/lib/i18n'
import { useThemeStore } from '@shared/stores/themeStore'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { Moon, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  AppContent,
  ContentShell,
  MainColumn,
  ShellLayout,
} from './AppLayout.styles'

export const AppLayout = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)
  const logout = useLogout()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const displayName = user?.name?.trim() || user?.email || ''

  const settingsMenuItems = useMemo((): MenuProps['items'] => {
    return [
      {
        key: 'change-password',
        label: t('layout.changePassword'),
        onClick: () => setChangePasswordOpen(true),
      },
      {
        key: 'theme',
        label: t('layout.theme'),
        children: [
          {
            key: 'theme-light',
            icon: <Sun size={14} strokeWidth={2} aria-hidden />,
            label: t('layout.themeLight'),
            disabled: !isDark,
            onClick: () => {
              if (isDark) toggleTheme()
            },
          },
          {
            key: 'theme-dark',
            icon: <Moon size={14} strokeWidth={2} aria-hidden />,
            label: t('layout.themeDark'),
            disabled: isDark,
            onClick: () => {
              if (!isDark) toggleTheme()
            },
          },
        ],
      },
      {
        key: 'language',
        label: t('layout.language'),
        children: [
          {
            key: 'lang-ru',
            label: t('common.languages.ru'),
            disabled: language === 'ru',
            onClick: () => {
              void setAppLanguage('ru')
            },
          },
          {
            key: 'lang-en',
            label: t('common.languages.en'),
            disabled: language === 'en',
            onClick: () => {
              void setAppLanguage('en')
            },
          },
        ],
      },
      { type: 'divider' },
      {
        key: 'logout',
        label: t('layout.logout'),
        danger: true,
        onClick: () => logout(),
      },
    ]
  }, [isDark, language, logout, t, toggleTheme])

  const appContextMenuItems = useMemo((): MenuProps['items'] => {
    const isProjectPage = location.pathname.startsWith(`${routes.projects}/`)
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
          ] as MenuProps['items'])
        : []),
      ...(isProjectPage
        ? ([
            { type: 'divider' as const },
            {
              key: 'projectView',
              type: 'group' as const,
              label: 'View',
              children: [
                { key: APP_CONTEXT_ACTIONS.projectViewKanban, label: t('projectDetails.tasksSection.viewKanban') },
                { key: APP_CONTEXT_ACTIONS.projectViewTable, label: t('projectDetails.tasksSection.viewTable') },
              ],
            },
            { key: APP_CONTEXT_ACTIONS.projectCreateTask, label: t('tasks.actions.create') },
          ] as MenuProps['items'])
        : []),
      { type: 'divider' },
      {
        key: 'settings',
        label: t('layout.openSettings'),
        children: settingsMenuItems ?? undefined,
      },
    ]
  }, [location.pathname, settingsMenuItems, t])

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
        <ChangePasswordModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
        />
      </ShellLayout>
    </Dropdown>
  )
}
