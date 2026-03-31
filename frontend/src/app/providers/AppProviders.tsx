import type { PropsWithChildren } from 'react'
import { useSyncExternalStore } from 'react'
import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from '@app/store/store'
import i18n, { getAntdLocale } from '@shared/lib/i18n'
import { initNotifications } from '@shared/ui'

initNotifications()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AppProvidersContent>{children}</AppProvidersContent>
)

const subscribeToLanguage = (callback: () => void) => {
  i18n.on('languageChanged', callback)

  return () => {
    i18n.off('languageChanged', callback)
  }
}

const getLanguageSnapshot = () => i18n.resolvedLanguage ?? i18n.language

const AppProvidersContent = ({ children }: PropsWithChildren) => {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getLanguageSnapshot
  )

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={getAntdLocale(language)}
          theme={{ token: { colorPrimary: '#1677ff' } }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  )
}
