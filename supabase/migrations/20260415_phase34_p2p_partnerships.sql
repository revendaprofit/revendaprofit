-- REVANDA PROFIT - FASE 34: PARCERIAS E SOCIEDADES B2B (P2P)

-- 1. Criao da Tabela de Contratos de Parceria (Partnerships)
CREATE TABLE IF NOT EXISTS public.partnerships (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'cancelled')),
  
  -- Regras Financeiras: Rateio do Investimento Inicial (Custos)
  cost_recovery_type text DEFAULT 'owner_100' NOT NULL CHECK (cost_recovery_type IN ('owner_100', 'shared_50_50', 'seller_100', 'custom')),
  cost_recovery_owner_percent numeric(5,2) DEFAULT 100, -- Usado se custom
  
  -- Regras Financeiras: A Parceria / Esforo e Passivo
  profit_split_seller_percent numeric(5,2) DEFAULT 85 NOT NULL,
  profit_split_partner_percent numeric(5,2) DEFAULT 15 NOT NULL,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usurios veem suas parcerias" ON public.partnerships;
CREATE POLICY "Usurios veem suas parcerias" ON public.partnerships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Usurios criam parcerias" ON public.partnerships;
CREATE POLICY "Usurios criam parcerias" ON public.partnerships FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Usurios atualizam suas parcerias" ON public.partnerships;
CREATE POLICY "Usurios atualizam suas parcerias" ON public.partnerships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);


-- 2. Tabela de Estoque Compartilhado na Parceria
CREATE TABLE IF NOT EXISTS public.partnership_shared_products (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partnership_shared_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Visvel aos membros da parceria" ON public.partnership_shared_products;
CREATE POLICY "Visvel aos membros da parceria" ON public.partnership_shared_products FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (
    SELECT 1 FROM public.partnerships p 
    WHERE p.id = partnership_id AND (p.requester_id = auth.uid() OR p.receiver_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Owner pode inserir" ON public.partnership_shared_products;
CREATE POLICY "Owner pode inserir" ON public.partnership_shared_products FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner pode atualizar" ON public.partnership_shared_products;
CREATE POLICY "Owner pode atualizar" ON public.partnership_shared_products FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner pode deletar" ON public.partnership_shared_products;
CREATE POLICY "Owner pode deletar" ON public.partnership_shared_products FOR DELETE USING (auth.uid() = owner_id);


-- 3. Tabela de Solicitacao de Reservas (Pedidos de Parcerias)
CREATE TABLE IF NOT EXISTS public.partnership_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  sale_price numeric(10,2) NOT NULL,
  status text DEFAULT 'pending_confirmation' NOT NULL CHECK (status IN ('pending_confirmation', 'confirmed', 'rejected', 'settled', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partnership_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver minhas solicitacoes e ordens" ON public.partnership_orders;
CREATE POLICY "Ver minhas solicitacoes e ordens" ON public.partnership_orders FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Criar pedidos parceria" ON public.partnership_orders;
CREATE POLICY "Criar pedidos parceria" ON public.partnership_orders FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Atualizar pedidos (aceite d dona)" ON public.partnership_orders;
CREATE POLICY "Atualizar pedidos (aceite d dona)" ON public.partnership_orders FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = owner_id);


-- 4. Acerto de Contas Financeiras Mtuas (Conta Corrente / Ledger)
CREATE TABLE IF NOT EXISTS public.partnership_settlements (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  partnership_order_id uuid NOT NULL REFERENCES public.partnership_orders(id) ON DELETE CASCADE UNIQUE,
  debtor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Quem deve o repasse
  creditor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Quem tem a receber
  amount_owed numeric(10,2) NOT NULL, -- O total da dvida final pra bater a conta
  cost_slice numeric(10,2) DEFAULT 0, -- Detalhamento interno: O pedao correspondente ao custo reembolsado
  profit_slice numeric(10,2) DEFAULT 0, -- Detalhamento interno: O pedao correspondente  sociedade
  status text DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'settled')),
  settled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partnership_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver relatorios meus de acerto" ON public.partnership_settlements;
CREATE POLICY "Ver relatorios meus de acerto" ON public.partnership_settlements FOR SELECT USING (auth.uid() = debtor_id OR auth.uid() = creditor_id);

DROP POLICY IF EXISTS "Logica de sistema insere acertos" ON public.partnership_settlements;
CREATE POLICY "Logica de sistema insere acertos" ON public.partnership_settlements FOR INSERT WITH CHECK (auth.uid() = creditor_id OR auth.uid() = debtor_id);

DROP POLICY IF EXISTS "Parceiras atualizam acertos p/ fechar conta" ON public.partnership_settlements;
CREATE POLICY "Parceiras atualizam acertos p/ fechar conta" ON public.partnership_settlements FOR UPDATE USING (auth.uid() = debtor_id OR auth.uid() = creditor_id);

-- Executar funes da base de dados pra notificaes (Se aplicvel no app num futuro)
