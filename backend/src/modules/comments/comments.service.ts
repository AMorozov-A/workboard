import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import { getTaskForUser } from '../tasks/tasks.service';

const MAX_BODY_LENGTH = 1000;

function assertCommentBody(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Текст комментария должен быть строкой');
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, 'Комментарий не может быть пустым');
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new HttpError(400, `Комментарий не длиннее ${MAX_BODY_LENGTH} символов`);
  }
  return trimmed;
}

export function parseCreateCommentBody(body: unknown): string {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  return assertCommentBody(b.body);
}

const authorSelect = { id: true, email: true } as const;

export async function getCommentsByTask(taskId: string, userId: string) {
  await getTaskForUser(taskId, userId);
  return prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: authorSelect } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(taskId: string, userId: string, body: string) {
  await getTaskForUser(taskId, userId);
  return prisma.comment.create({
    data: {
      taskId,
      authorId: userId,
      body,
    },
    include: { author: { select: authorSelect } },
  });
}

export async function deleteComment(taskId: string, commentId: string, userId: string): Promise<void> {
  await getTaskForUser(taskId, userId);
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, taskId },
    select: { id: true, authorId: true },
  });
  if (!comment) {
    throw new HttpError(404, 'Комментарий не найден');
  }
  if (comment.authorId !== userId) {
    throw new HttpError(403, 'Удалить может только автор комментария');
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
