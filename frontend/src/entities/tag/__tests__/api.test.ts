import type { ApiTag } from '@shared/api/crmV1.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listTags } = vi.hoisted(() => ({
  listTags: vi.fn(),
}))

vi.mock('@shared/api/crmV1Service', () => ({
  listTags,
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}))

import { fetchTags } from '../api'

function mockApiTag(overrides: Partial<ApiTag> = {}): ApiTag {
  return {
    id: 'tag-1',
    name: 'Demo',
    color: 'gray',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  }
}

describe('entities/tag API (fetchTags)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchTags — возвращает items как Tag[]', async () => {
    listTags.mockResolvedValue({
      ok: true,
      items: [mockApiTag({ id: 'a', name: 'A', color: 'blue' })],
    })

    const tags = await fetchTags()

    expect(listTags).toHaveBeenCalledTimes(1)
    expect(tags).toHaveLength(1)
    expect(tags[0]).toMatchObject({ id: 'a', name: 'A', color: 'blue' })
  })
})

