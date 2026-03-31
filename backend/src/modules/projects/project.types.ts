import type { ProjectStatus } from '@prisma/client';

/** Ответ API (JSON). */
export interface ProjectJson {
  id: string;
  key: string;
  title: string;
  description: string | null;
  client: string | null;
  status: ProjectStatus;
  budget: number | null;
  deadline: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  /** Префикс ключа: proj → proj-1, proj-2 (уникален в рамках пользователя) */
  keyPrefix?: string | null;
  description?: string | null;
  /** Обязателен при создании проекта. */
  client: string;
  status?: ProjectStatus;
  budget?: number | null;
  deadline?: Date | null;
}

/** PATCH: поля опциональны; `client` может быть `null` (сброс). */
export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'client'>> & {
  client?: string | null;
};
