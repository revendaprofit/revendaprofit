-- ============================================================
-- Notifications via BotConversa
-- ============================================================

-- 1. Global config (webhook URL do admin master)
CREATE TABLE IF NOT EXISTS public.system_config (
  key   text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_config"        ON public.system_config;
DROP POLICY IF EXISTS "authenticated_read_config"   ON public.system_config;

CREATE POLICY "admins_manage_config" ON public.system_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "authenticated_read_config" ON public.system_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Preferências de notificação por lojista
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS notify_new_order          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_partner_order      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_customer_signup    boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_bag_accepted       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_bag_finalized      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_birthday           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_overdue_installment boolean DEFAULT true;

-- 3. Log de notificações (evita duplicatas diárias)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id   uuid NOT NULL,
  event_type text NOT NULL,
  event_ref  text,
  sent_date  date NOT NULL DEFAULT CURRENT_DATE,
  sent_at    timestamptz DEFAULT now(),
  UNIQUE (owner_id, event_type, event_ref, sent_date)
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_access_own_logs" ON public.notification_log;
CREATE POLICY "owners_access_own_logs" ON public.notification_log
  FOR ALL USING (owner_id = auth.uid());

-- 4. RPC: registrar lead (nome + telefone sem precisar de pedido)
CREATE OR REPLACE FUNCTION public.register_catalog_lead(
  p_store_id uuid,
  p_name     text,
  p_phone    text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer_id uuid;
  v_clean_phone text;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE owner_id = p_store_id
    AND regexp_replace(phone, '\D', '', 'g') = v_clean_phone
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (owner_id, name, phone)
    VALUES (p_store_id, p_name, p_phone)
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;
