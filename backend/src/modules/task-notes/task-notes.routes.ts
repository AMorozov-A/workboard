import { Router } from 'express';
import * as taskNotesController from './task-notes.controller';
import { requireAuth } from '../auth/auth.middleware';

export const taskNotesRouter = Router({ mergeParams: true });

taskNotesRouter.use(requireAuth);

taskNotesRouter.get('/', (req, res, next) => {
  void taskNotesController.list(req, res).catch(next);
});

taskNotesRouter.post('/', (req, res, next) => {
  void taskNotesController.create(req, res).catch(next);
});

taskNotesRouter.patch('/:noteId', (req, res, next) => {
  void taskNotesController.update(req, res).catch(next);
});

taskNotesRouter.delete('/:noteId', (req, res, next) => {
  void taskNotesController.remove(req, res).catch(next);
});
