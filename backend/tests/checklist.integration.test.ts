import { describe, expect, it } from 'vitest';
import { getTestApp, createTestUser, prisma } from './helpers';

const app = getTestApp();

describe('Checklist API — auth', () => {
  const fakeTaskId = '00000000-0000-4000-8000-000000000001';
  const fakeItemId = '00000000-0000-4000-8000-000000000002';

  it.each([
    ['GET', () => app.get(`/api/v1/tasks/${fakeTaskId}/checklist`)],
    ['POST', () => app.post(`/api/v1/tasks/${fakeTaskId}/checklist`).send({ text: 'x' })],
    ['PATCH', () => app.patch(`/api/v1/tasks/${fakeTaskId}/checklist/${fakeItemId}`).send({ done: true })],
    ['DELETE', () => app.delete(`/api/v1/tasks/${fakeTaskId}/checklist/${fakeItemId}`)],
  ])('%s returns 401 without Authorization', async (_label, req) => {
    const res = await req().expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });
});

describe('Checklist API — CRUD', () => {
  async function createTaskAndProject(accessToken: string) {
    const projectRes = await app
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Checklist Project', client: 'Client' })
      .expect(201);

    const projectId = projectRes.body.project.id as string;

    const taskRes = await app
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ projectId, title: 'Checklist Task' })
      .expect(201);

    const taskId = taskRes.body.task.id as string;
    return { projectId, taskId };
  }

  it('POST 201 creates items; GET lists ordered; PATCH updates; DELETE removes', async () => {
    const { accessToken } = await createTestUser({ email: 'checklist@example.com' });
    const { taskId } = await createTaskAndProject(accessToken);

    const a = await app
      .post(`/api/v1/tasks/${taskId}/checklist`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: ' First ' })
      .expect(201);

    const b = await app
      .post(`/api/v1/tasks/${taskId}/checklist`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'Second' })
      .expect(201);

    expect(a.body.item).toMatchObject({ text: 'First', done: false, taskId, position: 0 });
    expect(b.body.item).toMatchObject({ text: 'Second', done: false, taskId, position: 1 });

    const list = await app
      .get(`/api/v1/tasks/${taskId}/checklist`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body.items.map((i: { text: string }) => i.text)).toEqual(['First', 'Second']);

    const patched = await app
      .patch(`/api/v1/tasks/${taskId}/checklist/${a.body.item.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ done: true, position: 10 })
      .expect(200);

    expect(patched.body.item).toMatchObject({ done: true, position: 10 });

    await app
      .delete(`/api/v1/tasks/${taskId}/checklist/${a.body.item.id as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const db = await prisma.checklistItem.findMany({ where: { taskId } });
    expect(db).toHaveLength(1);
    expect(db[0].text).toBe('Second');
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await createTestUser({ email: 'checklist-owner@example.com' });
    const intruder = await createTestUser({ email: 'checklist-intruder@example.com' });
    const { taskId } = await createTaskAndProject(owner.accessToken);

    await app
      .get(`/api/v1/tasks/${taskId}/checklist`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(404);
  });

  it('POST 400 when text is empty', async () => {
    const { accessToken } = await createTestUser({ email: 'checklist-bad@example.com' });
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/checklist`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: '   ' })
      .expect(400);
  });
});

