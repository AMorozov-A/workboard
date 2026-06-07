import { describe, expect, it } from 'vitest';
import { getTestApp, prisma, createTestUser } from './helpers';

const app = getTestApp();

describe('Tags API — auth', () => {
  const fakeId = '00000000-0000-4000-8000-000000000001';

  it.each([
    ['GET', () => app.get('/api/v1/tags')],
    ['POST', () => app.post('/api/v1/tags').send({ name: 'Demo', color: 'blue' })],
    ['PATCH', () => app.patch(`/api/v1/tags/${fakeId}`).send({ name: 'X' })],
    ['DELETE', () => app.delete(`/api/v1/tags/${fakeId}`)],
  ])('%s returns 401 without Authorization', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });
});

describe('Tags API — CRUD', () => {
  it('POST 201 creates; GET lists own; PATCH updates; DELETE removes', async () => {
    const { accessToken, user } = await createTestUser({ email: 'tags-a@example.com' });

    const created = await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Urgent', color: '#ff4d4f' })
      .expect(201);

    expect(created.body.ok).toBe(true);
    expect(created.body.tag).toMatchObject({ name: 'Urgent', color: '#ff4d4f' });

    const list = await app
      .get('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(created.body.tag.id);

    const patched = await app
      .patch(`/api/v1/tags/${created.body.tag.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Urgent+', color: '#eb2f96' })
      .expect(200);

    expect(patched.body.tag).toMatchObject({
      id: created.body.tag.id,
      name: 'Urgent+',
      color: '#eb2f96',
    });

    await app
      .delete(`/api/v1/tags/${created.body.tag.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const db = await prisma.tag.findMany({ where: { userId: user.id } });
    expect(db).toHaveLength(0);
  });

  it('POST 409 when same name already exists for user', async () => {
    const { accessToken } = await createTestUser({ email: 'tags-dup@example.com' });

    await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Demo', color: '#1677ff' })
      .expect(201);

    await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Demo', color: '#ff4d4f' })
      .expect(409);
  });

  it('PATCH/DELETE 404 when tag belongs to another user', async () => {
    const a = await createTestUser({ email: 'tags-owner@example.com' });
    const b = await createTestUser({ email: 'tags-intruder@example.com' });

    const tag = await prisma.tag.create({
      data: { userId: a.user.id, name: 'Private', color: '#262626' },
    });

    await app
      .patch(`/api/v1/tags/${tag.id}`)
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ name: 'Hack' })
      .expect(404);

    await app
      .delete(`/api/v1/tags/${tag.id}`)
      .set('Authorization', `Bearer ${b.accessToken}`)
      .expect(404);
  });
});

describe('Tasks/Projects API — tagIds', () => {
  it('PATCH /tasks/:id sets tags; labels are derived from tags names for compatibility', async () => {
    const { accessToken } = await createTestUser({ email: 'tags-task@example.com' });

    const projectRes = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Tag project', client: 'Client' })
      .expect(201);

    const projectId = projectRes.body.project.id as string;

    const taskRes = await app
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId, title: 'Tag task' })
      .expect(201);

    const taskId = taskRes.body.task.id as string;

    const tagA = await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'UI', color: '#1677ff' })
      .expect(201);
    const tagB = await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'API', color: '#52c41a' })
      .expect(201);

    const patched = await app
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tagIds: [tagA.body.tag.id, tagB.body.tag.id] })
      .expect(200);

    expect(patched.body.task.tags.map((t: { name: string }) => t.name).sort()).toEqual(['API', 'UI']);
    expect(patched.body.task.labels.sort()).toEqual(['API', 'UI']);
  });

  it('PATCH /projects/:id sets tags', async () => {
    const { accessToken } = await createTestUser({ email: 'tags-project@example.com' });

    const projectRes = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'P', client: 'C' })
      .expect(201);

    const projectId = projectRes.body.project.id as string;

    const tag = await app
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Important', color: '#ff4d4f' })
      .expect(201);

    const patched = await app
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tagIds: [tag.body.tag.id] })
      .expect(200);

    expect(patched.body.project.tags).toHaveLength(1);
    expect(patched.body.project.tags[0]).toMatchObject({ name: 'Important', color: '#ff4d4f' });
  });
});

