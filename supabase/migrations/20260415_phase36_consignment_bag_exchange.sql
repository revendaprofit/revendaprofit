-- Adicionar coluna para armazenar o pedido de troca variante do cliente
ALTER TABLE public.consignment_bag_items 
ADD COLUMN IF NOT EXISTS exchange_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Atualizar ou confirmar RLS para permitir a atualização pela aba pública (que já usamos nas policies)
