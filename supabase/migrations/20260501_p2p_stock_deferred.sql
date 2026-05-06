-- =============================================================================
-- MIGRAÇÃO: Estoque P2P diferido - dedução somente após aceite da parceira
-- =============================================================================
-- Regras de negócio:
-- 1. Quando um item P2P é vendido, o estoque NÃO deve ser deduzido imediatamente.
-- 2. O estoque só é deduzido quando a parceira aceita a solicitação (confirmed).
--    → Para itens do próprio estoque em parceria (auto-confirmed via INSERT), deduz na hora.
--    → Para itens do estoque da parceira (pending_confirmation), deduz quando ela aceitar.
-- 3. Se a venda for cancelada:
--    A. Solicitação ainda pendente → nada muda (estoque nunca saiu)
--    B. Solicitação já confirmada → estoque volta para a VENDEDORA (solicitante),
--       pois a parceira já enviou a peça fisicamente.
-- =============================================================================

-- 1. MODIFICAR deduct_stock_on_sale: pular dedução para vendas P2P
-- O estoque será gerenciado pelos triggers de partnership_orders
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS trigger AS $$
DECLARE
  v_sale_status TEXT;
BEGIN
  -- Verificar se esta venda é P2P (settlement pendente)
  -- Se for, NÃO deduzir estoque agora; será deduzido quando a parceira aceitar
  SELECT status INTO v_sale_status FROM public.sales WHERE id = NEW.sale_id;
  
  IF v_sale_status = 'p2p_settlement' THEN
    RETURN NEW;
  END IF;
  
  -- Fluxo normal (vendas locais/hub): deduzir estoque imediatamente
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. NOVO TRIGGER: Deduzir estoque quando partnership_order é confirmado
-- Dispara em INSERT (auto-confirm de produto próprio) e UPDATE (parceira aceita)
CREATE OR REPLACE FUNCTION public.handle_p2p_stock_on_confirm()
RETURNS trigger AS $$
BEGIN
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

DROP TRIGGER IF EXISTS on_p2p_order_confirmed ON public.partnership_orders;
CREATE TRIGGER on_p2p_order_confirmed
  AFTER INSERT OR UPDATE OF status ON public.partnership_orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_p2p_stock_on_confirm();


-- 3. ATUALIZAR return_stock_on_cancel: lidar com cancelamentos P2P
-- Cenário A: pending_confirmation → estoque nunca saiu → nada a fazer
-- Cenário B: confirmed → estoque saiu da dona, peça está com a vendedora →
--            devolver para o estoque da VENDEDORA (seller), não da dona
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
            -- Parceira já enviou a peça → estoque vai para a VENDEDORA (seller)
            -- Buscar a variante correspondente no estoque da vendedora
            -- (mesmo nome de produto + mesmo tamanho + mesma cor)
            SELECT pv_seller.id INTO v_seller_variant_id
            FROM public.product_variants pv_orig
            JOIN public.products p_orig ON p_orig.id = pv_orig.product_id
            JOIN public.products p_seller ON p_seller.owner_id = po_row.seller_id
              AND LOWER(TRIM(p_seller.name)) = LOWER(TRIM(p_orig.name))
            JOIN public.product_variants pv_seller ON pv_seller.product_id = p_seller.id
              AND LOWER(TRIM(pv_seller.size)) = LOWER(TRIM(pv_orig.size))
              AND LOWER(TRIM(COALESCE(pv_seller.color, ''))) = LOWER(TRIM(COALESCE(pv_orig.color, '')))
            WHERE pv_orig.id = item_row.variant_id
              AND p_seller.id != p_orig.id  -- Não retornar a mesma variante da dona
            LIMIT 1;
            
            IF v_seller_variant_id IS NOT NULL THEN
              -- Encontrou variante da vendedora → adicionar estoque
              UPDATE public.product_variants
              SET stock = stock + item_row.quantity
              WHERE id = v_seller_variant_id;
            ELSE
              -- Fallback: se a vendedora não tem o produto, devolver à variante original
              UPDATE public.product_variants
              SET stock = stock + item_row.quantity
              WHERE id = item_row.variant_id;
            END IF;
            
          -- ELSE: pending_confirmation → estoque nunca foi deduzido → não fazer nada
          END IF;
        ELSE
          -- Item normal (não P2P): devolver estoque normalmente
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


-- 4. ATUALIZAR mark_p2p_sale_completed para aceitar status 'p2p_settlement'
CREATE OR REPLACE FUNCTION mark_p2p_sale_completed(p_sale_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.sales
  SET status = 'completed'
  WHERE id = p_sale_id AND status IN ('open', 'p2p_settlement');
END;
$$;


-- 5. CRIAR mark_p2p_sale_rejected (caso não exista)
CREATE OR REPLACE FUNCTION mark_p2p_sale_rejected(p_sale_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.sales
  SET status = 'p2p_rejected'
  WHERE id = p_sale_id AND status IN ('p2p_settlement', 'open');
END;
$$;
