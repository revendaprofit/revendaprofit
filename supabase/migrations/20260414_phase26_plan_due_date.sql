-- Adiciona coluna plan_due_date em profiles para controlar expiração de contas
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_due_date date;
