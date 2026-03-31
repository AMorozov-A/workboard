export class ApiError extends Error {
  readonly status: number
  readonly bodyText?: string

  constructor(status: number, message: string, bodyText?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.bodyText = bodyText
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
