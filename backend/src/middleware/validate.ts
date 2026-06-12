import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Returns middleware that validates and replaces `req.body` with the parsed,
 * typed result of the given zod schema. On failure the ZodError propagates to
 * the centralized error handler, which renders a 400 with field details.
 */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
