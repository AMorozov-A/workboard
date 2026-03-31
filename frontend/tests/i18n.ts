import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../src/shared/lib/i18n/locales/en.json'

export const testI18n = i18next.createInstance()

/**
 * Тестовый экземпляр i18next для Vitest (юнит/интеграционные тесты компонентов).
 *
 * Контракт локалей:
 * - Unit-тесты (Vitest) используют `locale=en` (этот инстанс + `lng: 'en'` ниже).
 * - Приложение и Playwright E2E используют `locale=ru` по умолчанию (`frontend/src/shared/lib/i18n`, `e2e/i18n-ru.ts`).
 * - Часть хелперов (например `getProjectStatusOptions` в entities) читает глобальный `i18n` приложения —
 *   в тестах после `localStorage.clear()` он тоже `ru`, поэтому подписи в Select могут быть на русском.
 * - При правке i18n-ключей проверяй оба уровня: тесты с `testI18n.t(…)` и UI/E2E на `ru`.
 */
export const testI18nInitPromise = testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        ...en,
        smoke: {
          hello: 'Hello',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
})
