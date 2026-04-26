import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, testI18n, userEvent, waitFor } from '../../../../tests/test-utils'
import { TaskModalWidget } from '../TaskModalWidget'

const mutateAsyncMock = vi.fn()

vi.mock('@entities/task-note', () => {
  return {
    useTaskNotesList: () => ({ data: [] }),
    useCreateTaskNoteMutation: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
    useUpdateTaskNoteMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteTaskNoteMutation: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
      variables: undefined,
    }),
  }
})

vi.mock('@shared/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@shared/ui')>()
  return {
    ...mod,
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }
})

describe('TaskModalWidget', () => {
  const baseProps = {
    projectId: 'project-1',
    tasksQueryKey: 'project-1',
    onClose: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    onSave: vi.fn().mockResolvedValue(undefined),
    onTaskDeleted: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    baseProps.onCreate.mockResolvedValue(undefined)
    baseProps.onSave.mockResolvedValue(undefined)
    mutateAsyncMock.mockResolvedValue(undefined)
  })

  it('в режиме create скрывает ID задачи в хедере', () => {
    renderWithProviders(<TaskModalWidget open mode="create" task={null} {...baseProps} />)

    expect(
      screen.queryByText(new RegExp(testI18n.t('tasks.detailModal.idLabel'), 'i')),
    ).toBeNull()
  })

  it('кнопка сохранения disabled пока заголовок пуст', () => {
    renderWithProviders(<TaskModalWidget open mode="create" task={null} {...baseProps} />)

    expect(
      screen.getByRole('button', { name: testI18n.t('tasks.modal.submit') }),
    ).toBeDisabled()
  })

  it('после ввода title сохранение вызывает onCreate и закрытие', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskModalWidget open mode="create" task={null} {...baseProps} />)

    const titleInput = screen.getByLabelText(testI18n.t('tasks.form.title'))
    await user.type(titleInput, 'Smoke test task')

    const submit = screen.getByRole('button', { name: testI18n.t('tasks.modal.submit') })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    await waitFor(() => {
      expect(baseProps.onCreate).toHaveBeenCalledTimes(1)
    })
    const created = baseProps.onCreate.mock.calls[0][0]
    expect(created).toMatchObject({
      title: 'Smoke test task',
      projectId: 'project-1',
      status: 'todo',
      priority: 'medium',
    })
    await waitFor(() => expect(baseProps.onClose).toHaveBeenCalled())
  })

  it('клик по иконке закрытия вызывает onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskModalWidget open mode="create" task={null} {...baseProps} />)

    await user.click(
      screen.getByRole('button', { name: testI18n.t('tasks.detailModal.closeAria') }),
    )
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('в режиме edit создаёт заметку по Enter в поле ввода', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TaskModalWidget
        open
        mode="edit"
        task={{
          id: 'task-1',
          key: 'task-1',
          title: 'My task',
          description: undefined,
          status: 'todo',
          priority: 'medium',
          dueDate: undefined,
          labels: undefined,
          projectId: 'project-1',
          createdBy: 'freelancer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        {...baseProps}
      />,
    )

    const noteArea = screen.getByLabelText(testI18n.t('tasks.detailModal.sections.notes'))
    await user.click(noteArea)
    await user.keyboard('hello')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    expect(mutateAsyncMock.mock.calls[0][0]).toEqual({ body: 'hello' })
  })
})
