-- Adicionar forma de pagamento individual por parcela
-- Permite registrar como cada parcela foi efetivamente paga
ALTER TABLE public.sale_installments 
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Adicionar coluna de taxa calculada por parcela
ALTER TABLE public.sale_installments 
  ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2) DEFAULT 0;
