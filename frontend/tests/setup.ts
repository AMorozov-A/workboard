import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach } from 'vitest'
import { testI18nInitPromise } from './i18n'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

beforeAll(async () => {
  await testI18nInitPromise
})

beforeEach(() => {
  localStorage.clear()
})
