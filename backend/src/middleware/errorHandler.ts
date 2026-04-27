import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../shared/http-error';
import { logger } from '../shared/logger';

function getStatusFromUnknownError(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  if (!('status' in err)) return null;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function getMessageFromUnknownError(err: unknown): string | null {
  if (err instanceof Error && typeof err.message === 'string' && err.message.length > 0) {
    return err.message;
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error('HTTP error', err, { method: req.method, url: req.originalUrl });

  let status = 500;
  if (err instanceof HttpError) {
    status = err.statusCode;
  } else {
    const statusFromError = getStatusFromUnknownError(err);
    if (statusFromError !== null) {
      status = statusFromError;
    }
  }

  const unsafeMessage = getMessageFromUnknownError(err) ?? 'Internal Server Error';
  const message =
    status === 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : unsafeMessage;
  res.status(status).json({ ok: false, message });
};
