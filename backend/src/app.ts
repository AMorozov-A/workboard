import express from 'express';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { v1Router } from './routes/v1';

export function createApp(): express.Application {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.use('/api/v1', v1Router);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, message: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
}
