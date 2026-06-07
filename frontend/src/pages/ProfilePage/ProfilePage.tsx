import { selectCurrentUser } from '@app/store/authSlice'
import { ChangePasswordForm } from '@features/auth/change-password'
import { useLogout } from '@entities/session'
import { routes } from '@shared/config/routes'
import { formatLocaleDate, getCurrentLanguage, normalizeLanguage, setAppLanguage } from '@shared/lib/i18n'
import { useAppSelector } from '@app/store/hooks'
import { useThemeStore } from '@shared/stores/themeStore'
import { Breadcrumb, Button, Segmented, Space, Spin, Typography } from 'antd'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export const ProfilePage = () => {
  const { t } = useTranslation()
  const user = useAppSelector(selectCurrentUser)
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()

  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const language = normalizeLanguage(getCurrentLanguage())

  const themeOptions = useMemo(
    () => [
      {
        label: (
          <Space size={6}>
            <Sun size={14} strokeWidth={2} aria-hidden />
            <span>{t('layout.themeLight')}</span>
          </Space>
        ),
        value: 'light',
      },
      {
        label: (
          <Space size={6}>
            <Moon size={14} strokeWidth={2} aria-hidden />
            <span>{t('layout.themeDark')}</span>
          </Space>
        ),
        value: 'dark',
      },
    ],
    [t]
  )

  const languageOptions = useMemo(
    () => [
      { label: t('common.languages.ru'), value: 'ru' },
      { label: t('common.languages.en'), value: 'en' },
    ],
    [t]
  )

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip={t('profile.loading')} />
      </div>
    )
  }

  const canGoBack = location.key !== 'default'

  return (
    <div style={{ width: '100%' }}>
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Space size={6}>
                  {canGoBack ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowLeft size={14} aria-hidden />}
                      aria-label={t('common.back')}
                      onClick={() => navigate(-1)}
                    />
                  ) : null}
                  <Link to={routes.projects}>{t('projects.breadcrumb.workspace')}</Link>
                </Space>
              ),
            },
            {
              title: (
                <span className="crm-breadcrumb-current">
                  {t('profile.title')}
                </span>
              ),
            },
          ]}
        />
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('profile.title')}
          </Typography.Title>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 24,
            alignItems: 'start',
            width: '100%',
          }}
        >
          <div>
            <Space direction="vertical" size={12} style={{ display: 'flex' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content max-content',
                  gap: 16,
                  alignItems: 'baseline',
                }}
              >
                <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                  {t('profile.fields.name')}
                </Typography.Text>
                <Typography.Text>{user.name || t('common.notSpecified')}</Typography.Text>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content max-content',
                  gap: 16,
                  alignItems: 'baseline',
                }}
              >
                <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                  {t('profile.fields.email')}
                </Typography.Text>
                <Typography.Text>{user.email}</Typography.Text>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content max-content',
                  gap: 16,
                  alignItems: 'baseline',
                }}
              >
                <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                  {t('profile.fields.createdAt')}
                </Typography.Text>
                <Typography.Text>{formatLocaleDate(user.createdAt)}</Typography.Text>
              </div>

              <Space direction="vertical" size={10} style={{ display: 'flex', paddingTop: 4 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Segmented
                    options={languageOptions}
                    value={language}
                    onChange={(value) => {
                      void setAppLanguage(String(value) === 'ru' ? 'ru' : 'en')
                    }}
                  />
                  <Segmented
                    options={themeOptions}
                    value={isDark ? 'dark' : 'light'}
                    onChange={(value) => {
                      const next = String(value)
                      if (next === 'dark' && !isDark) toggleTheme()
                      if (next === 'light' && isDark) toggleTheme()
                    }}
                  />
                </div>

                <div style={{ display: 'flex' }}>
                  <Button type="text" danger onClick={() => logout()}>
                    {t('layout.logout')}
                  </Button>
                </div>

                <div style={{ display: 'flex' }}>
                  <Button onClick={() => navigate(routes.tags)}>{t('tags.actions.manage')}</Button>
                </div>
              </Space>
            </Space>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ChangePasswordForm />
          </div>
        </div>

      </Space>
    </div>
  )
}

