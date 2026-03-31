import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                categories(name),
                brands(name),
                product_images(image_url),
                product_variants(id, sku, price, stock_quantity)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const product = req.body;
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Add image to product gallery
router.post('/:id/images', async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, sort_order } = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('product_images')
            .insert([{ product_id: id, image_url, sort_order }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete image from product gallery
router.delete('/:id/images/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;
        const { error } = await supabaseAdmin
            .from('product_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;
        res.status(204).end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
