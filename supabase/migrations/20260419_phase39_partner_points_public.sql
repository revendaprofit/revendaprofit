-- Allow public read access to active partner points
CREATE POLICY "Public can view active partner points"
ON public.partner_points FOR SELECT
USING (status = 'active');

-- Allow public read access to active partner point stock
CREATE POLICY "Public can view active partner point stock"
ON public.partner_point_stock FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_points
    WHERE partner_points.id = partner_point_stock.partner_point_id
    AND partner_points.status = 'active'
  )
);
