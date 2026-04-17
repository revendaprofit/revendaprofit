-- Adicionando mais colunas de mídia à tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url_2 text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url_3 text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
