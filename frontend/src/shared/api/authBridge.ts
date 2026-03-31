import { readStoredAccessToken } from '@shared/lib/auth/tokenStorage'

type AuthBridge = {
  getToken: () => string | null
  onUnauthorized: () => void
}

let bridge: AuthBridge | null = null

export function registerAuthBridge(next: AuthBridge): void {
  bridge = next
}

/**
 * Токен для заголовка Authorization.
 * Пока `registerAuthBridge` ещё не вызван (первый кадр /me после F5), bridge нет —
 * берём токен из localStorage, иначе запрос /me уходит без Bearer, приходит 401,
 * глобальный logout не срабатывает и UI зависает на спиннере.
 */
export function getAuthToken(): string | null {
  return bridge?.getToken() ?? readStoredAccessToken()
}

export function triggerUnauthorized(): void {
  bridge?.onUnauthorized()
}
