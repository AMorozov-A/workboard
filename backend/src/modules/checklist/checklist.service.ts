import type { ChecklistItem, Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import { getTaskForUser } from '../tasks/tasks.service';

import type { CreateChecklistItemInput, UpdateChecklistItemInput } from './checklist.types';

function assertText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'Укажите текст пункта');
  }
  return value.trim();
}

function assertBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new HttpError(400, 'Поле done должно быть boolean');
  }
  return value;
}

function assertInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new HttpError(400, 'Поле position должно быть целым числом');
  }
  return value;
}

export function parseCreateChecklistBody(body: unknown): CreateChecklistItemInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  return { text: assertText(b.text) };
}

export function parseUpdateChecklistBody(body: unknown): UpdateChecklistItemInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  const out: UpdateChecklistItemInput = {};
  if ('text' in b) out.text = assertText(b.text);
  if ('done' in b) out.done = assertBoolean(b.done);
  if ('position' in b) out.position = assertInt(b.position);
  return out;
}

export async function listChecklistItems(taskId: string, userId: string): Promise<ChecklistItem[]> {
  await getTaskForUser(taskId, userId);
  return prisma.checklistItem.findMany({
    where: { taskId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
}

async function nextPosition(taskId: string): Promise<number> {
  const row = await prisma.checklistItem.findFirst({
    where: { taskId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return row ? row.position + 1 : 0;
}

export async function createChecklistItem(
  taskId: string,
  userId: string,
  input: CreateChecklistItemInput,
): Promise<ChecklistItem> {
  await getTaskForUser(taskId, userId);
  const position = await nextPosition(taskId);
  return prisma.checklistItem.create({
    data: {
      taskId,
      text: input.text,
      position,
      done: false,
    },
  });
}

export async function getChecklistItemForUser(
  taskId: string,
  itemId: string,
  userId: string,
): Promise<ChecklistItem> {
  await getTaskForUser(taskId, userId);
  const row = await prisma.checklistItem.findFirst({
    where: { id: itemId, taskId },
  });
  if (!row) {
    throw new HttpError(404, 'Пункт чек-листа не найден');
  }
  return row;
}

export async function updateChecklistItem(
  taskId: string,
  itemId: string,
  userId: string,
  input: UpdateChecklistItemInput,
): Promise<ChecklistItem> {
  const existing = await getChecklistItemForUser(taskId, itemId, userId);
  const data: Prisma.ChecklistItemUpdateInput = {};
  if (input.text !== undefined) data.text = input.text;
  if (input.done !== undefined) data.done = input.done;
  if (input.position !== undefined) data.position = input.position;
  if (Object.keys(data).length === 0) return existing;
  return prisma.checklistItem.update({ where: { id: existing.id }, data });
}

export async function deleteChecklistItem(taskId: string, itemId: string, userId: string): Promise<void> {
  const existing = await getChecklistItemForUser(taskId, itemId, userId);
  await prisma.checklistItem.delete({ where: { id: existing.id } });
}

