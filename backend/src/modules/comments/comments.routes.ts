import { Router } from 'express';
import * as commentsController from './comments.controller';
import { requireAuth } from '../auth/auth.middleware';

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.use(requireAuth);

commentsRouter.get('/', (req, res, next) => {
  void commentsController.list(req, res).catch(next);
});

commentsRouter.post('/', (req, res, next) => {
  void commentsController.create(req, res).catch(next);
});

commentsRouter.delete('/:commentId', (req, res, next) => {
  void commentsController.remove(req, res).catch(next);
});
