import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { ProductSchema } from '../validation/productSchema.js';

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

        if (error) {
            console.error('Products GET error:', error);
            throw error;
        }
        res.json(data);
    } catch (error: any) {
        console.error('Products GET catch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create product with input validation (Zod)
router.post('/', async (req, res) => {
    try {
        console.log('Product POST body:', req.body);
        const result = ProductSchema.safeParse(req.body);
        if (!result.success) {
            console.error('Product validation error:', result.error);
            return res.status(400).json({ error: result.error.flatten() });
        }
        const product = result.data;
        
        // Generate slug if not provided
        if (!product.slug && product.name) {
            product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        
        // Ensure status is valid
        if (!product.status) {
            product.status = 'published';
        }
        
        console.log('Product to insert:', product);
        
        // Simple retry on transient DB errors to improve resiliency
        let data: any = null;
        let error: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await supabaseAdmin
            .from('products')
            .insert([product])
            .select()
            .single();
          data = res.data;
          error = (res as any).error;
          if (!error) break;
          // brief delay before retry
          await new Promise(r => setTimeout(r, 200));
        }
        if (error) {
            console.error('Product insert error:', error);
            throw error;
        }
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Product POST catch:', error);
        // Distinguish validation errors vs server errors
        const status = error?.name === 'ZodError' ? 400 : 500;
        res.status(status).json({ error: error?.message ?? 'Failed to save product' });
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
