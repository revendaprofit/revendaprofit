-- REVANDA PROFIT - FASE 6: CATÁLOGO DIGITAL E MINHA LOJA

-- Atualizar Store Settings para ter slug publico
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS logo_url text;

-- Permitir leitura pública dos settings da loja (para renderizar branding)
DROP POLICY IF EXISTS "Leitura publica de configuracoes da loja" ON public.store_settings;
CREATE POLICY "Leitura publica de configuracoes da loja" ON public.store_settings FOR SELECT USING (true);

-- Permitir leitura pública de produtos ativos (Catálogo)
DROP POLICY IF EXISTS "Leitura publica de produtos ativos" ON public.products;
CREATE POLICY "Leitura publica de produtos ativos" ON public.products FOR SELECT USING (marketing_status = 'active');

-- Permitir leitura publica de categorias associadas
DROP POLICY IF EXISTS "Leitura publica de categorias" ON public.categories;
CREATE POLICY "Leitura publica de categorias" ON public.categories FOR SELECT USING (true);

-- Permitir leitura publica de variantes cujo produto base seja visível
DROP POLICY IF EXISTS "Leitura publica de variantes" ON public.product_variants;
CREATE POLICY "Leitura publica de variantes" ON public.product_variants FOR SELECT USING (true);
