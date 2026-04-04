-- ==============================================
-- BSSOLE SCHEMA V3 (Hero Slides, Site Content, Marquee)
-- ==============================================

-- 1. Hero Slides Table (for carousel on homepage)
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    video_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Site Content Table (editable text across the site)
CREATE TABLE IF NOT EXISTS public.site_content (
    id SERIAL PRIMARY KEY,
    section TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Default site content
INSERT INTO public.site_content (section, content)
VALUES 
    ('marquee', '{"text": "🎉 FREE SHIPPING ON ORDERS ABOVE RS. 10,000! | USE CODE #BSSOLE7 – EXTRA DISCOUNT!"}'),
    ('footer', '{"tagline": "Redefining everyday luxury with handcrafted footwear and accessories.", "copyright": "© 2026 BSSOLE. ALL RIGHTS RESERVED."}'),
    ('contact', '{"email": "bssoleofficial@gmail.com", "whatsapp": "0325 528 1122", "studio": "Gulberg III, Lahore, Pakistan"}')
ON CONFLICT (section) DO NOTHING;

-- Default hero slides
INSERT INTO public.hero_slides (title, subtitle, image_url, cta_text, cta_link, sort_order, is_active)
VALUES 
    ('BEYOND', 'Redefining the essence of men''s footwear. Handcrafted soles designed for those who command presence in every step.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80&fit=crop', 'Explore Shop', 'shop', 1, true),
    ('LUXURY', 'Step into style with our premium collection of handcrafted shoes.', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1920&q=80&fit=crop', 'View Collection', 'shop', 2, true)
ON CONFLICT DO NOTHING;
