import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { orderController } from './order.controller';
import { createOrderSchema } from './order.schemas';

export const orderRouter = Router();

// All order endpoints are scoped to the authenticated user.
orderRouter.use(authenticate);

// Placing orders is a customer action; admins manage the catalog, not orders.
orderRouter.post(
  '/',
  requireRole('user'),
  validateBody(createOrderSchema),
  asyncHandler(orderController.create),
);
orderRouter.get('/', asyncHandler(orderController.list));
orderRouter.get('/:id', asyncHandler(orderController.getOne));
