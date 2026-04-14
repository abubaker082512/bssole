import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { ProductSchema } from '../validation/productSchema.js';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            console.error('[PRODUCTS] Supabase client not initialized');
            return res.json([]);
        }
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                categories(name),
                brands(name),
                product_images(image_url, sort_order),
                product_variants(id, sku, price, stock_quantity, image_url)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PRODUCTS] GET error:', error);
            return res.json([]);
        }
        
        // Process variants to extract colors from image_url (assuming image_url contains color name)
        const processed = (data || []).map((p: any) => {
            const variants = p.product_variants || [];
            const colors = new Set<string>();
            const variantImages: { [key: string]: string[] } = {};
            
            variants.forEach((v: any) => {
                if (v.image_url) {
                    // Try to extract color from image URL or use a default
                    // In practice, you'd have a color field in variants
                    // For now, we'll create color groups based on different images
                    const colorKey = 'Default';
                    if (!variantImages[colorKey]) {
                        variantImages[colorKey] = [];
                    }
                    if (!variantImages[colorKey].includes(v.image_url)) {
                        variantImages[colorKey].push(v.image_url);
                    }
                    colors.add(colorKey);
                }
            });
            
            return {
                ...p,
                variantImages,
                colors: colors.size > 0 ? Array.from(colors) : ['Default']
            };
        });
        
        res.json(processed);
    } catch (error: any) {
        console.error('[PRODUCTS] GET catch:', error);
        res.json([]);
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        console.log('[PRODUCTS] Creating product:', req.body);
        
        const result = ProductSchema.safeParse(req.body);
        if (!result.success) {
            console.error('[PRODUCTS] Validation error:', result.error);
            return res.status(400).json({ error: result.error.flatten() });
        }
        const product = result.data;
        
        if (!product.slug && product.name) {
            product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        
        if (!product.status) {
            product.status = 'published';
        }
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) {
            console.error('[PRODUCTS] Insert error:', error);
            return res.status(400).json({ error: error.message });
        }
        
        res.status(201).json(data);
    } catch (error: any) {
        console.error('[PRODUCTS] POST catch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const updates = req.body;
        
        // Strip out relational data that was joined during GET before saving
        delete updates.brands;
        delete updates.categories;
        delete updates.product_images;
        delete updates.product_variants;
        delete updates.colors;
        delete updates.sizes;
        delete updates.variantImages;
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PRODUCTS] Update error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (error: any) {
        console.error('[PRODUCTS] PUT catch:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[PRODUCTS] Delete error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(204).end();
    } catch (error: any) {
        console.error('[PRODUCTS] DELETE catch:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add image to product gallery
router.post('/:id/images', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { id } = req.params;
        const { image_url, sort_order } = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('product_images')
            .insert([{ product_id: id, image_url, sort_order }])
            .select()
            .single();

        if (error) {
            console.error('[PRODUCTS] Image insert error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (error: any) {
        console.error('[PRODUCTS] Image POST catch:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete image from product gallery
router.delete('/:id/images/:imageId', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const { imageId } = req.params;
        const { error } = await supabaseAdmin
            .from('product_images')
            .delete()
            .eq('id', imageId);

        if (error) {
            console.error('[PRODUCTS] Image delete error:', error);
            return res.status(400).json({ error: error.message });
        }
        res.status(204).end();
    } catch (error: any) {
        console.error('[PRODUCTS] Image DELETE catch:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
