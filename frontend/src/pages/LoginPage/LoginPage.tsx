import { LoginForm } from '@features/auth/login-form'
import { RegisterForm } from '@features/auth/register-form'
import { Card, Segmented, Space, Typography } from 'antd'
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
      <Card
        bordered={false}
        style={{
          width: 400,
          background: 'color-mix(in srgb, var(--color-surface) 36%, transparent)',
          boxShadow: 'none',
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {mode === 'login' ? t('auth.page.titleLogin') : t('auth.page.titleRegister')}
          </Typography.Title>
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
        </Space>
      </Card>
    </div>
  )
}
