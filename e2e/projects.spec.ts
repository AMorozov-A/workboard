import { expect, test, type Page } from '@playwright/test'
import { ruCommon, ruProjectDetails, ruProjects, ruTasks } from './i18n-ru'
import { registerAndLogin } from './helpers/auth'
import { stubProjectsCreateFailure } from './helpers/projects'

async function openCreateProjectModal(page: Page) {
  await page.getByRole('button', { name: ruProjects.actions.create }).first().click()
  const dialog = page.getByRole('dialog', { name: ruProjects.modal.title })
  await expect(dialog).toBeVisible()
  return dialog
}

async function createProjectViaUi(page: Page, projectTitle: string, client = 'E2E Client') {
  const createDialog = await openCreateProjectModal(page)
  await createDialog.getByPlaceholder(ruProjects.form.namePlaceholder).fill(projectTitle)
  await createDialog.getByPlaceholder(ruProjects.form.clientPlaceholder).fill(client)
  await createDialog.getByRole('button', { name: ruProjects.modal.submit }).click()
  await expect(page.getByTestId('projects-page-root').getByText(projectTitle)).toBeVisible({
    timeout: 15_000,
  })
  await expect(createDialog).toBeHidden()
}

test.describe('Projects: полный флоу', () => {
  test('1) создание проекта через UI — появляется в списке', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E Create ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-create-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await expect(page.getByRole('heading', { name: ruProjects.title, level: 3 })).toBeVisible()
    await expect(page.getByTestId('projects-page-root')).toBeVisible()

    await createProjectViaUi(page, projectTitle)
  })

  test('2) редактирование проекта — изменения видны в списке', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E Edit ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-edit-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await createProjectViaUi(page, projectTitle)

    await page.getByRole('button', { name: ruProjects.actions.edit }).first().click()
    const editDialog = page.getByRole('dialog', { name: ruProjects.editModal.title })
    await expect(editDialog).toBeVisible()

    const renamed = `${projectTitle} (ред.)`
    const nameInput = editDialog.getByPlaceholder(ruProjects.form.namePlaceholder)
    await nameInput.clear()
    await nameInput.fill(renamed)
    await editDialog.getByRole('button', { name: ruProjects.editModal.submit }).click()

    await expect(page.getByTestId('projects-page-root').getByText(renamed)).toBeVisible({
      timeout: 15_000,
    })
    await expect(editDialog).toBeHidden()
  })

  test('3) удаление проекта — confirm, исчезает из списка', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E Delete ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-del-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await createProjectViaUi(page, projectTitle)

    await page.getByRole('button', { name: ruProjects.actions.delete }).click()
    const deleteConfirm = page.getByTestId('delete-project-confirm')
    await expect(deleteConfirm).toBeVisible()
    await deleteConfirm.getByRole('button', { name: ruProjects.delete.confirmOk }).click()

    await expect(page.getByText(ruProjects.empty.title)).toBeVisible({ timeout: 15_000 })
  })

  test('3b) отмена удаления — проект остаётся в списке', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E DelCancel ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-delcancel-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await createProjectViaUi(page, projectTitle)

    await page.getByRole('button', { name: ruProjects.actions.delete }).click()
    const deleteConfirm = page.getByTestId('delete-project-confirm')
    await expect(deleteConfirm).toBeVisible()
    await deleteConfirm.getByRole('button', { name: ruCommon.cancel }).click()
    await expect(deleteConfirm).toBeHidden()

    await expect(page.getByTestId('projects-page-root').getByText(projectTitle)).toBeVisible()
  })

  test(
    '4) задачи: создать в модалке, открыть drawer, удалить — список пустой',
    async ({ page }) => {
    test.setTimeout(90_000)
    const id = crypto.randomUUID()
    const projectTitle = `E2E Tasks ${id.slice(0, 8)}`
    const taskTitle = `Задача E2E ${id.slice(0, 6)}`
    await registerAndLogin(page, {
      email: `e2e-tasks-crud-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await createProjectViaUi(page, projectTitle)

    await page.locator('tbody').getByRole('row').filter({ hasText: projectTitle }).click()
    await expect(page).toHaveURL(/\/app\/projects\/[^/]+$/)
    await expect(
      page.getByRole('heading', { name: ruProjectDetails.tasksSection.title, level: 5 })
    ).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: ruTasks.actions.create }).first().click()
    const taskModal = page.getByRole('dialog', { name: ruTasks.modal.title })
    await expect(taskModal).toBeVisible()
    await taskModal.getByPlaceholder(ruTasks.form.titlePlaceholder).fill(taskTitle)
    await taskModal.getByRole('button', { name: ruTasks.modal.submit }).click()
    await expect(taskModal).toBeHidden({ timeout: 15_000 })

    await expect(page.locator('tbody').getByText(taskTitle, { exact: true })).toBeVisible({
      timeout: 15_000,
    })

    await page.locator('tbody').getByRole('row').filter({ hasText: taskTitle }).click()
    await expect(page.locator('.ant-drawer-open')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: ruTasks.actions.delete }).click()
    const deleteTaskConfirm = page.getByTestId('delete-task-confirm')
    await expect(deleteTaskConfirm).toBeVisible()
    await deleteTaskConfirm.getByRole('button', { name: ruTasks.delete.confirmOk }).click()

    await expect(page.locator('.ant-drawer-open')).toBeHidden({ timeout: 15_000 })
    await expect(page.getByTestId('project-tasks-empty')).toBeVisible({ timeout: 30_000 })
    }
  )

  test('4b) переход на карточку проекта — вкладка Задачи и секция задач', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E Nav ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-nav-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await createProjectViaUi(page, projectTitle)

    await page.locator('tbody').getByRole('row').filter({ hasText: projectTitle }).click()

    await expect(page).toHaveURL(/\/app\/projects\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: projectTitle })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('tab', { name: ruProjectDetails.tabs.tasks })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: ruProjectDetails.tasksSection.title, level: 5 })
    ).toBeVisible()
  })

  test('5) негатив: без названия — кнопка Создать неактивна', async ({ page }) => {
    const id = crypto.randomUUID()
    await registerAndLogin(page, {
      email: `e2e-proj-val-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    const createDialog = await openCreateProjectModal(page)
    await createDialog.getByPlaceholder(ruProjects.form.clientPlaceholder).fill('Только клиент')
    await expect(createDialog.getByRole('button', { name: ruProjects.modal.submit })).toBeDisabled()
  })

  test('6) негатив: ошибка сервера при создании — уведомление', async ({ page }) => {
    const id = crypto.randomUUID()
    const projectTitle = `E2E Fail ${id.slice(0, 8)}`
    await registerAndLogin(page, {
      email: `e2e-proj-500-${id}@example.com`,
      password: 'password12',
      name: 'E2E User',
    })

    await stubProjectsCreateFailure(page)
    try {
      const createDialog = await openCreateProjectModal(page)
      await createDialog.getByPlaceholder(ruProjects.form.namePlaceholder).fill(projectTitle)
      await createDialog.getByPlaceholder(ruProjects.form.clientPlaceholder).fill('E2E Client')
      await createDialog.getByRole('button', { name: ruProjects.modal.submit }).click()

      await expect(page.getByText(ruProjects.notifications.createErrorTitle)).toBeVisible({
        timeout: 15_000,
      })
    } finally {
      await page.unroute('**/api/v1/projects')
    }
  })
})
