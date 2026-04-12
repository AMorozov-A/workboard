import { useEffect } from 'react'
import { useThemeStore } from '@shared/stores/themeStore'

export function ThemeSync() {
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return null
}
