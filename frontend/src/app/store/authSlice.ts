import type { PublicUser } from '@entities/user/model/types'
import { readStoredAccessToken } from '@shared/lib/auth/tokenStorage'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  accessToken: string | null
  user: PublicUser | null
}

const initialState: AuthState = {
  accessToken: readStoredAccessToken(),
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ accessToken: string; user: PublicUser }>
    ) => {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
    },
    setUser: (state, action: PayloadAction<PublicUser>) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.accessToken = null
      state.user = null
    },
  },
})

export const { loginSuccess, setUser, logout } = authSlice.actions
export const authReducer = authSlice.reducer

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.user)

export const selectSessionPending = (state: { auth: AuthState }) =>
  Boolean(state.auth.accessToken) && !state.auth.user

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
