import type { Comment as PrismaComment, User } from '@prisma/client';
import type { CommentResponse } from './comment.types';

type CommentWithAuthor = PrismaComment & {
  author: Pick<User, 'id' | 'email'>;
};

export function mapCommentToJson(row: CommentWithAuthor): CommentResponse {
  return {
    id: row.id,
    body: row.body,
    taskId: row.taskId,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.author.id,
      email: row.author.email,
    },
  };
}
