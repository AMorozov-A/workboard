import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createChecklistItem, deleteChecklistItem, getChecklist, updateChecklistItem } from './api'
import type { ChecklistItem, CreateChecklistItemDto, UpdateChecklistItemDto } from './types'

export const checklistQueryKey = ['checklist'] as const

export const useChecklist = (taskId: string) =>
  useQuery({
    queryKey: [...checklistQueryKey, taskId],
    queryFn: () => getChecklist(taskId),
    enabled: Boolean(taskId),
  })

export const useCreateChecklistItemMutation = (taskId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateChecklistItemDto) => createChecklistItem(taskId, dto),
    onSuccess: (created) => {
      queryClient.setQueryData<ChecklistItem[]>([...checklistQueryKey, taskId], (old) =>
        [...(old ?? []), created].sort((a, b) => a.position - b.position)
      )
      void queryClient.invalidateQueries({ queryKey: [...checklistQueryKey, taskId] })
    },
  })
}

export const useUpdateChecklistItemMutation = (taskId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, dto }: { itemId: string; dto: UpdateChecklistItemDto }) =>
      updateChecklistItem(taskId, itemId, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChecklistItem[]>([...checklistQueryKey, taskId], (old) =>
        (old ?? []).map((i) => (i.id === updated.id ? updated : i)).sort((a, b) => a.position - b.position)
      )
      void queryClient.invalidateQueries({ queryKey: [...checklistQueryKey, taskId] })
    },
  })
}

export const useDeleteChecklistItemMutation = (taskId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => deleteChecklistItem(taskId, itemId),
    onSuccess: (_data, itemId) => {
      queryClient.setQueryData<ChecklistItem[]>([...checklistQueryKey, taskId], (old) =>
        (old ?? []).filter((i) => i.id !== itemId)
      )
      void queryClient.invalidateQueries({ queryKey: [...checklistQueryKey, taskId] })
    },
  })
}

