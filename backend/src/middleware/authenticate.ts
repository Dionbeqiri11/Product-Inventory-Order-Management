import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../api/auth/token';

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success the
 * decoded payload is attached to `req.user`; otherwise responds 401.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
};
