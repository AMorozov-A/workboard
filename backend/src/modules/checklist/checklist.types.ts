export interface ChecklistItemJson {
  id: string;
  text: string;
  done: boolean;
  position: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateChecklistItemInput = {
  text: string;
};

export type UpdateChecklistItemInput = Partial<{
  text: string;
  done: boolean;
  position: number;
}>;

