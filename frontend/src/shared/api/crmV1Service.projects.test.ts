import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@mocks/server'
import { mockApiProject, projectsHandlers } from '@mocks/handlers'
import * as authBridge from './authBridge'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from './crmV1Service'

describe('crmV1Service projects', () => {
  beforeEach(() => {
    localStorage.setItem('freelance_crm_access_token', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /v1/projects — парсит список и возвращает типизированный ответ', async () => {
    const items = [mockApiProject({ id: 'a', key: 'proj-1', title: 'Alpha' })]
    server.use(projectsHandlers.listSuccess(items))

    const res = await listProjects()
    expect(res.ok).toBe(true)
    expect(res.items).toHaveLength(1)
    expect(res.items[0].title).toBe('Alpha')
  })

  it('GET /v1/projects — отправляет Authorization: Bearer при наличии токена', async () => {
    let authHeader = ''
    server.use(
      http.get('*/api/v1/projects', ({ request }) => {
        authHeader = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true, items: [] })
      })
    )

    await listProjects()
    expect(authHeader).toBe('Bearer test-token')
  })

  it('GET /v1/projects/:id — успешный project', async () => {
    const project = mockApiProject({ id: 'p-99', title: 'Detail' })
    server.use(projectsHandlers.detailSuccess(project))

    const res = await getProject('p-99')
    expect(res.ok).toBe(true)
    expect(res.project.id).toBe('p-99')
    expect(res.project.title).toBe('Detail')
  })

  it('POST /v1/projects — тело соответствует CreateProjectBody, ответ 201', async () => {
    const created = mockApiProject({ id: 'new-id', title: 'New title' })
    let body: unknown
    server.use(
      http.post('*/api/v1/projects', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ok: true, project: created }, { status: 201 })
      })
    )

    const res = await createProject({
      title: 'New title',
      keyPrefix: 'crm',
      client: 'Client A',
      status: 'active',
      budget: 100,
      deadline: '2026-12-31T00:00:00.000Z',
      description: 'Desc',
    })

    expect(res.project.title).toBe('New title')
    expect(body).toEqual({
      title: 'New title',
      keyPrefix: 'crm',
      client: 'Client A',
      status: 'active',
      budget: 100,
      deadline: '2026-12-31T00:00:00.000Z',
      description: 'Desc',
    })
  })

  it('PATCH /v1/projects/:id — метод и тело', async () => {
    const updated = mockApiProject({ title: 'Patched' })
    let method = ''
    let body: unknown
    server.use(
      http.patch('*/api/v1/projects/:id', async ({ request }) => {
        method = request.method
        body = await request.json()
        return HttpResponse.json({ ok: true, project: updated })
      })
    )

    const res = await updateProject('p-1', { title: 'Patched' })
    expect(method).toBe('PATCH')
    expect(body).toEqual({ title: 'Patched' })
    expect(res.project.title).toBe('Patched')
  })

  it('DELETE /v1/projects/:id — 204, без тела', async () => {
    let status = 0
    server.use(
      http.delete('*/api/v1/projects/:id', ({ request }) => {
        status = request.method === 'DELETE' ? 204 : 0
        return new HttpResponse(null, { status: 204 })
      })
    )

    await expect(deleteProject('p-1')).resolves.toBeUndefined()
    expect(status).toBe(204)
  })

  it('DELETE /v1/projects/:id — 404 выбрасывает ошибку', async () => {
    server.use(
      http.delete('*/api/v1/projects/:id', () => new HttpResponse(null, { status: 404 }))
    )

    await expect(deleteProject('missing')).rejects.toThrow()
  })

  it('PATCH /v1/projects/:id — 404 выбрасывает ошибку', async () => {
    server.use(
      http.patch('*/api/v1/projects/:id', () => new HttpResponse(null, { status: 404 }))
    )

    await expect(updateProject('missing', { title: 'x' })).rejects.toThrow()
  })

  it('при 401 с токеном — вызывается triggerUnauthorized', async () => {
    const spy = vi.spyOn(authBridge, 'triggerUnauthorized').mockImplementation(() => {})
    server.use(
      http.get('*/api/v1/projects', () => new HttpResponse(null, { status: 401 }))
    )

    await expect(listProjects()).rejects.toThrow()
    expect(spy).toHaveBeenCalled()
  })
})
