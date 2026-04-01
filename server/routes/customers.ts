import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all customers
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
