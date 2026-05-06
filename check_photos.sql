-- Comparar produtos entre as duas Tessas e identificar quais precisam de fotos
-- tessaforwod@gmail.com = f5ac26be-0a90-4cb0-b05f-18f7381132ed (Tessa For Wod)
-- tessaforwodbsb@gmail.com = 79ffdb94-5af5-4b2d-a9cd-6753bcda05dd (Tessa BSB)

WITH user1_products AS (
  SELECT id, name, image_url, image_url_2, image_url_3, video_url,
    CASE WHEN image_url IS NOT NULL AND image_url != '-' AND LENGTH(image_url) > 5 THEN true ELSE false END AS has_img1,
    CASE WHEN image_url_2 IS NOT NULL AND image_url_2 != '-' AND LENGTH(image_url_2) > 5 THEN true ELSE false END AS has_img2,
    CASE WHEN image_url_3 IS NOT NULL AND image_url_3 != '-' AND LENGTH(image_url_3) > 5 THEN true ELSE false END AS has_img3,
    CASE WHEN image_url LIKE '%supabase.co/storage%' THEN true ELSE false END AS img1_supabase
  FROM products 
  WHERE owner_id = 'f5ac26be-0a90-4cb0-b05f-18f7381132ed'
),
user2_products AS (
  SELECT id, name, image_url, image_url_2, image_url_3, video_url,
    CASE WHEN image_url IS NOT NULL AND image_url != '-' AND LENGTH(image_url) > 5 THEN true ELSE false END AS has_img1,
    CASE WHEN image_url_2 IS NOT NULL AND image_url_2 != '-' AND LENGTH(image_url_2) > 5 THEN true ELSE false END AS has_img2,
    CASE WHEN image_url_3 IS NOT NULL AND image_url_3 != '-' AND LENGTH(image_url_3) > 5 THEN true ELSE false END AS has_img3,
    CASE WHEN image_url LIKE '%supabase.co/storage%' THEN true ELSE false END AS img1_supabase
  FROM products 
  WHERE owner_id = '79ffdb94-5af5-4b2d-a9cd-6753bcda05dd'
)
SELECT 
  u1.name AS product_name,
  u1.id AS tessa_wod_id,
  u2.id AS tessa_bsb_id,
  u1.has_img1 AS wod_img1,
  u2.has_img1 AS bsb_img1,
  u1.has_img2 AS wod_img2,
  u2.has_img2 AS bsb_img2,
  u1.has_img3 AS wod_img3,
  u2.has_img3 AS bsb_img3,
  u1.img1_supabase AS wod_supabase,
  u2.img1_supabase AS bsb_supabase,
  LEFT(u1.image_url, 80) AS wod_url,
  LEFT(u2.image_url, 80) AS bsb_url,
  CASE 
    WHEN u1.has_img1 AND NOT u2.has_img1 THEN 'COPIAR WOD->BSB'
    WHEN NOT u1.has_img1 AND u2.has_img1 THEN 'COPIAR BSB->WOD'
    WHEN u1.has_img1 AND u2.has_img1 AND u1.img1_supabase AND NOT u2.img1_supabase THEN 'UPGRADE WOD->BSB'
    WHEN u1.has_img1 AND u2.has_img1 AND NOT u1.img1_supabase AND u2.img1_supabase THEN 'UPGRADE BSB->WOD'
    WHEN NOT u1.has_img1 AND NOT u2.has_img1 THEN 'AMBAS SEM FOTO'
    ELSE 'OK'
  END AS acao
FROM user1_products u1
JOIN user2_products u2 ON LOWER(TRIM(u1.name)) = LOWER(TRIM(u2.name))
ORDER BY acao DESC, u1.name;
