-- Obter o ID do admin master e criar política global
DO $$
DECLARE
  master_id uuid;
BEGIN
  -- Tenta buscar o admin principal
  SELECT id INTO master_id FROM auth.users WHERE email = 'revendaprofit@gmail.com' LIMIT 1;
  
  IF master_id IS NOT NULL THEN
    -- Atualizar política de Categorias
    DROP POLICY IF EXISTS "Lojistas podem ver suas categorias" ON public.categories;
    EXECUTE 'CREATE POLICY "Lojistas podem ver suas categorias" ON public.categories FOR SELECT USING (auth.uid() = owner_id OR owner_id = ''' || master_id || ''')';

    -- Atualizar política de Subcategorias
    DROP POLICY IF EXISTS "Lojistas podem ver suas subcategorias" ON public.subcategories;
    EXECUTE 'CREATE POLICY "Lojistas podem ver suas subcategorias" ON public.subcategories FOR SELECT USING (auth.uid() = owner_id OR owner_id = ''' || master_id || ''')';
  END IF;
  
  -- Para Produtos: adicioar a Flag "Lançamento" caso não exista
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false;
END $$;
