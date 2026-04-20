-- =============================================
-- FASE 38c: CRÉDITO FINANCEIRO DO CONSÓRCIO
-- =============================================

-- 1. Crédito disponível e utilizado nos participantes
ALTER TABLE public.consortium_participants
  ADD COLUMN IF NOT EXISTS credit_awarded numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_used    numeric(10,2) DEFAULT 0;

-- 2. Linkar vendas a um participante de consórcio (para rastreio)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS consortium_participant_id uuid
    REFERENCES public.consortium_participants(id) ON DELETE SET NULL;

-- 3. Índice para buscar vendas de parcelas por participante
CREATE INDEX IF NOT EXISTS idx_sales_consortium_participant
  ON public.sales(consortium_participant_id)
  WHERE consortium_participant_id IS NOT NULL;
