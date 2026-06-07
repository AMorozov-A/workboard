import type { Prisma, Tag } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';

import type { CreateTagInput, UpdateTagInput } from './tag.types';

function assertName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'Укажите название тега');
  }
  return value.trim();
}

function assertColor(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'Укажите цвет тега');
  }
  const c = value.trim();
  // Prefer hex from UI ColorPicker; keep compatibility with any future string values
  const isHex = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
  if (!isHex) {
    throw new HttpError(400, 'Некорректный цвет тега');
  }
  return c;
}

export function parseCreateTagBody(body: unknown): CreateTagInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  return {
    name: assertName(b.name),
    color: assertColor(b.color),
  };
}

export function parseUpdateTagBody(body: unknown): UpdateTagInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  const out: UpdateTagInput = {};
  if ('name' in b) {
    out.name = assertName(b.name);
  }
  if ('color' in b) {
    out.color = assertColor(b.color);
  }
  return out;
}

export async function listTagsForUser(userId: string): Promise<Tag[]> {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
  });
}

export async function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  try {
    return await prisma.tag.create({
      data: {
        userId,
        name: input.name,
        color: input.color,
      },
    });
  } catch (e) {
    const err = e as Prisma.PrismaClientKnownRequestError;
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Тег с таким названием уже существует');
    }
    throw e;
  }
}

export async function getTagForUser(tagId: string, userId: string): Promise<Tag> {
  const row = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!row) {
    throw new HttpError(404, 'Тег не найден');
  }
  return row;
}

export async function updateTag(tagId: string, userId: string, input: UpdateTagInput): Promise<Tag> {
  const existing = await getTagForUser(tagId, userId);
  const data: Prisma.TagUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.color !== undefined) {
    data.color = input.color;
  }
  if (Object.keys(data).length === 0) {
    return existing;
  }
  try {
    return await prisma.tag.update({
      where: { id: existing.id },
      data,
    });
  } catch (e) {
    const err = e as Prisma.PrismaClientKnownRequestError;
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Тег с таким названием уже существует');
    }
    throw e;
  }
}

export async function deleteTag(tagId: string, userId: string): Promise<void> {
  const existing = await getTagForUser(tagId, userId);
  await prisma.tag.delete({ where: { id: existing.id } });
}

export async function assertTagsOwnedByUser(tagIds: string[], userId: string): Promise<Tag[]> {
  if (tagIds.length === 0) return [];
  const unique = Array.from(new Set(tagIds));
  const rows = await prisma.tag.findMany({
    where: { userId, id: { in: unique } },
  });
  if (rows.length !== unique.length) {
    throw new HttpError(400, 'Некорректные tagIds');
  }
  return rows;
}

export async function ensureTagsByNames(userId: string, names: string[]): Promise<Tag[]> {
  const trimmed = names.map((n) => n.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  if (unique.length === 0) return [];

  const existing = await prisma.tag.findMany({
    where: { userId, name: { in: unique } },
  });
  const existingByName = new Map(existing.map((t) => [t.name, t]));

  const missing = unique.filter((n) => !existingByName.has(n));
  if (missing.length > 0) {
    const created = await Promise.all(
      missing.map((name) =>
        prisma.tag.create({
          data: {
            userId,
            name,
            color: '#8c8c8c',
          },
        }),
      ),
    );
    for (const t of created) existingByName.set(t.name, t);
  }
  return unique.map((n) => existingByName.get(n)!);
}

