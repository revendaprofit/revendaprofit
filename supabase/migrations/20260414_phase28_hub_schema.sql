-- =====================================================
-- REVENDA PROFIT — FASE 28: HUB DE FORNECEDORES (DROPSHIPPING)
-- =====================================================

-- 1. hub_products — Catalogo do Fornecedor
CREATE TABLE IF NOT EXISTS public.hub_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  category text,
  brand text,
  sku text,
  wholesale_price numeric(10,2) NOT NULL,
  suggested_retail_price numeric(10,2),
  min_retail_price numeric(10,2),
  min_order_qty integer DEFAULT 1,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hub_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub products visiveis para autenticados" ON public.hub_products;
CREATE POLICY "Hub products visiveis para autenticados"
  ON public.hub_products FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Fornecedor insere seus produtos" ON public.hub_products;
CREATE POLICY "Fornecedor insere seus produtos"
  ON public.hub_products FOR INSERT
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Fornecedor atualiza seus produtos" ON public.hub_products;
CREATE POLICY "Fornecedor atualiza seus produtos"
  ON public.hub_products FOR UPDATE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Fornecedor deleta seus produtos" ON public.hub_products;
CREATE POLICY "Fornecedor deleta seus produtos"
  ON public.hub_products FOR DELETE
  USING (auth.uid() = supplier_id);


-- 2. hub_product_variants — Variantes (ESTOQUE REAL)
CREATE TABLE IF NOT EXISTS public.hub_product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hub_product_id uuid NOT NULL REFERENCES public.hub_products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size text,
  color text,
  sku text,
  stock integer DEFAULT 0,
  wholesale_price_override numeric(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hub_product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub variants visiveis para autenticados" ON public.hub_product_variants;
CREATE POLICY "Hub variants visiveis para autenticados"
  ON public.hub_product_variants FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Fornecedor insere variantes" ON public.hub_product_variants;
CREATE POLICY "Fornecedor insere variantes"
  ON public.hub_product_variants FOR INSERT
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Fornecedor atualiza variantes" ON public.hub_product_variants;
CREATE POLICY "Fornecedor atualiza variantes"
  ON public.hub_product_variants FOR UPDATE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Fornecedor deleta variantes" ON public.hub_product_variants;
CREATE POLICY "Fornecedor deleta variantes"
  ON public.hub_product_variants FOR DELETE
  USING (auth.uid() = supplier_id);


-- 3. hub_trade_rules — Regras Comerciais + Endereco Remetente
CREATE TABLE IF NOT EXISTS public.hub_trade_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_margin_pct numeric(5,2) DEFAULT 30,
  min_margin_pct numeric(5,2) DEFAULT 10,
  delivery_days integer DEFAULT 7,
  payment_terms text DEFAULT 'a_vista',
  shipping_policy text DEFAULT 'supplier',
  sender_name text,
  sender_address text,
  sender_city text,
  sender_state text,
  sender_zip text,
  sender_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id)
);

ALTER TABLE public.hub_trade_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Regras visiveis para autenticados" ON public.hub_trade_rules;
CREATE POLICY "Regras visiveis para autenticados"
  ON public.hub_trade_rules FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Fornecedor insere regras" ON public.hub_trade_rules;
CREATE POLICY "Fornecedor insere regras"
  ON public.hub_trade_rules FOR INSERT
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Fornecedor atualiza regras" ON public.hub_trade_rules;
CREATE POLICY "Fornecedor atualiza regras"
  ON public.hub_trade_rules FOR UPDATE
  USING (auth.uid() = supplier_id);


-- 4. hub_imports — Produtos importados pelo Lojista
CREATE TABLE IF NOT EXISTS public.hub_imports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_product_id uuid NOT NULL REFERENCES public.hub_products(id),
  supplier_id uuid NOT NULL REFERENCES auth.users(id),
  retail_price numeric(10,2),
  imported_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(tenant_id, hub_product_id)
);

