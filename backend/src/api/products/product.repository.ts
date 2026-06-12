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

  findPage(skip: number, limit: number): Promise<ProductDocument[]> {
    return ProductModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  },

  count(): Promise<number> {
    return ProductModel.countDocuments().exec();
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

  /**
   * Atomically decrement stock iff at least `quantity` is available. The
   * `stock: { $gte: quantity }` guard and `$inc` happen as a single atomic
   * document update in MongoDB, so concurrent reservations can never drive
   * stock negative (no overselling). Returns the updated product, or null when
   * the product does not exist or has insufficient stock.
   */
  reserveStock(id: string, quantity: number): Promise<ProductDocument | null> {
    return ProductModel.findOneAndUpdate(
      { _id: id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    ).exec();
  },

  /** Compensating action: return previously reserved stock to a product. */
  releaseStock(id: string, quantity: number): Promise<ProductDocument | null> {
    return ProductModel.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true }).exec();
  },
};
