ALTER TABLE public.store_orders
ADD COLUMN IF NOT EXISTS partner_point_id UUID REFERENCES public.partner_points(id) ON DELETE SET NULL;
