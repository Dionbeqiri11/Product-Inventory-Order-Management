import { z } from 'zod';

/** Query schema for paginated list endpoints (1-based page, capped limit). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Offset for a Mongo query from the validated pagination params. */
export function skipFor(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/** Wrap a page of results with pagination metadata. */
export function buildPage<T>(data: T[], total: number, params: PaginationParams): Paginated<T> {
  return {
    data,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}
