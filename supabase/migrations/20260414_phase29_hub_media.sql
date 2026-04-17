-- Adiciona colunas de midia extra ao hub_products
ALTER TABLE public.hub_products ADD COLUMN IF NOT EXISTS image_url_2 text;
ALTER TABLE public.hub_products ADD COLUMN IF NOT EXISTS image_url_3 text;
ALTER TABLE public.hub_products ADD COLUMN IF NOT EXISTS video_url text;
