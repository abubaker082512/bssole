import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { OrderPayloadSchema } from '../validation/orderSchema.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../email.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────

async function resolveItems(orderId: string) {
  // Try both column names (price / unit_price) to handle schema variants
  const { data: items, error } = await supabaseAdmin
    .from('order_items')
    .select('id, quantity, price, unit_price, total_price, product_id, product_name')
    .eq('order_id', orderId);

  if (error) {
    console.error('[ORDERS] order_items fetch error:', error.message);
    return [];
  }

  return Promise.all((items || []).map(async (item: any) => {
    // Resolve product name
    let name = item.product_name || '';
    if (!name && item.product_id) {
      const { data: prod } = await supabaseAdmin
        .from('products').select('name').eq('id', item.product_id).single();
      name = prod?.name || 'Product';
    }
    const unitPrice = item.price ?? item.unit_price ?? 0;
    const qty = item.quantity ?? 1;
    return {
      id: item.id,
      product_name: name || 'Product',
      quantity: qty,
      price: unitPrice,
    };
  }));
}

// ── GET all orders ────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, customers(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all((orders || []).map(async (o: any) => {
      const orderItems = await resolveItems(String(o.id));
      return {
        ...o,
        total_amount: o.total || o.total_amount || 0,
        customer_name:
          `${o.customers?.first_name || ''} ${o.customers?.last_name || ''}`.trim() ||
          o.address?.name || 'Guest',
        order_items: orderItems,
      };
    }));

    res.json(enriched);
  } catch (e: any) {
    console.error('[ORDERS] GET / error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET single order ──────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const { data: o, error } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const items = await resolveItems(String(req.params.id));

    const addr = o.address || o.shipping_address;
    const shippingAddress =
      typeof addr === 'string'
        ? addr
        : addr
          ? `${addr?.line1 || addr?.address || ''}, ${addr?.city || ''}, ${addr?.postalCode || addr?.postal_code || ''}`.replace(/^,\s*|,\s*$/g, '')
          : 'N/A';

    const mapped = {
      ...o,
      total_amount: o.total || o.total_amount || 0,
      customer_name:
        `${o.customers?.first_name || ''} ${o.customers?.last_name || ''}`.trim() ||
        (typeof addr === 'object' ? addr?.name : '') || 'Guest',
      customer_email: o.customers?.email || (typeof addr === 'object' ? addr?.email : '') || 'N/A',
      customer_phone: o.customers?.phone || (typeof addr === 'object' ? addr?.phone : '') || 'N/A',
      shipping_address: shippingAddress,
      items,
    };

    res.json(mapped);
  } catch (e: any) {
    console.error('[ORDERS] GET /:id error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── UPDATE order status ───────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ── CREATE new order ──────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const result = OrderPayloadSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const payload = result.data as any;
    const { items, total, address } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Resolve or create customer
    let cid: string | undefined;
    const email = payload.customer_email ?? address?.email ?? '';

    if (email) {
      const { data: existing } = await supabaseAdmin
        .from('customers').select('id').eq('email', email).single();
      if (existing?.id) {
        cid = existing.id;
      } else {
        const { data: newCust } = await supabaseAdmin
          .from('customers')
          .insert([{
            email,
            first_name: address?.name?.split(' ')[0] || '',
            last_name: address?.name?.split(' ').slice(1).join(' ') || '',
            phone: address?.phone || '',
          }])
          .select('id')
          .single();
        if (newCust?.id) cid = newCust.id;
      }
    }

    if (!cid) {
      return res.status(400).json({ error: 'Could not resolve customer' });
    }

    // Create order — handle both schema variants (total / total_amount)
    const orderPayload: any = {
      customer_id: cid,
      status: 'pending',
      address,
      payment_method: 'cod',
      payment_status: 'pending',
    };

    // Try both column names gracefully
    try {
      orderPayload.total = total;
      orderPayload.total_amount = total;
    } catch {}

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) {
      // If total_amount failed (column might not exist), retry with just total
      if (orderError.message.includes('total_amount')) {
        delete orderPayload.total_amount;
        const { data: od2, error: oe2 } = await supabaseAdmin
          .from('orders').insert([orderPayload]).select().single();
        if (oe2) throw oe2;
        Object.assign(orderPayload, od2);
      } else {
        throw orderError;
      }
    }

    const orderId = (orderData ?? orderPayload)?.id;
    if (!orderId) throw new Error('Order ID not returned');

    // Insert each line item — try both price column name variants
    for (const item of items) {
      const { product_id, quantity, price } = item;

      // Fetch product name
      let productName = '';
      try {
        const { data: prod } = await supabaseAdmin
          .from('products').select('name').eq('id', product_id).single();
        productName = prod?.name || '';
      } catch {}

      // Try inserting with `price` first, fall back to unit_price / total_price
      const { error: itemErr } = await supabaseAdmin.from('order_items').insert([{
        order_id: orderId,
        product_id,
        quantity,
        price,
        product_name: productName,
      }]);

      if (itemErr) {
        // Fallback: schema_v2 uses unit_price + total_price instead of price
        await supabaseAdmin.from('order_items').insert([{
          order_id: orderId,
          product_id,
          quantity,
          unit_price: price,
          total_price: price * quantity,
          product_name: productName,
        }]);
      }

      // Deduct stock
      try {
        const { data: prod } = await supabaseAdmin
          .from('products').select('stock_quantity').eq('id', product_id).single();
        if (prod) {
          await supabaseAdmin.from('products')
            .update({ stock_quantity: Math.max(0, (prod.stock_quantity ?? 0) - quantity) })
            .eq('id', product_id);
        }
      } catch {}
    }

    res.json({ orderId, order: orderData });

    // Send confirmation emails
    const customerEmail = address?.email || '';
    if (customerEmail && orderId) {
      const fullOrder = { id: orderId, items, total, shipping_address: address, total_amount: total, payment_method: 'cod', status: 'pending' };
      sendOrderConfirmationEmail(fullOrder, customerEmail).catch(e => console.error('[EMAIL] Customer email failed:', e.message));
      sendAdminOrderNotification(fullOrder, customerEmail).catch(e => console.error('[EMAIL] Admin email failed:', e.message));
    }
  } catch (e: any) {
    console.error('[ORDERS] POST error:', e.message);
    res.status(500).json({ error: e?.message ?? 'Failed to create order' });
  }
});

export default router;
