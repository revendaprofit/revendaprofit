-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias notificações" ON public.notifications
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Usuários atualizam (leitura) suas notificações" ON public.notifications
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Usuários deletam suas notificações" ON public.notifications
    FOR DELETE USING (auth.uid() = owner_id);


-- 1. Trigger: P2P Order Requests & 7. Acceptance/Decline
CREATE OR REPLACE FUNCTION notify_partnership_order_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending_confirmation' THEN
       -- Notificar o dono do produto
       INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
       VALUES (NEW.owner_id, 'p2p_order_request', 'Nova solicitação P2P', 'Você tem uma nova venda aguardando aprovação de estoque P2P.', '/partnerships', NEW.id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
       IF NEW.status = 'approved' THEN
          -- Notificar o vendedor que foi aprovado
          INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
          VALUES (NEW.seller_id, 'p2p_order_approved', 'Venda P2P Aprovada', 'O parceiro aprovou e despachará sua venda P2P.', '/partnerships', NEW.id);
       ELSIF NEW.status = 'rejected' THEN
          INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
          VALUES (NEW.seller_id, 'p2p_order_rejected', 'Venda P2P Recusada', 'O parceiro recusou sua venda P2P. Verifique com o cliente.', '/partnerships', NEW.id);
       END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_partnership_order ON public.partnership_orders;
CREATE TRIGGER trigger_notify_partnership_order
    AFTER INSERT OR UPDATE ON public.partnership_orders
    FOR EACH ROW EXECUTE FUNCTION notify_partnership_order_changes();


-- 2. Trigger: Parcerias Novas
CREATE OR REPLACE FUNCTION notify_new_partnership_request()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
       -- Notificar a loja destino (a origin_store_id não tá clara na tabela standard de partnership, vamos pegar pelo criador?)
       -- Sabemos que auth.uid() criou, então notifica o outro
       IF auth.uid() = NEW.user1_id THEN
           INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
           VALUES (NEW.user2_id, 'partnership_request', 'Nova Solicitação de Parceria', 'Uma loja quer se associar ao seu catálogo P2P.', '/partnerships', NEW.id);
       ELSE
           INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
           VALUES (NEW.user1_id, 'partnership_request', 'Nova Solicitação de Parceria', 'Uma loja quer se associar ao seu catálogo P2P.', '/partnerships', NEW.id);
       END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_partnership ON public.partnerships;
CREATE TRIGGER trigger_notify_new_partnership
    AFTER INSERT ON public.partnerships
    FOR EACH ROW EXECUTE FUNCTION notify_new_partnership_request();


-- 3. Trigger: Mudança Status HUB Fulfillment
CREATE OR REPLACE FUNCTION notify_hub_order_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
        VALUES (NEW.tenant_id, 'hub_order_update', 'Atualização em Pedido Hub', 'O fornecedor alterou o status do envio do seu pedido.', '/hub/orders', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_hub_order ON public.hub_fulfillment_orders;
CREATE TRIGGER trigger_notify_hub_order
    AFTER UPDATE ON public.hub_fulfillment_orders
    FOR EACH ROW EXECUTE FUNCTION notify_hub_order_status();


-- 4. Trigger: Novos Produtos Hub
CREATE OR REPLACE FUNCTION notify_new_hub_product()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Notifica de forma bulk todos os Lojistas que usam o sistema 
        -- Pega todos os lojistas do hub_connections (ou logistas ativos). Vamos pegar das conexões de hub:
        INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
        SELECT hc.tenant_id, 'new_hub_product', 'Novo Produto no Hub', 'Um fornecedor que você acompanha adicionou ' || NEW.name, '/hub', NEW.id
        FROM public.hub_connections hc
        WHERE hc.supplier_id = NEW.supplier_id AND hc.status = 'connected';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_hub_product ON public.hub_products;
CREATE TRIGGER trigger_notify_new_hub_product
    AFTER INSERT ON public.hub_products
    FOR EACH ROW EXECUTE FUNCTION notify_new_hub_product();


-- 5 & 6. Trigger: Bolsa Consignada respondida (Aprovação ou Troca)
CREATE OR REPLACE FUNCTION notify_consignment_bag_answered()
RETURNS TRIGGER AS $$
DECLARE
    tem_troca BOOLEAN;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'with_customer' AND NEW.status = 'pending_approval' THEN
        
        -- Verificar se existe pedido de troca na malinha
        SELECT EXISTS(
            SELECT 1 FROM public.consignment_bag_items i WHERE i.bag_id = NEW.id AND i.customer_decision = 'wrong_size'
        ) INTO tem_troca;

        IF tem_troca THEN
            INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
            VALUES (NEW.owner_id, 'bag_answered_with_exchange', 'Malinha Respondida com Troca!', 'O cliente separou algumas peças mas solicitou novos tamanhos.', '/consignment-bags', NEW.id);
        ELSE
            INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
            VALUES (NEW.owner_id, 'bag_answered', 'Malinha Respondida!', 'O cliente finalizou a malinha e escolheu o que vai ficar. Faça o acerto.', '/consignment-bags', NEW.id);
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_consignment_bag ON public.consignment_bags;
CREATE TRIGGER trigger_notify_consignment_bag
    AFTER UPDATE ON public.consignment_bags
    FOR EACH ROW EXECUTE FUNCTION notify_consignment_bag_answered();
