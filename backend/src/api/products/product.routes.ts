import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { productController } from './product.controller';
import { createProductSchema, updateProductSchema } from './product.schemas';

export const productRouter = Router();

// Read endpoints are public; managing products is restricted to admins.
productRouter.get('/', asyncHandler(productController.list));
productRouter.get('/:id', asyncHandler(productController.getOne));
productRouter.post(
  '/',
  authenticate,
  requireRole('admin'),
  validateBody(createProductSchema),
  asyncHandler(productController.create),
);
productRouter.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validateBody(updateProductSchema),
  asyncHandler(productController.update),
);
productRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(productController.remove),
);
