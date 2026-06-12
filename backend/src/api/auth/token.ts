import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
}

/** Sign a JWT for an authenticated user. */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/** Verify and decode a JWT, throwing if invalid/expired. */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return decoded as JwtPayload;
}
