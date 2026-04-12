import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@mocks/server'
import { mockApiTask, tasksHandlers } from '@mocks/handlers'
import type { Task } from './model/types'
import {
  projectTasksQueryKey,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useProjectTasksQuery,
  useUpdateTaskMutation,
} from './api'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createHookWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const baseTask: Task = {
  id: 't-1',
  key: 'task-1',
  title: 'Task title',
  status: 'todo',
  priority: 'medium',
  projectId: 'p-1',
  createdBy: 'freelancer',
}

describe('useProjectTasksQuery', () => {
  it('успех — data — массив Task после маппинга', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const row = mockApiTask({
      id: 'ta-1',
      title: 'Mapped',
      projectId: 'p-x',
    })
    server.use(tasksHandlers.listSuccess('p-x', [row]))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectTasksQuery('p-x'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'ta-1',
      title: 'Mapped',
      projectId: 'p-x',
    })
  })

  it('при projectId пустом запрос не уходит', async () => {
    localStorage.setItem('workboard_access_token', 't')
    let requests = 0
    server.use(
      http.get('*/api/v1/tasks/project/:projectId', () => {
        requests += 1
        return HttpResponse.json({
          ok: true,
          projectId: 'x',
          items: [mockApiTask()],
        })
      })
    )

    const qc = createTestQueryClient()
    renderHook(() => useProjectTasksQuery(''), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(qc.isFetching()).toBe(0))
    expect(requests).toBe(0)
  })

  it('ошибка сети — isError', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.listError(500, 'err'))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectTasksQuery('p-1'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})

describe('useCreateTaskMutation', () => {
  it('onSuccess инвалидирует список задач проекта', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const created = mockApiTask({ id: 'new-t', title: 'Created', projectId: 'p-1' })
    server.use(tasksHandlers.createSuccess(created))

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateTaskMutation('p-1'), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync({
      ...baseTask,
      id: 'local',
      title: 'Created',
      projectId: 'p-1',
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [...projectTasksQueryKey, 'p-1'] })
    )
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.postError(400))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCreateTaskMutation('p-1'), {
      wrapper: createHookWrapper(qc),
    })

    await expect(
      result.current.mutateAsync({
        ...baseTask,
        title: 'N',
      })
    ).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteTaskMutation', () => {
  it('onSuccess инвалидирует список задач проекта', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.deleteNoContent())

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTaskMutation(), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync({ taskId: 'tid', tasksQueryKey: 'p-del' })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [...projectTasksQueryKey, 'p-del'] })
    )
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.deleteError(400))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDeleteTaskMutation(), {
      wrapper: createHookWrapper(qc),
    })

    await expect(
      result.current.mutateAsync({ taskId: 'tid', tasksQueryKey: 'p-1' })
    ).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('при ошибке API вызывается onError из опций mutateAsync', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.deleteError(500))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDeleteTaskMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const onError = vi.fn()
    await expect(
      result.current.mutateAsync({ taskId: 'tid', tasksQueryKey: 'p-x' }, { onError })
    ).rejects.toThrow()
    expect(onError).toHaveBeenCalled()
  })
})

describe('useUpdateTaskMutation', () => {
  it('onSuccess инвалидирует список задач проекта', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const updated = mockApiTask({ id: 't-up', title: 'Renamed', projectId: 'p-up' })
    server.use(tasksHandlers.updateSuccess(updated))

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTaskMutation('p-up'), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync({
      ...baseTask,
      id: 't-up',
      title: 'Renamed',
      projectId: 'p-up',
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [...projectTasksQueryKey, 'p-up'] })
    )
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.patchError(400))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useUpdateTaskMutation('p-1'), {
      wrapper: createHookWrapper(qc),
    })

    await expect(
      result.current.mutateAsync({
        ...baseTask,
        title: 'X',
      })
    ).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('при ошибке API вызывается onError из опций mutateAsync', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(tasksHandlers.patchError(500))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useUpdateTaskMutation('p-1'), {
      wrapper: createHookWrapper(qc),
    })

    const onError = vi.fn()
    await expect(
      result.current.mutateAsync({ ...baseTask, id: 't-err' }, { onError })
    ).rejects.toThrow()
    expect(onError).toHaveBeenCalled()
  })
})
