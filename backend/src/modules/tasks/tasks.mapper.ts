import type { Prisma } from '@prisma/client';
import type { Task as PrismaTask } from '@prisma/client';
import type { TaskJson } from './task.types';

function labelsFromJson(value: Prisma.JsonValue | null): string[] | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
    return value as string[];
  }
  return null;
}

export function mapTaskToJson(t: PrismaTask): TaskJson {
  return {
    id: t.id,
    key: t.key,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    labels: labelsFromJson(t.labels),
    projectId: t.projectId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
