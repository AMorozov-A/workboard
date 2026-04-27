import type { Request, Response } from 'express';
import * as commentsService from './comments.service';
import { mapCommentToJson } from './comments.mapper';
import { HttpError } from '../../shared/http-error';

function userId(req: Request): string {
  const id = req.user?.userId;
  if (!id) throw new HttpError(401, 'Unauthorized');
  return id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const rows = await commentsService.getCommentsByTask(taskId, userId(req));
  res.status(200).json({
    ok: true,
    items: rows.map(mapCommentToJson),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const body = commentsService.parseCreateCommentBody(req.body);
  const row = await commentsService.createComment(taskId, userId(req), body);
  res.status(201).json({ ok: true, comment: mapCommentToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { taskId, commentId } = req.params;
  await commentsService.deleteComment(taskId, commentId, userId(req));
  res.status(204).send();
}
