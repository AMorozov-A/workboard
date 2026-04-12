import type { ProjectStatus } from '@prisma/client';
 
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
  keyPrefix?: string | null;
  description?: string | null;
  client: string;
  status?: ProjectStatus;
  budget?: number | null;
  deadline?: Date | null;
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'client'>> & {
  client?: string | null;
};
