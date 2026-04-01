// Validation tests for ProductSchema using Zod
import { ProductSchema } from '../../server/validation/productSchema.js';

async function run() {
  const validPayload = { name: 'Test Sneaker', price: 99.99, category: 'Footwear' };
  const res1 = ProductSchema.safeParse(validPayload as any);
  console.log('Product valid payload passes:', res1.success);

  const invalidPayload = { price: '99.99', category: 123 };
  const res2 = ProductSchema.safeParse(invalidPayload as any);
  console.log('Product invalid payload passes:', res2.success);
  if (!res2.success) {
    console.log('Product validation errors:', (res2 as any).error.flatten?.());
  }
}

run();
