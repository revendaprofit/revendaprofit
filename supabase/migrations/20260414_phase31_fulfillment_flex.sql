-- Relaxar constraints de hub_fulfillment_orders para funcionar com o POS
-- Muitos campos de endereco podem ser opcionais no fluxo presencial

ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN order_code SET DEFAULT 'FUL-' || upper(substr(md5(random()::text), 1, 4));
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN customer_address DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN customer_city DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN customer_state DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN customer_zip DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN wholesale_unit_price DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN total_wholesale DROP NOT NULL;
ALTER TABLE public.hub_fulfillment_orders ALTER COLUMN order_code DROP NOT NULL;

-- Gerar order_code automaticamente se não fornecido
CREATE OR REPLACE FUNCTION public.generate_fulfillment_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := 'FUL-' || upper(substr(md5(random()::text), 1, 6));
  END IF;
  
  -- Calcular wholesale se nao fornecido
  IF NEW.wholesale_unit_price IS NULL THEN
    SELECT wholesale_price INTO NEW.wholesale_unit_price
    FROM public.hub_products WHERE id = NEW.hub_product_id;
  END IF;
  
  IF NEW.total_wholesale IS NULL THEN
    NEW.total_wholesale := COALESCE(NEW.wholesale_unit_price, 0) * NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fulfillment_auto_fill ON public.hub_fulfillment_orders;
CREATE TRIGGER on_fulfillment_auto_fill
  BEFORE INSERT ON public.hub_fulfillment_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_fulfillment_code();
