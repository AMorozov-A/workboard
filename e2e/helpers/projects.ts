import type { Page } from '@playwright/test'

/**
 * Перехватывает только POST /api/v1/projects и отвечает 500 (для E2E негативного сценария).
 * После теста при необходимости снимите перехват тем же glob-паттерном, что в `page.route`.
 */
export async function stubProjectsCreateFailure(page: Page): Promise<void> {
  await page.route('**/api/v1/projects', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    })
  })
}
