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
