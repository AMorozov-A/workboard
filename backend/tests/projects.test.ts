import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client';
import { createTestUser, getTestApp } from './helpers';

/**
 * Интеграционные сценарии CRUD по плану Planner (Supertest + тестовая БД).
 * Второй пользователь для «чужого» проекта: в основном сценарии — `other@test.com`;
 * в остальных тестах — уникальные `other-*@test.com`, чтобы не ломать unique(email) при concurrent it.
 *
 * При нескольких воркерах Vitest и одной SQLite возможны гонки с `tests/setup.ts` (beforeEach).
 * Стабильный прогон: `cd backend && npm test -- --maxWorkers=1`
 */

/** HTTP-контракт: поле названия — `title` (см. Planner: name в UI → title в API). */
const validCreateBody = {
  title: 'Интеграционный проект',
  client: 'ООО Клиент',
};

describe('Projects API — auth', () => {
  const app = getTestApp();
  const nonExistentUuid = '00000000-0000-4000-8000-000000000001';

  it.each([
    ['GET list', () => app.get('/api/v1/projects')],
    ['POST create', () => app.post('/api/v1/projects').send(validCreateBody)],
    ['GET by id', () => app.get(`/api/v1/projects/${nonExistentUuid}`)],
    ['PATCH', () => app.patch(`/api/v1/projects/${nonExistentUuid}`).send({ status: 'done' })],
    ['DELETE', () => app.delete(`/api/v1/projects/${nonExistentUuid}`)],
  ])('%s returns 401 without Authorization', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it.each([
    ['GET list', () => app.get('/api/v1/projects').set('Authorization', 'Bearer not-a-valid-jwt')],
    [
      'POST create',
      () =>
        app
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer not-a-valid-jwt')
          .send(validCreateBody),
    ],
    [
      'GET by id',
      () =>
        app.get(`/api/v1/projects/${nonExistentUuid}`).set('Authorization', 'Bearer not-a-valid-jwt'),
    ],
    [
      'PATCH',
      () =>
        app
          .patch(`/api/v1/projects/${nonExistentUuid}`)
          .set('Authorization', 'Bearer not-a-valid-jwt')
          .send({ status: 'done' }),
    ],
    [
      'DELETE',
      () =>
        app.delete(`/api/v1/projects/${nonExistentUuid}`).set('Authorization', 'Bearer not-a-valid-jwt'),
    ],
  ])('%s returns 401 with invalid JWT', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });
});

describe('Projects API — CRUD (integration)', () => {
  const app = getTestApp();

  it('POST 201: создаёт проект с обязательным client; GET list — только свои проекты', async () => {
    const { accessToken: tokenOwner } = await createTestUser({ email: 'owner-projects@example.com' });
    const { accessToken: tokenOther } = await createTestUser({
      email: 'other@test.com',
      name: 'Other User',
    });

    const createRes = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send(validCreateBody)
      .expect(201);

    expect(createRes.body.ok).toBe(true);
    expect(createRes.body.project).toMatchObject({
      title: validCreateBody.title,
      client: validCreateBody.client,
      status: 'active',
      key: 'proj-1',
    });
    expect(createRes.body.project.userId).toBeDefined();

    const listOwner = await app
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .expect(200);

    expect(listOwner.body.items).toHaveLength(1);
    expect(listOwner.body.items[0].id).toBe(createRes.body.project.id);

    const listOther = await app
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenOther}`)
      .expect(200);

    expect(listOther.body.items).toHaveLength(0);
  });

  it('POST 400: без client или с пустым title/client', async () => {
    const { accessToken } = await createTestUser({ email: 'validate-projects@example.com' });

    const noClient = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Только заголовок' })
      .expect(400);
    expect(noClient.body).toMatchObject({ ok: false });
    expect(noClient.body.message).toBe('Укажите клиента');

    await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '', client: 'C' })
      .expect(400);

    await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'T', client: '   ' })
      .expect(400);
  });

  it('GET by id: 200 свой проект и по key; 404 несуществующий uuid; 404 чужой project.id', async () => {
    const { user, accessToken } = await createTestUser({ email: 'getter@example.com' });
    const { user: otherUser } = await createTestUser({
      email: 'other-get-by-id@test.com',
      name: 'Other User',
    });

    const own = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'Мой',
        client: 'Клиент',
        userId: user.id,
      },
    });

    await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'Чужой',
        client: 'X',
        userId: otherUser.id,
      },
    });

    const byUuid = await app
      .get(`/api/v1/projects/${own.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(byUuid.body.project.id).toBe(own.id);

    const byKey = await app
      .get(`/api/v1/projects/${encodeURIComponent('proj-1')}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(byKey.body.project.id).toBe(own.id);

    await app
      .get('/api/v1/projects/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    const foreign = await prisma.project.findFirst({
      where: { userId: otherUser.id },
    });
    expect(foreign).not.toBeNull();

    await app
      .get(`/api/v1/projects/${foreign!.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('PATCH: частичное обновление; пустой body — 200; 404 чужой; 400 неверный status; client null сбрасывает', async () => {
    const { user, accessToken } = await createTestUser({ email: 'patcher@example.com' });
    const { user: otherUser } = await createTestUser({
      email: 'other-patch@test.com',
      name: 'Other User',
    });

    const created = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'T',
        client: 'C',
        userId: user.id,
      },
    });

    const foreign = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'F',
        client: 'F',
        userId: otherUser.id,
      },
    });

    const patched = await app
      .patch(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'done', client: 'New Client' })
      .expect(200);

    expect(patched.body.project.status).toBe('done');
    expect(patched.body.project.client).toBe('New Client');

    const noop = await app
      .patch(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);
    expect(noop.body.project.id).toBe(created.id);

    const cleared = await app
      .patch(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ client: null })
      .expect(200);
    expect(cleared.body.project.client).toBeNull();

    await app
      .patch(`/api/v1/projects/${foreign.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Hacked' })
      .expect(404);

    await app
      .patch(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'not-a-status' })
      .expect(400);
  });

  it('DELETE: 204 hard delete; следующий GET — 404; DELETE чужого — 404', async () => {
    const { user, accessToken } = await createTestUser({ email: 'deleter@example.com' });
    const { user: otherUser } = await createTestUser({
      email: 'other-delete@test.com',
      name: 'Other User',
    });

    const mine = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'T',
        client: 'C',
        userId: user.id,
      },
    });

    const foreign = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'F',
        client: 'F',
        userId: otherUser.id,
      },
    });

    await app
      .delete(`/api/v1/projects/${foreign.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await app
      .delete(`/api/v1/projects/${mine.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await app
      .get(`/api/v1/projects/${mine.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('GET list: сортировка по updatedAt desc', async () => {
    const { user, accessToken } = await createTestUser({ email: 'orderer@example.com' });

    const older = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'Old',
        client: 'A',
        userId: user.id,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const newer = await prisma.project.create({
      data: {
        key: 'proj-2',
        title: 'New',
        client: 'B',
        userId: user.id,
        updatedAt: new Date('2026-01-10T00:00:00.000Z'),
      },
    });

    const list = await app
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body.items.map((p: { id: string }) => p.id)).toEqual([newer.id, older.id]);
  });
});
