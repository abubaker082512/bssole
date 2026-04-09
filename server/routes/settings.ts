import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all settings
router.get('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.json({});
        }
        
        const { data, error } = await supabaseAdmin.from('store_settings').select('*');
        
        if (error) {
            console.error('[SETTINGS] GET error:', error);
            return res.json({});
        }
        
        const mapped = data?.reduce((acc: any, row) => ({ ...acc, [row.key]: row.value }), {}) || {};
        res.json(mapped);
    } catch (e: any) { 
        console.error('[SETTINGS] GET catch:', e);
        res.json({}); 
    }
});

// UPDATE setting
router.put('/:key', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { value } = req.body;
        const { data, error } = await supabaseAdmin
            .from('store_settings')
            .update({ value, updated_at: new Date() })
            .eq('key', req.params.key)
            .select()
            .single();
        
        if (error) {
            console.error('[SETTINGS] Update error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (e: any) { 
        console.error('[SETTINGS] PUT catch:', e);
        res.status(400).json({ error: e.message }); 
    }
});

export default router;
