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
                product_variants(
                    id, sku, price, sale_price, stock_quantity, image_url,
                    variant_attribute_values(
                        attribute_value_id,
                        attribute_values(id, value, attributes(id, name))
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PRODUCTS] GET error:', error);
            return res.json([]);
        }
        
        // Process variants to extract colors and sizes from attributes
        const processed = (data || []).map((p: any) => {
            const variants = p.product_variants || [];
            const colors = new Set<string>();
            const sizes = new Set<string>();
            const variantImages: { [key: string]: string[] } = {};
            
            const productImgs = p.product_images?.map((img: any) => img.image_url) || [];
            
            // First, collect all unique colors from variants
            variants.forEach((v: any) => {
                const attrValues = v.variant_attribute_values || [];
                attrValues.forEach((av: any) => {
                    if (av.attribute_values) {
                        const attrName = (av.attribute_values.attributes?.name || '').toLowerCase();
                        const attrValue = av.attribute_values.value || '';
                        
                        if (attrName.includes('color') || attrName.includes('colour')) {
                            colors.add(attrValue);
                        } else if (attrName.includes('size')) {
                            sizes.add(attrValue);
                        }
                    }
                });
            });
            
            // Now process variants and group images by color
            variants.forEach((v: any) => {
                const attrValues = v.variant_attribute_values || [];
                let colorKey = 'Default';
                
                attrValues.forEach((av: any) => {
                    if (av.attribute_values) {
                        const attrName = (av.attribute_values.attributes?.name || '').toLowerCase();
                        const attrValue = av.attribute_values.value || '';
                        
                        if (attrName.includes('color') || attrName.includes('colour')) {
                            colorKey = attrValue;
                        }
                    }
                });
                
                // Group variant images by color
                if (v.image_url) {
                    if (!variantImages[colorKey]) {
                        variantImages[colorKey] = [];
                    }
                    if (!variantImages[colorKey].includes(v.image_url)) {
                        variantImages[colorKey].unshift(v.image_url);
                    }
                }
            });
            
            // Now add product images to ALL colors (as fallback images)
            const colorList = Array.from(colors);
            if (colorList.length > 0 && productImgs.length > 0) {
                colorList.forEach(color => {
                    if (!variantImages[color]) {
                        variantImages[color] = [];
                    }
                    // Add product images after any variant images for this color
                    productImgs.forEach((img: string) => {
                        if (!variantImages[color].includes(img)) {
                            variantImages[color].push(img);
                        }
                    });
                });
            } else if (productImgs.length > 0) {
                // No colors from variants, just add to Default
                variantImages['Default'] = productImgs;
            }
            
            return {
                ...p,
                colors: colorList.length > 0 ? colorList : [],
                sizes: sizes.size > 0 ? Array.from(sizes).sort((a, b) => {
                    const aNum = parseFloat(a);
                    const bNum = parseFloat(b);
                    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                    return a.localeCompare(b);
                }) : [],
                variantImages
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
