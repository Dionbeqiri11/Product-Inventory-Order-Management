import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { productRepository } from '../products/product.repository';
import { orderRepository } from './order.repository';
import type { CreateOrderInput } from './order.schemas';
import type { IOrderItem, OrderDocument } from './order.model';

interface Reservation {
  productId: string;
  quantity: number;
}

export const orderService = {
  /**
   * Create an order, atomically reserving stock for each line item.
   *
   * Reservation is per-item via an atomic conditional decrement
   * (productRepository.reserveStock). If any line cannot be satisfied, every
   * previously reserved line is compensated (released) so inventory is never
   * left in a partially-decremented state. This keeps the operation effectively
   * all-or-nothing without requiring a multi-document transaction.
   */
  async create(userId: string, input: CreateOrderInput): Promise<OrderDocument> {
    const reserved: Reservation[] = [];
    const items: IOrderItem[] = [];

    try {
      for (const line of input.items) {
        const product = await productRepository.reserveStock(line.productId, line.quantity);

        if (!product) {
          // Reservation failed: clarify whether the product is missing or just
          // out of stock so the client gets an actionable error.
          const exists = await productRepository.findById(line.productId);
          if (!exists) throw AppError.notFound(`Product not found: ${line.productId}`);
          throw AppError.conflict(
            `Insufficient stock for ${exists.sku}: requested ${line.quantity}, available ${exists.stock}`,
          );
        }

        reserved.push({ productId: line.productId, quantity: line.quantity });
        items.push({
          product: product._id as Types.ObjectId,
          sku: product.sku,
          name: product.name,
          quantity: line.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      const totalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
      return await orderRepository.create({
        user: new Types.ObjectId(userId),
        items,
        totalCents,
        status: 'confirmed',
      });
    } catch (err) {
      // Compensation: roll back stock for every line reserved before the failure.
      await Promise.all(reserved.map((r) => productRepository.releaseStock(r.productId, r.quantity)));
      throw err;
    }
  },

  list(userId: string): Promise<OrderDocument[]> {
    return orderRepository.findByUser(userId);
  },

  async getById(userId: string, id: string): Promise<OrderDocument> {
    const order = await orderRepository.findByIdForUser(id, userId);
    if (!order) throw AppError.notFound('Order not found');
    return order;
  },
};
