-- Adiciona coluna de status no profile para bloqueio de contas pelo admin
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'::text;

-- Update profiles without status to active
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;
