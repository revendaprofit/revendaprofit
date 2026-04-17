-- Adiciona coluna de email no profile para listagem no admin
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  
  -- Cria configuração padrão da loja
  INSERT INTO public.store_settings (owner_id, store_name, slug)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'loja-' || substr(new.id::text, 1, 8));

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
