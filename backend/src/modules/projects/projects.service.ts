import type { Prisma, Project, ProjectHealth, ProjectPriority, ProjectStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import { parseEnum } from '../../shared/parseEnum';
import { assertTagsOwnedByUser } from '../tags/tags.service';
import type { CreateProjectInput, ProjectWithProgress, UpdateProjectInput } from './project.types';

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'paused', 'done'];
const PROJECT_PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];
const PROJECT_HEALTH: ProjectHealth[] = ['on_track', 'at_risk', 'off_track'];

const KEY_PREFIX_RE = /^[a-z][a-z0-9-]{1,29}$/;
const TASK_KEY_PREFIX_RE = /^[A-Z][A-Z0-9]{0,9}$/;

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

function parseTaskKeyPrefix(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return 'T';
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Префикс ключа задач должен быть строкой');
  }
  const t = value.trim().toUpperCase();
  if (!TASK_KEY_PREFIX_RE.test(t)) {
    throw new HttpError(
      400,
      'Префикс ключа задач: 1–10 символов, A–Z и цифры, начинается с буквы (пример: T)',
    );
  }
  return t;
}

function defaultTaskKeyPrefixFromProjectPrefix(projectKeyPrefix: string): string {
  const cleaned = projectKeyPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 0) {
    return cleaned.slice(0, 10);
  }
  return 'T';
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
  return parseEnum<ProjectStatus>(value, PROJECT_STATUSES, {
    fallback,
    throwError: () => {
      throw new HttpError(400, 'Некорректный статус проекта');
    },
  });
}

function parseStatusRequired(value: unknown): ProjectStatus {
  return parseEnum<ProjectStatus>(value, PROJECT_STATUSES, {
    throwError: () => {
      throw new HttpError(400, 'Некорректный статус проекта');
    },
  });
}

function parsePriority(value: unknown, fallback: ProjectPriority): ProjectPriority {
  return parseEnum<ProjectPriority>(value, PROJECT_PRIORITIES, {
    fallback,
    throwError: () => {
      throw new HttpError(400, 'Некорректный приоритет проекта');
    },
  });
}

function parsePriorityRequired(value: unknown): ProjectPriority {
  return parseEnum<ProjectPriority>(value, PROJECT_PRIORITIES, {
    throwError: () => {
      throw new HttpError(400, 'Некорректный приоритет проекта');
    },
  });
}

function parseHealth(value: unknown, fallback: ProjectHealth): ProjectHealth {
  return parseEnum<ProjectHealth>(value, PROJECT_HEALTH, {
    fallback,
    throwError: () => {
      throw new HttpError(400, 'Некорректный health-статус проекта');
    },
  });
}

function parseHealthRequired(value: unknown): ProjectHealth {
  return parseEnum<ProjectHealth>(value, PROJECT_HEALTH, {
    throwError: () => {
      throw new HttpError(400, 'Некорректный health-статус проекта');
    },
  });
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

function parseTagIds(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((x) => typeof x === 'string')) {
    throw new HttpError(400, 'tagIds должен быть массивом строк');
  }
  return Array.from(new Set(value.map((s) => s.trim()).filter(Boolean)));
}

export function parseCreateProjectBody(body: unknown): CreateProjectInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  const keyPrefix = 'keyPrefix' in b ? parseKeyPrefix(b.keyPrefix) : 'proj';
  const taskKeyPrefix =
    'taskKeyPrefix' in b
      ? parseTaskKeyPrefix(b.taskKeyPrefix)
      : defaultTaskKeyPrefixFromProjectPrefix(keyPrefix);
  return {
    title: assertTitle(b.title),
    keyPrefix,
    taskKeyPrefix,
    description: parseOptionalString(b.description) ?? null,
    client: assertClient(b.client),
    status: parseStatus(b.status, 'active'),
    priority: parsePriority(b.priority, 'medium'),
    health: parseHealth(b.health, 'on_track'),
    budget: parseOptionalNumber(b.budget) ?? null,
    deadline: parseOptionalDate(b.deadline) ?? null,
    tagIds: parseTagIds((b as Record<string, unknown>).tagIds),
  };
}

