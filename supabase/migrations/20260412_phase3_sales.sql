-- REVANDA PROFIT - FASE 3: VENDAS E CLIENTES

-- Tabela Customers (Clientes)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  document text, -- CPF ou CNPJ
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojistas podem ver seus clientes" ON public.customers;
CREATE POLICY "Lojistas podem ver seus clientes" ON public.customers FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem inserir clientes" ON public.customers;
CREATE POLICY "Lojistas podem inserir clientes" ON public.customers FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem atualizar seus clientes" ON public.customers;
CREATE POLICY "Lojistas podem atualizar seus clientes" ON public.customers FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem deletar seus clientes" ON public.customers;
CREATE POLICY "Lojistas podem deletar seus clientes" ON public.customers FOR DELETE USING (auth.uid() = owner_id);

-- Tabela Sales (Vendas)
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount numeric(10,2) DEFAULT 0 NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  payment_method text NOT NULL, -- pix, credit_card, debit_card, cash, etc
  status text DEFAULT 'completed' NOT NULL, -- completed, cancelled
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojistas podem ver suas vendas" ON public.sales;
CREATE POLICY "Lojistas podem ver suas vendas" ON public.sales FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem inserir vendas" ON public.sales;
CREATE POLICY "Lojistas podem inserir vendas" ON public.sales FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem atualizar suas vendas" ON public.sales;
CREATE POLICY "Lojistas podem atualizar suas vendas" ON public.sales FOR UPDATE USING (auth.uid() = owner_id);

-- Tabela Sale Items (Itens da Venda)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojistas podem ver itens de suas vendas" ON public.sale_items;
CREATE POLICY "Lojistas podem ver itens de suas vendas" ON public.sale_items FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Lojistas podem inserir itens de vendas" ON public.sale_items;
CREATE POLICY "Lojistas podem inserir itens de vendas" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Automação: Baixa de Estoque Automática ao Vender
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS trigger AS $$
BEGIN
  -- Sempre abater do estoque específico da Variante se a venda indicar variação
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_sale_item_insert ON public.sale_items;
CREATE TRIGGER on_sale_item_insert
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE PROCEDURE public.deduct_stock_on_sale();

-- Automação: Retorno de Estoque caso a Venda seja Cancelada
CREATE OR REPLACE FUNCTION public.return_stock_on_cancel()
RETURNS trigger AS $$
DECLARE
  item_row record;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    FOR item_row IN SELECT * FROM public.sale_items WHERE sale_id = NEW.id LOOP
      IF item_row.variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + item_row.quantity
        WHERE id = item_row.variant_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_sale_cancelled ON public.sales;
CREATE TRIGGER on_sale_cancelled
  AFTER UPDATE OF status ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.return_stock_on_cancel();
