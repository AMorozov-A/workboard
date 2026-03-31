import * as sharedUi from '@shared/ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  renderWithProviders,
  screen,
  testI18n,
  userEvent,
  waitFor,
  within,
} from '../../../../../tests/test-utils'
import { EditProjectModal } from '../ui/EditProjectModal'
import type { Project } from '@entities/project/types'

vi.mock('@shared/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@shared/ui')>()
  return {
    ...mod,
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }
})

const baseProject: Project = {
  id: 'p-edit',
  key: 'crm-2',
  name: 'Original',
  client: 'ACME',
  status: 'paused',
  description: 'Desc',
}

describe('EditProjectModal', () => {
  const onClose = vi.fn()
  const onUpdate = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    onUpdate.mockResolvedValue(undefined)
  })

  it('data-testid и заголовок модалки', () => {
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    expect(screen.getByTestId('edit-project-modal')).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.editModal.title'))).toBeInTheDocument()
  })

  it('предзаполняет поля из project', () => {
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    expect(screen.getByDisplayValue('Original')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ACME')).toBeInTheDocument()
    expect(screen.getByText('crm-2')).toBeInTheDocument()
  })

  it('показывает ошибку валидации имени после очистки', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    const nameInput = screen.getByDisplayValue('Original')
    await user.clear(nameInput)

    await waitFor(() => {
      expect(screen.getByText(testI18n.t('projects.validation.nameRequired'))).toBeInTheDocument()
    })
  })

  it('сабмит вызывает onUpdate с обновлёнными полями и закрывает модалку при успехе', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    await user.clear(screen.getByDisplayValue('Original'))
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'Renamed'
    )

    await user.click(screen.getByRole('button', { name: testI18n.t('projects.editModal.submit') }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    expect(onUpdate.mock.calls[0][0]).toMatchObject({
      id: 'p-edit',
      key: 'crm-2',
      name: 'Renamed',
      client: 'ACME',
      status: 'paused',
      description: 'Desc',
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    expect(sharedUi.notifySuccess).toHaveBeenCalled()
  })

  it('сабмит вызывает onUpdate с полным объектом при изменении name, client и budget', async () => {
    const user = userEvent.setup()
    const projectWithBudget: Project = {
      ...baseProject,
      budget: 1000,
    }
    renderWithProviders(
      <EditProjectModal
        project={projectWithBudget}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    await user.clear(screen.getByDisplayValue('Original'))
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'MultiEdit'
    )

    await user.clear(screen.getByDisplayValue('ACME'))
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.clientPlaceholder')),
      'NewClient'
    )

    const budgetInput = screen.getByRole('spinbutton')
    await user.clear(budgetInput)
    await user.type(budgetInput, '48000')

    await user.click(screen.getByRole('button', { name: testI18n.t('projects.editModal.submit') }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    expect(onUpdate.mock.calls[0][0]).toMatchObject({
      id: 'p-edit',
      key: 'crm-2',
      name: 'MultiEdit',
      client: 'NewClient',
      status: 'paused',
      description: 'Desc',
      budget: 48000,
    })
  })

  it('при ошибке onUpdate показывает notifyError и не вызывает onClose', async () => {
    const user = userEvent.setup()
    onUpdate.mockRejectedValueOnce(new Error('fail'))

    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    await user.clear(screen.getByDisplayValue('Original'))
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'Renamed'
    )

    await user.click(screen.getByRole('button', { name: testI18n.t('projects.editModal.submit') }))

    await waitFor(() => {
      expect(sharedUi.notifyError).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('edit-project-modal')).toBeVisible()
  })

  it('во время ожидания onUpdate кнопка Save в состоянии loading', async () => {
    let resolveUpdate: () => void
    const updatePromise = new Promise<void>((resolve) => {
      resolveUpdate = resolve
    })
    onUpdate.mockReturnValueOnce(updatePromise)

    const user = userEvent.setup()
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    const dialog = screen.getByRole('dialog')

    await user.clear(screen.getByDisplayValue('Original'))
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'Renamed'
    )
    await user.click(
      within(dialog).getByRole('button', { name: testI18n.t('projects.editModal.submit') })
    )

    await waitFor(() => {
      const loadingBtn = dialog.querySelector('.ant-modal-footer button.ant-btn-loading')
      expect(loadingBtn).not.toBeNull()
    })

    resolveUpdate!()
  })

  it('Cancel вызывает onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <EditProjectModal
        project={baseProject}
        open
        onClose={onClose}
        onUpdate={onUpdate}
      />
    )

    await user.click(screen.getByRole('button', { name: testI18n.t('common.cancel') }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
