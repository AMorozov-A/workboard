import { createTag as createTagApi, deleteTag as deleteTagApi, listTags, updateTag as updateTagApi } from '@shared/api/crmV1Service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTagDto, Tag, UpdateTagDto } from './types'

export const tagsQueryKey = ['tags'] as const

export async function fetchTags(): Promise<Tag[]> {
  const { items } = await listTags()
  return items as Tag[]
}

export const useTagsQuery = () =>
  useQuery({
    queryKey: tagsQueryKey,
    queryFn: fetchTags,
  })

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateTagDto): Promise<Tag> => {
      const { tag } = await createTagApi({ name: dto.name, color: dto.color })
      return tag as Tag
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Tag[]>(tagsQueryKey, (old) => {
        const prev = old ?? []
        if (prev.some((t) => t.id === created.id)) return prev
        return [created, ...prev]
      })
      void queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    },
  })
}

export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tagId, dto }: { tagId: string; dto: UpdateTagDto }): Promise<Tag> => {
      const { tag } = await updateTagApi(tagId, dto)
      return tag as Tag
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Tag[]>(tagsQueryKey, (old) =>
        old?.map((t) => (t.id === updated.id ? updated : t)) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    },
  })
}

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      await deleteTagApi(tagId)
    },
    onSuccess: (_data, tagId) => {
      queryClient.setQueryData<Tag[]>(tagsQueryKey, (old) => old?.filter((t) => t.id !== tagId) ?? [])
      void queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    },
  })
}

