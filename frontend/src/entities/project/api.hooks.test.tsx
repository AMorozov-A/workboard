import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@mocks/server'
import { mockApiProject, projectsHandlers } from '@mocks/handlers'
import type { Project } from './types'
import {
  projectsQueryKey,
  projectDetailQueryKey,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectQuery,
  useProjectsQuery,
  useUpdateProjectMutation,
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

describe('useProjectsQuery', () => {
  it('успех — data — массив Project после маппинга', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(
      projectsHandlers.listSuccess([
        mockApiProject({ id: 'x1', title: 'Mapped', client: 'Cl' }),
      ])
    )

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectsQuery(), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'x1',
      name: 'Mapped',
      client: 'Cl',
    })
  })

  it('isPending/isFetching до ответа', async () => {
    localStorage.setItem('workboard_access_token', 't')
    let release: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    server.use(
      http.get('*/api/v1/projects', async () => {
        await gate
        return HttpResponse.json({ ok: true, items: [mockApiProject()] })
      })
    )

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectsQuery(), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isFetching).toBe(true))
    release!()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('ошибка сети — isError', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(projectsHandlers.listError(500, 'err'))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectsQuery(), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})

describe('useProjectQuery', () => {
  it('при projectId undefined запрос не уходит', async () => {
    localStorage.setItem('workboard_access_token', 't')
    let requests = 0
    server.use(
      http.get('*/api/v1/projects/:id', () => {
        requests += 1
        return HttpResponse.json({ ok: true, project: mockApiProject() })
      })
    )

    const qc = createTestQueryClient()
    renderHook(() => useProjectQuery(undefined), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(qc.isFetching()).toBe(0))
    expect(requests).toBe(0)
  })

  it('успех — один project', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const p = mockApiProject({ id: 'pid', title: 'One' })
    server.use(projectsHandlers.detailSuccess(p))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectQuery('pid'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ id: 'pid', name: 'One' })
  })

  it('404 — data null, запрос успешен (не isError)', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(projectsHandlers.detailNotFound())

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectQuery('missing'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })
})

describe('useCreateProjectMutation', () => {
  it('onSuccess инвалидирует список проектов', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const created = mockApiProject({ id: 'new', title: 'Created' })
    server.use(
      http.post('*/api/v1/projects', () =>
        HttpResponse.json({ ok: true, project: created }, { status: 201 })
      )
    )

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'local-id',
      key: '',
      keyPrefix: 'proj',
      name: 'Created',
      client: 'C',
      status: 'active',
    }

    await result.current.mutateAsync(payload)

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectsQueryKey })
    )
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(
      http.post('*/api/v1/projects', () => new HttpResponse('bad', { status: 400 }))
    )

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCreateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'local-id',
      key: '',
      name: 'N',
      client: 'C',
      status: 'active',
    }

    await expect(result.current.mutateAsync(payload)).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteProjectMutation', () => {
  it('onSuccess инвалидирует список и деталь проекта', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(
      http.delete('*/api/v1/projects/:id', () => new HttpResponse(null, { status: 204 }))
    )

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    await result.current.mutateAsync('pid-del')

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectsQueryKey })
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectDetailQueryKey('pid-del') })
    )
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(
      http.delete('*/api/v1/projects/:id', () => new HttpResponse('no', { status: 400 }))
    )

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDeleteProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    await expect(result.current.mutateAsync('pid')).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('при ошибке API вызывается onError из опций mutateAsync', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(projectsHandlers.deleteError(500))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDeleteProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const onError = vi.fn()
    await expect(
      result.current.mutateAsync('pid-del-err', { onError })
    ).rejects.toThrow()
    expect(onError).toHaveBeenCalled()
  })
})

describe('useUpdateProjectMutation', () => {
  it('onSuccess инвалидирует список и деталь проекта', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const updated = mockApiProject({ id: 'pid-up', title: 'Renamed' })
    server.use(
      http.patch('*/api/v1/projects/:id', () =>
        HttpResponse.json({ ok: true, project: updated })
      )
    )

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'pid-up',
      key: 'proj-1',
      name: 'Renamed',
      client: 'C',
      status: 'active',
    }

    await result.current.mutateAsync({ projectId: 'pid-up', project: payload })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectsQueryKey })
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectDetailQueryKey('pid-up') })
    )
  })

  it('onSuccess обновляет кэш детали проекта через setQueryData', async () => {
    localStorage.setItem('workboard_access_token', 't')
    const updated = mockApiProject({ id: 'pid-up', title: 'Renamed' })
    server.use(projectsHandlers.updateSuccess(updated))

    const qc = createTestQueryClient()
    const setQueryDataSpy = vi.spyOn(qc, 'setQueryData')
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'pid-up',
      key: 'proj-1',
      name: 'Renamed',
      client: 'C',
      status: 'active',
    }

    await result.current.mutateAsync({ projectId: 'pid-up', project: payload })

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      projectDetailQueryKey('pid-up'),
      expect.objectContaining({
        id: 'pid-up',
        name: 'Renamed',
      })
    )
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('ошибка API — mutation в error state', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(
      http.patch('*/api/v1/projects/:id', () => new HttpResponse('bad', { status: 400 }))
    )

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useUpdateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'pid',
      key: 'k',
      name: 'N',
      client: 'C',
      status: 'active',
    }

    await expect(
      result.current.mutateAsync({ projectId: 'pid', project: payload })
    ).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('при ошибке API вызывается onError из опций mutateAsync', async () => {
    localStorage.setItem('workboard_access_token', 't')
    server.use(projectsHandlers.patchError(500))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useUpdateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'pid-patch-err',
      key: 'k',
      name: 'N',
      client: 'C',
      status: 'active',
    }

    const onError = vi.fn()
    await expect(
      result.current.mutateAsync({ projectId: 'pid-patch-err', project: payload }, { onError })
    ).rejects.toThrow()
    expect(onError).toHaveBeenCalled()
  })
})
