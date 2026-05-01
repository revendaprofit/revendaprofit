-- SCRIPT: Correção Retroativa de Vendas em Parceria
-- Este script vasculha todas as vendas passadas (sale_items) e cria os acertos de contas (partnership_settlements) 
-- para produtos próprios que estavam em sociedade, mas foram vendidos antes da atualização de hoje.

DO $$
DECLARE
    r_item RECORD;
    v_order_id UUID;
    v_seller_id UUID;
    
    v_contract RECORD;
    
    v_original_owner_id UUID;
    v_creditor_id UUID;
    v_is_my_own_product BOOLEAN;
    
    v_cost_slice_creditor NUMERIC(10,2);
    v_profit_slice_creditor NUMERIC(10,2);
    v_lucro NUMERIC(10,2);
    v_total_owed NUMERIC(10,2);
    v_custom_cost_perc NUMERIC;
BEGIN
    -- Procurar todos os itens vendidos que:
    -- 1. Fazem parte de uma parceria ativa (partnership_shared_products)
    -- 2. Ainda NÃO têm um partnership_orders gerado para a respectiva venda.
    FOR r_item IN
        SELECT 
            si.id AS sale_item_id,
            si.sale_id,
            si.product_id,
            si.variant_id,
            si.quantity,
            si.unit_price,
            COALESCE(si.unit_cost, p.cost_price, 0) AS unit_cost,
            s.status AS sale_status,
            p.owner_id AS product_owner_id,
            psp.partnership_id,
            psp.owner_id AS psp_owner_id, -- quem compartilhou
            part.requester_id,
            part.receiver_id,
            part.cost_recovery_type,
            part.cost_recovery_owner_percent,
            part.profit_split_partner_percent,
            s.created_at AS sale_date
        FROM public.sale_items si
        JOIN public.sales s ON s.id = si.sale_id
        JOIN public.products p ON p.id = si.product_id
        JOIN public.partnership_shared_products psp ON psp.product_id = si.product_id
        JOIN public.partnerships part ON part.id = psp.partnership_id
        WHERE part.status = 'active'
          AND s.status NOT IN ('cancelled') -- Ignora vendas canceladas
          AND NOT EXISTS (
              SELECT 1 FROM public.partnership_orders po 
              WHERE po.sale_id = si.sale_id AND po.product_id = si.product_id
          )
    LOOP
        v_seller_id := r_item.product_owner_id; 
        
        IF r_item.requester_id = v_seller_id THEN
            v_creditor_id := r_item.receiver_id;
        ELSE
            v_creditor_id := r_item.requester_id;
        END IF;

        v_original_owner_id := v_seller_id;
        v_is_my_own_product := TRUE;

        INSERT INTO public.partnership_orders (
            partnership_id,
            seller_id,
            owner_id,
            product_id,
            variant_id,
            sale_id,
            quantity,
            sale_price,
            status
        ) VALUES (
            r_item.partnership_id,
            v_seller_id,
            v_original_owner_id,
            r_item.product_id,
            r_item.variant_id,
            r_item.sale_id,
            r_item.quantity,
            r_item.unit_price,
            'confirmed'
        ) RETURNING id INTO v_order_id;

        v_custom_cost_perc := r_item.cost_recovery_owner_percent / 100.0;
        v_cost_slice_creditor := 0;

        IF r_item.cost_recovery_type = 'owner_100' THEN
            v_cost_slice_creditor := 0;
        ELSIF r_item.cost_recovery_type = 'shared_50_50' THEN
            v_cost_slice_creditor := r_item.unit_cost * 0.5;
        ELSIF r_item.cost_recovery_type = 'custom' THEN
            v_cost_slice_creditor := r_item.unit_cost * (1 - v_custom_cost_perc);
        END IF;

        v_lucro := GREATEST(0, r_item.unit_price - r_item.unit_cost);
        v_profit_slice_creditor := v_lucro * (r_item.profit_split_partner_percent / 100.0);
        
        v_total_owed := (v_cost_slice_creditor + v_profit_slice_creditor) * r_item.quantity;

        IF v_total_owed > 0 THEN
            INSERT INTO public.partnership_settlements (
                partnership_id,
                partnership_order_id,
                debtor_id,
                creditor_id,
                amount_owed,
                cost_slice,
                profit_slice,
                status
            ) VALUES (
                r_item.partnership_id,
                v_order_id,
                v_seller_id,
                v_creditor_id,
                v_total_owed,
                v_cost_slice_creditor * r_item.quantity,
                v_profit_slice_creditor * r_item.quantity,
                'open'
            );
        END IF;
        
        RAISE NOTICE 'Sale % corrigida. Criado acerto P2P de R$ % para o parceiro %', r_item.sale_id, v_total_owed, v_creditor_id;
    END LOOP;
END;
$$;
