import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET all attributes and values
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('attributes')
            .select(`*, attribute_values(*)`)
            .order('name', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// CREATE attribute
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const { data, error } = await supabaseAdmin.from('attributes').insert([{ name }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE attribute
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('attributes').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).end();
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// CREATE attribute value (e.g. "Color" -> "Red")
router.post('/values', async (req, res) => {
    try {
        const { attribute_id, value } = req.body;
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { data, error } = await supabaseAdmin.from('attribute_values').insert([{ attribute_id, value, slug }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE attribute value
router.delete('/values/:id', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('attribute_values').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).end();
    } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
