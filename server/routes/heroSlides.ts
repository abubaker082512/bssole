import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all hero slides
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// CREATE hero slide
router.post('/', async (req, res) => {
    try {
        const slide = req.body;
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .insert([slide])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// UPDATE hero slide
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { data, error } = await supabaseAdmin
            .from('hero_slides')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE hero slide
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('hero_slides')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.status(204).end();
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
