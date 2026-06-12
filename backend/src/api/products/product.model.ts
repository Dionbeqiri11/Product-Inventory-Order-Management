import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const productSchema = new Schema(
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

export type Product = InferSchemaType<typeof productSchema>;
export type ProductDocument = HydratedDocument<Product>;

export const ProductModel = model('Product', productSchema);
