import type { Project as PrismaProject } from '@prisma/client';
import type { ProjectJson } from './project.types';

export function mapProjectToJson(p: PrismaProject): ProjectJson {
  return {
    id: p.id,
    key: p.key,
    taskKeyPrefix: p.taskKeyPrefix,
    title: p.title,
    description: p.description,
    client: p.client,
    status: p.status,
    budget: p.budget,
    deadline: p.deadline ? p.deadline.toISOString() : null,
    userId: p.userId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
