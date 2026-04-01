import { z } from 'zod';

// Product creation schema (for POST /api/products)
export const ProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  image: z.string().optional(),
  category: z.string(),
  featured: z.number().optional().default(0),
  stock: z.number().optional().default(0),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
});

export type ProductPayload = z.infer<typeof ProductSchema>;
