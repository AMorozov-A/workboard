export interface CommentAuthor {
  id: string
  email: string
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  author: CommentAuthor
}

export interface CreateCommentDto {
  body: string
}
