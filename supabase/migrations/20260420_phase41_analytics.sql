-- Analytics and E-commerce Tracking Migration

-- 1. Add fields to store_settings for Pixel and GA4 integration
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS meta_pixel_id text,
ADD COLUMN IF NOT EXISTS ga4_measurement_id text;

-- 2. Create catalog_events table for internal tracking
CREATE TABLE IF NOT EXISTS public.catalog_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('page_view', 'add_to_cart', 'initiate_checkout')),
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    session_id text, -- A simple random string or IP hash to track distinct visitors
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para catalog_events
ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir eventos via API pública anonimamente
CREATE POLICY "Qualquer um pode registrar eventos no catálogo"
    ON public.catalog_events FOR INSERT
    WITH CHECK (true);

-- Apenas o dono pode ler seus eventos
CREATE POLICY "Lojistas podem ler seus próprios eventos"
    ON public.catalog_events FOR SELECT
    USING (auth.uid() = owner_id);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
