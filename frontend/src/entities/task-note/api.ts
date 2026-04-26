import { apiRequest } from '@shared/api/client'
import type { CreateTaskNoteDto, TaskNote, UpdateTaskNoteDto } from './types'

const V1 = '/v1'

type NotesListResponse = {
  ok: true
  items: TaskNote[]
}

type NoteCreateResponse = {
  ok: true
  note: TaskNote
}

type NoteDeleteResponse = {
  ok: true
}

export async function getTaskNotes(taskId: string): Promise<TaskNote[]> {
  const res = await apiRequest<NotesListResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/notes`,
    { method: 'GET' }
  )
  return res.items
}

export async function createTaskNote(taskId: string, dto: CreateTaskNoteDto): Promise<TaskNote> {
  const res = await apiRequest<NoteCreateResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  )
  return res.note
}

export async function updateTaskNote(
  taskId: string,
  noteId: string,
  dto: UpdateTaskNoteDto
): Promise<TaskNote> {
  const res = await apiRequest<NoteCreateResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/notes/${encodeURIComponent(noteId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }
  )
  return res.note
}

export async function deleteTaskNote(taskId: string, noteId: string): Promise<void> {
  await apiRequest<NoteDeleteResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/notes/${encodeURIComponent(noteId)}`,
    { method: 'DELETE' }
  )
}
