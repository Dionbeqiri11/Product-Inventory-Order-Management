import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

/** Catch-all for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler. Translates known error types (AppError, Zod
 * validation, Mongoose cast/duplicate-key) into consistent JSON responses and
 * hides internal details for unexpected errors.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod validation errors -> 400 with field details.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // Mongoose invalid ObjectId -> 400.
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid value for field '${err.path}'` });
    return;
  }

  // Duplicate key (unique index violation) -> 409.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const keys = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {});
    res.status(409).json({ error: `Duplicate value for: ${keys.join(', ')}` });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Anything else is an unexpected error: log it and return a generic 500.
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
};
