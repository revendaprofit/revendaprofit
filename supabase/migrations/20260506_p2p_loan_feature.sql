-- =============================================================================
-- MIGRAÇÃO: Empréstimo de Peças P2P (Loan Feature)
-- =============================================================================
-- Regras de negócio:
-- 1. Vendas pelo PDV continuam gerando venda real (order_type = 'sale')
-- 2. Empréstimos pela tela de Parcerias (order_type = 'loan'):
--    a. shared_50_50: transferência permanente (não é empréstimo, apenas move estoque)
--    b. owner_100 / seller_100 / custom: empréstimo com rastreio (on_loan → returned/sold)
-- 3. Ao aceitar empréstimo, produto/variante são criados automaticamente no estoque
--    da solicitante se não existirem.
-- =============================================================================

-- 1. NOVA COLUNA order_type na partnership_orders
ALTER TABLE public.partnership_orders 
  ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'sale';

-- 2. ATUALIZAR constraint de status para incluir on_loan e returned
ALTER TABLE public.partnership_orders 
  DROP CONSTRAINT IF EXISTS partnership_orders_status_check;
ALTER TABLE public.partnership_orders 
  ADD CONSTRAINT partnership_orders_status_check 
  CHECK (status IN ('pending_confirmation', 'confirmed', 'rejected', 'settled', 'cancelled', 'on_loan', 'returned'));

-- 3. ATUALIZAR trigger handle_p2p_stock_on_confirm para IGNORAR loans
-- Loans terão seu estoque gerenciado pelas novas RPCs
CREATE OR REPLACE FUNCTION public.handle_p2p_stock_on_confirm()
RETURNS trigger AS $$
BEGIN
  -- Ignorar orders de tipo loan (gerenciado por RPCs dedicadas)
  IF COALESCE(NEW.order_type, 'sale') = 'loan' THEN
    RETURN NEW;
  END IF;

  -- INSERT com status 'confirmed': produto próprio, auto-confirmado → deduzir agora
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = stock - NEW.quantity
      WHERE id = NEW.variant_id;
    END IF;
  END IF;
  
  -- UPDATE de pending_confirmation → confirmed: parceira aceitou → deduzir agora
  IF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending_confirmation' THEN
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = stock - NEW.quantity
      WHERE id = NEW.variant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Aceitar empréstimo e transferir estoque
