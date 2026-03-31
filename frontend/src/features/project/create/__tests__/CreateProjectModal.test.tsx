import * as sharedUi from '@shared/ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  renderWithProviders,
  screen,
  testI18n,
  userEvent,
  waitFor,
} from '../../../../../tests/test-utils'
import { CreateProjectModal } from '../ui/CreateProjectModal'

vi.mock('@shared/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@shared/ui')>()
  return {
    ...mod,
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }
})

describe('CreateProjectModal', () => {
  const onClose = vi.fn()
  const onCreate = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    onCreate.mockResolvedValue(undefined)
  })

  it('модалка помечена data-testid для регрессии формы', () => {
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    expect(screen.getByTestId('create-project-modal')).toBeInTheDocument()
  })

  it('при open рендерит поля формы', () => {
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    expect(screen.getByText(testI18n.t('projects.form.name'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.keyPrefix'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.client'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.status'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.budget'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.deadline'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.form.description'))).toBeInTheDocument()
  })

  it('кнопка Create неактивна пока обязательные поля пусты', () => {
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    expect(screen.getByRole('button', { name: testI18n.t('projects.modal.submit') })).toBeDisabled()
  })

  it('показывает ошибку валидации для имени после ввода и очистки', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    const nameInput = screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder'))
    await user.type(nameInput, 'x')
    await user.clear(nameInput)

    await waitFor(() => {
      expect(screen.getByText(testI18n.t('projects.validation.nameRequired'))).toBeInTheDocument()
    })
  })

  it('сабмит вызывает onCreate и закрывает модалку при успехе', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'New CRM'
    )
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.clientPlaceholder')),
      'ACME'
    )

    await user.click(screen.getByRole('button', { name: testI18n.t('projects.modal.submit') }))

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledTimes(1)
    })

    const arg = onCreate.mock.calls[0][0]
    expect(arg).toMatchObject({
      name: 'New CRM',
      client: 'ACME',
      status: 'active',
      keyPrefix: 'proj',
    })
    expect(arg.id).toBeDefined()

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    expect(sharedUi.notifySuccess).toHaveBeenCalled()
  })

  it('при ошибке onCreate показывает notifyError и не вызывает onClose', async () => {
    const user = userEvent.setup()
    onCreate.mockRejectedValueOnce(new Error('fail'))

    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'New CRM'
    )
    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.clientPlaceholder')),
      'ACME'
    )
    await user.click(screen.getByRole('button', { name: testI18n.t('projects.modal.submit') }))

    await waitFor(() => {
      expect(sharedUi.notifyError).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Cancel вызывает onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    await user.click(screen.getByRole('button', { name: testI18n.t('common.cancel') }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('после Cancel при повторном open поля сброшены', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <CreateProjectModal open onClose={onClose} onCreate={onCreate} />
    )

    await user.type(
      screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder')),
      'Draft'
    )
    await user.click(screen.getByRole('button', { name: testI18n.t('common.cancel') }))

    rerender(<CreateProjectModal open={false} onClose={onClose} onCreate={onCreate} />)
    rerender(<CreateProjectModal open onClose={onClose} onCreate={onCreate} />)

    expect(screen.getByPlaceholderText(testI18n.t('projects.form.namePlaceholder'))).toHaveValue('')
  })
})
