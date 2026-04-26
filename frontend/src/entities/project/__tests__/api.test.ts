import { ApiError } from '@shared/api/errors'
import type { ApiProject } from '@shared/api/crmV1.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listProjects, getProject } = vi.hoisted(() => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
}))

vi.mock('@shared/api/crmV1Service', () => ({
  listProjects,
  getProject,
  createProject: vi.fn(),
}))

import { fetchProjectById, fetchProjects } from '../api'

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

describe('entities/project API (fetchProjects / fetchProjectById)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchProjects — маппит items в Project[]', async () => {
    listProjects.mockResolvedValue({
      ok: true,
      items: [
        mockApiProject({
          id: '1',
          key: 'k-1',
          title: 'UI name',
          client: 'C1',
        }),
      ],
    })

    const projects = await fetchProjects()

    expect(listProjects).toHaveBeenCalledTimes(1)
    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({
      id: '1',
      key: 'k-1',
      name: 'UI name',
      client: 'C1',
    })
  })

  it('fetchProjects — сортирует проекты по name (A→Z) независимо от порядка API', async () => {
    listProjects.mockResolvedValue({
      ok: true,
      items: [
        mockApiProject({ id: 'b', key: 'kb', title: 'Bravo', client: 'X' }),
        mockApiProject({ id: 'a', key: 'ka', title: 'Alpha', client: 'Y' }),
      ],
    })

    const projects = await fetchProjects()

    expect(projects.map((p) => p.name)).toEqual(['Alpha', 'Bravo'])
  })

  it('fetchProjectById — при 404 возвращает null', async () => {
    getProject.mockRejectedValue(new ApiError(404, 'Not found'))

    const result = await fetchProjectById('missing')

    expect(getProject).toHaveBeenCalledWith('missing')
    expect(result).toBeNull()
  })

  it('fetchProjectById — при 500 пробрасывает ошибку', async () => {
    getProject.mockRejectedValue(new ApiError(500, 'Server error'))

    await expect(fetchProjectById('any')).rejects.toMatchObject({ status: 500 })
  })
})
