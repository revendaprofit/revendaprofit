-- Adicionando novos campos de formulário e dados fiscais de produto para NFe
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS filter_model text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS filter_color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS filter_detail text;

-- Dados Fiscais (NFe)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cest text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ean text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin_code text DEFAULT '0';
