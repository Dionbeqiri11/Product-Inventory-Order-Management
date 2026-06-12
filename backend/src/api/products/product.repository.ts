import { ProductModel, type ProductDocument } from './product.model';
import type { CreateProductInput, UpdateProductInput } from './product.schemas';

/**
 * Data-access layer for products. Isolates Mongoose specifics so the service
 * layer deals only in domain operations and is easy to test/mock.
 */
export const productRepository = {
  create(data: CreateProductInput): Promise<ProductDocument> {
    return ProductModel.create(data);
  },

  findAll(): Promise<ProductDocument[]> {
    return ProductModel.find().sort({ createdAt: -1 }).exec();
  },

  findById(id: string): Promise<ProductDocument | null> {
    return ProductModel.findById(id).exec();
  },

  update(id: string, data: UpdateProductInput): Promise<ProductDocument | null> {
    return ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  },

  delete(id: string): Promise<ProductDocument | null> {
    return ProductModel.findByIdAndDelete(id).exec();
  },
};
