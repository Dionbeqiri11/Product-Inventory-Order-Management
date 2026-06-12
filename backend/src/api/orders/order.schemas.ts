import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid product id');

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        quantity: z.number().int('quantity must be an integer').positive(),
      }),
    )
    .min(1, 'an order must contain at least one item')
    // Collapse duplicate product lines so reservation logic handles each
    // product exactly once.
    .superRefine((items, ctx) => {
      const ids = new Set<string>();
      for (const item of items) {
        if (ids.has(item.productId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `duplicate product in order: ${item.productId}`,
          });
        }
        ids.add(item.productId);
      }
    }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
