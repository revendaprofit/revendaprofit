-- Função auxiliar de trigger de tempo
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela principal da Bolsa Consignada (Malinha)
CREATE TABLE IF NOT EXISTS public.consignment_bags (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    max_days integer DEFAULT 1,
    shipping_cost numeric(10,2) DEFAULT 0,
    status text DEFAULT 'draft' NOT NULL, -- 'draft', 'pending_approval', 'with_customer', 'returned', 'concluded'
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consignment_bags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam suas bolsas" ON public.consignment_bags;
CREATE POLICY "Usuários gerenciam suas bolsas" ON public.consignment_bags
  FOR ALL USING (auth.uid() = owner_id);

-- Para o Public Catalog/Bolsa acessar
DROP POLICY IF EXISTS "Acesso público bolsas enviadas" ON public.consignment_bags;
CREATE POLICY "Acesso público bolsas enviadas" ON public.consignment_bags
  FOR SELECT USING (status != 'draft');

DROP POLICY IF EXISTS "Acesso público atualizar bolsas" ON public.consignment_bags;
CREATE POLICY "Acesso público atualizar bolsas" ON public.consignment_bags
  FOR UPDATE USING (status != 'draft');

-- Tabela de itens da Bolsa
CREATE TABLE IF NOT EXISTS public.consignment_bag_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    bag_id uuid NOT NULL REFERENCES public.consignment_bags(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity integer DEFAULT 1 NOT NULL,
    customer_decision text DEFAULT 'pending', -- 'pending', 'kept', 'returned', 'wrong_size'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consignment_bag_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam itens de suas bolsas" ON public.consignment_bag_items;
CREATE POLICY "Usuários gerenciam itens de suas bolsas" ON public.consignment_bag_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.consignment_bags b WHERE b.id = bag_id AND b.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Acesso público itens da bolsa" ON public.consignment_bag_items;
CREATE POLICY "Acesso público itens da bolsa" ON public.consignment_bag_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.consignment_bags b WHERE b.id = bag_id AND b.status != 'draft')
  );

DROP POLICY IF EXISTS "Acesso público atualizar itens da bolsa" ON public.consignment_bag_items;
CREATE POLICY "Acesso público atualizar itens da bolsa" ON public.consignment_bag_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.consignment_bags b WHERE b.id = bag_id AND b.status != 'draft')
  );

-- Atualizar trigger updated_at
CREATE TRIGGER update_consignment_bags_modtime
    BEFORE UPDATE ON public.consignment_bags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
