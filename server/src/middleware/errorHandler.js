import { logger } from '../utils/logger.js';

/** Maps an error to an HTTP response. Distinguishes expected/known failures. */
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}

export function errorHandler(error, _req, res, _next) {
  const status = error?.status || 500;
  const detail = error?.detail;
  const message = error?.message || 'An unexpected error occurred.';

  if (status >= 500) {
    logger.error('Unhandled error', { status, message, detail, stack: error?.stack });
  } else {
    logger.warn('Request failed', { status, message, detail });
  }

  res.status(status).json({ error: message });
}