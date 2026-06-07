import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as checklistController from './checklist.controller';

export const checklistRouter = Router({ mergeParams: true });

checklistRouter.use(requireAuth);

checklistRouter.get('/', (req, res, next) => {
  void checklistController.list(req, res).catch(next);
});

checklistRouter.post('/', (req, res, next) => {
  void checklistController.create(req, res).catch(next);
});

checklistRouter.patch('/:itemId', (req, res, next) => {
  void checklistController.update(req, res).catch(next);
});

checklistRouter.delete('/:itemId', (req, res, next) => {
  void checklistController.remove(req, res).catch(next);
});

