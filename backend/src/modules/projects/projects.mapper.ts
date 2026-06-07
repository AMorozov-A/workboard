import type { Project as PrismaProject, Tag as PrismaTag } from '@prisma/client';
import type { ProjectJson } from './project.types';
import { mapTagToJson } from '../tags/tags.mapper';

type ProjectWithTags = PrismaProject & { tags?: PrismaTag[] };
type ProjectWithProgress = ProjectWithTags & {
  tasksCount?: number;
  tasksDoneCount?: number;
  progress?: number;
};

export function mapProjectToJson(p: ProjectWithProgress): ProjectJson {
  return {
    id: p.id,
    key: p.key,
    taskKeyPrefix: p.taskKeyPrefix,
    title: p.title,
    description: p.description,
    client: p.client,
    status: p.status,
    priority: p.priority,
    health: p.health,
    budget: p.budget,
    deadline: p.deadline ? p.deadline.toISOString() : null,
    userId: p.userId,
    tags: (p.tags ?? []).map(mapTagToJson),
    tasksCount: p.tasksCount,
    tasksDoneCount: p.tasksDoneCount,
    progress: p.progress,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
