import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
    console.log('[CATEGORIES] GET / called');
    try {
        if (!supabaseAdmin) {
            console.log('[CATEGORIES] Not initialized, returning empty');
            return res.json([]);
        }
        
        console.log('[CATEGORIES] Calling Supabase...');
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select(`*`)
            .order('name', { ascending: true });

        if (error) {
            console.log('[CATEGORIES] Supabase error:', error.message);
            return res.json([]);
        }
        
        console.log('[CATEGORIES] Success, count:', data?.length || 0);
        res.json(data || []);
    } catch (err: any) {
        console.log('[CATEGORIES] Exception:', err?.message || err);
        res.json([]);
    }
});

// Create category
router.post('/', async (req, res) => {
    console.log('[CATEGORIES] POST / called');
    try {
        if (!supabaseAdmin) {
            console.log('[CATEGORIES] Not initialized');
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const category = req.body;
        console.log('[CATEGORIES] Payload:', category);
        
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert([category])
            .select()
            .single();

        if (error) {
            console.log('[CATEGORIES] Insert error:', error.message);
            return res.status(400).json({ error: error.message });
        }
        
        console.log('[CATEGORIES] Created:', data);
        res.status(201).json(data);
    } catch (err: any) {
        console.log('[CATEGORIES] POST Exception:', err?.message || err);
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    console.log('[CATEGORIES] PUT /:id called');
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const updates = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.log('[CATEGORIES] Update error:', error.message);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (err: any) {
        console.log('[CATEGORIES] PUT Exception:', err?.message || err);
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    console.log('[CATEGORIES] DELETE /:id called');
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        
        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('[CATEGORIES] Delete error:', error.message);
            return res.status(400).json({ error: error.message });
        }
        res.status(204).end();
    } catch (err: any) {
        console.log('[CATEGORIES] DELETE Exception:', err?.message || err);
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// Get attributes
router.get('/attributes', async (req, res) => {
    console.log('[ATTRIBUTES] GET /attributes called');
    try {
        if (!supabaseAdmin) {
            return res.json([]);
        }
        
        const { data, error } = await supabaseAdmin
            .from('attributes')
            .select(`*, attribute_values(*)`)
            .order('name', { ascending: true });

        if (error) {
            console.log('[ATTRIBUTES] Error:', error.message);
            return res.json([]);
        }
        res.json(data || []);
    } catch (err: any) {
        console.log('[ATTRIBUTES] Exception:', err?.message || err);
        res.json([]);
    }
});

export default router;
