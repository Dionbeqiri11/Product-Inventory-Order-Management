import { OrderModel, type IOrder, type OrderDocument } from './order.model';

export const orderRepository = {
  create(data: Omit<IOrder, 'createdAt' | 'updatedAt'>): Promise<OrderDocument> {
    return OrderModel.create(data);
  },

  findByUser(userId: string): Promise<OrderDocument[]> {
    return OrderModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
  },

  findByIdForUser(id: string, userId: string): Promise<OrderDocument | null> {
    return OrderModel.findOne({ _id: id, user: userId }).exec();
  },
};
