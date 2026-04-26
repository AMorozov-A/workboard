import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client';
import { getTestApp } from './helpers';

const app = getTestApp();
const PASSWORD = 'password123';

type RegisterResult = {
  accessToken: string;
  user: { id: string; email: string };
};

async function registerUser(email: string): Promise<RegisterResult> {
  const res = await app
    .post('/api/v1/auth/register')
    .send({ email, password: PASSWORD, name: 'Notes Test User' })
    .expect(201);
  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user as { id: string; email: string },
  };
}

async function createTaskAndProject(
  accessToken: string,
): Promise<{ projectId: string; taskId: string }> {
  const projectRes = await app
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: 'Notes Project', client: 'Test Client', taskKeyPrefix: 'T' })
    .expect(201);
  const projectId = projectRes.body.project.id as string;

  const taskRes = await app
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ projectId, title: 'Notes Task' })
    .expect(201);

  return { projectId, taskId: taskRes.body.task.id as string };
}

function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function seedNote(
  taskId: string,
  body: string,
  title: string | null = null,
): Promise<void> {
  await prisma.taskNote.create({
    data: {
      taskId,
      key: `note-${Math.floor(Math.random() * 1_000_000)}`,
      title,
      body,
    },
  });
}

describe('GET /api/v1/tasks/:taskId/notes', () => {
  it('returns 401 without token', async () => {
    await app.get('/api/v1/tasks/00000000-0000-4000-8000-000000000001/notes').expect(401);
  });

  it('returns 200 with empty items when there are no notes', async () => {
    const { accessToken } = await registerUser(`notes-empty-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const res = await app
      .get(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .expect(200);

    expect(res.body).toEqual({ ok: true, items: [] });
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await registerUser(`notes-foreign-owner-${Date.now()}@example.com`);
    const other = await registerUser(`notes-foreign-other-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);

    await app
      .get(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(other.accessToken))
      .expect(404);
  });

  it('returns notes ordered by createdAt desc', async () => {
    const { accessToken } = await registerUser(`notes-list-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await seedNote(taskId, 'First');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await seedNote(taskId, 'Second', 'Second note');

    const res = await app
      .get(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].title).toBe('Second note');
    expect(res.body.items[0].body).toBe('Second');
    expect(res.body.items[1].body).toBe('First');
  });
});

describe('POST /api/v1/tasks/:taskId/notes', () => {
  it('returns 401 without token', async () => {
    await app
      .post('/api/v1/tasks/00000000-0000-4000-8000-000000000001/notes')
      .send({ body: 'x' })
      .expect(401);
  });

  it('creates a note and returns it', async () => {
    const { accessToken } = await registerUser(`notes-create-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const res = await app
      .post(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .send({ title: '  Idea  ', body: '  Keep the login flow simple.  ' })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.note).toMatchObject({
      id: expect.any(String),
      taskId,
      title: 'Idea',
      body: 'Keep the login flow simple.',
    });
    expect(res.body.note.createdAt).toBeDefined();
  });

  it('returns 400 when body is missing', async () => {
    const { accessToken } = await registerUser(`notes-400-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .send({})
      .expect(400);
  });

  it('returns 400 when body is empty after trim', async () => {
    const { accessToken } = await registerUser(`notes-400-empty-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .send({ body: '   ' })
      .expect(400);
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await registerUser(`notes-post-owner-${Date.now()}@example.com`);
    const other = await registerUser(`notes-post-other-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(other.accessToken))
      .send({ body: 'Hijack attempt' })
      .expect(404);
  });
});

describe('DELETE /api/v1/tasks/:taskId/notes/:noteId', () => {
  it('deletes own note', async () => {
    const { accessToken } = await registerUser(`notes-del-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const note = await prisma.taskNote.create({
      data: { taskId, key: 'note-1', body: 'To delete' },
    });

    await app
      .delete(`/api/v1/tasks/${taskId}/notes/${note.id}`)
      .set(authHeader(accessToken))
      .expect(200);

    const list = await app
      .get(`/api/v1/tasks/${taskId}/notes`)
      .set(authHeader(accessToken))
      .expect(200);
    expect(list.body.items).toHaveLength(0);
  });

  it('returns 404 when note does not exist', async () => {
    const { accessToken } = await registerUser(`notes-del-404-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .delete(`/api/v1/tasks/${taskId}/notes/00000000-0000-4000-8000-000000000099`)
      .set(authHeader(accessToken))
      .expect(404);
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await registerUser(`notes-del-owner-${Date.now()}@example.com`);
    const other = await registerUser(`notes-del-other-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);
    const note = await prisma.taskNote.create({
      data: { taskId, key: 'note-1', body: 'Protected' },
    });

    await app
      .delete(`/api/v1/tasks/${taskId}/notes/${note.id}`)
      .set(authHeader(other.accessToken))
      .expect(404);
  });
});
