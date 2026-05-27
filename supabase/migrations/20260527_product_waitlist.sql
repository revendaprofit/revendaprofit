-- ============================================================
-- Fila de Espera: clientes que querem ser avisadas quando
-- uma variante em malinha consignada voltar ao estoque
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_waitlist (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id     uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  customer_name  text NOT NULL,
  customer_phone text NOT NULL,
  notified_at    timestamptz,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (owner_id, variant_id, customer_phone)
);

ALTER TABLE public.product_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_waitlist" ON public.product_waitlist;
CREATE POLICY "owner_manage_waitlist" ON public.product_waitlist
  FOR ALL USING (owner_id = auth.uid());

-- RPC público: retorna variant_ids atualmente em malinhas ativas de uma loja
DROP FUNCTION IF EXISTS public.get_variants_in_consignment(uuid);
CREATE OR REPLACE FUNCTION public.get_variants_in_consignment(p_owner_id uuid)
RETURNS TABLE(variant_id uuid)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT DISTINCT cbi.variant_id
  FROM public.consignment_bag_items cbi
  JOIN public.consignment_bags cb ON cb.id = cbi.bag_id
  WHERE cb.owner_id = p_owner_id
    AND cb.status IN ('active', 'sent');
$$;

-- RPC público: registra interesse na fila (sem autenticação — catálogo é público)
DROP FUNCTION IF EXISTS public.register_waitlist_interest(uuid, uuid, text, text);
CREATE OR REPLACE FUNCTION public.register_waitlist_interest(
  p_owner_id     uuid,
  p_variant_id   uuid,
  p_customer_name  text,
  p_customer_phone text
) RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.product_waitlist (owner_id, variant_id, customer_name, customer_phone)
  VALUES (p_owner_id, p_variant_id, p_customer_name, p_customer_phone)
  ON CONFLICT (owner_id, variant_id, customer_phone) DO NOTHING;
$$;

-- Template de notificação para fila de espera
INSERT INTO public.notification_templates (event_type, template) VALUES
('waitlist_available',
E'🎉 *Boa notícia, {{cliente}}!*\n\nA peça *{{produto}}* (tamanho {{tamanho}}) que você estava aguardando está disponível novamente na loja!\n\nCorra para garantir a sua antes que esgote! 🛍️')
ON CONFLICT (event_type) DO NOTHING;
