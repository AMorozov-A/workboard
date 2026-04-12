import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@mocks/server'
import { commentsHandlers, mockComment } from '@mocks/handlers'
import {
  taskCommentsQueryKey,
  useCommentsList,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from './api.hooks'
import type { Comment } from './types'

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

describe('useCommentsList', () => {
  it('loads comment items from MSW', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const row = mockComment({
      id: 'cc-1',
      body: 'From MSW',
      author: { id: 'u-msw', email: 'msw@example.com' },
    })
    server.use(commentsHandlers.listSuccess('task-msw', [row]))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCommentsList('task-msw'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'cc-1',
      body: 'From MSW',
      author: { id: 'u-msw', email: 'msw@example.com' },
    })
  })

  it('does not fetch when taskId is empty (enabled: false)', async () => {
    localStorage.setItem('workboard_access_token', 't')
    let requests = 0
    server.use(
      http.get('*/api/v1/tasks/:taskId/comments', () => {
        requests += 1
        return HttpResponse.json({ ok: true, items: [mockComment()] })
      })
    )

    const qc = createTestQueryClient()
    renderHook(() => useCommentsList(''), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(qc.isFetching()).toBe(0))
    expect(requests).toBe(0)
  })
})

describe('useCreateCommentMutation', () => {
  it('creates a comment successfully', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const created = mockComment({ id: 'new-c', body: 'Created body' })
    server.use(commentsHandlers.createSuccess(created))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCreateCommentMutation('task-create'), {
      wrapper: createHookWrapper(qc),
    })

    const out = await result.current.mutateAsync({ body: 'Created body' })
    expect(out).toMatchObject({ id: 'new-c', body: 'Created body' })
  })

  it('invalidates queries with task-comments key on success', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(commentsHandlers.createSuccess(mockComment({ id: 'x' })))

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCommentMutation('task-inv'), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync({ body: 'Hi' })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [...taskCommentsQueryKey, 'task-inv'] })
    )
  })
})

describe('useDeleteCommentMutation', () => {
  it('removes comment from cache via setQueryData and invalidates', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(commentsHandlers.deleteSuccess())

    const qc = createTestQueryClient()
    const taskId = 'task-del'
    const c1 = mockComment({ id: 'keep-me' })
    const c2 = mockComment({ id: 'remove-me', body: 'gone' })
    qc.setQueryData<Comment[]>([...taskCommentsQueryKey, taskId], [c1, c2])

    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCommentMutation(taskId), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync('remove-me')

    expect(qc.getQueryData<Comment[]>([...taskCommentsQueryKey, taskId])).toEqual([c1])
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [...taskCommentsQueryKey, taskId] })
    )
  })
})
