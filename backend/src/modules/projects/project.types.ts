import type { Project, ProjectHealth, ProjectPriority, ProjectStatus, Tag } from '@prisma/client';
import type { TagJson } from '../tags/tag.types';

export type ProjectWithTags = Project & { tags: Tag[] };

export type ProjectWithProgress = ProjectWithTags & {
  tasksCount: number;
  tasksDoneCount: number;
  progress: number;
};
 
export interface ProjectJson {
  id: string;
  key: string;
  taskKeyPrefix: string;
  title: string;
  description: string | null;
  client: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  health: ProjectHealth;
  budget: number | null;
  deadline: string | null;
  userId: string;
  tags: TagJson[];
  tasksCount?: number;
  tasksDoneCount?: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  keyPrefix?: string | null;
  taskKeyPrefix?: string | null;
  description?: string | null;
  client: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  health?: ProjectHealth;
  budget?: number | null;
  deadline?: Date | null;
  tagIds?: string[];
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'client'>> & {
  client?: string | null;
};
