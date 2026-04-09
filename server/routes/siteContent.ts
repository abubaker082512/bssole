import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all site content
router.get('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.json({});
        }
        
        const { data, error } = await supabaseAdmin.from('site_content').select('*');
        
        if (error) {
            console.error('[SITECONTENT] GET error:', error);
            return res.json({});
        }
        
        const mapped = data?.reduce((acc: any, row) => ({ ...acc, [row.section]: row.content }), {}) || {};
        res.json(mapped);
    } catch (e: any) { 
        console.error('[SITECONTENT] GET catch:', e);
        res.json({}); 
    }
});

// GET single section
router.get('/:section', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .select('*')
            .eq('section', req.params.section)
            .single();
        
        if (error) {
            console.error('[SITECONTENT] Section GET error:', error);
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(data);
    } catch (e: any) { 
        console.error('[SITECONTENT] Section GET catch:', e);
        res.status(404).json({ error: 'Not found' }); 
    }
});

// UPDATE site content section
router.put('/:section', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { content } = req.body;
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .update({ content, updated_at: new Date() })
            .eq('section', req.params.section)
            .select()
            .single();
        
        if (error) {
            console.error('[SITECONTENT] Update error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (e: any) { 
        console.error('[SITECONTENT] PUT catch:', e);
        res.status(400).json({ error: e.message }); 
    }
});

export default router;
