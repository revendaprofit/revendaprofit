-- REVANDA PROFIT - FASE 2: GESTÃO DE ESTOQUE

-- Tabela Suppliers (Fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_info text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lojistas podem ver seus fornecedores" ON public.suppliers;
CREATE POLICY "Lojistas podem ver seus fornecedores" ON public.suppliers FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem inserir fornecedores" ON public.suppliers;
CREATE POLICY "Lojistas podem inserir fornecedores" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem atualizar seus fornecedores" ON public.suppliers;
CREATE POLICY "Lojistas podem atualizar seus fornecedores" ON public.suppliers FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem deletar seus fornecedores" ON public.suppliers;
CREATE POLICY "Lojistas podem deletar seus fornecedores" ON public.suppliers FOR DELETE USING (auth.uid() = owner_id);

-- Tabela Categories (Categorias)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lojistas podem ver suas categorias" ON public.categories;
CREATE POLICY "Lojistas podem ver suas categorias" ON public.categories FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem inserir categorias" ON public.categories;
CREATE POLICY "Lojistas podem inserir categorias" ON public.categories FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem atualizar suas categorias" ON public.categories;
CREATE POLICY "Lojistas podem atualizar suas categorias" ON public.categories FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem deletar suas categorias" ON public.categories;
CREATE POLICY "Lojistas podem deletar suas categorias" ON public.categories FOR DELETE USING (auth.uid() = owner_id);

-- Tabela Products (Produtos)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cost_price numeric(10,2) DEFAULT 0,
  sale_price numeric(10,2) DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  marketing_status text DEFAULT 'active',
  total_stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lojistas podem ver seus produtos" ON public.products;
CREATE POLICY "Lojistas podem ver seus produtos" ON public.products FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem inserir produtos" ON public.products;
CREATE POLICY "Lojistas podem inserir produtos" ON public.products FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem atualizar seus produtos" ON public.products;
CREATE POLICY "Lojistas podem atualizar seus produtos" ON public.products FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem deletar seus produtos" ON public.products;
CREATE POLICY "Lojistas podem deletar seus produtos" ON public.products FOR DELETE USING (auth.uid() = owner_id);

-- Tabela Product Variants (Variantes de Produtos)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size text,
  color text,
  sku text,
  stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lojistas podem ver variantes dos seus produtos" ON public.product_variants;
CREATE POLICY "Lojistas podem ver variantes dos seus produtos" ON public.product_variants FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem inserir variantes" ON public.product_variants;
CREATE POLICY "Lojistas podem inserir variantes" ON public.product_variants FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem atualizar variantes" ON public.product_variants;
CREATE POLICY "Lojistas podem atualizar variantes" ON public.product_variants FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem deletar variantes" ON public.product_variants;
CREATE POLICY "Lojistas podem deletar variantes" ON public.product_variants FOR DELETE USING (auth.uid() = owner_id);

-- Trigger: sync_product_stock_from_variants
CREATE OR REPLACE FUNCTION public.sync_product_stock()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.products
    SET total_stock = (SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET total_stock = (SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = OLD.product_id)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_variant_stock_change
  AFTER INSERT OR UPDATE OF stock OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE PROCEDURE public.sync_product_stock();

-- Storage Bucket para Imagens de Produtos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Imagens públicas para visualização" ON storage.objects;
CREATE POLICY "Imagens públicas para visualização" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Usuários autenticados podem subir imagens" ON storage.objects;
CREATE POLICY "Usuários autenticados podem subir imagens" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar imagens" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar imagens" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem deletar imagens" ON storage.objects;
CREATE POLICY "Usuários autenticados podem deletar imagens" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
