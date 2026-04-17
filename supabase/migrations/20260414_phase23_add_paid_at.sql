ALTER TABLE public.sale_installments ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
