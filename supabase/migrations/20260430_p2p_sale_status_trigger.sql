-- SCRIPT: Trigger para concluir venda após acerto de contas
-- Altera o status da venda para 'completed' quando todos os acertos vinculados a ela forem pagos

CREATE OR REPLACE FUNCTION check_and_complete_p2p_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_sale_id UUID;
    v_open_count INT;
BEGIN
    IF NEW.status = 'settled' AND OLD.status = 'open' THEN
        -- Localiza a venda original a partir do pedido de parceria
        SELECT sale_id INTO v_sale_id 
        FROM public.partnership_orders 
        WHERE id = NEW.partnership_order_id;

        IF v_sale_id IS NOT NULL THEN
            -- Verifica se ainda existem acertos abertos para esta mesma venda
            SELECT count(*) INTO v_open_count
            FROM public.partnership_orders po
            JOIN public.partnership_settlements ps ON ps.partnership_order_id = po.id
            WHERE po.sale_id = v_sale_id AND ps.status = 'open';

            -- Se não houver mais nenhum aberto, muda a venda para Concluída
            IF v_open_count = 0 THEN
                UPDATE public.sales 
                SET status = 'completed' 
                WHERE id = v_sale_id AND status = 'p2p_settlement';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_settlement_paid ON public.partnership_settlements;
CREATE TRIGGER on_settlement_paid
AFTER UPDATE OF status ON public.partnership_settlements
FOR EACH ROW EXECUTE PROCEDURE check_and_complete_p2p_sale();

-- Atualizar vendas passadas que estão como 'open' ou 'completed' mas que são de parceria
UPDATE public.sales s
SET status = 'p2p_settlement'
WHERE status IN ('open', 'completed')
AND (shipping_method IS NULL OR shipping_method NOT IN ('postal', 'app'))
AND EXISTS (
    SELECT 1 FROM public.partnership_orders po 
    JOIN public.partnership_settlements ps ON ps.partnership_order_id = po.id
    WHERE po.sale_id = s.id AND ps.status = 'open'
);
