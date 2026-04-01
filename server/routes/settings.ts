import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all settings
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('store_settings').select('*');
        if (error) throw error;
        const mapped = data.reduce((acc: any, row) => ({ ...acc, [row.key]: row.value }), {});
        res.json(mapped);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// UPDATE setting
router.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const { data, error } = await supabaseAdmin
            .from('store_settings')
            .update({ value, updated_at: new Date() })
            .eq('key', req.params.key)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
