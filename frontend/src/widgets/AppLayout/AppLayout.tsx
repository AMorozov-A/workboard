import { useProjectsQuery } from '@entities/project/api'
import { ChangePasswordModal } from '@features/auth/change-password'
import { useLogout } from '@features/auth/session'
import { routes } from '@shared/config/routes'
import { useAppSelector } from '@shared/lib/store'
import { normalizeLanguage, setAppLanguage, type AppLanguage } from '@shared/lib/i18n'
import { Button, Layout, Menu, Select, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const projectsMenuKey = 'projects'
const getProjectMenuKey = (projectId: string) => `project:${projectId}`

const getSelectedKey = (pathname: string) => {
  if (pathname === routes.projects) return projectsMenuKey

  const projectPathPrefix = `${routes.projects}/`
  if (pathname.startsWith(projectPathPrefix)) {
    return getProjectMenuKey(pathname.slice(projectPathPrefix.length))
  }

  return projectsMenuKey
}

export const AppLayout = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const userEmail = useAppSelector((s) => s.auth.user?.email)
  const logout = useLogout()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const { data: projects = [] } = useProjectsQuery()
  const selectedKey = getSelectedKey(location.pathname)
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  const menuItems = useMemo(
    () => [
      {
        key: projectsMenuKey,
        label: <Link to={routes.projects}>{t('layout.menu.projects')}</Link>,
        children: projects.map((project) => ({
          key: getProjectMenuKey(project.id),
          label: <Link to={routes.project(project.key)}>{project.name}</Link>,
        })),
      },
    ],
    [projects, t]
  )
  const languageOptions = useMemo(
    () => [
      { value: 'ru', label: t('common.languages.ru') },
      { value: 'en', label: t('common.languages.en') },
    ],
    [t]
  )

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        width={220}
        theme="light"
        style={{
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          overflow: 'auto',
          borderInlineEnd: '1px solid #f0f0f0',
        }}
      >
        <div style={{ padding: 16 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('layout.brand')}
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[projectsMenuKey]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            flex: '0 0 auto',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Typography.Text>{t('layout.workspace')}</Typography.Text>
          <Space size={16} align="center" wrap>
            {userEmail ? (
              <Typography.Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                {userEmail}
              </Typography.Text>
            ) : null}
            <Typography.Text type="secondary">{t('layout.language')}</Typography.Text>
            <Select<AppLanguage>
              value={language}
              options={languageOptions}
              style={{ width: 88 }}
              aria-label={t('layout.languageSelectLabel')}
              title={t('layout.languageSelectLabel')}
              onChange={(value) => {
                void setAppLanguage(value)
              }}
            />
            <Button type="default" onClick={() => setChangePasswordOpen(true)}>
              {t('layout.changePassword')}
            </Button>
            <Button type="default" onClick={logout}>
              {t('layout.logout')}
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 24,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Layout>
  )
}
