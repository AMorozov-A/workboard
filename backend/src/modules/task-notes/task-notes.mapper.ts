import type { TaskNote as PrismaTaskNote } from '@prisma/client';
import type { TaskNoteResponse } from './task-note.types';

export function mapTaskNoteToJson(row: PrismaTaskNote): TaskNoteResponse {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    body: row.body,
    taskId: row.taskId,
    createdAt: row.createdAt.toISOString(),
  };
}
