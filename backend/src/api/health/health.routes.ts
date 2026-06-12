import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

/**
 * Liveness/readiness probe. Reports process uptime and current database
 * connection state (1 = connected). Used by Docker healthchecks.
 */
healthRouter.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    uptime: process.uptime(),
    db: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});
