-- ============================================================
-- Image Cache: shared image storage across all tenants
-- When any user downloads an external image, it gets cached here.
-- Future users importing the same product get the cached version instantly.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.image_cache (
  source_url  TEXT PRIMARY KEY,            -- original external URL (the key)
  stored_url  TEXT NOT NULL,               -- final Supabase Storage public URL
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Allow all authenticated users to read/write the cache
ALTER TABLE public.image_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read image cache"
  ON public.image_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert into image cache"
  ON public.image_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_image_cache_source ON public.image_cache (source_url);

-- Also allow the service role / anon key used by the Vercel API route
CREATE POLICY "Anon can read image cache"
  ON public.image_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert into image cache"
  ON public.image_cache FOR INSERT
  TO anon
  WITH CHECK (true);
