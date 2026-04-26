import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@shared/api/errors'
import type { ApiProject } from '@shared/api/crmV1.types'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../types'
import {
  projectsQueryKey,
  useCreateProjectMutation,
  useProjectQuery,
  useProjectsQuery,
} from '../api'

const { listProjects, getProject, createProjectApi } = vi.hoisted(() => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProjectApi: vi.fn(),
}))

vi.mock('@shared/api/crmV1Service', () => ({
  listProjects,
  getProject,
  createProject: createProjectApi,
}))

function mockApiProject(overrides: Partial<ApiProject> = {}): ApiProject {
  return {
    id: 'default-id',
    key: 'key-1',
    taskKeyPrefix: 'T',
    title: 'Default title',
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

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
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useProjectsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('успех — data — массив Project после маппинга', async () => {
    listProjects.mockResolvedValue({
      ok: true,
      items: [mockApiProject({ id: 'x1', title: 'Mapped', client: 'Cl' })],
    })

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

  it('список отсортирован по name (A→Z) после маппинга', async () => {
    listProjects.mockResolvedValue({
      ok: true,
      items: [
        mockApiProject({ id: '2', title: 'Zed', client: 'a' }),
        mockApiProject({ id: '1', title: 'Amber', client: 'b' }),
      ],
    })

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectsQuery(), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((p) => p.name)).toEqual(['Amber', 'Zed'])
  })

  it('ошибка API — isError', async () => {
    listProjects.mockRejectedValue(new ApiError(500, 'err'))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectsQuery(), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})

describe('useProjectQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('при projectId undefined запрос не выполняется', async () => {
    getProject.mockResolvedValue({
      ok: true,
      project: mockApiProject(),
    })

    const qc = createTestQueryClient()
    renderHook(() => useProjectQuery(undefined), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(qc.isFetching()).toBe(0))
    expect(getProject).not.toHaveBeenCalled()
  })

  it('успех — один project', async () => {
    const p = mockApiProject({ id: 'pid', title: 'One' })
    getProject.mockResolvedValue({ ok: true, project: p })

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useProjectQuery('pid'), {
      wrapper: createHookWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ id: 'pid', name: 'One' })
  })

  it('404 — data null, запрос успешен (не isError)', async () => {
    getProject.mockRejectedValue(new ApiError(404, 'missing'))

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('onSuccess инвалидирует список проектов', async () => {
    const created = mockApiProject({ id: 'new', title: 'Created' })
    createProjectApi.mockResolvedValue({ ok: true, project: created })

    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'local-id',
      key: '',
      keyPrefix: 'proj',
      taskKeyPrefix: 'T',
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
    createProjectApi.mockRejectedValue(new ApiError(400, 'bad'))

    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCreateProjectMutation(), {
      wrapper: createHookWrapper(qc),
    })

    const payload: Project = {
      id: 'local-id',
      key: '',
      taskKeyPrefix: 'T',
      name: 'N',
      client: 'C',
      status: 'active',
    }

    await expect(result.current.mutateAsync(payload)).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
