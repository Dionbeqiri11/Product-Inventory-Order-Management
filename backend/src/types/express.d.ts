import type { JwtPayload } from '../api/auth/token';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the authenticate middleware for protected routes. */
      user?: JwtPayload;
    }
  }
}

export {};
