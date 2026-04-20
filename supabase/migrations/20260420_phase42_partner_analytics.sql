-- Add partner_point_id to catalog_events
ALTER TABLE public.catalog_events 
ADD COLUMN IF NOT EXISTS partner_point_id uuid REFERENCES public.partner_points(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
