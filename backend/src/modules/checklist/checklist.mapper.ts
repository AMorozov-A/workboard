import type { ChecklistItem } from '@prisma/client';
import type { ChecklistItemJson } from './checklist.types';

export function mapChecklistItemToJson(i: ChecklistItem): ChecklistItemJson {
  return {
    id: i.id,
    text: i.text,
    done: i.done,
    position: i.position,
    taskId: i.taskId,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

