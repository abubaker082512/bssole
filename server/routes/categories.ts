import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// Get all categories (with hierarchy if needed)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select(`*`)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const category = req.body;
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert([category])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get attributes
router.get('/attributes', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('attributes')
            .select(`*, attribute_values(*)`)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
