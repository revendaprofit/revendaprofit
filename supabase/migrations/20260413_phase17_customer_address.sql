-- Add address column to customers table
ALTER TABLE IF EXISTS public.customers
ADD COLUMN IF NOT EXISTS address text;
