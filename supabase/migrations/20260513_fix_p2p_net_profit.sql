-- CORREÇÃO RETROATIVA: Recalcular TODOS os partnership_settlements
-- 
-- MODELO A (fee_responsibility = shared_50_50):
--   Taxa é abatida do lucro bruto ANTES da divisão 85/15
--   profit_slice = (lucroBruto - taxaProporcional) × 15%
--   fee_slice = 0, amount_owed = (cost + profit) × qty
--
-- MODELO B (fee_responsibility = seller_100 ou custom):
--   Lucro bruto é dividido primeiro, depois cada sócia paga sua taxa
--   profit_slice = lucroBruto × 15%
--   fee_slice = taxa × parceira%, amount_owed = (cost + profit) × qty - fee_slice

DO $$
DECLARE
    r RECORD;
    v_total_fees NUMERIC(10,2);
    v_total_p2p_revenue NUMERIC(10,2);
    v_item_revenue NUMERIC(10,2);
    v_item_fee_ratio NUMERIC;
    v_item_fees NUMERIC(10,2);
    v_item_fees_per_unit NUMERIC(10,2);
    v_lucro_bruto NUMERIC(10,2);
    v_lucro_liquido NUMERIC(10,2);
    v_cost_price NUMERIC(10,2);
    v_sale_price NUMERIC(10,2);
    v_qty INTEGER;
    v_profit_split NUMERIC(5,2);
    v_is_my_own_product BOOLEAN;
    v_cost_slice_creditor NUMERIC(10,2);
    v_profit_slice_creditor NUMERIC(10,2);
    v_fee_slice_creditor NUMERIC(10,2);
    v_total_owed NUMERIC(10,2);
    v_count INTEGER := 0;
BEGIN
    FOR r IN
        SELECT 
            ps.id AS settlement_id,
            ps.amount_owed AS old_amount_owed,
            ps.profit_slice AS old_profit_slice,
            ps.fee_slice AS old_fee_slice,
            po.sale_id,
            po.product_id,
            po.sale_price,
            po.quantity,
            po.seller_id,
            po.owner_id,
            p.profit_split_partner_percent,
            p.cost_recovery_type,
            p.cost_recovery_owner_percent,
            p.fee_responsibility_type,
            p.fee_responsibility_seller_percent,
            s.payment_fee_amount,
            s.payment_fee_amount_2
        FROM public.partnership_settlements ps
        JOIN public.partnership_orders po ON po.id = ps.partnership_order_id
        JOIN public.partnerships p ON p.id = ps.partnership_id
        JOIN public.sales s ON s.id = po.sale_id
        WHERE s.status NOT IN ('cancelled')
    LOOP
        v_sale_price := r.sale_price;
        v_qty := r.quantity;
        v_profit_split := r.profit_split_partner_percent;
        v_is_my_own_product := (r.seller_id = r.owner_id);

        -- Buscar custo unitário
        SELECT COALESCE(si.unit_cost, prod.cost_price, 0) INTO v_cost_price
        FROM public.sale_items si
        JOIN public.products prod ON prod.id = si.product_id
        WHERE si.sale_id = r.sale_id AND si.product_id = r.product_id
        LIMIT 1;

        IF v_cost_price IS NULL THEN v_cost_price := 0; END IF;

        -- Taxa total da venda
        v_total_fees := COALESCE(r.payment_fee_amount, 0) + COALESCE(r.payment_fee_amount_2, 0);
        
        -- Receita total P2P da venda
        SELECT COALESCE(SUM(po2.sale_price * po2.quantity), 0) 
        INTO v_total_p2p_revenue
        FROM public.partnership_orders po2 
        WHERE po2.sale_id = r.sale_id;
        
        -- Taxa proporcional deste item
        v_item_revenue := v_sale_price * v_qty;
        v_item_fee_ratio := CASE WHEN v_total_p2p_revenue > 0 
            THEN v_item_revenue / v_total_p2p_revenue ELSE 1 END;
        v_item_fees := v_total_fees * v_item_fee_ratio;
        v_item_fees_per_unit := CASE WHEN v_qty > 0 THEN v_item_fees / v_qty ELSE 0 END;
        
        -- Custo (conforme regra do contrato)
        v_cost_slice_creditor := 0;
        IF r.cost_recovery_type = 'owner_100' THEN
            v_cost_slice_creditor := CASE WHEN v_is_my_own_product THEN 0 ELSE v_cost_price END;
        ELSIF r.cost_recovery_type = 'shared_50_50' THEN
            v_cost_slice_creditor := v_cost_price * 0.5;
        ELSIF r.cost_recovery_type = 'custom' THEN
            v_cost_slice_creditor := CASE WHEN v_is_my_own_product 
                THEN v_cost_price * (1 - r.cost_recovery_owner_percent / 100.0)
                ELSE v_cost_price * (r.cost_recovery_owner_percent / 100.0) END;
        END IF;
        
        v_lucro_bruto := GREATEST(0, v_sale_price - v_cost_price);

        -- ═══════════════════════════════════════════════════
        -- MODELO A vs MODELO B
        -- ═══════════════════════════════════════════════════
        IF r.fee_responsibility_type = 'shared_50_50' THEN
            -- MODELO A: taxa abatida do lucro ANTES da divisão
            v_lucro_liquido := GREATEST(0, v_lucro_bruto - v_item_fees_per_unit);
            v_profit_slice_creditor := v_lucro_liquido * (v_profit_split / 100.0);
            v_fee_slice_creditor := 0;
            v_total_owed := (v_cost_slice_creditor + v_profit_slice_creditor) * v_qty;
        ELSE
            -- MODELO B: divide o bruto, depois cada sócia paga sua taxa
            v_profit_slice_creditor := v_lucro_bruto * (v_profit_split / 100.0);
            v_fee_slice_creditor := 0;
            IF r.fee_responsibility_type = 'custom' THEN
                v_fee_slice_creditor := v_item_fees * (1 - r.fee_responsibility_seller_percent / 100.0);
            END IF;
            -- seller_100: v_fee_slice_creditor = 0 (vendedora paga tudo)
            v_total_owed := GREATEST(0, (v_cost_slice_creditor + v_profit_slice_creditor) * v_qty - v_fee_slice_creditor);
        END IF;
        
        -- Atualizar settlement
        UPDATE public.partnership_settlements 
        SET 
            cost_slice = v_cost_slice_creditor * v_qty,
            profit_slice = v_profit_slice_creditor * v_qty,
            fee_slice = v_fee_slice_creditor,
            amount_owed = v_total_owed
        WHERE id = r.settlement_id;
        
        v_count := v_count + 1;
        
        RAISE NOTICE 'Settlement % [%]: amount R$% → R$%, profit R$% → R$%', 
            r.settlement_id,
            r.fee_responsibility_type,
            r.old_amount_owed, ROUND(v_total_owed, 2),
            r.old_profit_slice, ROUND(v_profit_slice_creditor * v_qty, 2);
    END LOOP;
    
    RAISE NOTICE '✅ Total: % settlements recalculados.', v_count;
END;
$$;
