import { expect, test } from '@playwright/test'
import { registerViaAPI } from './helpers/auth'

test.describe('Auth flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('shows login page by default', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Вход', level: 3 })).toBeVisible()
  })

  test('can register a new user and land on workspace', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-${id}@example.com`
    const password = 'password12'

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Вход', level: 3 })).toBeVisible()
    await page.locator('.ant-segmented-item').filter({ hasText: 'Зарегистрироваться' }).click()
    await expect(page.getByRole('heading', { name: 'Регистрация', level: 3 })).toBeVisible()

    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Например: Алексей').fill('E2E User')
    await page.getByPlaceholder('Не менее 8 символов').fill(password)
    await page.getByPlaceholder('Повторите пароль').fill(password)
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page).toHaveURL(/\/app\/projects/)
    await expect(page.getByText('WorkBoard')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Проекты' })).toBeVisible()
  })

  test('after UI registration, user can sign in again with the same credentials', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-relogin-${id}@example.com`
    const password = 'password12'

    await page.goto('/login')
    await page.locator('.ant-segmented-item').filter({ hasText: 'Зарегистрироваться' }).click()
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Например: Алексей').fill('Relogin User')
    await page.getByPlaceholder('Не менее 8 символов').fill(password)
    await page.getByPlaceholder('Повторите пароль').fill(password)
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page).toHaveURL(/\/app\/projects/)
    await expect(page.getByText(email, { exact: true })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Выйти' }).click()
    await page.waitForURL(/\/login$/)

    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('••••••').fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()

    await expect(page).toHaveURL(/\/app\/projects/)
    await expect(page.getByText(email, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('can login with existing user', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-login-${id}@example.com`
    const password = 'password12'

    await registerViaAPI(page.request, { email, password, name: 'Existing' })

    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('••••••').fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()

    await expect(page).toHaveURL(/\/app\/projects/)
    await expect(page.getByText('WorkBoard')).toBeVisible()
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app/projects')
    await page.waitForURL(/\/login$/)
  })

  test('registration with duplicate email shows error and stays on login page', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-dup-${id}@example.com`
    const password = 'password12'

    await registerViaAPI(page.request, { email, password, name: 'Existing' })

    await page.goto('/login')
    await page.locator('.ant-segmented-item').filter({ hasText: 'Зарегистрироваться' }).click()
    await expect(page.getByRole('heading', { name: 'Регистрация', level: 3 })).toBeVisible()

    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Например: Алексей').fill('Dup User')
    await page.getByPlaceholder('Не менее 8 символов').fill(password)
    await page.getByPlaceholder('Повторите пароль').fill(password)
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page).not.toHaveURL(/\/app\/projects/)
    await expect(page.getByText('Этот email уже зарегистрирован')).toBeVisible({ timeout: 10_000 })
  })

  test('can switch between login and register tabs', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Вход', level: 3 })).toBeVisible()

    await page.locator('.ant-segmented-item').filter({ hasText: 'Зарегистрироваться' }).click()
    await expect(page.getByRole('heading', { name: 'Регистрация', level: 3 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible()

    await page.locator('.ant-segmented-item').filter({ hasText: 'Войти' }).click()
    await expect(page.getByRole('heading', { name: 'Вход', level: 3 })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  })
})
