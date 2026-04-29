-- Migration para adicionar a coluna deals_password na tabela store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS deals_password TEXT DEFAULT NULL;
