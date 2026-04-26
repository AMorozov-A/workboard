import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from './auth.middleware';

export const authRouter = Router();

authRouter.post('/register', (req, res, next) => {
  void authController.register(req, res).catch(next);
});

authRouter.post('/login', (req, res, next) => {
  void authController.login(req, res).catch(next);
});

authRouter.post('/ensure-demo', (req, res, next) => {
  void authController.ensureDemo(req, res).catch(next);
});

authRouter.get('/me', requireAuth, (req, res, next) => {
  void authController.me(req, res).catch(next);
});

authRouter.post('/logout', requireAuth, (req, res, next) => {
  void authController.logout(req, res).catch(next);
});

authRouter.patch('/password', requireAuth, (req, res, next) => {
  void authController.changePassword(req, res).catch(next);
});
