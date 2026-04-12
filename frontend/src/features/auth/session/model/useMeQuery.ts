import { logout, setUser } from '@app/store/authSlice'
import { useAppDispatch, useAppSelector } from '@shared/lib/store'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchMe } from '../api/authApi'

export const meQueryKey = ['auth', 'me'] as const

export function useMeQuery() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const enabled = Boolean(accessToken && !user)

  const query = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled,
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (query.data?.user) {
      dispatch(setUser(query.data.user))
    }
  }, [query.data, dispatch])

  useEffect(() => {
    if (!query.isError || !enabled) return
    dispatch(logout())
  }, [query.isError, query.error, enabled, dispatch])

  return query
}
