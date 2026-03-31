import { Router } from 'express';
import * as commentsController from './comments.controller';

export const commentsRouter = Router();

/** GET /api/v1/comments/task/:taskId */
commentsRouter.get('/task/:taskId', (req, res, next) => {
  void commentsController.listByTask(req, res).catch(next);
});
