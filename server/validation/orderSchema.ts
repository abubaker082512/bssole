import { z } from 'zod';

// Address sub-schema
export const AddressSchema = z.object({
  line1: z.string(),
  city: z.string(),
  postalCode: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

// Item sub-schema
export const ItemSchema = z.object({
  product_id: z.number().int(),
  quantity: z.number().int().positive(),
  price: z.number(),
});

// Full order payload schema
export const OrderPayloadSchema = z.object({
  customer_id: z.number().optional(),
  customer_email: z.string().email().optional(),
  items: z.array(ItemSchema),
  total: z.number(),
  address: AddressSchema,
});

// TypeScript type inferred from the schema
export type OrderPayload = z.infer<typeof OrderPayloadSchema>;
