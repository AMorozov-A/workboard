import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import { getTaskForUser } from '../tasks/tasks.service';
import type { CreateTaskNoteDto, UpdateTaskNoteDto } from './task-note.types';

const MAX_TITLE_LENGTH = 160;
const MAX_BODY_LENGTH = 4000;

function parseOptionalTitle(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Заголовок заметки должен быть строкой');
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new HttpError(400, `Заголовок не длиннее ${MAX_TITLE_LENGTH} символов`);
  }
  return trimmed;
}

function parseBody(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Текст заметки обязателен');
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, 'Заметка не может быть пустой');
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new HttpError(400, `Заметка не длиннее ${MAX_BODY_LENGTH} символов`);
  }
  return trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCreateTaskNoteBody(body: unknown): CreateTaskNoteDto {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  return {
    title: parseOptionalTitle(body.title),
    body: parseBody(body.body),
  };
}

export function parseUpdateTaskNoteBody(body: unknown): UpdateTaskNoteDto {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const dto: UpdateTaskNoteDto = {};
  if ('title' in body) {
    dto.title = parseOptionalTitle(body.title);
  }
  if ('body' in body) {
    dto.body = parseBody(body.body);
  }
  if (dto.title === undefined && dto.body === undefined) {
    throw new HttpError(400, 'Нет изменений для обновления');
  }
  return dto;
}

export async function listNotesByTask(taskId: string, userId: string) {
  await getTaskForUser(taskId, userId);
  return prisma.taskNote.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
}

async function nextNoteKeyForTask(taskId: string): Promise<string> {
  const rows = await prisma.taskNote.findMany({
    where: { taskId },
    select: { key: true },
  });
  let max = 0;
  for (const { key } of rows) {
    const m = key.match(/^note-(\d+)$/);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return `note-${max + 1}`;
}

export async function createNote(taskId: string, userId: string, dto: CreateTaskNoteDto) {
  await getTaskForUser(taskId, userId);
  const key = await nextNoteKeyForTask(taskId);
  return prisma.taskNote.create({
    data: {
      taskId,
      key,
      title: dto.title ?? null,
      body: dto.body,
    },
  });
}

export async function updateNote(
  taskId: string,
  noteId: string,
  userId: string,
  dto: UpdateTaskNoteDto
) {
  await getTaskForUser(taskId, userId);
  const existing = await prisma.taskNote.findFirst({
    where: { id: noteId, taskId },
    select: { id: true },
  });
  if (!existing) {
    throw new HttpError(404, 'Заметка не найдена');
  }
  const data: { title?: string | null; body?: string } = {};
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.body !== undefined) data.body = dto.body;
  return prisma.taskNote.update({
    where: { id: noteId },
    data,
  });
}

export async function deleteNote(taskId: string, noteId: string, userId: string): Promise<void> {
  await getTaskForUser(taskId, userId);
  const note = await prisma.taskNote.findFirst({
    where: { id: noteId, taskId },
    select: { id: true },
  });
  if (!note) {
    throw new HttpError(404, 'Заметка не найдена');
  }
  await prisma.taskNote.delete({ where: { id: noteId } });
}
