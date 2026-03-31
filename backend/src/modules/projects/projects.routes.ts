import { Router } from 'express';
import * as projectsController from './projects.controller';
import { requireAuth } from '../auth/auth.middleware';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', (req, res, next) => {
  void projectsController.list(req, res).catch(next);
});

projectsRouter.post('/', (req, res, next) => {
  void projectsController.create(req, res).catch(next);
});

projectsRouter.get('/:id', (req, res, next) => {
  void projectsController.getById(req, res).catch(next);
});

projectsRouter.patch('/:id', (req, res, next) => {
  void projectsController.update(req, res).catch(next);
});

projectsRouter.delete('/:id', (req, res, next) => {
  void projectsController.remove(req, res).catch(next);
});
