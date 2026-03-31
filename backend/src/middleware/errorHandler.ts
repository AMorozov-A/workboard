import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../shared/http-error';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error('[HTTP Error]', err);
  const status =
    err instanceof HttpError
      ? err.statusCode
      : typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err as Error).message || 'Internal Server Error';
  res.status(status).json({ ok: false, message });
};
