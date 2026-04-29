-- ============================================
-- COPIA DE ESTOQUE: Dayana -> Tessa & Tessa BSB
-- Source: dayana_tbperez@hotmail.com
-- Dest 1: tessaforwod@gmail.com
-- Dest 2: tessaforwodbsb@gmail.com
-- O Estoque de todos os produtos e variantes será copiado com quantidade 0.
-- Gerado Inteligente via IA
-- ============================================

DO $$
DECLARE
  source_owner uuid;
  dest1_owner uuid;
  dest2_owner uuid;
  dest_id uuid;
  d_array uuid[];
  r_cat record;
  r_subcat record;
  r_prod record;
  r_var record;
  inserted_id uuid;
BEGIN
  -- 1. Encontrar IDs dos usuários através dos perfis (emails cadastrados no banco)
  SELECT id INTO source_owner FROM public.profiles WHERE email = 'dayana_tbperez@hotmail.com';
  SELECT id INTO dest1_owner FROM public.profiles WHERE email = 'tessaforwod@gmail.com';
  SELECT id INTO dest2_owner FROM public.profiles WHERE email = 'tessaforwodbsb@gmail.com';

  -- Validação de segurança
  IF source_owner IS NULL THEN RAISE EXCEPTION 'Usuária de origem (Dayana) não encontrada.'; END IF;
  IF dest1_owner IS NULL THEN RAISE EXCEPTION 'Usuária de destino (Tessa 1) não encontrada.'; END IF;
  IF dest2_owner IS NULL THEN RAISE EXCEPTION 'Usuária de destino (Tessa BSB) não encontrada.'; END IF;

  -- 2. Tabela temporária para mapear IDs antigos para os novos, mantendo os links
  CREATE TEMP TABLE IF NOT EXISTS id_map (
    old_id uuid,
    new_id uuid,
    type text
  );
  
  -- Array com as duas contas de destino
  d_array := ARRAY[dest1_owner, dest2_owner];

  -- Loop principal: Clona todo o catálogo 2 vezes (uma para cada Tessa)
  FOREACH dest_id IN ARRAY d_array
  LOOP
    TRUNCATE TABLE id_map;
    
    -- 2.1 Categorias
    FOR r_cat IN SELECT * FROM public.categories WHERE owner_id = source_owner LOOP
      INSERT INTO public.categories (owner_id, name, created_at)
      VALUES (dest_id, r_cat.name, now())
      RETURNING id INTO inserted_id;
      
      INSERT INTO id_map VALUES (r_cat.id, inserted_id, 'category');
    END LOOP;

    -- 2.2 Subcategorias
    FOR r_subcat IN SELECT * FROM public.subcategories WHERE owner_id = source_owner LOOP
      INSERT INTO public.subcategories (owner_id, category_id, name, created_at)
      VALUES (
        dest_id, 
        (SELECT new_id FROM id_map WHERE old_id = r_subcat.category_id AND type = 'category'), 
        r_subcat.name, 
        now()
      )
      RETURNING id INTO inserted_id;
      
      INSERT INTO id_map VALUES (r_subcat.id, inserted_id, 'subcategory');
    END LOOP;

    -- 2.3 Fornecedores (opcional, copia se tiver)
    FOR r_cat IN SELECT * FROM public.suppliers WHERE owner_id = source_owner LOOP
      INSERT INTO public.suppliers (owner_id, name, created_at)
      VALUES (dest_id, r_cat.name, now())
      RETURNING id INTO inserted_id;
      INSERT INTO id_map VALUES (r_cat.id, inserted_id, 'supplier');
    END LOOP;

    -- 2.4 Produtos (ZERANDO O ESTOQUE)
    FOR r_prod IN SELECT * FROM public.products WHERE owner_id = source_owner LOOP
      INSERT INTO public.products (
        owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url,
        category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, 
        min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival, created_at
      )
      VALUES (
        dest_id, r_prod.name, r_prod.cost_price, r_prod.sale_price, r_prod.image_url, r_prod.image_url_2, r_prod.image_url_3, r_prod.video_url,
        (SELECT new_id FROM id_map WHERE old_id = r_prod.category_id AND type = 'category'),
        (SELECT new_id FROM id_map WHERE old_id = r_prod.subcategory_id AND type = 'subcategory'),
        (SELECT new_id FROM id_map WHERE old_id = r_prod.supplier_id AND type = 'supplier'),
        r_prod.marketing_status, 
        0, -- ZERO STOCK!
        r_prod.description, 
        r_prod.min_stock, r_prod.filter_model, r_prod.filter_color, r_prod.filter_detail, r_prod.ncm, r_prod.cest, r_prod.ean, r_prod.origin_code, r_prod.is_new_arrival, now()
      )
      RETURNING id INTO inserted_id;
      
      INSERT INTO id_map VALUES (r_prod.id, inserted_id, 'product');
    END LOOP;

    -- 2.5 Variações (Tamanhos e Medidas) (ZERANDO O ESTOQUE)
    FOR r_var IN SELECT * FROM public.product_variants WHERE owner_id = source_owner LOOP
      INSERT INTO public.product_variants (
        product_id, owner_id, size, color, stock, sku, created_at
      )
      VALUES (
        (SELECT new_id FROM id_map WHERE old_id = r_var.product_id AND type = 'product'),
        dest_id,
        r_var.size, 
        r_var.color,
        0, -- ZERO STOCK!
        r_var.sku, 
        now()
      );
    END LOOP;

  END LOOP;

  DROP TABLE IF EXISTS id_map;
END $$;
