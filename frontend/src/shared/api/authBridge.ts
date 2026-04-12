import { readStoredAccessToken } from '@shared/lib/auth/tokenStorage'

type AuthBridge = {
  getToken: () => string | null
  onUnauthorized: () => void
}

let bridge: AuthBridge | null = null

export function registerAuthBridge(next: AuthBridge): void {
  bridge = next
}

export function getAuthToken(): string | null {
  return bridge?.getToken() ?? readStoredAccessToken()
}

export function triggerUnauthorized(): void {
  bridge?.onUnauthorized()
}
