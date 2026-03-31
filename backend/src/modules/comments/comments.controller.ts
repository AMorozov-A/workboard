import type { Request, Response } from 'express';
import * as commentsService from './comments.service';

export async function listByTask(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const items = await commentsService.listCommentsByTaskStub(taskId);
  res.status(200).json({ ok: true, taskId, items });
}
