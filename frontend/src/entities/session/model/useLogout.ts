import { logout } from '@app/store/authSlice'
import { logoutRequest } from '../api/authApi'
import { routes } from '@shared/config/routes'
import { useAppDispatch } from '@app/store/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { meQueryKey } from './useMeQuery'

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useCallback(() => {
    const finish = () => {
      void queryClient.removeQueries({ queryKey: meQueryKey })
      dispatch(logout())
      void navigate(routes.login, { replace: true })
    }

    void logoutRequest()
      .catch(() => {
        /* expired token / network — local logout is still ok */
      })
      .finally(finish)
  }, [dispatch, navigate, queryClient])
}

