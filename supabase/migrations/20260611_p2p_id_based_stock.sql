-- =============================================================================
-- MIGRAÇÃO SUPABASE: Estabilização do Estoque P2P via IDs Rígidos (UUIDs)
-- =============================================================================
-- Objetivo:
-- 1. Adicionar colunas de referência do produto/variante original nas tabelas de cópias.
-- 2. Atualizar as lógicas de triggers e RPCs de parcerias para buscar e devolver estoque
--    pelo ID de referência, em vez de comparar strings de nome, tamanho e cor.
-- 3. Fazer backfill seguro dos dados legados existentes na base das usuárias.
-- =============================================================================

-- 1. ADICIONAR COLUNAS DE REFERÊNCIA (Retrocompatível e Opcional)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS p2p_original_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS p2p_original_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;


-- 2. BACKFILL DE DADOS LEGADOS: Mapear os produtos/variantes atuais por strings uma única vez
DO $$
DECLARE
    v_prod_count INT := 0;
    v_var_count INT := 0;
BEGIN
    -- Mapear produtos
    UPDATE public.products p_seller
    SET p2p_original_product_id = p_orig.id
    FROM public.products p_orig
    WHERE p_seller.p2p_original_product_id IS NULL
      AND p_seller.owner_id != p_orig.owner_id
      AND LOWER(TRIM(p_seller.name)) = LOWER(TRIM(p_orig.name))
      AND EXISTS (
         SELECT 1 FROM public.partnership_shared_products psp
         JOIN public.partnerships prt ON prt.id = psp.partnership_id
         WHERE psp.product_id = p_orig.id 
           AND (prt.requester_id = p_seller.owner_id OR prt.receiver_id = p_seller.owner_id)
      );
    GET DIAGNOSTICS v_prod_count = ROW_COUNT;

    -- Mapear variantes
    UPDATE public.product_variants pv_seller
    SET p2p_original_variant_id = pv_orig.id
    FROM public.product_variants pv_orig
    JOIN public.products p_orig ON p_orig.id = pv_orig.product_id
    JOIN public.products p_seller ON p_seller.p2p_original_product_id = p_orig.id
    WHERE pv_seller.product_id = p_seller.id
      AND pv_seller.p2p_original_variant_id IS NULL
      AND LOWER(TRIM(pv_seller.size)) = LOWER(TRIM(pv_orig.size))
      AND LOWER(TRIM(COALESCE(pv_seller.color, ''))) = LOWER(TRIM(COALESCE(pv_orig.color, '')));
    GET DIAGNOSTICS v_var_count = ROW_COUNT;

    RAISE NOTICE 'Backfill P2P concluído: % produtos e % variantes mapeados por IDs.', v_prod_count, v_var_count;
END;
$$;


