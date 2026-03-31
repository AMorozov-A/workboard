import enUS from 'antd/locale/en_US'
import ruRU from 'antd/locale/ru_RU'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/ru'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'

export const defaultLanguage = 'ru'
export const languageStorageKey = 'crm.language'
export const supportedLanguages = ['ru', 'en'] as const

export type AppLanguage = (typeof supportedLanguages)[number]

const resources = {
  ru: {
    translation: ru,
  },
  en: {
    translation: en,
  },
} as const

export const normalizeLanguage = (language: string): AppLanguage =>
  language.startsWith('ru') ? 'ru' : 'en'

const getStoredLanguage = (): AppLanguage | null => {
  if (typeof window === 'undefined') return null

  const storedLanguage = window.localStorage.getItem(languageStorageKey)

  if (!storedLanguage) return null

  if (supportedLanguages.includes(storedLanguage as AppLanguage)) {
    return storedLanguage as AppLanguage
  }

  window.localStorage.removeItem(languageStorageKey)

  return null
}

const persistLanguage = (language: string) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(languageStorageKey, normalizeLanguage(language))
}

export const getAntdLocale = (language: string) =>
  normalizeLanguage(language) === 'ru' ? ruRU : enUS

export const getCurrentLanguage = (): AppLanguage =>
  normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

export const getIntlLocale = (language = getCurrentLanguage()) =>
  normalizeLanguage(language) === 'ru' ? 'ru-RU' : 'en-US'

export const getDateInputFormat = (language = getCurrentLanguage()) =>
  normalizeLanguage(language) === 'ru' ? 'DD.MM.YYYY' : 'MM/DD/YYYY'

export const formatLocaleDate = (
  value?: string,
  options?: Intl.DateTimeFormatOptions
) => {
  if (!value) return i18n.t('common.notSpecified')

  const parsedDate = dayjs(value)

  if (!parsedDate.isValid()) {
    return i18n.t('common.notSpecified')
  }

  return new Intl.DateTimeFormat(getIntlLocale(), options ?? {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate.toDate())
}

export const formatLocaleDateTime = (
  value?: string,
  options?: Intl.DateTimeFormatOptions
) =>
  formatLocaleDate(value, options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatLocaleCurrency = (
  value?: number,
  currency = 'RUB'
) => {
  if (value == null) return i18n.t('common.notSpecified')

  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const syncDayjsLocale = (language: string) => {
  const normalizedLanguage = normalizeLanguage(language)

  dayjs.locale(normalizedLanguage)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalizedLanguage
  }
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getStoredLanguage() ?? defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
  })

  syncDayjsLocale(i18n.language)
  i18n.on('languageChanged', syncDayjsLocale)
  i18n.on('languageChanged', persistLanguage)
}

export const setAppLanguage = (language: AppLanguage) => i18n.changeLanguage(language)

export default i18n
