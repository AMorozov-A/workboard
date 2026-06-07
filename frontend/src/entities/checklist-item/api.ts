import { apiRequest } from '@shared/api/client'
import type { ChecklistItem, CreateChecklistItemDto, UpdateChecklistItemDto } from './types'

const V1 = '/v1'

type ChecklistListResponse = {
  ok: true
  items: ChecklistItem[]
}

type ChecklistItemResponse = {
  ok: true
  item: ChecklistItem
}

export async function getChecklist(taskId: string): Promise<ChecklistItem[]> {
  const res = await apiRequest<ChecklistListResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/checklist`,
    { method: 'GET' }
  )
  return res.items
}

export async function createChecklistItem(
  taskId: string,
  dto: CreateChecklistItemDto
): Promise<ChecklistItem> {
  const res = await apiRequest<ChecklistItemResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/checklist`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  )
  return res.item
}

export async function updateChecklistItem(
  taskId: string,
  itemId: string,
  dto: UpdateChecklistItemDto
): Promise<ChecklistItem> {
  const res = await apiRequest<ChecklistItemResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/checklist/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }
  )
  return res.item
}

export async function deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
  await apiRequest<void>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/checklist/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' }
  )
}

