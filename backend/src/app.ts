import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { healthRouter } from './api/health/health.routes';
import { authRouter } from './api/auth/auth.routes';
import { productRouter } from './api/products/product.routes';
import { orderRouter } from './api/orders/order.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Builds and configures the Express application. Kept separate from the server
 * bootstrap so tests can import the app without opening a network port.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/orders', orderRouter);

  // 404 + centralized error handling must be registered last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
