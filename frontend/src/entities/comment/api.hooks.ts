import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createComment, deleteComment, getComments } from './api'
import type { Comment, CreateCommentDto } from './types'

export const taskCommentsQueryKey = ['task-comments'] as const

export const useCommentsList = (taskId: string) =>
  useQuery({
    queryKey: [...taskCommentsQueryKey, taskId],
    queryFn: () => getComments(taskId),
    enabled: Boolean(taskId),
  })

export const useCreateCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createComment(taskId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...taskCommentsQueryKey, taskId] })
    },
  })
}

export const useDeleteCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<Comment[]>([...taskCommentsQueryKey, taskId], (old) =>
        old?.filter((c) => c.id !== commentId) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: [...taskCommentsQueryKey, taskId] })
    },
  })
}
