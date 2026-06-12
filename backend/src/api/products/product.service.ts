import { AppError } from '../../utils/AppError';
import { productRepository } from './product.repository';
import type { CreateProductInput, UpdateProductInput } from './product.schemas';
import type { ProductDocument } from './product.model';

/**
 * Business logic for products. Validation of shape happens at the route via zod;
 * this layer enforces domain rules and translates "not found" into AppError.
 */
export const productService = {
  create(input: CreateProductInput): Promise<ProductDocument> {
    return productRepository.create(input);
  },

  list(): Promise<ProductDocument[]> {
    return productRepository.findAll();
  },

  async getById(id: string): Promise<ProductDocument> {
    const product = await productRepository.findById(id);
    if (!product) throw AppError.notFound('Product not found');
    return product;
  },

  async update(id: string, input: UpdateProductInput): Promise<ProductDocument> {
    const product = await productRepository.update(id, input);
    if (!product) throw AppError.notFound('Product not found');
    return product;
  },

  async remove(id: string): Promise<void> {
    const product = await productRepository.delete(id);
    if (!product) throw AppError.notFound('Product not found');
  },
};
