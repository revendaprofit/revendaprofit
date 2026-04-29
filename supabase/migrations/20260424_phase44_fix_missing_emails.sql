-- Migração para corrigir emails faltantes na tabela profiles e garantir sincronização futura

-- 1. Backfill: Preenche o email na tabela profiles para qualquer usuário que esteja sem email (como a NaBell's e outras lojas)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 2. Criação de uma função e trigger para sincronizar atualizações de email de auth.users para public.profiles
-- Isso previne que se o email for alterado futuramente, a tabela profiles fique desatualizada
CREATE OR REPLACE FUNCTION public.handle_update_user_email()
RETURNS trigger AS $$
BEGIN
  IF old.email IS DISTINCT FROM new.email THEN
    UPDATE public.profiles
    SET email = new.email
    WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user_email();
