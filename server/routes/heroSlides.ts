import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all hero slides
router.get('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.json([]);
        }
        
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (error) {
            console.error('[HERO] GET error:', error);
            return res.json([]);
        }
        res.json(data || []);
    } catch (e: any) { 
        console.error('[HERO] GET catch:', e);
        res.json([]); 
    }
});

// CREATE hero slide
router.post('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const slide = req.body;
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .insert([slide])
            .select()
            .single();
        
        if (error) {
            console.error('[HERO] Create error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (e: any) { 
        console.error('[HERO] POST catch:', e);
        res.status(400).json({ error: e.message }); 
    }
});

// UPDATE hero slide
router.put('/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const updates = req.body;
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('[HERO] Update error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (e: any) { 
        console.error('[HERO] PUT catch:', e);
        res.status(400).json({ error: e.message }); 
    }
});

// DELETE hero slide
router.delete('/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('hero_slides')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('[HERO] Delete error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(204).end();
    } catch (e: any) { 
        console.error('[HERO] DELETE catch:', e);
        res.status(400).json({ error: e.message }); 
    }
});

export default router;
