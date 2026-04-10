-- REVANDA PROFIT - FASE 1 SCHEMAS
-- Habilita extensão pgcrypto para uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modificando a tabela public.profiles caso exista ou criando nova
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user'::text,
  plan text DEFAULT 'free'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Habilitando RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles são visíveis por todos."
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem inserir seu próprio profile."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio profile."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Tabela store_settings (Configuração da Loja)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text,
  slug text UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#000000',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(owner_id)
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações da loja são visíveis publicamente"
    ON public.store_settings FOR SELECT
    USING (true);

CREATE POLICY "Lojistas podem atualizar sua própria configuração"
    ON public.store_settings FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Lojistas podem inserir sua configuração"
    ON public.store_settings FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Trigger para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Cria configuração padrão da loja
  INSERT INTO public.store_settings (owner_id, store_name, slug)
  VALUES (new.id, 'Minha Loja', 'loja-' || substr(new.id::text, 1, 8));

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger se existir para evitar erro ao recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean AS $$
DECLARE
  _user_role text;
BEGIN
  SELECT role INTO _user_role FROM public.profiles WHERE id = _user_id;
  RETURN _user_role = _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
