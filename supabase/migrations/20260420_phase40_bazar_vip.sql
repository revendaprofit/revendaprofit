-- FASE 40: BAZAR VIP - Marketplace P2P Híbrido
-- =============================================

-- 1) Extensão de profiles com campos de endereço para logística
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;

-- 2) Tabela bazar_items
CREATE TABLE IF NOT EXISTS public.bazar_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  customer_price decimal(10,2) NOT NULL,
  commission_value decimal(10,2) DEFAULT 0,
  final_price decimal(10,2) GENERATED ALWAYS AS (customer_price + commission_value) STORED,
  weight decimal(6,3),
  height int,
  width int,
  length int,
  images text[] DEFAULT '{}',
  condition text DEFAULT 'used',
  size text,
  color text,
  category text,
  status text DEFAULT 'pending',
  rejection_reason text,
  buyer_name text,
  buyer_phone text,
  sold_at timestamptz,
  seller_paid boolean DEFAULT false,
  seller_paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3) RLS
ALTER TABLE public.bazar_items ENABLE ROW LEVEL SECURITY;

-- Público lê itens aprovados
DROP POLICY IF EXISTS "bazar_items_public_read" ON public.bazar_items;
CREATE POLICY "bazar_items_public_read"
  ON public.bazar_items FOR SELECT
  USING (status = 'approved');

-- Vendedor lê seus próprios itens (qualquer status)
DROP POLICY IF EXISTS "bazar_items_seller_read" ON public.bazar_items;
CREATE POLICY "bazar_items_seller_read"
  ON public.bazar_items FOR SELECT
  USING (auth.uid() = seller_id);

-- Vendedor pode inserir itens (como seller)
DROP POLICY IF EXISTS "bazar_items_seller_insert" ON public.bazar_items;
CREATE POLICY "bazar_items_seller_insert"
  ON public.bazar_items FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Owner tem controle total (SELECT)
DROP POLICY IF EXISTS "bazar_items_owner_read" ON public.bazar_items;
CREATE POLICY "bazar_items_owner_read"
  ON public.bazar_items FOR SELECT
  USING (auth.uid() = owner_id);

-- Owner pode atualizar
DROP POLICY IF EXISTS "bazar_items_owner_update" ON public.bazar_items;
CREATE POLICY "bazar_items_owner_update"
  ON public.bazar_items FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owner pode deletar
DROP POLICY IF EXISTS "bazar_items_owner_delete" ON public.bazar_items;
CREATE POLICY "bazar_items_owner_delete"
  ON public.bazar_items FOR DELETE
  USING (auth.uid() = owner_id);

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
