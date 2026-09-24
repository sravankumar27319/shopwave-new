import { z } from "zod";

export const getProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional(),
});
