-- Add Men Shoes and Women Shoes categories if they don't exist

INSERT INTO categories (name, slug, description) 
VALUES 
    ('Men Shoes', 'men-shoes', 'Premium collection of men footwear'),
    ('Women Shoes', 'women-shoes', 'Elegant collection of women footwear')
ON CONFLICT (slug) DO NOTHING;

-- Verify categories were created
SELECT * FROM categories ORDER BY name;
