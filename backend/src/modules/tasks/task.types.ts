import type { TaskPriority, TaskStatus } from '@prisma/client';
import type { TagJson } from '../tags/tag.types';

export interface TaskJson {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  labels: string[] | null;
  tags: TagJson[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  labels?: string[] | null;
  tagIds?: string[];
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'projectId'>>;
