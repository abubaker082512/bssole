import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all site content
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('site_content').select('*');
        if (error) throw error;
        const mapped = data.reduce((acc: any, row) => ({ ...acc, [row.section]: row.content }), {});
        res.json(mapped);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET single section
router.get('/:section', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .select('*')
            .eq('section', req.params.section)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// UPDATE site content section
router.put('/:section', async (req, res) => {
    try {
        const { content } = req.body;
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .update({ content, updated_at: new Date() })
            .eq('section', req.params.section)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
