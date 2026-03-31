import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@mocks/server'
import { mockApiProject, projectsHandlers } from '@mocks/handlers'
import { fetchProjectById, fetchProjects } from './api'

describe('fetchProjects / fetchProjectById', () => {
  beforeEach(() => {
    localStorage.setItem('freelance_crm_access_token', 'test-token')
  })

  it('fetchProjects — маппит items в Project[]', async () => {
    server.use(
      projectsHandlers.listSuccess([
        mockApiProject({
          id: '1',
          key: 'k-1',
          title: 'UI name',
          client: 'C1',
        }),
      ])
    )

    const projects = await fetchProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({
      id: '1',
      key: 'k-1',
      name: 'UI name',
      client: 'C1',
    })
  })

  it('fetchProjectById — при 404 возвращает null', async () => {
    server.use(projectsHandlers.detailNotFound())

    const result = await fetchProjectById('missing')
    expect(result).toBeNull()
  })

  it('fetchProjectById — при 500 пробрасывает ошибку', async () => {
    server.use(
      http.get('*/api/v1/projects/:id', () => new HttpResponse('fail', { status: 500 }))
    )

    await expect(fetchProjectById('any')).rejects.toMatchObject({ status: 500 })
  })
})
