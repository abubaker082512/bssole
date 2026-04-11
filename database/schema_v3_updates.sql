-- ==============================================
-- BSSOLE MASTER SCHEMA HARMONIZATION (Step 3)
-- This script aligns the live DB with the current API and standardizes all tables.
-- Run this in your Supabase SQL Editor.
-- ==============================================

-- 1. Ensure 'featured' exists in products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- 2. Ensure delivery_charges table exists
CREATE TABLE IF NOT EXISTS public.delivery_charges (
    id SERIAL PRIMARY KEY,
    min_order NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_order NUMERIC(10, 2),
    charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure customers table exists
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Clean up / Enhance Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES public.customers(id),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing target columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES public.customers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

-- RELAX CONSTRAINTS on legacy columns to prevent crashes
-- This makes them optional so the new API code (which doesn't use them) can still save orders.
ALTER TABLE public.orders ALTER COLUMN total_amount DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN shipping_address DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN billing_address DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN payment_method DROP NOT NULL;

-- 5. Ensure order_items exists fully
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;

-- 6. Storage Bucket & Policies (Consolidated)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON storage.objects;
CREATE POLICY "Public profiles are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can upload an image" ON storage.objects;
CREATE POLICY "Anyone can upload an image" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can update an image" ON storage.objects;
CREATE POLICY "Anyone can update an image" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can delete an image" ON storage.objects;
CREATE POLICY "Anyone can delete an image" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
