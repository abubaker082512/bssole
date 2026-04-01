// Validation tests for OrderPayloadSchema using Zod
import { OrderPayloadSchema } from '../../server/validation/orderSchema.js';

async function run() {
  const validPayload = {
    customer_id: 1,
    items: [{ product_id: 1, quantity: 2, price: 50 }],
    total: 100,
    address: { line1: '123 Main St', city: 'Lahore', postalCode: '54000' },
  };
  const res1 = OrderPayloadSchema.safeParse(validPayload as any);
  console.log('Order valid payload passes:', res1.success);

  const invalidPayload = { total: 100 };
  const res2 = OrderPayloadSchema.safeParse(invalidPayload as any);
  console.log('Order invalid payload passes:', res2.success);
  if (!res2.success) {
    console.log('Order validation errors:', (res2 as any).error.flatten?.());
  }
}

run();
