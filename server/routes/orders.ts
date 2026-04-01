import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

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

export default router;
