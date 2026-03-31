import { getAuthToken, triggerUnauthorized } from './authBridge'
import { ApiError } from './errors'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type ApiRequestOptions = {
  /** Не подставлять Authorization (логин и т.п.) */
  skipAuth?: boolean
}

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {}
): Promise<T> => {
  const headers = new Headers(init.headers ?? undefined)

  const tokenForRequest = options.skipAuth ? null : getAuthToken()
  if (tokenForRequest) {
    headers.set('Authorization', `Bearer ${tokenForRequest}`)
  }

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  const hadAuthHeader = Boolean(tokenForRequest)

  if (response.status === 401 && hadAuthHeader) {
    triggerUnauthorized()
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  if (!response.ok) {
    const errorText = await response.text()
    let message = errorText || response.statusText
    try {
      const parsed = JSON.parse(errorText) as { message?: string }
      if (typeof parsed?.message === 'string' && parsed.message.length > 0) {
        message = parsed.message
      }
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, message, errorText)
  }

  return response.json() as Promise<T>
}
