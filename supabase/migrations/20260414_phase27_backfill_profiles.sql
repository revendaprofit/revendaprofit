-- Backfill: Preenche email dos profiles existentes a partir da tabela auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Backfill: Preenche full_name dos profiles a partir do store_settings (nome da loja)
UPDATE public.profiles p
SET full_name = s.store_name
FROM public.store_settings s
WHERE p.id = s.owner_id
AND (p.full_name IS NULL OR p.full_name = '');

-- Backfill: Se ainda nao tem full_name, tenta pegar do user_metadata da Auth
UPDATE public.profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id
AND (p.full_name IS NULL OR p.full_name = '')
AND u.raw_user_meta_data->>'full_name' IS NOT NULL;
