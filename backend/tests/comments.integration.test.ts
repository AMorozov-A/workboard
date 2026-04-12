import { beforeEach, describe, expect, it } from 'vitest';
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
    .send({ email, password: PASSWORD, name: 'Comments Test User' })
    .expect(201);
  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user as { id: string; email: string },
  };
}

async function createTaskAndProject(accessToken: string): Promise<{ projectId: string; taskId: string }> {
  const projectRes = await app
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Comment Project',
      client: 'Test Client',
    })
    .expect(201);

  const projectId = projectRes.body.project.id as string;

  const taskRes = await app
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      projectId,
      title: 'Comment Task',
    })
    .expect(201);

  return { projectId, taskId: taskRes.body.task.id as string };
}

function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/v1/tasks/:taskId/comments', () => {
  const fakeTaskId = '00000000-0000-4000-8000-000000000001';

  it('returns 401 without token', async () => {
    const res = await app.get(`/api/v1/tasks/${fakeTaskId}/comments`).expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it('returns 200 with empty items when there are no comments', async () => {
    const { accessToken } = await registerUser(`get-empty-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const res = await app
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(accessToken))
      .expect(200);

    expect(res.body).toEqual({ ok: true, items: [] });
  });

  describe('list seeded via prisma', () => {
    let accessToken: string;
    let userId: string;
    let userEmail: string;
    let taskId: string;

    beforeEach(async () => {
      const reg = await registerUser(`get-seeded-${Date.now()}@example.com`);
      accessToken = reg.accessToken;
      userId = reg.user.id;
      userEmail = reg.user.email;
      const created = await createTaskAndProject(accessToken);
      taskId = created.taskId;

      await prisma.comment.create({
        data: { taskId, authorId: userId, body: 'Alpha' },
      });
      await prisma.comment.create({
        data: { taskId, authorId: userId, body: 'Beta' },
      });
    });

    it('returns 200 with comments ordered and author shape', async () => {
      const res = await app
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set(authHeader(accessToken))
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toMatchObject({
        body: 'Alpha',
        taskId,
        author: { id: userId, email: userEmail },
      });
      expect(res.body.items[0].createdAt).toBeDefined();
      expect(res.body.items[1].body).toBe('Beta');
    });
  });

  it('returns 404 when task id does not exist', async () => {
    const { accessToken } = await registerUser(`get-404-${Date.now()}@example.com`);
    const missingId = '00000000-0000-4000-8000-000000000099';

    await app.get(`/api/v1/tasks/${missingId}/comments`).set(authHeader(accessToken)).expect(404);
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await registerUser(`get-foreign-owner-${Date.now()}@example.com`);
    const other = await registerUser(`get-foreign-other-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);

    await app
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(other.accessToken))
      .expect(404);
  });
});

describe('POST /api/v1/tasks/:taskId/comments', () => {
  it('returns 401 without token', async () => {
    const res = await app
      .post('/api/v1/tasks/00000000-0000-4000-8000-000000000001/comments')
      .send({ body: 'x' })
      .expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it('returns 201 with ok and comment containing id, body, author', async () => {
    const { accessToken, user } = await registerUser(`post-201-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const res = await app
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(accessToken))
      .send({ body: '  New comment text  ' })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.comment).toMatchObject({
      id: expect.any(String),
      body: 'New comment text',
      taskId,
      author: { id: user.id, email: user.email },
    });
    expect(res.body.comment.createdAt).toBeDefined();
  });

  it('returns 400 when body is empty or whitespace', async () => {
    const { accessToken } = await registerUser(`post-400-empty-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(accessToken))
      .send({ body: '   ' })
      .expect(400);
  });

  it('returns 400 when body exceeds 1000 characters', async () => {
    const { accessToken } = await registerUser(`post-400-len-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(accessToken))
      .send({ body: 'x'.repeat(1001) })
      .expect(400);
  });

  it('returns 404 when task does not exist', async () => {
    const { accessToken } = await registerUser(`post-404-${Date.now()}@example.com`);
    const missingId = '00000000-0000-4000-8000-000000000088';

    await app
      .post(`/api/v1/tasks/${missingId}/comments`)
      .set(authHeader(accessToken))
      .send({ body: 'Nope' })
      .expect(404);
  });

  it('returns 404 when task belongs to another user', async () => {
    const owner = await registerUser(`post-for-owner-${Date.now()}@example.com`);
    const intruder = await registerUser(`post-for-intruder-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);

    await app
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(intruder.accessToken))
      .send({ body: 'Hijack' })
      .expect(404);
  });
});

describe('DELETE /api/v1/tasks/:taskId/comments/:commentId', () => {
  it('returns 401 without token', async () => {
    const res = await app
      .delete('/api/v1/tasks/00000000-0000-4000-8000-000000000001/comments/00000000-0000-4000-8000-000000000002')
      .expect(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it('returns 200 when author deletes own comment', async () => {
    const { accessToken, user } = await registerUser(`del-200-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const created = await prisma.comment.create({
      data: { taskId, authorId: user.id, body: 'To delete' },
    });

    const res = await app
      .delete(`/api/v1/tasks/${taskId}/comments/${created.id}`)
      .set(authHeader(accessToken))
      .expect(200);

    expect(res.body).toEqual({ ok: true });

    const list = await app
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set(authHeader(accessToken))
      .expect(200);
    expect(list.body.items).toHaveLength(0);
  });

  it('returns 403 when authenticated user is not the comment author (owner deleting foreign comment)', async () => {
    const owner = await registerUser(`del-403-owner-${Date.now()}@example.com`);
    const other = await registerUser(`del-403-other-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(owner.accessToken);

    const foreign = await prisma.comment.create({
      data: {
        taskId,
        authorId: other.user.id,
        body: 'Written by other user id on owner task',
      },
    });

    await app
      .delete(`/api/v1/tasks/${taskId}/comments/${foreign.id}`)
      .set(authHeader(owner.accessToken))
      .expect(403);
  });

  it('returns 404 when comment id does not exist', async () => {
    const { accessToken } = await registerUser(`del-404-${Date.now()}@example.com`);
    const { taskId } = await createTaskAndProject(accessToken);

    const missingCommentId = '00000000-0000-4000-8000-000000000077';
    await app
      .delete(`/api/v1/tasks/${taskId}/comments/${missingCommentId}`)
      .set(authHeader(accessToken))
      .expect(404);
  });
});
