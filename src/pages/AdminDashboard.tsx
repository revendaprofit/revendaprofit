import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Users, Store, Factory, PlusCircle, Search, ShieldCheck, X, ShieldOff, AlertTriangle, Key, Copy, Loader2, Trash2, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'lojistas' | 'fornecedores'>('lojistas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState('store_owner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });

  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // BotConversa webhook config
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  // Notification templates
  const EVENT_TYPES = [
    { key: 'new_order',           label: 'Nova venda no catálogo',     emoji: '🛍️', vars: ['nome','valor','codigo'] },
    { key: 'partner_order',       label: 'Venda via ponto parceiro',   emoji: '🤝', vars: ['nome','parceiro','valor','codigo'] },
    { key: 'customer_signup',     label: 'Nova cliente cadastrada',    emoji: '👋', vars: ['nome','telefone'] },
    { key: 'bag_accepted',        label: 'Malinha respondida',         emoji: '👜', vars: ['cliente','malinha','pecas_ficaram'] },
    { key: 'bag_finalized',       label: 'Malinha finalizada',         emoji: '✅', vars: ['cliente','malinha','pecas_compradas','valor'] },
    { key: 'birthday',            label: 'Aniversariante(s) hoje',     emoji: '🎂', vars: ['nomes','quantidade'] },
    { key: 'overdue_installment', label: 'Parcelas vencidas',          emoji: '⚠️', vars: ['quantidade'] },
  ];

  const SAMPLE_VARS: Record<string, Record<string, string>> = {
    new_order:           { nome: 'Maria Silva', valor: 'R$ 189,90', codigo: 'PED-0042' },
    partner_order:       { nome: 'Ana Lima', parceiro: 'Ponto Centro', valor: 'R$ 250,00', codigo: 'PED-0043' },
    customer_signup:     { nome: 'Beatriz Santos', telefone: '5511988887777' },
    bag_accepted:        { cliente: 'Juliana Costa', malinha: 'Malinha 03', pecas_ficaram: '4' },
    bag_finalized:       { cliente: 'Juliana Costa', malinha: 'Malinha 03', pecas_compradas: '4', valor: 'R$ 360,00' },
    birthday:            { nomes: 'Carla, Fernanda', quantidade: '2' },
    overdue_installment: { quantidade: '3' },
  };

  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [testingEvent, setTestingEvent] = useState<string | null>(null);

  const handleTestEvent = async (eventKey: string) => {
    const url = webhookUrl.trim();
    if (!url) return toast.error('Configure e salve a URL do webhook primeiro.');
    const phone = testPhone.replace(/\D/g, '');
    if (!phone) return toast.error('Informe o número de WhatsApp para receber o teste.');

    const template = templates[eventKey] ?? '';
    const sampleVars = SAMPLE_VARS[eventKey] ?? {};
    const mensagem = template.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVars[key] ?? `{{${key}}}`);

    setTestingEvent(eventKey);
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.startsWith('55') ? phone : `55${phone}`, mensagem, ...sampleVars }),
      });
      toast.success('Mensagem de teste enviada! Verifique o WhatsApp.');
    } catch (e: any) {
      toast.error('Erro ao enviar: ' + e.message);
    } finally {
      setTestingEvent(null);
    }
  };

  useEffect(() => {
    supabase.from('system_config').select('value').eq('key', 'botconversa_webhook_url').single()
      .then(({ data }) => { if (data?.value) setWebhookUrl(data.value); });
    supabase.from('notification_templates').select('event_type, template')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => { map[row.event_type] = row.template; });
          setTemplates(map);
        }
      });
  }, []);

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    const rows = Object.entries(templates).map(([event_type, template]) => ({
      event_type,
      template,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('notification_templates')
      .upsert(rows, { onConflict: 'event_type' });
    setSavingTemplates(false);
    if (error) toast.error('Erro ao salvar templates: ' + error.message);
    else toast.success('Mensagens de notificação salvas!');
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    const { error } = await supabase.from('system_config').upsert(
      { key: 'botconversa_webhook_url', value: webhookUrl.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    setSavingWebhook(false);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else toast.success('URL do webhook BotConversa salva!');
  };

  const handleTestWebhook = async () => {
    const url = webhookUrl.trim();
    if (!url) return toast.error('Salve a URL do webhook antes de testar.');
    setSendingTest(true);
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:           '5511999999999',
          mensagem:        '🧪 Mensagem de teste do Revenda Profit! Se você está vendo isso, o webhook está funcionando corretamente.',
          nome:            'João Silva',
          valor:           'R$ 250,00',
          codigo:          'PED-0001',
          parceiro:        'Ponto Norte',
          cliente:         'Maria Souza',
          malinha:         'Malinha 01',
          pecas_ficaram:   '3',
          pecas_compradas: '3',
          nomes:           'Ana, Beatriz',
          quantidade:      '2',
          telefone:        '5511999999999',
        }),
      });
      toast.success('Payload enviado! Abra o BotConversa para mapear as variáveis.');
    } catch (e: any) {
      toast.error('Erro ao enviar: ' + e.message);
    } finally {
      setSendingTest(false);
    }
  };
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      // Retorna os perfis. Precisafemos garantir que a policy permite ao SuperAdmin
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, role, status, plan, plan_due_date, created_at').order('created_at', { ascending: false });
      if (error) {
        console.warn("Sem permissão ou erro:", error);
        return [];
      }
      return data || [];
    }
  });

  const tenants = profiles?.filter(p => p.role === 'store_owner' || p.role === 'user') || [];
  const suppliers = profiles?.filter(p => p.role === 'supplier') || [];

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: string }) => {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
       queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
       toast.success(newStatus === 'active' ? "Conta reativada com sucesso!" : "Conta suspensa!");
       if (selectedEntity) {
          setSelectedEntity({ ...selectedEntity, status: newStatus });
       }
    },
    onError: (error: any) => {
       toast.error("Erro ao alterar status: " + error.message);
    }
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ id, newPlan }: { id: string, newPlan: string }) => {
      const { error } = await supabase.from('profiles').update({ plan: newPlan }).eq('id', id);
      if (error) throw error;
      return newPlan;
    },
    onSuccess: (newPlan) => {
       queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
       toast.success(`Plano atualizado para ${newPlan === 'premium' ? 'Premium' : 'Free'}!`);
       if (selectedEntity) {
          setSelectedEntity({ ...selectedEntity, plan: newPlan });
       }
    },
    onError: (error: any) => {
       toast.error("Erro ao alterar plano: " + error.message);
    }
  });

  const updateDueDateMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string, newDate: string }) => {
      const { error } = await supabase.from('profiles').update({ plan_due_date: newDate || null }).eq('id', id);
      if (error) throw error;
      return newDate;
    },
    onSuccess: (newDate) => {
       queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
       toast.success(`Data de vencimento do plano salva!`);
       if (selectedEntity) {
          setSelectedEntity({ ...selectedEntity, plan_due_date: newDate });
       }
    },
    onError: (error: any) => {
       toast.error("Erro ao alterar vencimento: " + error.message);
    }
  });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tenant', {
        body: { role: modalRole, ...formData }
      });
      if (error) {
         throw new Error(error.message);
      }
      
      if (data && data.success === false) {
          throw new Error(data.error);
      }
      toast.success(modalRole === 'supplier' ? 'Fornecedor criado com sucesso!' : 'Lojista criado com sucesso!');
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (err: any) {
      toast.error('Erro ao criar: ' + err.message, { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER DA SALA DE COMANDO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
        
        <div className="flex items-center gap-4 relative z-10">
           <div className="bg-primary/20 p-3.5 rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
             <ShieldAlert className="w-8 h-8 text-primary" />
           </div>
           <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Sala de Comando</h1>
              <p className="text-slate-400 font-medium mt-1">Gerenciamento global do ecossistema SaaS</p>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
           <Button onClick={() => { setModalRole('store_owner'); setIsModalOpen(true); }} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/25 font-bold transition-transform active:scale-95">
              <PlusCircle className="w-5 h-5 mr-2" />
              Novo Assinante
           </Button>
        </div>
      </div>

      {/* TABS DE SELEÇÃO */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-px">
         <button 
           onClick={() => setActiveTab('lojistas')}
           className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'lojistas' ? 'border-primary text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
            <div className="flex items-center gap-2">
               <Store className="w-4 h-4" />
               Lojistas (Tenants)
               <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px] ml-1">{tenants.length}</span>
            </div>
         </button>
         <button 
           onClick={() => setActiveTab('fornecedores')}
           className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'fornecedores' ? 'border-primary text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
            <div className="flex items-center gap-2">
               <Factory className="w-4 h-4" />
               Fornecedores (Hub)
               <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px] ml-1">{suppliers.length}</span>
            </div>
         </button>
      </div>

      {/* ÁREA DE CONTEÚDO (LOJISTAS) */}
      {activeTab === 'lojistas' && (
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
               <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <Input className="pl-11 h-11 bg-white border-slate-200 rounded-xl" placeholder="Buscar por nome da loja ou email..." />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead>
                     <tr className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Tenant / Lojista</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Data de Cadastro</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {isLoading ? (
                         <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-medium">Buscando assinantes...</td></tr>
                     ) : tenants.length === 0 ? (
                         <tr>
                            <td colSpan={4} className="text-center py-16">
                               <div className="flex flex-col items-center justify-center text-slate-400">
                                  <Store className="w-10 h-10 mb-3 opacity-20" />
                                  <p className="font-medium text-slate-500">Nenhum lojista encontrado.</p>
                                  <p className="text-xs mt-1">Crie o primeiro assinante para ver aqui.</p>
                               </div>
                            </td>
                         </tr>
                     ) : tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Store className="w-4 h-4 text-primary" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{tenant.full_name || 'Loja Sem Nome'}</span>
                                    <span className="text-xs text-slate-500 font-medium">{tenant.email || 'Sem email'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {tenant.status === 'suspended' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Suspenso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ativo
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                              {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <Button variant="outline" size="sm" onClick={() => setSelectedEntity(tenant)} className="h-8 text-xs font-bold rounded-lg border-slate-200">Gerenciar</Button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* ÁREA DE CONTEÚDO (FORNECEDORES) */}
      {activeTab === 'fornecedores' && (
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
               <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <Input className="pl-11 h-11 bg-white border-slate-200 rounded-xl" placeholder="Buscar fornecedor..." />
               </div>
               <Button onClick={() => { setModalRole('supplier'); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 font-bold">
                  <PlusCircle className="w-4 h-4 mr-2" /> Novo Fornecedor
               </Button>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead>
                     <tr className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Fornecedor</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Data de Cadastro</th>
                        <th className="px-6 py-4 text-right">Acoes</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {isLoading ? (
                         <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-medium">Buscando fornecedores...</td></tr>
                     ) : suppliers.length === 0 ? (
                         <tr>
                            <td colSpan={4} className="text-center py-16">
                               <div className="flex flex-col items-center justify-center text-slate-400">
                                  <Factory className="w-10 h-10 mb-3 opacity-20" />
                                  <p className="font-medium text-slate-500">Nenhum fornecedor encontrado.</p>
                                  <p className="text-xs mt-1">Crie o primeiro fornecedor parceiro.</p>
                               </div>
                            </td>
                         </tr>
                     ) : suppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                    <Factory className="w-4 h-4 text-white" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{supplier.full_name || 'Fornecedor Sem Nome'}</span>
                                    <span className="text-xs text-slate-500 font-medium">{supplier.email || 'Sem email'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {supplier.status === 'suspended' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Suspenso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ativo
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                              {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <Button variant="outline" size="sm" onClick={() => setSelectedEntity(supplier)} className="h-8 text-xs font-bold rounded-lg border-slate-200">Gerenciar</Button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* MODAL DE CRIAÇÃO OMNI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${modalRole === 'supplier' ? 'bg-slate-900 text-white' : 'bg-primary/20 text-primary'}`}>
                  {modalRole === 'supplier' ? <Factory className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                   <h2 className="text-lg font-bold text-slate-900">Novo {modalRole === 'supplier' ? 'Fornecedor' : 'Lojista'}</h2>
                   <p className="text-xs text-slate-500">Criação de conta SaaS Controlada.</p>
                </div>
             </div>
             
             <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nome Corporativo da Entidade</label>
                  <Input required placeholder="Ex: Cross Imports LTDA" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Email (Administrador)</label>
                  <Input required type="email" placeholder="gestao@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Senha Inicial Provisória</label>
                  <Input required type="text" placeholder="Gere uma senha segura..." value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-11 border-slate-200" />
                </div>

                <div className="flex gap-3 pt-4">
                   <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold border-slate-200" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                   <Button type="submit" disabled={isSubmitting} className={`flex-1 h-11 rounded-xl font-bold text-white shadow-lg ${modalRole === 'supplier' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-primary hover:bg-primary/90'}`}>
                      {isSubmitting ? 'Homologando...' : 'Criar Entidade'}
                   </Button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO (MANAGE ENTITY) */}
      {selectedEntity && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-end sm:justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden animate-in slide-in-from-right-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div className="flex gap-4 items-center">
                   <div className={`p-3 rounded-xl shadow-sm ${selectedEntity.role === 'supplier' ? 'bg-slate-900 text-white' : 'bg-primary/10 text-primary'}`}>
                      {selectedEntity.role === 'supplier' ? <Factory className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 mb-0.5">{selectedEntity.full_name || 'Loja Sem Nome'}</h2>
                      <div className="flex gap-2 items-center">
                         <span className="text-xs font-semibold text-slate-400 capitalize">{selectedEntity.role === 'store_owner' ? 'Lojista' : selectedEntity.role}</span>
                         <span className="text-xs text-slate-300">•</span>
                         <span className="text-xs font-medium text-slate-500">{selectedEntity.email || 'Sem email vinculado'}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                   <X className="w-5 h-5" />
                </button>
             </div>

             <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Status Card */}
                <div className={`p-4 border rounded-xl flex items-center justify-between ${selectedEntity.status === 'suspended' ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedEntity.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                         {selectedEntity.status === 'suspended' ? <ShieldOff className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Status da Conta</p>
                         <p className={`font-bold ${selectedEntity.status === 'suspended' ? 'text-red-700' : 'text-emerald-700'}`}>
                           {selectedEntity.status === 'suspended' ? 'Conta Suspensa' : 'Conta Ativa'}
                         </p>
                      </div>
                   </div>
                   
                   <Button 
                     variant={selectedEntity.status === 'suspended' ? 'default' : 'secondary'}
                     className={selectedEntity.status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}
                     onClick={() => toggleStatusMutation.mutate({ id: selectedEntity.id, currentStatus: selectedEntity.status })}
                     disabled={toggleStatusMutation.isPending}
                   >
                     {toggleStatusMutation.isPending ? 'Aguarde...' : selectedEntity.status === 'suspended' ? 'Reativar Conta' : 'Suspender Acesso'}
                   </Button>
                </div>

                {/* Account Details */}
                <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-3">Gerenciamento do Contrato</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between col-span-1 sm:col-span-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Plano Atual</p>
                         <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                           <button 
                             className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${selectedEntity.plan === 'free' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                             onClick={() => changePlanMutation.mutate({ id: selectedEntity.id, newPlan: 'free' })}
                             disabled={changePlanMutation.isPending}
                           >
                             Free
                           </button>
                           <button 
                             className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${selectedEntity.plan === 'premium' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-primary hover:bg-primary/5'}`}
                             onClick={() => changePlanMutation.mutate({ id: selectedEntity.id, newPlan: 'premium' })}
                             disabled={changePlanMutation.isPending}
                           >
                             Premium
                           </button>
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vencimento do Plano</p>
                         <Input 
                            type="date"
                            className="bg-white border-slate-200 h-9 text-xs font-bold text-slate-700"
                            value={selectedEntity.plan_due_date || ''}
                            onChange={(e) => updateDueDateMutation.mutate({ id: selectedEntity.id, newDate: e.target.value })}
                            disabled={updateDueDateMutation.isPending}
                         />
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Adesão Em</p>
                         <p className="font-bold text-slate-800 mt-2">{new Date(selectedEntity.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                   </div>
                </div>

                {/* Admin Actions */}
                <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-3">Gerenciamento Avancado</h3>
                   <div className="space-y-2">
                        <Button 
                           variant="outline" 
                           className="w-full justify-start h-12 text-slate-600 border-slate-200 hover:bg-slate-50"
                           onClick={async () => {
                             try {
                               toast.loading('Gerando link...');
                               const { data, error } = await supabase.functions.invoke('admin-actions', {
                                 body: { action: 'reset_password', target_email: selectedEntity.email, target_user_id: selectedEntity.id }
                               });
                               toast.dismiss();
                               if (error || (data && !data.success)) {
                                 toast.error(data?.error || error?.message || 'Erro desconhecido');
                                 return;
                               }
                               if (data.recovery_link) {
                                 setRecoveryLink(data.recovery_link);
                                 toast.success('Link gerado com sucesso!');
                               } else {
                                 toast.success('Email enviado para ' + selectedEntity.email);
                               }
                             } catch (err: any) {
                               toast.dismiss();
                               toast.error('Erro: ' + err.message);
                             }
                           }}
                        >
                           <Key className="w-4 h-4 mr-3" /> Gerar Link de Nova Senha
                        </Button>

                        {recoveryLink && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Link de recuperacao (enviar ao lojista):</p>
                            <div className="flex items-center gap-2">
                              <input 
                                readOnly 
                                value={recoveryLink}
                                className="flex-1 text-[11px] text-emerald-800 bg-white border border-emerald-200 rounded-lg px-2 py-1.5 font-mono truncate"
                              />
                              <button 
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                onClick={() => { navigator.clipboard.writeText(recoveryLink); toast.success('Link copiado!'); }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {!confirmDelete ? (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start h-12 text-red-600 border-red-100 hover:bg-red-50"
                            onClick={() => setConfirmDelete(true)}
                          >
                            <AlertTriangle className="w-4 h-4 mr-3" /> Excluir Conta (Wipe Total)
                          </Button>
                        ) : (
                          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
                            <p className="text-sm font-bold text-red-700">Tem certeza absoluta?</p>
                            <p className="text-xs text-red-600">Todos os dados de <strong>{selectedEntity.full_name || selectedEntity.email}</strong> serao removidos para sempre.</p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1 text-slate-600 border-slate-200" 
                                onClick={() => setConfirmDelete(false)}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                  try {
                                    toast.loading('Excluindo conta...');
                                    const { data, error } = await supabase.functions.invoke('admin-actions', {
                                      body: { action: 'delete_user', target_user_id: selectedEntity.id }
                                    });
                                    toast.dismiss();
                                    if (error || (data && !data.success)) {
                                      toast.error(data?.error || error?.message || 'Erro ao excluir');
                                      return;
                                    }
                                    toast.success('Conta removida permanentemente.');
                                    setSelectedEntity(null);
                                    setConfirmDelete(false);
                                    setRecoveryLink(null);
                                    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
                                  } catch (err: any) {
                                    toast.dismiss();
                                    toast.error('Erro: ' + err.message);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Confirmar
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 text-center">Acoes administrativas permanentes.</p>
                </div>

             </div>
          </div>
        </div>
      )}

      {/* ── BotConversa Webhook Config ── */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-500/20 p-2.5 rounded-xl border border-green-500/30">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">BotConversa — Webhook Global</h2>
            <p className="text-slate-400 text-sm">URL usada para enviar notificações WhatsApp às lojistas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://backend.botconversa.com.br/api/v1/webhooks/catch/..."
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
          />
          <Button
            onClick={handleSaveWebhook}
            disabled={savingWebhook || !webhookUrl.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 shrink-0"
          >
            {savingWebhook ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
        <div className="mt-4 flex gap-3 items-center">
          <Input
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            placeholder="Seu WhatsApp para receber testes (ex: 11999999999)"
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-yellow-500"
          />
          <Button
            onClick={handleTestWebhook}
            disabled={sendingTest || !webhookUrl.trim()}
            variant="outline"
            className="shrink-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-xs px-4 whitespace-nowrap"
          >
            {sendingTest ? 'Enviando...' : '⚡ Teste Geral'}
          </Button>
        </div>
        <p className="text-slate-600 text-xs mt-2">O número acima é usado nos botões de teste de cada mensagem abaixo.</p>
      </div>

      {/* ── Mensagens de Notificação ── */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Mensagens de Notificação</h2>
              <p className="text-slate-400 text-sm">Texto enviado no campo <code className="text-blue-400">mensagem</code> para cada evento. Use <code className="text-blue-400">{'{{variavel}}'}</code> para inserir dados dinâmicos.</p>
            </div>
          </div>
          <Button
            onClick={handleSaveTemplates}
            disabled={savingTemplates}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shrink-0"
          >
            {savingTemplates ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>

        <div className="space-y-4">
          {EVENT_TYPES.map(({ key, label, emoji, vars }) => (
            <div key={key} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">{emoji} {label}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {vars.map(v => (
                    <code
                      key={v}
                      className="text-[10px] bg-slate-700 text-green-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-600 transition-colors"
                      title="Clique para copiar"
                      onClick={() => {
                        const tag = `{{${v}}}`;
                        navigator.clipboard.writeText(tag);
                        toast.success(`${tag} copiado!`);
                      }}
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
              <textarea
                value={templates[key] ?? ''}
                onChange={e => setTemplates(prev => ({ ...prev, [key]: e.target.value }))}
                rows={4}
                placeholder={`Mensagem para o evento "${label}"...`}
                className="w-full bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed"
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                  Dados de exemplo: {Object.entries(SAMPLE_VARS[key] ?? {}).map(([k, v]) => (
                    <span key={k} className="text-slate-500"><code className="text-green-500">{`{{${k}}}`}</code> = "{v}" </span>
                  ))}
                </p>
                <Button
                  onClick={() => handleTestEvent(key)}
                  disabled={testingEvent === key || !webhookUrl.trim()}
                  variant="outline"
                  className="shrink-0 border-slate-600 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300 text-xs px-3 h-8 whitespace-nowrap"
                >
                  {testingEvent === key ? 'Enviando...' : '⚡ Testar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