export function parseUpdateProjectBody(body: unknown): UpdateProjectInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  if ('taskKeyPrefix' in b) {
    throw new HttpError(400, 'Нельзя изменить префикс ключа задач после создания проекта');
  }
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
  if ('priority' in b) {
    out.priority = parsePriorityRequired(b.priority);
  }
  if ('health' in b) {
    out.health = parseHealthRequired(b.health);
  }
  if ('budget' in b) {
    out.budget = parseOptionalNumber(b.budget) ?? null;
  }
  if ('deadline' in b) {
    out.deadline = parseOptionalDate(b.deadline) ?? null;
  }
  if ('tagIds' in b) {
    out.tagIds = parseTagIds(b.tagIds) ?? [];
  }
  return out;
}

export async function listProjectsForUser(userId: string): Promise<ProjectWithProgress[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { tags: true },
  });
  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);
  const totals = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: ids } },
    _count: { _all: true },
  });
  const done = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: ids }, status: 'done' },
    _count: { _all: true },
  });

  const totalByProject = new Map(totals.map((r) => [r.projectId, r._count._all]));
  const doneByProject = new Map(done.map((r) => [r.projectId, r._count._all]));

  return projects.map((p) => {
    const tasksCount = totalByProject.get(p.id) ?? 0;
    const tasksDoneCount = doneByProject.get(p.id) ?? 0;
    const progress = tasksCount > 0 ? Math.round((tasksDoneCount / tasksCount) * 100) : 0;
    return { ...p, tasksCount, tasksDoneCount, progress };
  });
}

export async function getProjectForUser(
  projectRef: string,
  userId: string,
): Promise<ProjectWithProgress> {
  if (UUID_RE.test(projectRef)) {
    const p = await prisma.project.findFirst({
      where: { id: projectRef, userId },
      include: { tags: true },
    });
    if (!p) {
      throw new HttpError(404, 'Проект не найден');
    }
    const tasksCount = await prisma.task.count({ where: { projectId: p.id } });
    const tasksDoneCount = await prisma.task.count({ where: { projectId: p.id, status: 'done' } });
    const progress = tasksCount > 0 ? Math.round((tasksDoneCount / tasksCount) * 100) : 0;
    return { ...p, tasksCount, tasksDoneCount, progress };
  }
  const p = await prisma.project.findFirst({
    where: { key: projectRef, userId },
    include: { tags: true },
  });
  if (!p) {
    throw new HttpError(404, 'Проект не найден');
  }
  const tasksCount = await prisma.task.count({ where: { projectId: p.id } });
  const tasksDoneCount = await prisma.task.count({ where: { projectId: p.id, status: 'done' } });
  const progress = tasksCount > 0 ? Math.round((tasksDoneCount / tasksCount) * 100) : 0;
  return { ...p, tasksCount, tasksDoneCount, progress };
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<Project> {
  const prefix = input.keyPrefix ?? 'proj';
  const key = await nextProjectKeyForUser(userId, prefix);
  const tags =
    input.tagIds && input.tagIds.length > 0 ? await assertTagsOwnedByUser(input.tagIds, userId) : [];
  return prisma.project.create({
    data: {
      key,
      taskKeyPrefix: input.taskKeyPrefix ?? defaultTaskKeyPrefixFromProjectPrefix(prefix),
      title: input.title,
      description: input.description ?? null,
      client: input.client,
      status: input.status ?? 'active',
      priority: input.priority ?? 'medium',
      health: input.health ?? 'on_track',
      budget: input.budget ?? null,
      deadline: input.deadline ?? null,
      userId,
      tags: tags.length > 0 ? { connect: tags.map((t) => ({ id: t.id })) } : undefined,
    },
    include: { tags: true },
  });
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<Project> {
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
  if (input.priority !== undefined) {
    data.priority = input.priority;
  }
  if (input.health !== undefined) {
    data.health = input.health;
  }
  if (input.budget !== undefined) {
    data.budget = input.budget;
  }
  if (input.deadline !== undefined) {
    data.deadline = input.deadline;
  }
  if (input.tagIds !== undefined) {
    const tags = await assertTagsOwnedByUser(input.tagIds, userId);
    data.tags = { set: tags.map((t) => ({ id: t.id })) };
  }
  if (Object.keys(data).length === 0) {
    return existing;
  }
  return prisma.project.update({
    where: { id: existing.id },
    data,
    include: { tags: true },
  });
}

export async function deleteProject(projectRef: string, userId: string): Promise<void> {
  const existing = await getProjectForUser(projectRef, userId);
  await prisma.project.delete({
    where: { id: existing.id },
  });
}
