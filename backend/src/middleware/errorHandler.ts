import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../shared/http-error';
import { logger } from '../shared/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error('HTTP error', err, { method: req.method, url: req.originalUrl });

  let status = 500;
  if (err instanceof HttpError) {
    status = err.statusCode;
  } else if (typeof (err as { status?: unknown }).status === 'number') {
    status = (err as { status: number }).status;
  }

  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err as Error).message || 'Internal Server Error';
  res.status(status).json({ ok: false, message });
};
