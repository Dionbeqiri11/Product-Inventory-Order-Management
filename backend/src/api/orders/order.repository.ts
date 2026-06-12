import { OrderModel, type IOrder, type OrderDocument } from './order.model';

export const orderRepository = {
  create(data: Omit<IOrder, 'createdAt' | 'updatedAt'>): Promise<OrderDocument> {
    return OrderModel.create(data);
  },

  findPageByUser(userId: string, skip: number, limit: number): Promise<OrderDocument[]> {
    return OrderModel.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  },

  countByUser(userId: string): Promise<number> {
    return OrderModel.countDocuments({ user: userId }).exec();
  },

  findByIdForUser(id: string, userId: string): Promise<OrderDocument | null> {
    return OrderModel.findOne({ _id: id, user: userId }).exec();
  },
};
