import type { Project } from '@entities/project/types'
import { getProjectInitials } from '@entities/project/lib/initials'
import { useProjectsQuery } from '@entities/project/api'
import { ChangePasswordModal } from '@features/auth/change-password'
import { useLogout } from '@features/auth/session'
import { routes } from '@shared/config/routes'
import { useAppSelector } from '@shared/lib/store'
import { normalizeLanguage, setAppLanguage } from '@shared/lib/i18n'
import { useThemeStore } from '@shared/stores/themeStore'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Typography } from 'antd'
import { FolderOpen, Moon, Plus, Settings, Sun } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  AppContent,
  AppHeader,
  AppSider,
  ContentShell,
  LogoMark,
  LogoRow,
  LogoSquare,
  LogoText,
  MainColumn,
  MenuSectionTitle,
  ProfileAvatar,
  SectionHeaderRow,
  SettingsGearButton,
  ShellLayout,
  SidebarProjectAvatar,
  SidebarProjectLink,
  SiderInner,
  SiderMenu,
  SiderProfile,
  SiderProfileMeta,
  SiderProfileName,
  SiderProfileSub,
  SiderScroll,
  ProjectMenuName,
} from './AppLayout.styles'

const projectsMenuKey = 'projects'
const getProjectMenuKey = (projectId: string) => `project:${projectId}`

const getSelectedKeys = (pathname: string, projectList: Project[]): string[] => {
  if (pathname === routes.projects) {
    return [projectsMenuKey]
  }

  const prefix = `${routes.projects}/`
  if (pathname.startsWith(prefix)) {
    const ref = decodeURIComponent(pathname.slice(prefix.length))
    const project = projectList.find((p) => p.id === ref || p.key === ref)
    if (project) {
      return [projectsMenuKey, getProjectMenuKey(project.id)]
    }
  }

  return [projectsMenuKey]
}

const splitProjectsByStatus = (projectList: Project[]) => {
  const active = projectList.filter((p) => p.status === 'active' || p.status == null)
  const paused = projectList.filter((p) => p.status === 'paused')
  const done = projectList.filter((p) => p.status === 'done')
  return { active, paused, done }
}

type AppMenuItem = NonNullable<MenuProps['items']>[number]

export const AppLayout = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const logout = useLogout()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const { data: projects = [] } = useProjectsQuery()
  const selectedKeys = useMemo(
    () => getSelectedKeys(location.pathname, projects),
    [location.pathname, projects]
  )
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const displayName = user?.name?.trim() || user?.email || ''
  const profileLine2 = t('layout.soloWorkspace')

  const menuItems = useMemo((): MenuProps['items'] => {
    const { active, paused, done } = splitProjectsByStatus(projects)

    const toItem = (project: Project): AppMenuItem => ({
      key: getProjectMenuKey(project.id),
      label: (
        <SidebarProjectLink to={routes.project(project.key)}>
          <SidebarProjectAvatar size={28}>{getProjectInitials(project.name, project.key)}</SidebarProjectAvatar>
          <ProjectMenuName>{project.name}</ProjectMenuName>
        </SidebarProjectLink>
      ),
    })

    const groups: MenuProps['items'] = []

    if (active.length > 0) {
      groups.push({
        type: 'group',
        label: t('layout.projectGroups.active'),
        children: active.map(toItem),
      })
    }
    if (paused.length > 0) {
      groups.push({
        type: 'group',
        label: t('layout.projectGroups.paused'),
        children: paused.map(toItem),
      })
    }
    if (done.length > 0) {
      groups.push({
        type: 'group',
        label: t('layout.projectGroups.done'),
        children: done.map(toItem),
      })
    }

    const sectionHeader: AppMenuItem = {
      key: 'crm-projects-section',
      disabled: true,
      className: 'layout-menu-section-header',
      style: { pointerEvents: 'auto' } as CSSProperties,
      label: (
        <SectionHeaderRow>
          <MenuSectionTitle>{t('layout.menu.projectsSection')}</MenuSectionTitle>
          <Button
            type="text"
            size="small"
            icon={<Plus size={14} aria-hidden />}
            aria-label={t('layout.sidebar.createProject')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(routes.projects, { state: { openCreateProject: true } })
            }}
          />
        </SectionHeaderRow>
      ),
    }

    return [
      {
        key: projectsMenuKey,
        icon: <FolderOpen size={16} strokeWidth={2} aria-hidden />,
        label: <Link to={routes.projects}>{t('layout.menu.projects')}</Link>,
      },
      { type: 'divider' },
      sectionHeader,
      ...groups,
    ]
  }, [navigate, projects, t])

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

  return (
    <ShellLayout>
      <AppSider width={220} theme={isDark ? 'dark' : 'light'}>
        <SiderInner>
          <LogoRow>
            <LogoMark aria-hidden>
              <LogoSquare />
              <LogoSquare />
              <LogoSquare />
            </LogoMark>
            <LogoText>{t('layout.brandShort')}</LogoText>
          </LogoRow>
          <SiderScroll>
            <SiderMenu mode="inline" multiple selectedKeys={selectedKeys} items={menuItems} />
          </SiderScroll>
          <SiderProfile>
            <ProfileAvatar size={40}>
              {displayName ? getProjectInitials(displayName, displayName) : '?'}
            </ProfileAvatar>
            <SiderProfileMeta>
              <SiderProfileName>{displayName || t('layout.profilePlaceholder')}</SiderProfileName>
              <SiderProfileSub>{profileLine2}</SiderProfileSub>
            </SiderProfileMeta>
            <Dropdown
              menu={{ items: settingsMenuItems }}
              trigger={['click']}
              placement="topRight"
            >
              <SettingsGearButton
                type="text"
                size="small"
                icon={<Settings size={16} aria-hidden />}
                aria-label={t('layout.openSettings')}
                title={t('layout.openSettings')}
                aria-haspopup="menu"
              />
            </Dropdown>
          </SiderProfile>
        </SiderInner>
      </AppSider>
      <MainColumn>
        <AppHeader>
          <Typography.Text>{t('layout.workspace')}</Typography.Text>
        </AppHeader>
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
  )
}