-- 3. ATUALIZAR RPC: accept_p2p_loan (Aceitar Empréstimo e Salvar IDs de Origem)
CREATE OR REPLACE FUNCTION public.accept_p2p_loan(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_source_variant RECORD;
  v_source_product RECORD;
  v_target_product_id UUID;
  v_target_variant_id UUID;
  v_partnership RECORD;
  v_is_permanent BOOLEAN := false;
  v_new_status TEXT;
BEGIN
  -- Buscar a ordem de parceria
  SELECT * INTO v_order FROM public.partnership_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF v_order.status != 'pending_confirmation' THEN RAISE EXCEPTION 'Solicitação já processada'; END IF;

  -- Buscar contrato da parceria para checar cost_recovery_type
  SELECT * INTO v_partnership FROM public.partnerships WHERE id = v_order.partnership_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Parceria não encontrada'; END IF;

  -- Determinar se é transferência permanente (50/50) ou empréstimo temporário
  IF v_partnership.cost_recovery_type = 'shared_50_50' THEN
    v_is_permanent := true;
    v_new_status := 'confirmed';  -- Transferência definitiva, sem rastreio
  ELSE
    v_is_permanent := false;
    v_new_status := 'on_loan';    -- Empréstimo com rastreio de devolução
  END IF;

  -- Buscar variante e produto de origem (da dona do produto)
  SELECT * INTO v_source_variant FROM public.product_variants WHERE id = v_order.variant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Variante de origem não encontrada'; END IF;
  
  SELECT * INTO v_source_product FROM public.products WHERE id = v_order.product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto de origem não encontrado'; END IF;

  -- Verificar se há estoque suficiente
  IF v_source_variant.stock < v_order.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', v_source_variant.stock, v_order.quantity;
  END IF;

  -- DEDUZIR estoque da dona (owner_id)
  UPDATE public.product_variants
  SET stock = stock - v_order.quantity
  WHERE id = v_order.variant_id;

  -- ENCONTRAR ou CRIAR produto na solicitante (vendedora)
  -- 1º Passo: Tentar achar usando o ID de referência
  SELECT p.id INTO v_target_product_id
  FROM public.products p
  WHERE p.owner_id = v_order.seller_id
    AND p.p2p_original_product_id = v_order.product_id
  LIMIT 1;

  -- Fallback de segurança por nome (caso não tenha mapeado no backfill)
  IF v_target_product_id IS NULL THEN
    SELECT p.id INTO v_target_product_id
    FROM public.products p
    WHERE p.owner_id = v_order.seller_id
      AND LOWER(TRIM(p.name)) = LOWER(TRIM(v_source_product.name))
    LIMIT 1;
  END IF;

  -- Se não existe, criar o produto salvando a referência de ID original
  IF v_target_product_id IS NULL THEN
    INSERT INTO public.products (
      owner_id, name, description, sale_price, cost_price, 
      image_url, image_url_2, image_url_3, video_url,
      category_id, subcategory_id, supplier_id,
      weight, ncm, cest, origin,
      p2p_original_product_id
    ) VALUES (
      v_order.seller_id, v_source_product.name, v_source_product.description,
      v_source_product.sale_price, v_source_product.cost_price,
      v_source_product.image_url, v_source_product.image_url_2, 
      v_source_product.image_url_3, v_source_product.video_url,
      v_source_product.category_id, v_source_product.subcategory_id,
      v_source_product.supplier_id,
      v_source_product.weight, v_source_product.ncm, 
      v_source_product.cest, v_source_product.origin,
      v_order.product_id
    )
    RETURNING id INTO v_target_product_id;
  ELSE
    -- Se existia, garante que a referência de ID está preenchida
    UPDATE public.products
    SET p2p_original_product_id = COALESCE(p2p_original_product_id, v_order.product_id)
    WHERE id = v_target_product_id;
  END IF;

  -- ENCONTRAR ou CRIAR variante na solicitante (vendedora)
  -- 1º Passo: Tentar achar usando o ID de referência
  SELECT pv.id INTO v_target_variant_id
  FROM public.product_variants pv
  WHERE pv.product_id = v_target_product_id
    AND pv.p2p_original_variant_id = v_order.variant_id
  LIMIT 1;

  -- Fallback de segurança por tamanho/cor
  IF v_target_variant_id IS NULL THEN
    SELECT pv.id INTO v_target_variant_id
    FROM public.product_variants pv
    WHERE pv.product_id = v_target_product_id
      AND LOWER(TRIM(pv.size)) = LOWER(TRIM(v_source_variant.size))
      AND LOWER(TRIM(COALESCE(pv.color, ''))) = LOWER(TRIM(COALESCE(v_source_variant.color, '')))
    LIMIT 1;
  END IF;

  IF v_target_variant_id IS NOT NULL THEN
    -- Variante existe → adicionar estoque e garantir referência de ID original
    UPDATE public.product_variants
    SET stock = stock + v_order.quantity,
        p2p_original_variant_id = COALESCE(p2p_original_variant_id, v_order.variant_id)
    WHERE id = v_target_variant_id;
  ELSE
    -- Variante não existe → criar salvando a referência de ID original
    INSERT INTO public.product_variants (
      product_id, size, color, stock, sale_price, p2p_original_variant_id
    ) VALUES (
      v_target_product_id, v_source_variant.size, v_source_variant.color,
      v_order.quantity, v_source_variant.sale_price, v_order.variant_id
    )
    RETURNING id INTO v_target_variant_id;
  END IF;

  -- Atualizar status da ordem de parceria
  UPDATE public.partnership_orders
  SET status = v_new_status, updated_at = now()
  WHERE id = p_order_id;

END;
$$;


-- 4. ATUALIZAR RPC: return_p2p_loan (Devolver Empréstimo via ID Rígido)
CREATE OR REPLACE FUNCTION public.return_p2p_loan(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_source_variant RECORD;
  v_source_product RECORD;
  v_target_variant_id UUID;
  v_target_product_id UUID;
BEGIN
  -- Buscar a ordem de parceria
  SELECT * INTO v_order FROM public.partnership_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF v_order.status != 'on_loan' THEN RAISE EXCEPTION 'Esta peça não está emprestada'; END IF;

  -- Buscar dados do produto/variante original (da dona)
  SELECT * INTO v_source_variant FROM public.product_variants WHERE id = v_order.variant_id;
  SELECT * INTO v_source_product FROM public.products WHERE id = v_order.product_id;

  -- DEVOLVER estoque à dona (owner)
  UPDATE public.product_variants
  SET stock = stock + v_order.quantity
  WHERE id = v_order.variant_id;

  -- REMOVER estoque da solicitante (vendedora)
  -- 1º Passo: Localizar a variante correspondente usando ID de referência
  SELECT pv.id INTO v_target_variant_id
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE p.owner_id = v_order.seller_id
    AND pv.p2p_original_variant_id = v_order.variant_id
  LIMIT 1;

  -- Fallback de segurança por strings (caso não mapeou)
  IF v_target_variant_id IS NULL THEN
    SELECT p.id INTO v_target_product_id
    FROM public.products p
    WHERE p.owner_id = v_order.seller_id
      AND LOWER(TRIM(p.name)) = LOWER(TRIM(v_source_product.name))
    LIMIT 1;

    IF v_target_product_id IS NOT NULL THEN
      SELECT pv.id INTO v_target_variant_id
      FROM public.product_variants pv
      WHERE pv.product_id = v_target_product_id
        AND LOWER(TRIM(pv.size)) = LOWER(TRIM(v_source_variant.size))
        AND LOWER(TRIM(COALESCE(pv.color, ''))) = LOWER(TRIM(COALESCE(v_source_variant.color, '')))
      LIMIT 1;
    END IF;
  END IF;

  -- Se encontrou a variante no estoque da solicitante, retira o estoque
  IF v_target_variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = GREATEST(0, stock - v_order.quantity)
    WHERE id = v_target_variant_id;
  END IF;

  -- Marcar ordem de parceria como devolvida
  UPDATE public.partnership_orders
  SET status = 'returned', updated_at = now()
  WHERE id = p_order_id;

END;
$$;


-- 5. ATUALIZAR TRIGGER: return_stock_on_cancel (Estorno de Venda P2P via ID Rígido)
CREATE OR REPLACE FUNCTION public.return_stock_on_cancel()
RETURNS trigger AS $$
DECLARE
  item_row record;
  po_row record;
  v_seller_variant_id UUID;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IN ('completed', 'p2p_settlement', 'installment') THEN
    FOR item_row IN SELECT * FROM public.sale_items WHERE sale_id = NEW.id LOOP
      IF item_row.variant_id IS NOT NULL THEN
        
        -- Verificar se este item tem um partnership_order associado
        SELECT po.* INTO po_row 
        FROM public.partnership_orders po
        WHERE po.sale_id = NEW.id 
          AND po.variant_id = item_row.variant_id
        LIMIT 1;
        
        IF po_row IS NOT NULL THEN
          -- É um item P2P
          IF po_row.status = 'confirmed' THEN
            -- Parceira já enviou a peça física → estoque deve ser estornado para a VENDEDORA (seller)
            -- 1º Passo: Tentar localizar a variante da vendedora pelo ID original referenciado
            SELECT pv_seller.id INTO v_seller_variant_id
            FROM public.product_variants pv_seller
            JOIN public.products p_seller ON p_seller.id = pv_seller.product_id
            WHERE pv_seller.p2p_original_variant_id = item_row.variant_id
              AND p_seller.owner_id = po_row.seller_id
            LIMIT 1;
            
            -- Fallback de segurança por strings
            IF v_seller_variant_id IS NULL THEN
              SELECT pv_seller.id INTO v_seller_variant_id
              FROM public.product_variants pv_orig
              JOIN public.products p_orig ON p_orig.id = pv_orig.product_id
              JOIN public.products p_seller ON p_seller.owner_id = po_row.seller_id
                AND LOWER(TRIM(p_seller.name)) = LOWER(TRIM(p_orig.name))
              JOIN public.product_variants pv_seller ON pv_seller.product_id = p_seller.id
                AND LOWER(TRIM(pv_seller.size)) = LOWER(TRIM(pv_orig.size))
                AND LOWER(TRIM(COALESCE(pv_seller.color, ''))) = LOWER(TRIM(COALESCE(pv_orig.color, '')))
              WHERE pv_orig.id = item_row.variant_id
                AND p_seller.id != p_orig.id
              LIMIT 1;
            END IF;
            
            IF v_seller_variant_id IS NOT NULL THEN
              -- Encontrou variante da vendedora → adicionar estoque nela
              UPDATE public.product_variants
              SET stock = stock + item_row.quantity
              WHERE id = v_seller_variant_id;
            ELSE
              -- Fallback geral: se a vendedora não tem o produto, devolver à variante original (dona)
              UPDATE public.product_variants
              SET stock = stock + item_row.quantity
              WHERE id = item_row.variant_id;
            END IF;
            
          -- ELSE: pending_confirmation → estoque nunca saiu fisicamente da dona → não faz nada
          END IF;
        ELSE
          -- Item de venda comum (não P2P): estornar estoque local normalmente
          UPDATE public.product_variants
          SET stock = stock + item_row.quantity
          WHERE id = item_row.variant_id;
        END IF;
        
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
