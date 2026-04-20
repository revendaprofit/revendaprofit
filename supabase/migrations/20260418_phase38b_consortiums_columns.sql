-- =============================================
-- FASE 38b: ADICIONAR COLUNAS FALTANTES
-- (Execute este script se a migration principal
--  já foi rodada parcialmente)
-- =============================================

-- Adicionar colunas novas em consortium_participants (se não existirem)
ALTER TABLE public.consortium_participants
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS due_day integer NOT NULL DEFAULT 10;

-- Adicionar constraint de vencimento (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'consortium_participants_due_day_check'
  ) THEN
    ALTER TABLE public.consortium_participants
      ADD CONSTRAINT consortium_participants_due_day_check
      CHECK (due_day >= 1 AND due_day <= 31);
  END IF;
END $$;
