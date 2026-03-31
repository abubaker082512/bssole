import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// Get variants for a given product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { data, error } = await supabaseAdmin
            .from('product_variants')
            .select(`*, variant_attribute_values(attribute_value_id, attribute_values!inner(*, attributes(name)))`)
            .eq('product_id', productId);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create variants
router.post('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { variants } = req.body; // Array of { sku, price, stock_quantity, attributes: [value_ids] }

        // Start transaction abstraction (Supabase admin does direct inserts)
        for (const variant of variants) {
            const { attributes, ...variantData } = variant;
            
            // 1. Insert variant
            const { data: insertedVariant, error: variantError } = await supabaseAdmin
                .from('product_variants')
                .insert([{ product_id: productId, ...variantData }])
                .select()
                .single();

            if (variantError) throw variantError;

            // 2. Insert variant attribute linking
            if (attributes && attributes.length > 0) {
                const mappings = attributes.map((attrValueId: number) => ({
                    variant_id: insertedVariant.id,
                    attribute_value_id: attrValueId
                }));
                
                const { error: mapError } = await supabaseAdmin
                    .from('variant_attribute_values')
                    .insert(mappings);

                if (mapError) throw mapError;
            }
        }

        res.status(201).json({ message: 'Variants created successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete variant
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('product_variants')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
