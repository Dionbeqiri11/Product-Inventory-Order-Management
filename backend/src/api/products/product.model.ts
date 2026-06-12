import { Schema, model, type HydratedDocument } from 'mongoose';

export interface IProduct {
  name: string;
  sku: string;
  description: string;
  priceCents: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '', trim: true },
    // Price stored in minor units (cents) to avoid floating-point rounding.
    priceCents: { type: Number, required: true, min: 0 },
    // Available inventory. Never allowed to go negative (enforced in step 5).
    stock: { type: Number, required: true, min: 0, default: 0 },
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

export type ProductDocument = HydratedDocument<IProduct>;

export const ProductModel = model<IProduct>('Product', productSchema);
