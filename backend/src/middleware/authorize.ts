import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../api/auth/user.model';

/**
 * Authorization guard. Must run after `authenticate` (which populates req.user).
 * Responds 403 if the authenticated user's role is not in the allowed set.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
