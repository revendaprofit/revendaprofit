-- ============================================================
-- Per-variant pricing: allows each variant to have its own sale price
-- If set, this price overrides the product-level sale_price
-- Used for the "Oportunidades" (Deals) section on the storefront
-- ============================================================

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.product_variants.sale_price IS 
  'Optional per-variant sale price. If set, overrides the parent product sale_price for this specific variant.';
