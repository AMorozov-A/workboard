import { Router } from 'express';
import * as tasksController from './tasks.controller';
import { requireAuth } from '../auth/auth.middleware';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.post('/', (req, res, next) => {
  void tasksController.create(req, res).catch(next);
});

tasksRouter.get('/project/:projectId', (req, res, next) => {
  void tasksController.listByProject(req, res).catch(next);
});

tasksRouter.patch('/:id', (req, res, next) => {
  void tasksController.update(req, res).catch(next);
});

tasksRouter.delete('/:id', (req, res, next) => {
  void tasksController.remove(req, res).catch(next);
});
