import { configureStore, type Middleware } from '@reduxjs/toolkit'
import { authReducer, loginSuccess, logout } from './authSlice'
import { clearStoredAccessToken, writeStoredAccessToken } from '@shared/lib/auth/tokenStorage'

const authPersistenceMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action)
  if (loginSuccess.match(action)) {
    writeStoredAccessToken(action.payload.accessToken)
  }
  if (logout.match(action)) {
    clearStoredAccessToken()
  }
  return result
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authPersistenceMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
