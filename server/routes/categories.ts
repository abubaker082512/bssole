import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// Get all categories (with hierarchy if needed)
router.get('/', async (req, res) => {
    try {
        console.log('[CATEGORIES] Fetching categories...');
        
        if (!supabaseAdmin) {
            console.error('[CATEGORIES] Supabase client not initialized');
            return res.json([]);
        }
        
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select(`*`)
            .order('name', { ascending: true });

        if (error) {
            console.error('[CATEGORIES] Supabase error:', error);
            // Return empty array instead of error to not break the UI
            return res.json([]);
        }
        console.log('[CATEGORIES] Success, found:', data?.length || 0);
        res.json(data || []);
    } catch (error: any) {
        console.error('[CATEGORIES] GET catch:', error);
        // Return empty array on error
        res.json([]);
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        console.log('[CATEGORIES] Creating category:', req.body);
        
        if (!supabaseAdmin) {
            console.error('[CATEGORIES] Supabase client not initialized');
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const category = req.body;
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert([category])
            .select()
            .single();

        if (error) {
            console.error('[CATEGORIES] Create error:', error);
            return res.status(400).json({ error: error.message });
        }
        console.log('[CATEGORIES] Created:', data);
        res.status(201).json(data);
    } catch (error: any) {
        console.error('[CATEGORIES] POST error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        console.log('[CATEGORIES] Updating category:', id, updates);
        
        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[CATEGORIES] Update error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (error: any) {
        console.error('[CATEGORIES] PUT error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        console.log('[CATEGORIES] Deleting category:', id);
        
        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[CATEGORIES] Delete error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(204).end();
    } catch (error: any) {
        console.error('[CATEGORIES] DELETE error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get attributes
router.get('/attributes', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.json([]);
        }
        
        const { data, error } = await supabaseAdmin
            .from('attributes')
            .select(`*, attribute_values(*)`)
            .order('name', { ascending: true });

        if (error) {
            console.error('[ATTRIBUTES] Error:', error);
            return res.json([]);
        }
        res.json(data);
    } catch (error: any) {
        console.error('[ATTRIBUTES] GET error:', error);
        res.json([]);
    }
});

export default router;
