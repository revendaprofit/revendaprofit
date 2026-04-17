-- Adicionando novos campos na tabela sales para o checkout aprimorado
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_origin text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed'; -- fixed, percentage, exchange
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'presential'; -- presential, postal, app, others
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method_2 text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_amount_2 numeric(10,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS observations text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS postal_company text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shipping_payer text DEFAULT 'buyer'; -- buyer, seller

-- Adicionando Instagram no Cliente
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS instagram text;
