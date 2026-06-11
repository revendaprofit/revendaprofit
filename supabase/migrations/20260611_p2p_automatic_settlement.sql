-- =============================================================================
-- MIGRAÇÃO SUPABASE: Automação de Acertos P2P e Correção de Estornos/Deduções
-- =============================================================================
-- Objetivo:
-- 1. Estender o retorno de estoque de vendas canceladas para qualquer status anterior.
-- 2. Corrigir a dedução automática no PDV para pular vendas P2P parceladas.
-- 3. Criar trigger automática que insere o acerto (settlement) assim que a ordem for confirmada.
-- 4. Rodar backfill para criar acertos pendentes em ordens confirmadas legadas.
-- =============================================================================


-- 1. ATUALIZAR TRIGGER: return_stock_on_cancel (Estorno de Estoque ao Cancelar)
-- Agora aceita qualquer status de origem anterior (OLD.status) diferente de 'cancelled'
CREATE OR REPLACE FUNCTION public.return_stock_on_cancel()
RETURNS trigger AS $$
DECLARE
  item_row record;
  po_row record;
  v_seller_variant_id UUID;
BEGIN
  -- Se o status mudou para 'cancelled' e o anterior não era 'cancelled'
  IF NEW.status = 'cancelled' AND COALESCE(OLD.status, '') != 'cancelled' THEN
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


-- 2. ATUALIZAR TRIGGER: deduct_stock_on_sale (Evitar Baixa Dupla em Vendas P2P)
-- Pula a dedução também para vendas P2P parceladas (status 'p2p_pending_payment')
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS trigger AS $$
DECLARE
  v_sale_status TEXT;
BEGIN
  -- Verificar se esta venda é P2P (direta ou parcelada)
  SELECT status INTO v_sale_status FROM public.sales WHERE id = NEW.sale_id;
  
  IF v_sale_status IN ('p2p_settlement', 'p2p_pending_payment') THEN
    RETURN NEW;
  END IF;
  
  -- Fluxo normal: deduzir estoque imediatamente
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. NOVA FUNÇÃO TRIGGER: create_p2p_settlement_on_confirm (Automação de Acertos)
CREATE OR REPLACE FUNCTION public.create_p2p_settlement_on_confirm()
RETURNS trigger AS $$
DECLARE
  v_contract RECORD;
  v_cost_price NUMERIC(10,2) := 0;
  v_total_fees NUMERIC(10,2) := 0;
  v_total_p2p_revenue NUMERIC(10,2) := 0;
  v_item_fee_ratio NUMERIC := 1;
  v_item_fees NUMERIC(10,2) := 0;
  v_item_fees_per_unit NUMERIC(10,2) := 0;
  v_lucro_bruto NUMERIC(10,2) := 0;
  v_cost_slice_creditor NUMERIC(10,2) := 0;
  v_profit_slice_creditor NUMERIC(10,2) := 0;
  v_fee_slice_creditor NUMERIC(10,2) := 0;
  v_total_owed NUMERIC(10,2) := 0;
  v_sale_payment_fee NUMERIC(10,2) := 0;
  v_sale_payment_fee_2 NUMERIC(10,2) := 0;
