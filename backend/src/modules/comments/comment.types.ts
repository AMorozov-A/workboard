export interface CommentAuthorResponse {
  id: string;
  email: string;
}

export interface CommentResponse {
  id: string;
  body: string;
  taskId: string;
  createdAt: string;
  author: CommentAuthorResponse;
}
