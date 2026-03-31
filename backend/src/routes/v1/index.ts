import { Router } from 'express';
import { authRouter } from '../../modules/auth/auth.routes';
import { projectsRouter } from '../../modules/projects/projects.routes';
import { tasksRouter } from '../../modules/tasks/tasks.routes';
import { commentsRouter } from '../../modules/comments/comments.routes';

export const v1Router = Router();

v1Router.get('/ping', (_req, res) => {
  res.status(200).json({ ok: true, message: 'pong' });
});

v1Router.use('/auth', authRouter);
v1Router.use('/projects', projectsRouter);
v1Router.use('/tasks', tasksRouter);
v1Router.use('/comments', commentsRouter);
