import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Plus, Users, Search, TrendingUp, Receipt, MessageCircle, MoreHorizontal, Bell, Gift, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Customer = { 
  id: string; 
  name: string; 
  phone: string; 
  instagram?: string;
  email?: string; 
  document?: string;
  address?: string;
  birth_date?: string;
  modality?: string;
  training_location?: string;
  size_top?: string;
  size_bottom?: string;
  size_shoes?: string;
  sales?: { total_amount: number; created_at: string }[];
};

export default function Customers() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '', address: '', birth_date: '', modality: '', training_location: '', size_top: '', size_bottom: '', size_shoes: '' });
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*, sales(total_amount, created_at)').order('name');
      if (error) throw error;
      return data as Customer[];
    }
  });

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalSalesCount = 0;
    let recurrentCount = 0;

    items.forEach(c => {
       const userSales = c.sales || [];
       const userSpent = userSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
       totalRevenue += userSpent;
       totalSalesCount += userSales.length;
       if (userSales.length > 1) recurrentCount++;
    });

    const ticketMedio = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const recurrentPercent = items.length > 0 ? Math.round((recurrentCount / items.length) * 100) : 0;

    return {
       total: items.length,
       revenue: totalRevenue,
       ticket: ticketMedio,
       recurrent: recurrentCount,
       recurrentPercent
    };
  }, [items]);

  const recommendedActions = useMemo(() => {
    const actions: { type: 'birthday' | 'risk', title: string, subtitle: string, cta: string, phone: string, cxName: string }[] = [];
    
    const today = new Date();
    const currentMonth = `${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const todayDay = `${today.getDate().toString().padStart(2, '0')}`;

    items.forEach(c => {
       if (!c.phone) return; // Need phone for actions

       // Birthdays
       if (c.birth_date) {
          const bMonth = c.birth_date.substring(5, 7);
          const bDay = c.birth_date.substring(8, 10);
          if (bMonth === currentMonth) {
             actions.push({
               type: 'birthday',
               title: `Aniversário de ${c.name}`,
               subtitle: bDay === todayDay ? 'Hoje!' : `Dia ${bDay}/${bMonth}`,
               cta: 'Mandar Felicitações',
               phone: c.phone,
               cxName: c.name
             });
          }
       }

       // Risk (Sumidos)
       const userSales = c.sales || [];
       if (userSales.length > 0) {
          const spent = userSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
          const maxDate = new Date(Math.max(...userSales.map(s => new Date(s.created_at).getTime())));
          const daysSince = Math.floor((today.getTime() - maxDate.getTime()) / (1000 * 3600 * 24));
          
          if (daysSince > 90 && spent > 300) {
             actions.push({
               type: 'risk',
               title: `${c.name.split(' ')[0]} sumiu!`,
               subtitle: `Sem compras há ${daysSince} dias. (Já gastou R$ ${spent.toFixed(2)})`,
               cta: 'Mandar Oi',
               phone: c.phone,
               cxName: c.name
             });
          }
       }
    });

    return actions.sort((a,b) => {
       if (a.type === 'birthday' && a.subtitle === 'Hoje!') return -1;
       return 0;
    }).slice(0, 10); // Show top 10 actions

  }, [items]);

  const initials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0,2).toUpperCase();
  };

  const upsertMutation = useMutation({
    mutationFn: async (payloadData: Partial<Customer>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');
      
      const { id, ...rest } = payloadData;
      const payload = { ...rest, owner_id: user.id };
      
      if (id) {
        const { error } = await supabase.from('customers').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Cliente salvo com sucesso!');
      setIsOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(`Erro ao salvar: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Cliente removido!');
    }
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ name: '', phone: '', email: '', document: '', address: '', birth_date: '', modality: '', training_location: '', size_top: '', size_bottom: '', size_shoes: '' });
  };

  const handleEdit = (c: Customer) => {
    setEditingItem(c);
    setFormData({ 
      name: c.name, 
      phone: c.phone || '', 
      email: c.email || '', 
      document: c.document || '', 
      address: c.address || '', 
      birth_date: c.birth_date || '',
      modality: c.modality || '',
      training_location: c.training_location || '',
      size_top: c.size_top || '',
      size_bottom: c.size_bottom || '',
      size_shoes: c.size_shoes || ''
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    upsertMutation.mutate({ id: editingItem?.id, ...formData });
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.phone?.includes(search) || i.instagram?.includes(search));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus clientes e envie mensagens via WhatsApp</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold outline-none shadow-sm h-10 px-6">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome completo</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Maria Joaquina" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Telefone / WhatsApp</label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF/CNPJ</label>
                  <Input value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="Opcional" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="maria@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço de Entrega</label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Opcional. Ex: Rua das Flores, 123" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium">Data de Aniversário</label>
                   <Input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full text-sm block" />
                 </div>
                 <div>
                   <label className="text-sm font-medium">Modalidade</label>
                   <select 
                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     value={formData.modality} 
                     onChange={e => setFormData({...formData, modality: e.target.value})}
                   >
                     <option value="">Selecione...</option>
                     <option value="CrossFit">CrossFit</option>
                     <option value="Musculação">Musculação</option>
                     <option value="Corrida">Corrida</option>
                     <option value="LPO">LPO</option>
                     <option value="Outro">Outro</option>
                   </select>
                 </div>
              </div>

              <div>
                 <label className="text-sm font-medium">Box / Academia de Treino</label>
                 <Input value={formData.training_location} onChange={e => setFormData({...formData, training_location: e.target.value})} placeholder="Ex: Crossfit Iron, SmartFit Centro..." />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="col-span-3 text-xs font-bold text-slate-500 uppercase">Tamanhos e Medidas</div>
                 <div>
                    <label className="text-xs font-medium">Parte Cima</label>
                    <Input value={formData.size_top} onChange={e => setFormData({...formData, size_top: e.target.value})} placeholder="Ex: G, GG" className="h-8 text-sm mt-1" />
                 </div>
                 <div>
                    <label className="text-xs font-medium">Parte Baixo</label>
                    <Input value={formData.size_bottom} onChange={e => setFormData({...formData, size_bottom: e.target.value})} placeholder="Ex: 40, M" className="h-8 text-sm mt-1" />
                 </div>
                 <div>
                    <label className="text-xs font-medium">Tênis</label>
                    <Input value={formData.size_shoes} onChange={e => setFormData({...formData, size_shoes: e.target.value})} placeholder="Ex: 41" className="h-8 text-sm mt-1" />
                 </div>
              </div>

              <Button type="submit" className="w-full mt-4 bg-pink-600 hover:bg-pink-700 h-12 rounded-xl text-md font-bold text-white shadow-xl shadow-pink-500/20" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Clientes</span>
               <Users className="w-4 h-4 text-pink-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
         </div>

         <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita Total</span>
               <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
         </div>

         <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Médio</span>
               <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">R$ {metrics.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
         </div>

         <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clientes Recorrentes</span>
               <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
               <div className="text-2xl font-bold text-gray-900">{metrics.recurrent}</div>
               <div className="text-xs text-gray-400 font-medium">{metrics.recurrentPercent}% do total</div>
            </div>
         </div>
      </div>

      {/* Automação CRM */}
      {recommendedActions.length > 0 && (
         <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 sm:p-5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
            <div className="flex items-center gap-2 mb-4">
               <Bell className="w-5 h-5 text-pink-600" />
               <h3 className="font-bold text-gray-900 text-lg">Lembretes & Ações Recomendadas</h3>
               <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto sm:ml-2">Ative seus clientes!</span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
               {recommendedActions.map((action, idx) => {
                  const isBday = action.type === 'birthday';
                  const Icon = isBday ? Gift : AlertTriangle;
                  
                  // Textos prontos incríveis para conversão
                  const message = isBday 
                    ? `Fala ${action.cxName.split(' ')[0]}, beleza? Parabéns pelo seu aniversário! 🎉 Passando pra te desejar muitas felicidades, saúde e muitos PRs! Tamo junto! 👊`
                    : `Fala ${action.cxName.split(' ')[0]}, tudo bem? Faz um tempinho que não nos falamos. Como estão os treinos? Tem precisado de algum material novo? 🏋️‍♂️`;

                  return (
                    <div key={idx} className="min-w-[260px] max-w-[280px] bg-slate-50 border border-slate-100 rounded-xl p-4 snap-start shrink-0 flex flex-col justify-between">
                       <div className="flex gap-3 items-start mb-4">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isBday ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-red-100 text-red-600'}`}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <div>
                             <div className="font-bold text-sm text-gray-900 leading-tight">{action.title}</div>
                             <div className="text-xs text-slate-500 mt-1 font-medium">{action.subtitle}</div>
                          </div>
                       </div>
                       <a 
                         href={`https://wa.me/${action.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                         target="_blank"
                         className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 font-bold text-xs py-2.5 rounded-lg transition-colors shadow-sm"
                       >
                         <MessageCircle className="w-4 h-4 text-emerald-500" /> {action.cta}
                       </a>
                    </div>
                  );
               })}
            </div>
         </div>
      )}

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-full">
            <Search className="h-4 w-4 text-gray-400 mr-3" />
            <input 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 font-medium" 
              placeholder="Buscar por nome, telefone ou Instagram..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5">
           <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
             <Users className="w-5 h-5 text-gray-400" /> 
             Lista de Clientes ({filteredItems.length})
           </h3>

           <div className="overflow-x-auto">
             <table className="w-full min-w-[900px] text-sm text-left">
                <thead>
                   <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 px-2 font-semibold">Cliente / Perfil</th>
                      <th className="pb-3 px-2 font-semibold">Contato</th>
                      <th className="pb-3 px-2 font-semibold text-center">Compras</th>
                      <th className="pb-3 px-2 font-semibold text-right">Total Gasto</th>
                      <th className="pb-3 px-2 font-semibold">Últ. Compra</th>
                      <th className="pb-3 px-2 font-semibold">Status</th>
                      <th className="pb-3 px-2 font-semibold text-right text-gray-300">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {isLoading ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Carregando...</td></tr>
                   ) : filteredItems.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>
                   ) : filteredItems.map(c => {
                      const userSales = c.sales || [];
                      const spent = userSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
                      
                      let lastPurchase = '-';
                      let statusPill = <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold border border-gray-200 whitespace-nowrap">Novo / Sem Compra</span>;
                      
                      if (userSales.length > 0) {
                        const dates = userSales.map(s => new Date(s.created_at).getTime());
                        const maxDate = new Date(Math.max(...dates));
                        lastPurchase = maxDate.toLocaleDateString('pt-BR');
                        
                        const daysSinceLastPurchase = Math.floor((new Date().getTime() - maxDate.getTime()) / (1000 * 3600 * 24));
                        
                        if (spent > 1500) {
                           statusPill = <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200 whitespace-nowrap">👑 RX (Campeão)</span>;
                        } else if (daysSinceLastPurchase > 90) {
                           statusPill = <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold border border-red-200 whitespace-nowrap">⚠️ Em Risco</span>;
                        } else {
                           statusPill = <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 whitespace-nowrap">🏃 Ativo</span>;
                        }
                      }

                      return (
                         <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                           <td className="py-3 px-2">
                             <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0">
                                 {initials(c.name)}
                               </div>
                               <div>
                                 <div className="font-bold text-gray-800">{c.name}</div>
                                 {(c.modality || c.size_top || c.size_shoes) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {c.modality && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{c.modality}</span>}
                                      {c.size_top && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Cima: {c.size_top}</span>}
                                      {c.size_shoes && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Calçado: {c.size_shoes}</span>}
                                    </div>
                                 )}
                               </div>
                             </div>
                           </td>
                           <td className="py-3 px-2">
                              <div className="flex items-center gap-2 text-gray-600 font-medium text-xs">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                {c.phone || '-'}
                              </div>
                              {c.training_location && (
                                <div className="text-[10px] text-gray-400 mt-0.5" title="Box / Academia">{c.training_location}</div>
                              )}
                           </td>
                           <td className="py-3 px-2 text-center">
                              {userSales.length > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-600 text-white text-[10px] font-bold shadow-sm">
                                  {userSales.length}
                                </span>
                              ) : (
                                <span className="text-gray-300 font-bold">-</span>
                              )}
                           </td>
                           <td className="py-3 px-2 text-right">
                              <span className="font-bold text-gray-900">
                                {spent > 0 ? `R$ ${spent.toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '-'}
                              </span>
                           </td>
                           <td className="py-3 px-2">
                              {lastPurchase !== '-' ? (
                                 <span className="text-gray-500 font-medium text-xs flex items-center gap-1.5 whitespace-nowrap">
                                    <MoreHorizontal className="w-3 h-3 text-gray-300" /> {lastPurchase}
                                 </span>
                              ) : (
                                 <span className="text-gray-300 font-medium">-</span>
                              )}
                           </td>
                           <td className="py-3 px-2">
                              <div className="flex items-center">
                                 {statusPill}
                              </div>
                           </td>
                           <td className="py-3 px-2 text-right">
                              <div className="flex justify-end items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" className="h-7 px-3 text-[10px] font-bold border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white" onClick={() => handleEdit(c)}>
                                  Ver
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 bg-white text-gray-500 hover:text-gray-900" onClick={() => handleEdit(c)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <a 
                                 href={c.phone ? `https://wa.me/${c.phone.replace(/\D/g, '')}` : '#'}
                                 target="_blank"
                                 className="h-7 w-7 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors" onClick={() => {
                                  if(confirm('Tem certeza? Isso apagará este cliente permanentemente.')) deleteMutation.mutate(c.id);
                                }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                           </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
