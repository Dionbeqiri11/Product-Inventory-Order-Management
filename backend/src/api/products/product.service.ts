import { AppError } from '../../utils/AppError';
import { buildPage, skipFor, type Paginated, type PaginationParams } from '../../utils/pagination';
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

  async list(params: PaginationParams): Promise<Paginated<ProductDocument>> {
    const [data, total] = await Promise.all([
      productRepository.findPage(skipFor(params), params.limit),
      productRepository.count(),
    ]);
    return buildPage(data, total, params);
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
