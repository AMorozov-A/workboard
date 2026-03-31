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
import { DeleteTaskButton } from '../ui/DeleteTaskButton'
import type { Task } from '@entities/task/model/types'

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@shared/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@shared/ui')>()
  return {
    ...mod,
    notifyError: vi.fn(),
  }
})

vi.mock('@entities/task/api', () => ({
  useDeleteTaskMutation: () => ({
    mutateAsync: mockMutateAsync,
  }),
}))

const sampleTask: Task = {
  id: 'task-del-1',
  key: 'task-9',
  title: 'To delete',
  status: 'todo',
  priority: 'medium',
  projectId: 'p-1',
  createdBy: 'freelancer',
}

describe('DeleteTaskButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue(undefined)
  })

  it('рендерит кнопку с data-testid', () => {
    renderWithProviders(<DeleteTaskButton task={sampleTask} tasksQueryKey="proj-route-1" />)

    expect(screen.getByTestId('delete-task-task-del-1')).toBeInTheDocument()
  })

  it('по клику открывает confirm; подтверждение вызывает mutateAsync с id и projectId', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DeleteTaskButton task={sampleTask} tasksQueryKey="proj-route-1" />)

    await user.click(screen.getByTestId('delete-task-task-del-1'))

    await waitFor(() => {
      expect(screen.getAllByRole('dialog').length).toBeGreaterThanOrEqual(1)
    })
    const dialogsAfterOpen = screen.getAllByRole('dialog')
    const confirmDialog = dialogsAfterOpen[dialogsAfterOpen.length - 1]
    await user.click(
      within(confirmDialog).getByRole('button', { name: testI18n.t('tasks.delete.confirmOk') })
    )

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        taskId: 'task-del-1',
        tasksQueryKey: 'proj-route-1',
      })
    )
  })

  it('отмена в confirm не вызывает mutateAsync', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DeleteTaskButton task={sampleTask} tasksQueryKey="proj-route-1" />)

    await user.click(screen.getByTestId('delete-task-task-del-1'))

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
      renderWithProviders(<DeleteTaskButton task={sampleTask} tasksQueryKey="proj-route-1" />)

      await user.click(screen.getByTestId('delete-task-task-del-1'))

      await waitFor(() => {
        expect(sharedUi.notifyError).toHaveBeenCalledWith(
          testI18n.t('tasks.delete.errorTitle'),
          testI18n.t('tasks.delete.errorDescription')
        )
      })
    } finally {
      confirmSpy.mockRestore()
    }
  })
})
