import type { Prisma, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { Prisma as PrismaRuntime } from '@prisma/client';
import { prisma } from '../../db/client';
import { getProjectForUser } from '../projects/projects.service';
import { HttpError } from '../../shared/http-error';
import { parseEnum } from '../../shared/parseEnum';
import { assertTagsOwnedByUser, ensureTagsByNames } from '../tags/tags.service';
import type { CreateTaskInput, UpdateTaskInput } from './task.types';

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

type TaskWithTags = Prisma.TaskGetPayload<{ include: { tags: true } }>;

function assertTitle(title: unknown): string {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new HttpError(400, 'Укажите название задачи');
  }
  return title.trim();
}

function parseTaskStatus(value: unknown, fallback: TaskStatus): TaskStatus {
  return parseEnum<TaskStatus>(value, TASK_STATUSES, {
    fallback,
    throwError: () => {
      throw new HttpError(400, 'Некорректный статус задачи');
    },
  });
}

function parseTaskStatusRequired(value: unknown): TaskStatus {
  return parseEnum<TaskStatus>(value, TASK_STATUSES, {
    throwError: () => {
      throw new HttpError(400, 'Некорректный статус задачи');
    },
  });
}

function parseTaskPriority(value: unknown, fallback: TaskPriority): TaskPriority {
  return parseEnum<TaskPriority>(value, TASK_PRIORITIES, {
    fallback,
    throwError: () => {
      throw new HttpError(400, 'Некорректный приоритет задачи');
    },
  });
}

function parseTaskPriorityRequired(value: unknown): TaskPriority {
  return parseEnum<TaskPriority>(value, TASK_PRIORITIES, {
    throwError: () => {
      throw new HttpError(400, 'Некорректный приоритет задачи');
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

function parseLabels(value: unknown): string[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (!Array.isArray(value) || !value.every((x) => typeof x === 'string')) {
    throw new HttpError(400, 'labels должен быть массивом строк');
  }
  return value.length === 0 ? null : value;
}

function parseTagIds(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((x) => typeof x === 'string')) {
    throw new HttpError(400, 'tagIds должен быть массивом строк');
  }
  return Array.from(new Set(value.map((s) => s.trim()).filter(Boolean)));
}

async function nextTaskKeyForProject(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { taskKeyPrefix: true },
  });
  if (!project) {
    throw new HttpError(404, 'Проект не найден');
  }
  const prefix = project.taskKeyPrefix;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}-(\\d+)$`);
  const rows = await prisma.task.findMany({
    where: { projectId },
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

export async function assertProjectOwnedByUser(projectRef: string, userId: string) {
  return getProjectForUser(projectRef, userId);
}

export function parseCreateTaskBody(body: unknown): CreateTaskInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  if (typeof b.projectId !== 'string' || b.projectId.trim().length === 0) {
    throw new HttpError(400, 'Укажите projectId');
  }
  return {
    projectId: b.projectId.trim(),
    title: assertTitle(b.title),
    description: parseOptionalString(b.description) ?? null,
    status: parseTaskStatus(b.status, 'todo'),
    priority: parseTaskPriority(b.priority, 'medium'),
    dueDate: parseOptionalDate(b.dueDate) ?? null,
    labels: parseLabels(b.labels) ?? null,
    tagIds: parseTagIds((b as Record<string, unknown>).tagIds),
  };
}

export function parseUpdateTaskBody(body: unknown): UpdateTaskInput {
  if (body === null || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  const b = body as Record<string, unknown>;
  const out: UpdateTaskInput = {};
  if ('title' in b) {
    out.title = assertTitle(b.title);
  }
  if ('description' in b) {
    out.description = parseOptionalString(b.description) ?? null;
  }
  if ('status' in b) {
    out.status = parseTaskStatusRequired(b.status);
  }
  if ('priority' in b) {
    out.priority = parseTaskPriorityRequired(b.priority);
  }
  if ('dueDate' in b) {
    out.dueDate = parseOptionalDate(b.dueDate) ?? null;
  }
  if ('labels' in b) {
    out.labels = parseLabels(b.labels) ?? null;
  }
  if ('tagIds' in b) {
    out.tagIds = parseTagIds(b.tagIds) ?? [];
  }
  return out;
}

function toLabelsJson(
  labels: string[] | null | undefined,
): Prisma.InputJsonValue | typeof PrismaRuntime.JsonNull | undefined {
  if (labels === undefined) {
    return undefined;
  }
  if (labels === null || labels.length === 0) {
    return PrismaRuntime.JsonNull;
  }
  return labels;
}

export async function listTasksForProject(
  projectRef: string,
  userId: string,
): Promise<{ projectId: string; rows: TaskWithTags[] }> {
  const project = await assertProjectOwnedByUser(projectRef, userId);
  const rows = await prisma.task.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
    include: { tags: true },
  });
  return { projectId: project.id, rows };
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskWithTags> {
  await assertProjectOwnedByUser(input.projectId, userId);
  const key = await nextTaskKeyForProject(input.projectId);
  const tags =
    input.tagIds && input.tagIds.length > 0
      ? await assertTagsOwnedByUser(input.tagIds, userId)
      : input.labels && input.labels.length > 0
        ? await ensureTagsByNames(userId, input.labels)
        : [];
  return prisma.task.create({
    data: {
      key,
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      labels: toLabelsJson(input.labels ?? null) ?? PrismaRuntime.JsonNull,
      tags: tags.length > 0 ? { connect: tags.map((t) => ({ id: t.id })) } : undefined,
    },
    include: { tags: true },
  });
}

export async function getTaskForUser(taskId: string, userId: string): Promise<TaskWithTags> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { userId },
    },
    include: { tags: true },
  });
  if (!task) {
    throw new HttpError(404, 'Задача не найдена');
  }
  return task;
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskWithTags> {
  const existing = await getTaskForUser(taskId, userId);
  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.priority !== undefined) {
    data.priority = input.priority;
  }
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate;
  }
  if (input.labels !== undefined) {
    data.labels = toLabelsJson(input.labels) ?? PrismaRuntime.JsonNull;
  }
  if (input.tagIds !== undefined) {
    const tags = await assertTagsOwnedByUser(input.tagIds, userId);
    data.tags = { set: tags.map((t) => ({ id: t.id })) };
  }
  if (Object.keys(data).length === 0) {
    return existing;
  }
  return prisma.task.update({
    where: { id: taskId },
    data,
    include: { tags: true },
  });
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { userId },
    },
  });
  if (!task) {
    throw new HttpError(404, 'Задача не найдена');
  }
  await prisma.task.delete({ where: { id: taskId } });
}
