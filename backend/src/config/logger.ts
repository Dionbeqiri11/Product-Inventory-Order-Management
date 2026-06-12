import pino from 'pino';
import { env } from './env';

/**
 * Application logger. Uses pretty printing in development for readability and
 * structured JSON in production for log aggregation.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});
