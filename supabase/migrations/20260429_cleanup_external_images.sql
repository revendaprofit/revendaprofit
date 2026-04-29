-- Cleanup external images that failed to download
UPDATE products
SET image_url = NULL
WHERE image_url IS NOT NULL AND image_url NOT LIKE '%supabase.co%';

UPDATE products
SET image_url_2 = NULL
WHERE image_url_2 IS NOT NULL AND image_url_2 NOT LIKE '%supabase.co%';

UPDATE products
SET image_url_3 = NULL
WHERE image_url_3 IS NOT NULL AND image_url_3 NOT LIKE '%supabase.co%';

UPDATE products
SET video_url = NULL
WHERE video_url IS NOT NULL AND video_url NOT LIKE '%supabase.co%';
