-- =============================================
-- FASE 38: MÓDULO DE CONSÓRCIOS
-- =============================================

-- Função auxiliar (idempotente)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -----------------------------------------------
-- 1. GRUPOS DE CONSÓRCIO
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consortiums (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_value numeric(10,2) NOT NULL DEFAULT 0,
    installment_value numeric(10,2) NOT NULL DEFAULT 0,
    installment_count integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    -- Configurações
    grace_days integer DEFAULT 5,
    penalty_cash_pct numeric(5,2) DEFAULT 10,
    penalty_exchange_pct numeric(5,2) DEFAULT 5,
    shipping_policy text DEFAULT 'first_free', -- 'first_free', 'all_paid', 'all_free'
    quota_extinction_rule text DEFAULT 'redistribute', -- 'redistribute', 'cancel', 'suspend'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consortiums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam seus consórcios" ON public.consortiums;
CREATE POLICY "Usuários gerenciam seus consórcios" ON public.consortiums
  FOR ALL USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS update_consortiums_modtime ON public.consortiums;
CREATE TRIGGER update_consortiums_modtime
    BEFORE UPDATE ON public.consortiums
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- -----------------------------------------------
-- 2. PARTICIPANTES DO CONSÓRCIO
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consortium_participants (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    consortium_id uuid NOT NULL REFERENCES public.consortiums(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name text,                              -- nome manual (quando não é cliente cadastrado)
    phone text,                                      -- telefone do participante
    payment_method text NOT NULL DEFAULT 'cash',     -- 'cash', 'pix', 'card', 'transfer'
    due_day integer NOT NULL DEFAULT 10               -- dia do vencimento da parcela (1-31)
        CHECK (due_day >= 1 AND due_day <= 31),
    status text NOT NULL DEFAULT 'active',           -- 'active', 'drawn', 'withdrawn', 'defaulting'
    payment_status text NOT NULL DEFAULT 'up_to_date', -- 'up_to_date', 'overdue', 'paid_off'
    installments_paid integer NOT NULL DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consortium_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam participantes" ON public.consortium_participants;
CREATE POLICY "Usuários gerenciam participantes" ON public.consortium_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.consortiums c
      WHERE c.id = consortium_id AND c.owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_consortium_participants_modtime ON public.consortium_participants;
CREATE TRIGGER update_consortium_participants_modtime
    BEFORE UPDATE ON public.consortium_participants
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- -----------------------------------------------
-- 3. PAGAMENTOS DE PARCELAS (baixa manual + integração)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consortium_installment_payments (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_id uuid NOT NULL REFERENCES public.consortium_participants(id) ON DELETE CASCADE,
    consortium_id uuid NOT NULL REFERENCES public.consortiums(id) ON DELETE CASCADE,
    installment_number integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_at timestamp with time zone,
    payment_method text DEFAULT 'manual', -- 'manual', 'pix', 'cash', 'card', 'sale_link'
    sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL, -- link com venda existente
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consortium_installment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam pagamentos de consórcios" ON public.consortium_installment_payments;
CREATE POLICY "Usuários gerenciam pagamentos de consórcios" ON public.consortium_installment_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.consortiums c
      WHERE c.id = consortium_id AND c.owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_consortium_payments_modtime ON public.consortium_installment_payments;
CREATE TRIGGER update_consortium_payments_modtime
    BEFORE UPDATE ON public.consortium_installment_payments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- -----------------------------------------------
-- 4. SORTEIOS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consortium_draws (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    consortium_id uuid NOT NULL REFERENCES public.consortiums(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.consortium_participants(id) ON DELETE CASCADE,
    draw_number integer NOT NULL,
    draw_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    draw_type text NOT NULL DEFAULT 'random', -- 'random', 'manual'
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consortium_draws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam sorteios" ON public.consortium_draws;
CREATE POLICY "Usuários gerenciam sorteios" ON public.consortium_draws
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.consortiums c
      WHERE c.id = consortium_id AND c.owner_id = auth.uid()
    )
  );
