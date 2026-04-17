-- Adicionando novos campos personalizados para a loja online
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS page_title text,
ADD COLUMN IF NOT EXISTS favicon_url text,
ADD COLUMN IF NOT EXISTS banner_desktop_url text,
ADD COLUMN IF NOT EXISTS banner_mobile_url text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#f9fafb',
ADD COLUMN IF NOT EXISTS card_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS title_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS announcement_text text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS footer_text text,
ADD COLUMN IF NOT EXISTS product_layout text DEFAULT 'grid';

-- Recarregando schema
NOTIFY pgrst, 'reload schema';
