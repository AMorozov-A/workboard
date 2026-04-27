import { expect, test } from '@playwright/test'
import { registerViaAPI } from './helpers/auth'
import { ruAuth, ruLayout } from './i18n-ru'

test.describe('Auth flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('shows login page by default', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login$/)
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleLogin, level: 3 })
    ).toBeVisible()
  })

  test('can register a new user and land on workspace', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-${id}@example.com`
    const password = 'password12'

    await page.goto('/login')
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleLogin, level: 3 })
    ).toBeVisible()

    await page
      .locator('.ant-segmented-item')
      .filter({ hasText: ruAuth.page.tabRegister })
      .click()
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleRegister, level: 3 })
    ).toBeVisible()

    await page.getByPlaceholder(ruAuth.registerForm.emailPlaceholder).fill(email)
    await page.getByPlaceholder(ruAuth.registerForm.namePlaceholder).fill('E2E User')
    await page.getByPlaceholder(ruAuth.registerForm.passwordPlaceholder).fill(password)
    await page.getByPlaceholder(ruAuth.registerForm.passwordConfirmationPlaceholder).fill(password)
    await page.getByRole('button', { name: ruAuth.registerForm.submit }).click()

    await expect(page).toHaveURL(/\/projects\/?$/)
    await expect(page.getByText(ruLayout.brand)).toBeVisible()
    await expect(page.getByTestId('projects-page-root')).toBeVisible()
  })

  test('after UI registration, user can sign in again with the same credentials', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-relogin-${id}@example.com`
    const password = 'password12'

    await page.goto('/login')
    await page
      .locator('.ant-segmented-item')
      .filter({ hasText: ruAuth.page.tabRegister })
      .click()
    await page.getByPlaceholder(ruAuth.registerForm.emailPlaceholder).fill(email)
    await page.getByPlaceholder(ruAuth.registerForm.namePlaceholder).fill('Relogin User')
    await page.getByPlaceholder(ruAuth.registerForm.passwordPlaceholder).fill(password)
    await page.getByPlaceholder(ruAuth.registerForm.passwordConfirmationPlaceholder).fill(password)
    await page.getByRole('button', { name: ruAuth.registerForm.submit }).click()

    await expect(page).toHaveURL(/\/projects\/?$/)
    await expect(page.getByTestId('projects-page-root')).toBeVisible({ timeout: 10_000 })

    await page.evaluate(() => localStorage.removeItem('workboard_access_token'))
    await page.goto('/login')
    await page.waitForURL(/\/login$/)

    await page.getByPlaceholder(ruAuth.form.emailPlaceholder).fill(email)
    await page.getByPlaceholder(ruAuth.form.passwordPlaceholder).fill(password)
    await page.getByRole('button', { name: ruAuth.form.submit }).click()

    await expect(page).toHaveURL(/\/projects\/?$/)
    await expect(page.getByTestId('projects-page-root')).toBeVisible({ timeout: 10_000 })
  })

  test('can login with existing user', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-login-${id}@example.com`
    const password = 'password12'

    await registerViaAPI(page.request, { email, password, name: 'Existing' })

    await page.goto('/login')
    await page.getByPlaceholder(ruAuth.form.emailPlaceholder).fill(email)
    await page.getByPlaceholder(ruAuth.form.passwordPlaceholder).fill(password)
    await page.getByRole('button', { name: ruAuth.form.submit }).click()

    await expect(page).toHaveURL(/\/projects\/?$/)
    await expect(page.getByText(ruLayout.brand)).toBeVisible()
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForURL(/\/login$/)
  })

  test('registration with duplicate email shows error and stays on login page', async ({ page }) => {
    const id = crypto.randomUUID()
    const email = `e2e-dup-${id}@example.com`
    const password = 'password12'

    await registerViaAPI(page.request, { email, password, name: 'Existing' })

    await page.goto('/login')
    await page
      .locator('.ant-segmented-item')
      .filter({ hasText: ruAuth.page.tabRegister })
      .click()
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleRegister, level: 3 })
    ).toBeVisible()

    await page.getByPlaceholder(ruAuth.registerForm.emailPlaceholder).fill(email)
    await page.getByPlaceholder(ruAuth.registerForm.namePlaceholder).fill('Dup User')
    await page.getByPlaceholder(ruAuth.registerForm.passwordPlaceholder).fill(password)
    await page.getByPlaceholder(ruAuth.registerForm.passwordConfirmationPlaceholder).fill(password)
    await page.getByRole('button', { name: ruAuth.registerForm.submit }).click()

    await expect(page).not.toHaveURL(/\/projects\/?$/)
    await expect(page.getByText(ruAuth.errors.emailTaken)).toBeVisible({ timeout: 10_000 })
  })

  test('can switch between login and register tabs', async ({ page }) => {
    await page.goto('/login')
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleLogin, level: 3 })
    ).toBeVisible()

    await page
      .locator('.ant-segmented-item')
      .filter({ hasText: ruAuth.page.tabRegister })
      .click()
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleRegister, level: 3 })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: ruAuth.registerForm.submit })).toBeVisible()

    await page
      .locator('.ant-segmented-item')
      .filter({ hasText: ruAuth.page.tabLogin })
      .click()
    await expect(
      page.getByRole('heading', { name: ruAuth.page.titleLogin, level: 3 })
    ).toBeVisible()
    await expect(page.getByPlaceholder(ruAuth.form.emailPlaceholder)).toBeVisible()
  })
})