BEGIN
  -- Só processar para ordens do tipo 'sale' que mudaram/foram inseridas como 'confirmed'
  -- E onde o vendedor não é o próprio dono da peça (não é auto-consignação)
  IF NEW.order_type = 'sale' AND NEW.status = 'confirmed' AND NEW.seller_id != NEW.owner_id THEN
    
    -- Evitar duplicados
    IF EXISTS (SELECT 1 FROM public.partnership_settlements WHERE partnership_order_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Buscar contrato de parceria
    SELECT * INTO v_contract FROM public.partnerships WHERE id = NEW.partnership_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    -- Buscar custo unitário do produto gravado no sale_items
    SELECT COALESCE(unit_cost, 0) INTO v_cost_price
    FROM public.sale_items
    WHERE sale_id = NEW.sale_id AND product_id = NEW.product_id
    LIMIT 1;

    -- Buscar taxas registradas na venda
    SELECT COALESCE(payment_fee_amount, 0), COALESCE(payment_fee_amount_2, 0)
    INTO v_sale_payment_fee, v_sale_payment_fee_2
    FROM public.sales
    WHERE id = NEW.sale_id;
    
    v_total_fees := v_sale_payment_fee + v_sale_payment_fee_2;

    -- Receita total das ordens P2P desta venda para calcular a taxa proporcional
    SELECT COALESCE(SUM(sale_price * quantity), 0) INTO v_total_p2p_revenue
    FROM public.partnership_orders
    WHERE sale_id = NEW.sale_id;

    -- Taxa proporcional do item
    IF v_total_p2p_revenue > 0 THEN
      v_item_fee_ratio := (NEW.sale_price * NEW.quantity) / v_total_p2p_revenue;
    END IF;
    v_item_fees := v_total_fees * v_item_fee_ratio;
    v_item_fees_per_unit := CASE WHEN NEW.quantity > 0 THEN v_item_fees / NEW.quantity ELSE 0 END;

    -- Custo proporcional da parceira credora (conforme contrato)
    IF v_contract.cost_recovery_type = 'owner_100' THEN
      v_cost_slice_creditor := v_cost_price;
    ELSIF v_contract.cost_recovery_type = 'shared_50_50' THEN
      v_cost_slice_creditor := v_cost_price * 0.5;
    ELSIF v_contract.cost_recovery_type = 'custom' THEN
      v_cost_slice_creditor := v_cost_price * (COALESCE(v_contract.cost_recovery_owner_percent, 100) / 100.0);
    END IF;

    v_lucro_bruto := GREATEST(0, NEW.sale_price - v_cost_price);

    -- Rateio financeiro conforme a responsabilidade das taxas
    IF v_contract.fee_responsibility_type = 'shared_50_50' THEN
      -- MODELO A: taxa é abatida do lucro bruto antes da divisão 85/15
      v_profit_slice_creditor := GREATEST(0, v_lucro_bruto - v_item_fees_per_unit) * (v_contract.profit_split_partner_percent / 100.0);
      v_fee_slice_creditor := 0;
      v_total_owed := (v_cost_slice_creditor + v_profit_slice_creditor) * NEW.quantity;
    ELSE
      -- MODELO B: divide o lucro bruto primeiro, depois cada uma paga sua taxa
      v_profit_slice_creditor := v_lucro_bruto * (v_contract.profit_split_partner_percent / 100.0);
      IF v_contract.fee_responsibility_type = 'custom' THEN
        v_fee_slice_creditor := v_item_fees * (1 - COALESCE(v_contract.fee_responsibility_seller_percent, 100) / 100.0);
      END IF;
      -- seller_100: v_fee_slice_creditor = 0 (vendedora paga a taxa inteira)
      v_total_owed := GREATEST(0, (v_cost_slice_creditor + v_profit_slice_creditor) * NEW.quantity - v_fee_slice_creditor);
    END IF;

    -- Inserir o acerto de contas automático
    INSERT INTO public.partnership_settlements (
      partnership_id,
      partnership_order_id,
      debtor_id,
      creditor_id,
      cost_slice,
      profit_slice,
      fee_slice,
      amount_owed,
      status
    ) VALUES (
      NEW.partnership_id,
      NEW.id,
      NEW.seller_id,
      NEW.owner_id,
      v_cost_slice_creditor * NEW.quantity,
      v_profit_slice_creditor * NEW.quantity,
      v_fee_slice_creditor,
      v_total_owed,
      'open'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. INSTANCIAR TRIGGER DE ACERTO AUTOMÁTICO
DROP TRIGGER IF EXISTS on_p2p_order_settlement ON public.partnership_orders;
CREATE TRIGGER on_p2p_order_settlement
  AFTER INSERT OR UPDATE OF status ON public.partnership_orders
  FOR EACH ROW EXECUTE PROCEDURE public.create_p2p_settlement_on_confirm();


-- 5. BACKFILL: Gerar acertos que ficaram pendentes para ordens já confirmadas
DO $$
DECLARE
    r RECORD;
    v_contract RECORD;
    v_cost_price NUMERIC(10,2) := 0;
    v_total_fees NUMERIC(10,2) := 0;
    v_total_p2p_revenue NUMERIC(10,2) := 0;
    v_item_fee_ratio NUMERIC := 1;
    v_item_fees NUMERIC(10,2) := 0;
    v_item_fees_per_unit NUMERIC(10,2) := 0;
    v_lucro_bruto NUMERIC(10,2) := 0;
    v_cost_slice_creditor NUMERIC(10,2) := 0;
    v_profit_slice_creditor NUMERIC(10,2) := 0;
    v_fee_slice_creditor NUMERIC(10,2) := 0;
    v_total_owed NUMERIC(10,2) := 0;
    v_sale_payment_fee NUMERIC(10,2) := 0;
    v_sale_payment_fee_2 NUMERIC(10,2) := 0;
    v_count INT := 0;
BEGIN
    FOR r IN
        SELECT po.* 
        FROM public.partnership_orders po
        WHERE po.order_type = 'sale' 
          AND po.status = 'confirmed' 
          AND po.seller_id != po.owner_id
          AND NOT EXISTS (
              SELECT 1 FROM public.partnership_settlements ps WHERE ps.partnership_order_id = po.id
          )
    LOOP
        -- Buscar contrato de parceria
        SELECT * INTO v_contract FROM public.partnerships WHERE id = r.partnership_id;
        IF NOT FOUND THEN CONTINUE; END IF;

        -- Buscar custo unitário do produto gravado no sale_items
        SELECT COALESCE(unit_cost, 0) INTO v_cost_price
        FROM public.sale_items
        WHERE sale_id = r.sale_id AND product_id = r.product_id
        LIMIT 1;

        -- Buscar taxas registradas na venda
        SELECT COALESCE(payment_fee_amount, 0), COALESCE(payment_fee_amount_2, 0)
        INTO v_sale_payment_fee, v_sale_payment_fee_2
        FROM public.sales
        WHERE id = r.sale_id;
        
        v_total_fees := v_sale_payment_fee + v_sale_payment_fee_2;

        -- Receita total das ordens P2P desta venda
        SELECT COALESCE(SUM(sale_price * quantity), 0) INTO v_total_p2p_revenue
        FROM public.partnership_orders
        WHERE sale_id = r.sale_id;

        -- Taxa proporcional
        IF v_total_p2p_revenue > 0 THEN
          v_item_fee_ratio := (r.sale_price * r.quantity) / v_total_p2p_revenue;
        END IF;
        v_item_fees := v_total_fees * v_item_fee_ratio;
        v_item_fees_per_unit := CASE WHEN r.quantity > 0 THEN v_item_fees / r.quantity ELSE 0 END;

        -- Custo proporcional
        IF v_contract.cost_recovery_type = 'owner_100' THEN
          v_cost_slice_creditor := v_cost_price;
        ELSIF v_contract.cost_recovery_type = 'shared_50_50' THEN
          v_cost_slice_creditor := v_cost_price * 0.5;
        ELSIF v_contract.cost_recovery_type = 'custom' THEN
          v_cost_slice_creditor := v_cost_price * (COALESCE(v_contract.cost_recovery_owner_percent, 100) / 100.0);
        END IF;

        v_lucro_bruto := GREATEST(0, r.sale_price - v_cost_price);

        -- Rateio financeiro
        IF v_contract.fee_responsibility_type = 'shared_50_50' THEN
          v_profit_slice_creditor := GREATEST(0, v_lucro_bruto - v_item_fees_per_unit) * (v_contract.profit_split_partner_percent / 100.0);
          v_fee_slice_creditor := 0;
          v_total_owed := (v_cost_slice_creditor + v_profit_slice_creditor) * r.quantity;
        ELSE
          v_profit_slice_creditor := v_lucro_bruto * (v_contract.profit_split_partner_percent / 100.0);
          IF v_contract.fee_responsibility_type = 'custom' THEN
            v_fee_slice_creditor := v_item_fees * (1 - COALESCE(v_contract.fee_responsibility_seller_percent, 100) / 100.0);
          END IF;
          v_total_owed := GREATEST(0, (v_cost_slice_creditor + v_profit_slice_creditor) * r.quantity - v_fee_slice_creditor);
        END IF;

        -- Inserir acerto pendente
        INSERT INTO public.partnership_settlements (
          partnership_id,
          partnership_order_id,
          debtor_id,
          creditor_id,
          cost_slice,
          profit_slice,
          fee_slice,
          amount_owed,
          status
        ) VALUES (
          r.partnership_id,
          r.id,
          r.seller_id,
          r.owner_id,
          v_cost_slice_creditor * r.quantity,
          v_profit_slice_creditor * r.quantity,
          v_fee_slice_creditor,
          v_total_owed,
          'open'
        );
        
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Backfill de acertos concluído: % novos acertos gerados.', v_count;
END;
$$;
