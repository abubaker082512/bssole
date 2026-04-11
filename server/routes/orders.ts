import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { OrderPayloadSchema } from '../validation/orderSchema.js';

const router = Router();

// Validation is now performed with Zod schema (OrderPayloadSchema)

// GET all orders
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`*, customers(first_name, last_name, email)`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET single order with items
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`*, customers(*), order_items(*, products(name), product_variants(sku))`)
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// UPDATE order status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabaseAdmin.from('orders').update({ status }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// CREATE new order
router.post('/', async (req, res) => {
  try {
    const result = OrderPayloadSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const payload = result.data as any;
    const { customer_id, customer_email, items, total, address } = payload;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    // Resolve customer_id: prefer provided, otherwise create/find by email
    let cid: number | undefined = payload.customer_id;
    if (!cid) {
      const email = payload.customer_email ?? (payload.address?.email ?? '');
      if (email) {
        const { data: existing, error: existErr } = await supabaseAdmin.from('customers').select('id').eq('email', email).single();
        if (!existErr && (existing as any)?.id) {
          cid = (existing as any).id;
        } else {
          const { data: newCust, error: createErr } = await supabaseAdmin.from('customers').insert([{ email }]).select('id').single();
          if (!createErr && (newCust as any)?.id) cid = (newCust as any).id;
        }
      }
    }
    if (!cid) {
      return res.status(400).json({ error: 'Missing customer_id or customer_email' });
    }
    // Create the order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{ 
        customer_id: cid, 
        total, 
        status: 'pending', 
        address, 
        payment_method: 'cod',
        payment_status: 'pending'
      }])
      .select()
      .single();
    if (orderError) throw orderError;
    const orderId = (orderData as any).id;

    // Attach items to the order
    for (const item of items) {
      const { product_id, quantity, price } = item;
      await supabaseAdmin.from('order_items').insert([{
        order_id: orderId,
        product_id,
        quantity,
        price,
      }]);
    }

    res.json({ orderId, order: orderData });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'Failed to create order' });
  }
});

export default router;
