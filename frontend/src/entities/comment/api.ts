import { apiRequest } from '@shared/api/client'
import type { Comment, CreateCommentDto } from './types'

const V1 = '/v1'

type CommentsListResponse = {
  ok: true
  items: Comment[]
}

type CommentCreateResponse = {
  ok: true
  comment: Comment
}

type CommentDeleteResponse = {
  ok: true
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const res = await apiRequest<CommentsListResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/comments`,
    { method: 'GET' }
  )
  return res.items
}

export async function createComment(taskId: string, dto: CreateCommentDto): Promise<Comment> {
  const res = await apiRequest<CommentCreateResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  )
  return res.comment
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  await apiRequest<CommentDeleteResponse>(
    `${V1}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' }
  )
}
