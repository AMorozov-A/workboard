import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../src/shared/lib/i18n/locales/en.json'

export const testI18n = i18next.createInstance()

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
