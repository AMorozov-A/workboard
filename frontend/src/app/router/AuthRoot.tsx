import { logout } from '@app/store/authSlice'
import { store } from '@app/store/store'
import { meQueryKey, useMeQuery } from '@entities/session'
import { registerAuthBridge } from '@shared/api/authBridge'
import { routes } from '@shared/config/routes'
import { useAppDispatch } from '@app/store/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useLayoutEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export function AuthRoot() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    registerAuthBridge({
      getToken: () => store.getState().auth.accessToken,
      onUnauthorized: () => {
        void queryClient.removeQueries({ queryKey: meQueryKey })
        dispatch(logout())
        void navigate(routes.login, { replace: true })
      },
    })
  }, [dispatch, navigate, queryClient])

  useMeQuery()

  return <Outlet />
}
