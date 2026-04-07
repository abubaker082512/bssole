import { z } from 'zod';

// Product creation schema (for POST /api/products)
export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  regular_price: z.number().optional().default(0),
  sale_price: z.number().optional().default(0),
  stock_quantity: z.number().optional().default(0),
  sku: z.string().optional(),
  status: z.string().optional().default('published'),
  type: z.string().optional().default('simple'),
  category_id: z.number().optional(),
  featured: z.number().optional().default(0),
});

export type ProductPayload = z.infer<typeof ProductSchema>;
