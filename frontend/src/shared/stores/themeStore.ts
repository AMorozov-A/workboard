import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: getSystemPrefersDark(),
      toggle: () => set({ isDark: !get().isDark }),
    }),
    {
      name: 'crm-theme',
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
)
