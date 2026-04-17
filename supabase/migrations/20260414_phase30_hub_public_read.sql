-- Permitir leitura publica de hub_imports para que a vitrine funcione
-- A vitrine precisa saber quais produtos um lojista importou
DROP POLICY IF EXISTS "Vitrine publica pode ver imports" ON public.hub_imports;
CREATE POLICY "Vitrine publica pode ver imports"
  ON public.hub_imports FOR SELECT
  USING (true);

-- Garantir que hub_products e hub_product_variants tambem sao legiveis publicamente
DROP POLICY IF EXISTS "Hub products visiveis publicamente" ON public.hub_products;
CREATE POLICY "Hub products visiveis publicamente"
  ON public.hub_products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hub variants visiveis publicamente" ON public.hub_product_variants;
CREATE POLICY "Hub variants visiveis publicamente"
  ON public.hub_product_variants FOR SELECT
  USING (true);
