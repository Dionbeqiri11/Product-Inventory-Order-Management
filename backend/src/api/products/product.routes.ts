import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { productController } from './product.controller';
import { createProductSchema, updateProductSchema } from './product.schemas';

export const productRouter = Router();

// Read endpoints are public. Mutating endpoints are protected with auth in step 4.
productRouter.get('/', asyncHandler(productController.list));
productRouter.get('/:id', asyncHandler(productController.getOne));
productRouter.post('/', validateBody(createProductSchema), asyncHandler(productController.create));
productRouter.patch(
  '/:id',
  validateBody(updateProductSchema),
  asyncHandler(productController.update),
);
productRouter.delete('/:id', asyncHandler(productController.remove));
