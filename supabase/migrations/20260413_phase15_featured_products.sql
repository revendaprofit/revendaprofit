-- Add featured products column to store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS featured_product_ids uuid[] DEFAULT '{}';
