import type { Prisma, Tag as PrismaTag, Task as PrismaTask } from '@prisma/client';
import type { TaskJson } from './task.types';
import { mapTagToJson } from '../tags/tags.mapper';

function labelsFromJson(value: Prisma.JsonValue | null): string[] | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
    return value as string[];
  }
  return null;
}

type TaskWithTags = PrismaTask & { tags?: PrismaTag[] };

function labelsFromTags(tags: PrismaTag[] | undefined): string[] | null {
  if (!tags || tags.length === 0) return null;
  return tags.map((t) => t.name);
}

export function mapTaskToJson(t: TaskWithTags): TaskJson {
  return {
    id: t.id,
    key: t.key,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    labels: labelsFromTags(t.tags) ?? labelsFromJson(t.labels),
    tags: (t.tags ?? []).map(mapTagToJson),
    projectId: t.projectId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
