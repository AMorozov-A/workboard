import { Router } from 'express';
import { authRouter } from '../../modules/auth/auth.routes';
import { checklistRouter } from '../../modules/checklist/checklist.routes';
import { commentsRouter } from '../../modules/comments/comments.routes';
import { projectsRouter } from '../../modules/projects/projects.routes';
import { tagsRouter } from '../../modules/tags/tags.routes';
import { taskNotesRouter } from '../../modules/task-notes/task-notes.routes';
import { tasksRouter } from '../../modules/tasks/tasks.routes';

export const v1Router = Router();

v1Router.get('/ping', (_req, res) => {
  res.status(200).json({ ok: true, message: 'pong' });
});

v1Router.use('/auth', authRouter);
v1Router.use('/projects', projectsRouter);
v1Router.use('/tags', tagsRouter);
v1Router.use('/tasks/:taskId/comments', commentsRouter);
v1Router.use('/tasks/:taskId/checklist', checklistRouter);
v1Router.use('/tasks/:taskId/notes', taskNotesRouter);
v1Router.use('/tasks', tasksRouter);
