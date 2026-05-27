-- ============================================================
-- Mensagens de notificação editáveis pelo admin
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  event_type text PRIMARY KEY,
  template   text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_templates" ON public.notification_templates;
CREATE POLICY "admins_manage_templates" ON public.notification_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can read (edge function usa service_role, ignora RLS)
DROP POLICY IF EXISTS "authenticated_read_templates" ON public.notification_templates;
CREATE POLICY "authenticated_read_templates" ON public.notification_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Templates padrão
INSERT INTO public.notification_templates (event_type, template) VALUES
('new_order',
E'🛍️ *Nova venda no catálogo!*\n\nO cliente *{{nome}}* acabou de fazer um pedido.\n💰 Valor: {{valor}}\n📋 Código: {{codigo}}\n\nAcesse o sistema para confirmar e processar! ✅'),
('partner_order',
E'🤝 *Novo pedido via ponto parceiro!*\n\nO cliente *{{nome}}* fez um pedido no ponto *{{parceiro}}*.\n💰 Valor: {{valor}}\n📋 Código: {{codigo}}\n\nAcesse o sistema para processar! ✅'),
('customer_signup',
E'👋 *Nova cliente cadastrada!*\n\n*{{nome}}* se cadastrou na sua loja online.\n📱 WhatsApp: {{telefone}}\n\nQue tal entrar em contato e fechar uma venda? 😊'),
('bag_accepted',
E'👜 *Malinha respondida!*\n\n*{{cliente}}* respondeu sobre a malinha *{{malinha}}*.\n✅ Peças que ficaram: {{pecas_ficaram}}\n\nAcesse o sistema para fazer o acerto com ela!'),
('bag_finalized',
E'✅ *Malinha finalizada!*\n\nO acerto da malinha de *{{cliente}}* foi concluído.\n🛍️ Peças compradas: {{pecas_compradas}}\n💰 Valor: {{valor}}'),
('birthday',
E'🎂 *Aniversariante(s) hoje!*\n\n{{nomes}} ({{quantidade}} no total).\n\nQue tal mandar uma mensagem especial e oferecer um cupom? 🎁'),
('overdue_installment',
E'⚠️ *Atenção: parcelas vencidas!*\n\nVocê tem *{{quantidade}} parcela(s) vencida(s)* em aberto.\n\nAcesse Vendas a Prazo no sistema para cobrar suas clientes. 💬')
ON CONFLICT (event_type) DO NOTHING;
