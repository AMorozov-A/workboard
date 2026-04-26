export interface TaskNoteResponse {
  id: string;
  key: string;
  title: string | null;
  body: string;
  taskId: string;
  createdAt: string;
}

export interface CreateTaskNoteDto {
  title?: string | null;
  body: string;
}

export interface UpdateTaskNoteDto {
  title?: string | null;
  body?: string;
}
