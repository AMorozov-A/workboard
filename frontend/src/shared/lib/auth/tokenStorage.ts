const ACCESS_TOKEN_KEY = 'freelance_crm_access_token'

export function readStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeStoredAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // ignore
  }
}
