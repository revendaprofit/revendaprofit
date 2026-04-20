-- BAZAR VIP: Trigger de notificação para novos itens submetidos
CREATE OR REPLACE FUNCTION notify_new_bazar_item()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
        VALUES (
            NEW.owner_id,
            'bazar_new_item',
            '🏷️ Nova Peça no Bazar VIP',
            'Um vendedor enviou "' || NEW.title || '" para curadoria. Analise e defina o preço.',
            '/bazar-admin',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_bazar_item ON public.bazar_items;
CREATE TRIGGER trigger_notify_bazar_item
    AFTER INSERT ON public.bazar_items
    FOR EACH ROW EXECUTE FUNCTION notify_new_bazar_item();

-- Permitir insert de notificações via trigger (SECURITY DEFINER) 
-- já cobre o INSERT no trigger, mas garantir policy de INSERT para o sistema:
DROP POLICY IF EXISTS "Sistema pode inserir notificações" ON public.notifications;
CREATE POLICY "Sistema pode inserir notificações"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
