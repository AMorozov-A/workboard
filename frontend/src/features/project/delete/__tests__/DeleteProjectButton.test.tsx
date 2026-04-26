import * as sharedUi from '@shared/ui'
import { Modal } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  renderWithProviders,
  screen,
  testI18n,
  userEvent,
  waitFor,
  within,
} from '../../../../../tests/test-utils'
import { DeleteProjectButton } from '../ui/DeleteProjectButton'
import type { Project } from '@entities/project/types'

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@shared/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@shared/ui')>()
  return {
    ...mod,
    notifyError: vi.fn(),
  }
})

vi.mock('@entities/project/api', () => ({
  useDeleteProjectMutation: () => ({
    mutateAsync: mockMutateAsync,
  }),
}))

const sampleProject: Project = {
  id: 'p-del-1',
  key: 'proj-9',
  taskKeyPrefix: 'T',
  name: 'To delete',
  client: 'X',
  status: 'active',
}

describe('DeleteProjectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue(undefined)
  })

  it('рендерит кнопку с data-testid', () => {
    renderWithProviders(<DeleteProjectButton project={sampleProject} />)

    expect(screen.getByTestId('delete-project-p-del-1')).toBeInTheDocument()
  })

  it('по клику открывает confirm; подтверждение вызывает mutateAsync с id проекта', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DeleteProjectButton project={sampleProject} />)

    await user.click(screen.getByTestId('delete-project-p-del-1'))

    await waitFor(() => {
      expect(screen.getAllByRole('dialog').length).toBeGreaterThanOrEqual(1)
    })
    const dialogsAfterOpen = screen.getAllByRole('dialog')
    const confirmDialog = dialogsAfterOpen[dialogsAfterOpen.length - 1]
    await user.click(
      within(confirmDialog).getByRole('button', { name: testI18n.t('projects.delete.confirmOk') })
    )

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('p-del-1'))
  })

  it('отмена в confirm не вызывает mutateAsync', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DeleteProjectButton project={sampleProject} />)

    await user.click(screen.getByTestId('delete-project-p-del-1'))

    await waitFor(() => {
      expect(screen.getAllByRole('dialog').length).toBeGreaterThanOrEqual(1)
    })
    const dialogsOpen = screen.getAllByRole('dialog')
    const confirmDialogCancel = dialogsOpen[dialogsOpen.length - 1]
    await user.click(
      within(confirmDialogCancel).getByRole('button', { name: testI18n.t('common.cancel') })
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('при ошибке mutateAsync вызывает notifyError с текстами из локали', async () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      queueMicrotask(async () => {
        try {
          await config.onOk?.()
        } catch {
          // как в UI: после notifyError onOk отклоняется — не даём unhandled rejection
        }
      })
      return { destroy: vi.fn(), update: vi.fn() }
    })

    try {
      mockMutateAsync.mockRejectedValueOnce(new Error('network'))
      const user = userEvent.setup()
      renderWithProviders(<DeleteProjectButton project={sampleProject} />)

      await user.click(screen.getByTestId('delete-project-p-del-1'))

      await waitFor(() => {
        expect(sharedUi.notifyError).toHaveBeenCalledWith(
          testI18n.t('projects.delete.errorTitle'),
          testI18n.t('projects.delete.errorDescription')
        )
      })
    } finally {
      confirmSpy.mockRestore()
    }
  })
})
