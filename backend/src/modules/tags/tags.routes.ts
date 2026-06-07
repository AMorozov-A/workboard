import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as tagsController from './tags.controller';

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get('/', (req, res, next) => {
  void tagsController.list(req, res).catch(next);
});

tagsRouter.post('/', (req, res, next) => {
  void tagsController.create(req, res).catch(next);
});

tagsRouter.patch('/:id', (req, res, next) => {
  void tagsController.update(req, res).catch(next);
});

tagsRouter.delete('/:id', (req, res, next) => {
  void tagsController.remove(req, res).catch(next);
});

