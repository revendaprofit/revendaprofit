-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lojistas podem ver suas subcategorias" ON public.subcategories;
CREATE POLICY "Lojistas podem ver suas subcategorias" ON public.subcategories FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem inserir subcategorias" ON public.subcategories;
CREATE POLICY "Lojistas podem inserir subcategorias" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem atualizar suas subcategorias" ON public.subcategories;
CREATE POLICY "Lojistas podem atualizar suas subcategorias" ON public.subcategories FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Lojistas podem deletar suas subcategorias" ON public.subcategories;
CREATE POLICY "Lojistas podem deletar suas subcategorias" ON public.subcategories FOR DELETE USING (auth.uid() = owner_id);

-- Alter products to have subcategory_id
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;
