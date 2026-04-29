-- FIX: O trigger notify_new_partnership_request referenciava NEW.user1_id e NEW.user2_id
-- mas a tabela partnerships usa requester_id e receiver_id.
-- Isso causava "TypeError: Failed to fetch" ao criar uma nova parceria.

CREATE OR REPLACE FUNCTION notify_new_partnership_request()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
       -- Notifica o receiver (parceira convidada)
       INSERT INTO public.notifications (owner_id, type, title, message, link, related_entity_id)
       VALUES (NEW.receiver_id, 'partnership_request', 'Nova Solicitação de Parceria', 'Uma loja quer se associar ao seu catálogo P2P.', '/partnerships', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
