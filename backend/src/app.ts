import cors from 'cors';
import express from 'express';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { v1Router } from './routes/v1';

export function createApp(): express.Application {
  const app = express();

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:5173'];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.use('/api/v1', v1Router);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, message: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
}
