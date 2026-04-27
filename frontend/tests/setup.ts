import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from '../src/mocks/server'
import { testI18nInitPromise } from './i18n'

const originalGetComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = ((...args: Parameters<typeof window.getComputedStyle>) =>
  originalGetComputedStyle(args[0])) as typeof window.getComputedStyle

Object.defineProperty(document, 'elementFromPoint', {
  configurable: true,
  value: () => null,
})

const nodeProto = Node.prototype as unknown as {
  getClientRects?: () => DOMRectList
  getBoundingClientRect?: () => DOMRect
}
if (typeof nodeProto.getClientRects !== 'function') {
  nodeProto.getClientRects = () =>
    ({ length: 0, item: () => null } as unknown as DOMRectList)
}
if (typeof nodeProto.getBoundingClientRect !== 'function') {
  nodeProto.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as unknown as DOMRect)
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

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
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  localStorage.clear()
})
