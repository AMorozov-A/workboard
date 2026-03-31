import type { ReactElement, ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  type RenderOptions,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { authReducer } from '@app/store/authSlice'
import type { RootState } from '@app/store/store'
import { testI18n } from './i18n'

const rootReducer = combineReducers({
  auth: authReducer,
})

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

type ProvidersRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  preloadedState?: Partial<RootState>
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, route = '/', ...renderOptions }: ProvidersRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const store = createTestStore(preloadedState)

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={testI18n}>
            <MemoryRouter initialEntries={[route]}>
              <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
                {children}
              </ConfigProvider>
            </MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>
      </Provider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export { render, screen, within, waitFor, fireEvent, userEvent }
export { testI18n } from './i18n'
