import type { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import type { CreateProjectInput, UpdateProjectInput } from './project.types';

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'paused', 'done'];

/** Префикс ключа проекта: proj → proj-1, crm → crm-1 */
const KEY_PREFIX_RE = /^[a-z][a-z0-9-]{1,29}$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseKeyPrefix(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return 'proj';
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Префикс ключа должен быть строкой');
  }
  const t = value.trim().toLowerCase();
  if (!KEY_PREFIX_RE.test(t)) {
    throw new HttpError(
      400,
      'Префикс ключа: 2–30 символов, латиница в нижнем регистре, цифры и дефис, начинается с буквы',
    );
  }
  return t;
}

async function nextProjectKeyForUser(userId: string, prefix: string): Promise<string> {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}-(\\d+)$`);
  const rows = await prisma.project.findMany({
    where: { userId },
    select: { key: true },
  });
  let max = 0;
  for (const { key } of rows) {
    const m = key.match(re);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return `${prefix}-${max + 1}`;
}

function assertTitle(title: unknown): string {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new HttpError(400, 'Укажите название проекта');
  }
  return title.trim();
}

function assertClient(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'Укажите клиента');
  }
  return value.trim();
}

function parseStatus(value: unknown, fallback: ProjectStatus): ProjectStatus {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'string' && PROJECT_STATUSES.includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  throw new HttpError(400, 'Некорректный статус проекта');
}

function parseStatusRequired(value: unknown): ProjectStatus {
  if (typeof value === 'string' && PROJECT_STATUSES.includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  throw new HttpError(400, 'Некорректный статус проекта');
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Строковое поле задано неверно');
  }
  const t = value.trim();
  return t.length === 0 ? null : t;
}

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HttpError(400, 'Поле budget должно быть числом');
  }
  return value;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Дата должна быть строкой ISO 8601');
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(400, 'Некорректная дата');
  }
  return d;
}

export function parseCreateProjectBody(body: unknown): CreateProjectInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  return {
    title: assertTitle(b.title),
    keyPrefix: 'keyPrefix' in b ? parseKeyPrefix(b.keyPrefix) : 'proj',
    description: parseOptionalString(b.description) ?? null,
    client: assertClient(b.client),
    status: parseStatus(b.status, 'active'),
    budget: parseOptionalNumber(b.budget) ?? null,
    deadline: parseOptionalDate(b.deadline) ?? null,
  };
}

export function parseUpdateProjectBody(body: unknown): UpdateProjectInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  const out: UpdateProjectInput = {};
  if ('title' in b) {
    out.title = assertTitle(b.title);
  }
  if ('description' in b) {
    out.description = parseOptionalString(b.description) ?? null;
  }
  if ('client' in b) {
    out.client = parseOptionalString(b.client) ?? null;
  }
  if ('status' in b) {
    out.status = parseStatusRequired(b.status);
  }
  if ('budget' in b) {
    out.budget = parseOptionalNumber(b.budget) ?? null;
  }
  if ('deadline' in b) {
    out.deadline = parseOptionalDate(b.deadline) ?? null;
  }
  return out;
}

export async function listProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

/** projectRef — uuid или человекочитаемый key (напр. proj-1) */
export async function getProjectForUser(projectRef: string, userId: string) {
  if (UUID_RE.test(projectRef)) {
    const p = await prisma.project.findFirst({
      where: { id: projectRef, userId },
    });
    if (!p) {
      throw new HttpError(404, 'Проект не найден');
    }
    return p;
  }
  const p = await prisma.project.findFirst({
    where: { key: projectRef, userId },
  });
  if (!p) {
    throw new HttpError(404, 'Проект не найден');
  }
  return p;
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const prefix = input.keyPrefix ?? 'proj';
  const key = await nextProjectKeyForUser(userId, prefix);
  return prisma.project.create({
    data: {
      key,
      title: input.title,
      description: input.description ?? null,
      client: input.client,
      status: input.status ?? 'active',
      budget: input.budget ?? null,
      deadline: input.deadline ?? null,
      userId,
    },
  });
}

export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  const existing = await getProjectForUser(projectId, userId);
  const data: Prisma.ProjectUpdateInput = {};
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.client !== undefined) {
    data.client = input.client;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.budget !== undefined) {
    data.budget = input.budget;
  }
  if (input.deadline !== undefined) {
    data.deadline = input.deadline;
  }
  if (Object.keys(data).length === 0) {
    return existing;
  }
  return prisma.project.update({
    where: { id: existing.id },
    data,
  });
}

export async function deleteProject(projectRef: string, userId: string): Promise<void> {
  const existing = await getProjectForUser(projectRef, userId);
  await prisma.project.delete({
    where: { id: existing.id },
  });
}
