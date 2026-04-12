import type { Request, Response } from 'express';
import * as commentsService from './comments.service';
import { mapCommentToJson } from './comments.mapper';

function userId(req: Request): string {
  return req.user!.userId;
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
  res.status(200).json({ ok: true });
}
