import type { TaskPriority, TaskStatus } from '@prisma/client';

export interface TaskJson {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  labels: string[] | null;
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
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'projectId'>>;