-- Deduz da dona, cria produto/variante na solicitante se necessário, adiciona estoque
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
  -- Buscar a order
  SELECT * INTO v_order FROM public.partnership_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF v_order.status != 'pending_confirmation' THEN RAISE EXCEPTION 'Solicitação já processada'; END IF;

  -- Buscar contrato da parceria para checar cost_recovery_type
  SELECT * INTO v_partnership FROM public.partnerships WHERE id = v_order.partnership_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Parceria não encontrada'; END IF;

  -- Determinar se é transferência permanente (50/50) ou empréstimo rastreado
  IF v_partnership.cost_recovery_type = 'shared_50_50' THEN
    v_is_permanent := true;
    v_new_status := 'confirmed';  -- Transferência permanente, sem rastreio
  ELSE
    v_is_permanent := false;
    v_new_status := 'on_loan';    -- Empréstimo com rastreio
  END IF;

  -- Buscar variante e produto de origem
  SELECT * INTO v_source_variant FROM public.product_variants WHERE id = v_order.variant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Variante de origem não encontrada'; END IF;
  
  SELECT * INTO v_source_product FROM public.products WHERE id = v_order.product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto de origem não encontrado'; END IF;

  -- Verificar estoque suficiente
  IF v_source_variant.stock < v_order.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', v_source_variant.stock, v_order.quantity;
  END IF;

  -- ==========================================
  -- DEDUZIR estoque da dona (owner)
  -- ==========================================
  UPDATE public.product_variants
  SET stock = stock - v_order.quantity
  WHERE id = v_order.variant_id;

  -- ==========================================
  -- ENCONTRAR ou CRIAR produto na solicitante
  -- ==========================================
  
  -- Procurar produto com mesmo nome no estoque da solicitante
  SELECT p.id INTO v_target_product_id
  FROM public.products p
  WHERE p.owner_id = v_order.seller_id
    AND LOWER(TRIM(p.name)) = LOWER(TRIM(v_source_product.name))
  LIMIT 1;

  -- Se não existe, criar o produto
  IF v_target_product_id IS NULL THEN
    INSERT INTO public.products (
      owner_id, name, description, sale_price, cost_price, 
      image_url, image_url_2, image_url_3, video_url,
      category_id, subcategory_id, supplier_id,
      weight, ncm, cest, origin
    ) VALUES (
      v_order.seller_id, v_source_product.name, v_source_product.description,
      v_source_product.sale_price, v_source_product.cost_price,
      v_source_product.image_url, v_source_product.image_url_2, 
      v_source_product.image_url_3, v_source_product.video_url,
      v_source_product.category_id, v_source_product.subcategory_id,
      v_source_product.supplier_id,
      v_source_product.weight, v_source_product.ncm, 
      v_source_product.cest, v_source_product.origin
    )
    RETURNING id INTO v_target_product_id;
  END IF;

  -- ==========================================
  -- ENCONTRAR ou CRIAR variante na solicitante
  -- ==========================================

  SELECT pv.id INTO v_target_variant_id
  FROM public.product_variants pv
  WHERE pv.product_id = v_target_product_id
    AND LOWER(TRIM(pv.size)) = LOWER(TRIM(v_source_variant.size))
    AND LOWER(TRIM(COALESCE(pv.color, ''))) = LOWER(TRIM(COALESCE(v_source_variant.color, '')))
  LIMIT 1;

  IF v_target_variant_id IS NOT NULL THEN
    -- Variante existe → adicionar estoque
    UPDATE public.product_variants
    SET stock = stock + v_order.quantity
    WHERE id = v_target_variant_id;
  ELSE
    -- Variante não existe → criar com estoque
    INSERT INTO public.product_variants (
      product_id, size, color, stock, sale_price
    ) VALUES (
      v_target_product_id, v_source_variant.size, v_source_variant.color,
      v_order.quantity, v_source_variant.sale_price
    )
    RETURNING id INTO v_target_variant_id;
  END IF;

  -- ==========================================
  -- ATUALIZAR status da order
  -- ==========================================
  UPDATE public.partnership_orders
  SET status = v_new_status, updated_at = now()
  WHERE id = p_order_id;

END;
$$;


-- 5. RPC: Devolver peça emprestada (reverte a transferência)
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
  -- Buscar a order
  SELECT * INTO v_order FROM public.partnership_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF v_order.status != 'on_loan' THEN RAISE EXCEPTION 'Esta peça não está emprestada'; END IF;

  -- Buscar dados do produto/variante original (da dona)
  SELECT * INTO v_source_variant FROM public.product_variants WHERE id = v_order.variant_id;
  SELECT * INTO v_source_product FROM public.products WHERE id = v_order.product_id;

  -- ==========================================
  -- DEVOLVER estoque à dona (owner)
  -- ==========================================
  UPDATE public.product_variants
  SET stock = stock + v_order.quantity
  WHERE id = v_order.variant_id;

  -- ==========================================
  -- REMOVER estoque da solicitante (seller)
  -- ==========================================
  -- Encontrar a variante correspondente no estoque da solicitante
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

    IF v_target_variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = GREATEST(0, stock - v_order.quantity)
      WHERE id = v_target_variant_id;
    END IF;
  END IF;

  -- ==========================================
  -- MARCAR como devolvida
  -- ==========================================
  UPDATE public.partnership_orders
  SET status = 'returned', updated_at = now()
  WHERE id = p_order_id;

END;
$$;
