import type { RequestHandler } from 'express';
import { logger } from '../shared/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - started;
    logger.debug('HTTP request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ms,
    });
  });
  next();
};
