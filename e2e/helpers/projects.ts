import type { Page } from '@playwright/test'

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
