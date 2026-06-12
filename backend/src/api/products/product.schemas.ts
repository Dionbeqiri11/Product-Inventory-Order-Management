import { z } from 'zod';

/** Payload for creating a product. */
export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
  sku: z.string().trim().min(1, 'sku is required').max(50),
  description: z.string().trim().max(2000).optional(),
  priceCents: z.number().int('priceCents must be an integer').nonnegative(),
  stock: z.number().int('stock must be an integer').nonnegative().default(0),
});

/** Payload for updating a product: all fields optional, at least one required. */
export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
