import type { Request, Response } from 'express';
import { productService } from './product.service';

/**
 * HTTP controllers for products. Thin layer: translate request -> service call
 * -> response. Validation already happened in middleware; errors bubble to the
 * centralized handler via asyncHandler.
 */
export const productController = {
  async create(req: Request, res: Response): Promise<void> {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  },

  async list(_req: Request, res: Response): Promise<void> {
    const products = await productService.list();
    res.json(products);
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const product = await productService.getById(req.params.id);
    res.json(product);
  },

  async update(req: Request, res: Response): Promise<void> {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await productService.remove(req.params.id);
    res.status(204).send();
  },
};
