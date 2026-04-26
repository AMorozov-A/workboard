import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTaskNote, deleteTaskNote, getTaskNotes, updateTaskNote } from './api'
import type { CreateTaskNoteDto, TaskNote, UpdateTaskNoteDto } from './types'

export const taskNotesQueryKey = ['task-notes'] as const

export const useTaskNotesList = (taskId: string) =>
  useQuery({
    queryKey: [...taskNotesQueryKey, taskId],
    queryFn: () => getTaskNotes(taskId),
    enabled: Boolean(taskId),
  })

export const useCreateTaskNoteMutation = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateTaskNoteDto) => createTaskNote(taskId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...taskNotesQueryKey, taskId] })
    },
  })
}

export const useUpdateTaskNoteMutation = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, dto }: { noteId: string; dto: UpdateTaskNoteDto }) =>
      updateTaskNote(taskId, noteId, dto),
    onSuccess: (note) => {
      queryClient.setQueryData<TaskNote[]>([...taskNotesQueryKey, taskId], (old) =>
        old?.map((n) => (n.id === note.id ? note : n)) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: [...taskNotesQueryKey, taskId] })
    },
  })
}

export const useDeleteTaskNoteMutation = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => deleteTaskNote(taskId, noteId),
    onSuccess: (_data, noteId) => {
      queryClient.setQueryData<TaskNote[]>([...taskNotesQueryKey, taskId], (old) =>
        old?.filter((n) => n.id !== noteId) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: [...taskNotesQueryKey, taskId] })
    },
  })
}