ALTER TABLE public.hub_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojista ve seus imports" ON public.hub_imports;
CREATE POLICY "Lojista ve seus imports"
  ON public.hub_imports FOR SELECT
  USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Lojista insere imports" ON public.hub_imports;
CREATE POLICY "Lojista insere imports"
  ON public.hub_imports FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Lojista atualiza imports" ON public.hub_imports;
CREATE POLICY "Lojista atualiza imports"
  ON public.hub_imports FOR UPDATE
  USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Lojista deleta imports" ON public.hub_imports;
CREATE POLICY "Lojista deleta imports"
  ON public.hub_imports FOR DELETE
  USING (auth.uid() = tenant_id);


-- 5. hub_fulfillment_orders — Pedidos de Envio (Dropshipping)
CREATE TABLE IF NOT EXISTS public.hub_fulfillment_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES auth.users(id),
  supplier_id uuid NOT NULL REFERENCES auth.users(id),
  hub_product_id uuid NOT NULL REFERENCES public.hub_products(id),
  hub_variant_id uuid REFERENCES public.hub_product_variants(id),
  quantity integer NOT NULL DEFAULT 1,
  wholesale_unit_price numeric(10,2) NOT NULL,
  total_wholesale numeric(10,2) NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text NOT NULL,
  customer_city text NOT NULL,
  customer_state text NOT NULL,
  customer_zip text NOT NULL,
  customer_complement text,
  status text DEFAULT 'pending',
  tracking_code text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  tenant_notes text,
  supplier_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hub_fulfillment_orders ENABLE ROW LEVEL SECURITY;

-- Lojista e Fornecedor podem VER seus pedidos
DROP POLICY IF EXISTS "Partes do pedido podem ver" ON public.hub_fulfillment_orders;
CREATE POLICY "Partes do pedido podem ver"
  ON public.hub_fulfillment_orders FOR SELECT
  USING (auth.uid() = tenant_id OR auth.uid() = supplier_id);

-- Apenas Lojista cria pedido
DROP POLICY IF EXISTS "Lojista cria pedido" ON public.hub_fulfillment_orders;
CREATE POLICY "Lojista cria pedido"
  ON public.hub_fulfillment_orders FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Ambos podem atualizar (lojista: notas; fornecedor: status/tracking)
DROP POLICY IF EXISTS "Partes podem atualizar pedido" ON public.hub_fulfillment_orders;
CREATE POLICY "Partes podem atualizar pedido"
  ON public.hub_fulfillment_orders FOR UPDATE
  USING (auth.uid() = tenant_id OR auth.uid() = supplier_id);


-- =====================================================
-- TRIGGERS DE ESTOQUE
-- =====================================================

-- Debita estoque ao criar pedido de fulfillment
CREATE OR REPLACE FUNCTION public.debit_hub_stock()
RETURNS trigger AS $$
BEGIN
  IF NEW.hub_variant_id IS NOT NULL THEN
    UPDATE public.hub_product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.hub_variant_id
    AND stock >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente no fornecedor para esta variante';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fulfillment_created ON public.hub_fulfillment_orders;
CREATE TRIGGER on_fulfillment_created
  BEFORE INSERT ON public.hub_fulfillment_orders
  FOR EACH ROW EXECUTE FUNCTION public.debit_hub_stock();

-- Restaura estoque ao cancelar pedido
CREATE OR REPLACE FUNCTION public.restore_hub_stock()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    IF OLD.hub_variant_id IS NOT NULL THEN
      UPDATE public.hub_product_variants
      SET stock = stock + OLD.quantity
      WHERE id = OLD.hub_variant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fulfillment_cancelled ON public.hub_fulfillment_orders;
CREATE TRIGGER on_fulfillment_cancelled
  BEFORE UPDATE OF status ON public.hub_fulfillment_orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_hub_stock();
