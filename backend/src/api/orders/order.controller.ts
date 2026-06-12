import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { paginationSchema } from '../../utils/pagination';
import { orderService } from './order.service';

/** Pull the authenticated user id from the JWT payload set by authenticate. */
function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.sub;
}

export const orderController = {
  async create(req: Request, res: Response): Promise<void> {
    const order = await orderService.create(userId(req), req.body);
    res.status(201).json(order);
  },

  async list(req: Request, res: Response): Promise<void> {
    const params = paginationSchema.parse(req.query);
    const orders = await orderService.list(userId(req), params);
    res.json(orders);
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const order = await orderService.getById(userId(req), req.params.id);
    res.json(order);
  },
};
