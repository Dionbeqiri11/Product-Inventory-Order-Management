import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { productController } from './product.controller';
import { createProductSchema, updateProductSchema } from './product.schemas';

export const productRouter = Router();

// Read endpoints are public; mutating endpoints require authentication.
productRouter.get('/', asyncHandler(productController.list));
productRouter.get('/:id', asyncHandler(productController.getOne));
productRouter.post(
  '/',
  authenticate,
  validateBody(createProductSchema),
  asyncHandler(productController.create),
);
productRouter.patch(
  '/:id',
  authenticate,
  validateBody(updateProductSchema),
  asyncHandler(productController.update),
);
productRouter.delete('/:id', authenticate, asyncHandler(productController.remove));
