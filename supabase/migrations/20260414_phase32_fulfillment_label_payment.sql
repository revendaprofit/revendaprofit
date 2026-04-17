-- Adicionar campos de etiqueta e pagamento ao hub_fulfillment_orders
ALTER TABLE public.hub_fulfillment_orders ADD COLUMN IF NOT EXISTS label_url text;
ALTER TABLE public.hub_fulfillment_orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.hub_fulfillment_orders ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.hub_fulfillment_orders ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;
ALTER TABLE public.hub_fulfillment_orders ADD COLUMN IF NOT EXISTS label_uploaded_at timestamptz;
