import type { PropsWithChildren } from 'react'
import { useSyncExternalStore } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import { AntdAppBridge } from '@app/providers/AntdAppBridge'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'
import { store } from '@app/store/store'
import { ThemeSync } from '@app/providers/ThemeProvider'
import { darkTheme, lightTheme } from '@app/providers/themeConfig'
import i18n, { getAntdLocale } from '@shared/lib/i18n'
import { GlobalStyle } from '@shared/styles/GlobalStyle'
import { useThemeStore } from '@shared/stores/themeStore'
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
  const isDark = useThemeStore((s) => s.isDark)

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={{}}>
          <GlobalStyle />
          <ThemeSync />
          <ConfigProvider
            locale={getAntdLocale(language)}
            theme={isDark ? darkTheme : lightTheme}
          >
            <AntdApp>
              <AntdAppBridge />
              {children}
            </AntdApp>
          </ConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}
