import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client';
import { createTestUser, getTestApp } from './helpers';

const validCreateBody = {
  title: 'Интеграционный проект',
  client: 'ООО Клиент',
};

describe('Projects API — auth', () => {
  const app = getTestApp();
  const fakeId = '00000000-0000-4000-8000-000000000001';

  it.each([
    ['GET', () => app.get('/api/v1/projects')],
    ['POST', () => app.post('/api/v1/projects').send(validCreateBody)],
    ['GET by id', () => app.get(`/api/v1/projects/${fakeId}`)],
    ['PATCH', () => app.patch(`/api/v1/projects/${fakeId}`).send({ status: 'done' })],
    ['DELETE', () => app.delete(`/api/v1/projects/${fakeId}`)],
  ])('%s returns 401 without Authorization', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it.each([
    ['GET', () => app.get('/api/v1/projects').set('Authorization', 'Bearer not-a-valid-jwt')],
    [
      'POST',
      () =>
        app
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer not-a-valid-jwt')
          .send(validCreateBody),
    ],
    [
      'GET by id',
      () => app.get(`/api/v1/projects/${fakeId}`).set('Authorization', 'Bearer not-a-valid-jwt'),
    ],
    [
      'PATCH',
      () =>
        app
          .patch(`/api/v1/projects/${fakeId}`)
          .set('Authorization', 'Bearer not-a-valid-jwt')
          .send({ status: 'done' }),
    ],
    [
      'DELETE',
      () => app.delete(`/api/v1/projects/${fakeId}`).set('Authorization', 'Bearer not-a-valid-jwt'),
    ],
  ])('%s returns 401 with invalid JWT', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });
});

describe('Projects API — CRUD', () => {
  const app = getTestApp();

  it('POST 201 creates project; GET list returns only own projects', async () => {
    const { accessToken: tokenA } = await createTestUser({ email: 'a-projects@example.com' });
    const { accessToken: tokenB } = await createTestUser({ email: 'b-projects@example.com' });

    const createRes = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenA}`)
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

    const listA = await app
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listA.body.items).toHaveLength(1);
    expect(listA.body.items[0].id).toBe(createRes.body.project.id);

    const listB = await app
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(listB.body.items).toHaveLength(0);
  });

  it('POST 400 when title or client empty', async () => {
    const { accessToken } = await createTestUser({ email: 'val-projects@example.com' });

    await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '', client: 'C' })
      .expect(400);

    await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'T' })
      .expect(400);
  });

  it('GET by id 200 for own project; 404 for missing or foreign id', async () => {
    const { user, accessToken } = await createTestUser({ email: 'getid@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });

    const created = await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'T',
        client: 'C',
        userId: user.id,
      },
    });

    await prisma.project.create({
      data: {
        key: 'proj-1',
        title: 'Foreign',
        client: 'X',
        userId: other.user.id,
      },
    });

    const own = await app
      .get(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(own.body.project.id).toBe(created.id);

    const byKey = await app
      .get(`/api/v1/projects/${encodeURIComponent('proj-1')}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(byKey.body.project.id).toBe(created.id);

    await app
      .get('/api/v1/projects/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    const foreignProject = await prisma.project.findFirst({
      where: { userId: other.user.id },
    });
    expect(foreignProject).not.toBeNull();

    await app
      .get(`/api/v1/projects/${foreignProject!.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('PATCH 200 partial update; 404 foreign; 400 invalid status', async () => {
    const { user, accessToken } = await createTestUser({ email: 'patch@example.com' });
    const other = await createTestUser({ email: 'patch-other@example.com' });

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
        userId: other.user.id,
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

  it('DELETE 204 and next GET 404; 404 foreign', async () => {
    const { user, accessToken } = await createTestUser({ email: 'del@example.com' });
    const other = await createTestUser({ email: 'del-other@example.com' });

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
        userId: other.user.id,
      },
    });

    await app
      .delete(`/api/v1/projects/${foreign.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await app
      .delete(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await app
      .get(`/api/v1/projects/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('GET list orders by updatedAt desc', async () => {
    const { user, accessToken } = await createTestUser({ email: 'order@example.com' });

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
