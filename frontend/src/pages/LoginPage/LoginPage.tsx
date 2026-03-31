import { LoginForm } from '@features/auth/login-form'
import { RegisterForm } from '@features/auth/register-form'
import { Button, Card, Segmented, Space, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type AuthMode = 'login' | 'register'

export const LoginPage = () => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<AuthMode>('login')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 400 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {mode === 'login' ? t('auth.page.titleLogin') : t('auth.page.titleRegister')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            {t('auth.page.subtitle')}
          </Typography.Paragraph>
          <Segmented<AuthMode>
            block
            value={mode}
            onChange={(value) => setMode(value)}
            options={[
              { label: t('auth.page.tabLogin'), value: 'login' },
              { label: t('auth.page.tabRegister'), value: 'register' },
            ]}
            aria-label={t('auth.page.modeSegmentAria')}
          />
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
          <Typography.Paragraph type="secondary" style={{ margin: 0, textAlign: 'center' }}>
            {mode === 'login' ? (
              <>
                {t('auth.page.switchToRegisterPrompt')}{' '}
                <Button type="link" onClick={() => setMode('register')} style={{ padding: 0, height: 'auto' }}>
                  {t('auth.page.goRegister')}
                </Button>
              </>
            ) : (
              <>
                {t('auth.page.switchToLoginPrompt')}{' '}
                <Button type="link" onClick={() => setMode('login')} style={{ padding: 0, height: 'auto' }}>
                  {t('auth.page.goLogin')}
                </Button>
              </>
            )}
          </Typography.Paragraph>
        </Space>
      </Card>
    </div>
  )
}
