-- ==============================================
-- BSSOLE COMMERCE SCHEMA V3 UPDATES
-- Run this in your Supabase SQL Editor
-- ==============================================

-- 1. Add missing 'featured' column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- 2. Create the missing delivery_charges table
CREATE TABLE IF NOT EXISTS public.delivery_charges (
    id SERIAL PRIMARY KEY,
    min_order NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_order NUMERIC(10, 2),
    charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert default delivery charges to match the frontend UI ("Free delivery above Rs.3,000")
INSERT INTO public.delivery_charges (min_order, max_order, charge, label) 
VALUES
    (0, 3000, 300, 'Standard Delivery'),
    (3000, NULL, 0, 'Free Delivery')
ON CONFLICT (id) DO NOTHING;

-- If you are using Row Level Security (RLS), uncomment the following lines to allow public reads:
-- ALTER TABLE public.delivery_charges ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.delivery_charges FOR SELECT USING (true);


-- 4. Create Storage Bucket and RLS Policies for "product-images"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON storage.objects;
CREATE POLICY "Public profiles are viewable by everyone" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Allow uploads to the product-images bucket (this fixes the "violates row-level security policy" error)
DROP POLICY IF EXISTS "Anyone can upload an image" ON storage.objects;
CREATE POLICY "Anyone can upload an image" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

-- Allow updates
DROP POLICY IF EXISTS "Anyone can update an image" ON storage.objects;
CREATE POLICY "Anyone can update an image" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'product-images');

-- Allow deletes
DROP POLICY IF EXISTS "Anyone can delete an image" ON storage.objects;
CREATE POLICY "Anyone can delete an image" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images');

-- 5. Add missing 'address' column to orders table for Checkout Flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS address JSONB;
