ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost numeric(10,2) DEFAULT 0;
