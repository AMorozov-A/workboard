import {
  selectIsAuthenticated,
  selectSessionPending,
} from '@app/store/authSlice'
import { routes } from '@shared/config/routes'
import { useAppSelector } from '@app/store/hooks'
import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const pending = useAppSelector(selectSessionPending)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (pending) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip={t('auth.session.checking')} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.login} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const pending = useAppSelector(selectSessionPending)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (pending) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip={t('auth.session.checking')} />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={routes.projects} replace />
  }

  return <>{children}</>
}

export function WildcardRedirect() {
  const { t } = useTranslation()
  const pending = useAppSelector(selectSessionPending)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (pending) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip={t('auth.session.checking')} />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={routes.projects} replace />
  }

  return <Navigate to={routes.login} replace />
}
