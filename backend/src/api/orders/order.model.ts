import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type OrderStatus = 'confirmed' | 'cancelled';

export interface IOrderItem {
  product: Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalCents: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    // Denormalized snapshot so the order stays accurate even if the product
    // is later renamed, repriced, or deleted.
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    // Indexed: every order list/lookup is scoped by user.
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    totalCents: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        const { _id, ...rest } = ret as Record<string, unknown>;
        return { id: _id, ...rest };
      },
    },
  },
);

export type OrderDocument = HydratedDocument<IOrder>;

export const OrderModel = model<IOrder>('Order', orderSchema);
