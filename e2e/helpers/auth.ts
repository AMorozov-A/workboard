import type { APIRequestContext, Page } from '@playwright/test'

/** Совпадает с frontend/src/shared/lib/auth/tokenStorage.ts */
export const ACCESS_TOKEN_KEY = 'freelance_crm_access_token'

export const getApiBaseUrl = (): string =>
  process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001'

type LoginBody = {
  email: string
  password: string
}

type RegisterBody = LoginBody & {
  name?: string
}

type AuthJson = {
  ok?: boolean
  accessToken?: string
  user?: { id: string; email: string; name?: string | null }
}

export async function loginViaAPI(
  request: APIRequestContext,
  body: LoginBody
): Promise<string> {
  const res = await request.post(`${getApiBaseUrl()}/api/v1/auth/login`, {
    data: body,
  })
  if (!res.ok()) {
    throw new Error(`loginViaAPI failed: ${res.status()} ${await res.text()}`)
  }
  const json = (await res.json()) as AuthJson
  if (!json.accessToken) {
    throw new Error('loginViaAPI: missing accessToken in response')
  }
  return json.accessToken
}

export async function registerViaAPI(
  request: APIRequestContext,
  body: RegisterBody
): Promise<{ accessToken: string }> {
  const res = await request.post(`${getApiBaseUrl()}/api/v1/auth/register`, {
    data: body,
  })
  if (!res.ok()) {
    throw new Error(`registerViaAPI failed: ${res.status()} ${await res.text()}`)
  }
  const json = (await res.json()) as AuthJson
  if (!json.accessToken) {
    throw new Error('registerViaAPI: missing accessToken in response')
  }
  return { accessToken: json.accessToken }
}

/**
 * Регистрация через API, запись токена в localStorage и переход в рабочую область
 * (подгрузка пользователя через /me, как в обычном приложении).
 */
export async function registerAndLogin(
  page: Page,
  creds: RegisterBody
): Promise<void> {
  const { accessToken } = await registerViaAPI(page.request, creds)
  await page.goto('/')
  await page.evaluate(
    ([key, token]) => {
      localStorage.setItem(key, token)
    },
    [ACCESS_TOKEN_KEY, accessToken] as [string, string]
  )
  await page.goto('/app/projects')
  await page.waitForURL(/\/app\/projects/)
}
