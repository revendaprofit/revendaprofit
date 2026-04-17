import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Clock, CheckCircle, AlertTriangle, DollarSign, Download, Send, Edit2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore, startOfToday } from 'date-fns';

export default function InstallmentsReport() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, pending, overdue, paid
  const [search, setSearch] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [paidDateFrom, setPaidDateFrom] = useState('');
  const [paidDateTo, setPaidDateTo] = useState('');

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments-report'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      
      const { data, error } = await supabase
        .from('sale_installments')
        .select(`
          id, amount, due_date, status, sale_id, paid_at,
          sales (
            id, payment_method, payment_method_2,
            customers (id, name, phone),
            sale_items (quantity, products(name))
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: payMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
       const user = (await supabase.auth.getUser()).data.user;
       if (!user) return [];
       const { data } = await supabase.from('payment_methods').select('id, name, is_installment');
       return data || [];
    }
  });

  const getPaymentName = (sale: any) => {
    if (!sale || !payMethods) return 'A prazo';
    const pm1 = payMethods.find(p => p.id === sale.payment_method);
    const pm2 = payMethods.find(p => p.id === sale.payment_method_2);
    // Rough guess since we don't map installment directly to payment method 1 or 2
    if (pm1?.name && pm1.name.toLowerCase().includes('prazo')) return pm1.name;
    if (pm2?.name && pm2.name.toLowerCase().includes('prazo')) return pm2.name;
    return pm1?.name || 'A prazo';
  };

  const today = startOfToday();

  const metrics = useMemo(() => {
     let total = 0;
     let paid = 0;
     let pending = 0;
     let overdue = 0;

     installments.forEach((inst: any) => {
        total += Number(inst.amount);
        if (inst.status === 'paid' || inst.status === 'completed') {
           paid += Number(inst.amount);
        } else {
           // pending
           const dueDate = new Date(inst.due_date + 'T00:00:00');
           if (isBefore(dueDate, today)) {
              overdue += Number(inst.amount);
           } else {
              pending += Number(inst.amount);
           }
        }
     });

     return { total, paid, pending, overdue, count: installments.length };
  }, [installments, today]);

  const filteredItems = useMemo(() => {
     return installments.filter((inst: any) => {
        const cName = inst.sales?.customers?.name?.toLowerCase() || '';
        const dueDate = new Date(inst.due_date + 'T00:00:00');
        const isOverdue = inst.status !== 'paid' && inst.status !== 'completed' && isBefore(dueDate, today);
        const isPaid = inst.status === 'paid' || inst.status === 'completed';
        const isPending = !isPaid && !isOverdue;

        if (filterStatus === 'pending' && !isPending) return false;
        if (filterStatus === 'overdue' && !isOverdue) return false;
        if (filterStatus === 'paid' && !isPaid) return false;

        if (dueDateFrom && inst.due_date < dueDateFrom) return false;
        if (dueDateTo && inst.due_date > dueDateTo) return false;

        if (paidDateFrom || paidDateTo) {
           if (!isPaid) return false;
           const paidDateStr = inst.paid_at ? inst.paid_at.split('T')[0] : '';
           if (paidDateFrom && paidDateStr < paidDateFrom) return false;
           if (paidDateTo && paidDateStr > paidDateTo) return false;
        }

        if (search && !cName.includes(search.toLowerCase())) return false;

        return true;
     });
  }, [installments, filterStatus, search, today, dueDateFrom, dueDateTo, paidDateFrom, paidDateTo]);

  const updateMutation = useMutation({
     mutationFn: async ({ id, status, sale_id }: { id: string, status: string, sale_id: string }) => {
        const payload: any = { status };
        if (status === 'paid' || status === 'completed') payload.paid_at = new Date().toISOString();
        else payload.paid_at = null;

        const { error } = await supabase.from('sale_installments').update(payload).eq('id', id);
        if (error) throw error;
        
        // Check if all installments for this sale are paid
        const { data: allInsts } = await supabase.from('sale_installments').select('status').eq('sale_id', sale_id);
        if (allInsts) {
           const allPaid = allInsts.every(i => i.status === 'paid' || i.status === 'completed');
           await supabase.from('sales').update({ status: allPaid ? 'completed' : 'installment' }).eq('id', sale_id);
        }
     },
     onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['installments-report'] });
        queryClient.invalidateQueries({ queryKey: ['sales-history'] });
        toast.success("Parcela atualizada!");
     }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
             <div className="bg-primary/10 p-2 rounded-lg">
               <Clock className="w-5 h-5 text-primary" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendas a Prazo</h1>
           </div>
           <p className="text-sm text-gray-500 mt-1 ml-11">Controle detalhado de parcelas e cobranças</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 h-10 shadow-sm font-semibold">
           <Download className="w-4 h-4 mr-2" /> Exportar XLS
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Vencimento De</label>
              <Input type="date" className="h-10 text-sm bg-gray-50/50" value={dueDateFrom} onChange={e => setDueDateFrom(e.target.value)} />
           </div>
           <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Vencimento Até</label>
              <Input type="date" className="h-10 text-sm bg-gray-50/50" value={dueDateTo} onChange={e => setDueDateTo(e.target.value)} />
           </div>
           <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Pago em De</label>
              <Input type="date" className="h-10 text-sm bg-gray-50/50 focus:bg-white" value={paidDateFrom} onChange={e => setPaidDateFrom(e.target.value)} />
           </div>
           <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Pago em Até</label>
              <Input type="date" className="h-10 text-sm bg-gray-50/50 focus:bg-white" value={paidDateTo} onChange={e => setPaidDateTo(e.target.value)} />
           </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
           <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
           <button onClick={() => setFilterStatus('pending')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pendentes</button>
           <button onClick={() => setFilterStatus('overdue')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Vencidos</button>
           <button onClick={() => setFilterStatus('paid')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pagos</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <DollarSign className="w-5 h-5 text-gray-400 mb-1" />
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total a Prazo</p>
            <p className="text-xl font-black text-gray-900 mt-1">R$ {metrics.total.toFixed(2).replace('.',',')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{metrics.count} parcelas</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <CheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Recebido</p>
            <p className="text-xl font-black text-emerald-600 mt-1">R$ {metrics.paid.toFixed(2).replace('.',',')}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400"></div>
            <Clock className="w-5 h-5 text-orange-400 mb-1" />
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pendente</p>
            <p className="text-xl font-black text-orange-500 mt-1">R$ {metrics.pending.toFixed(2).replace('.',',')}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Vencido</p>
            <p className="text-xl font-black text-red-600 mt-1">R$ {metrics.overdue.toFixed(2).replace('.',',')}</p>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-4 border-b flex items-center gap-4 bg-gray-50/50">
          <div className="flex gap-4 items-center">
             <button className="text-sm font-bold border-b-2 border-gray-900 pb-1 px-1">Por Vencimento</button>
             <button className="text-sm font-medium text-gray-400 hover:text-gray-900 pb-1 px-1">Por Cliente</button>
          </div>
          <div className="ml-auto w-full max-w-sm relative">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
             <Input className="pl-9 h-10 bg-white" placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
             <thead>
                <tr className="bg-white border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                   <th className="px-6 py-4">Cliente</th>
                   <th className="px-6 py-4">Valor</th>
                   <th className="px-6 py-4">Vencimento</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Forma Pgto</th>
                   <th className="px-6 py-4">Produtos</th>
                   <th className="px-6 py-4 text-right pr-8">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                   <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
                ) : filteredItems.length === 0 ? (
                   <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma parcela encontrada.</td></tr>
                ) : filteredItems.map((inst: any) => {
                   const customerName = inst.sales?.customers?.name || 'Cliente Excluído';
                   const customerPhone = inst.sales?.customers?.phone || '';
                   const dueDateObj = new Date(inst.due_date + 'T00:00:00');
                   const isPaid = inst.status === 'paid' || inst.status === 'completed';
                   const isOverdue = !isPaid && isBefore(dueDateObj, today);
                   
                   let statusChip = <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Pendente</span>;
                   if (isPaid) statusChip = <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Pago</span>;
                   else if (isOverdue) statusChip = <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Vencido</span>;

                   const productsString = inst.sales?.sale_items?.map((i:any) => `${i.quantity}x ${i.products?.name}`).join(', ') || '-';

                   return (
                     <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-800">{customerName}</p>
                           {customerPhone && <p className="text-xs text-gray-400">{customerPhone}</p>}
                        </td>
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-900">R$ {Number(inst.amount).toFixed(2).replace('.',',')}</p>
                        </td>
                        <td className="px-6 py-4">
                           <p className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>{format(dueDateObj, 'dd/MM/yyyy')}</p>
                        </td>
                        <td className="px-6 py-4">
                           {statusChip}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                           {getPaymentName(inst.sales)}
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs text-gray-500 max-w-[200px] truncate" title={productsString}>{productsString}</p>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                           <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              {isPaid ? (
                                <button className="text-[10px] font-bold flex items-center gap-1 text-gray-500 hover:text-gray-900" onClick={() => updateMutation.mutate({ id: inst.id, status: 'pending', sale_id: inst.sale_id })}>
                                  <RotateCcw className="w-3 h-3" /> Desfazer
                                </button>
                              ) : (
                                <>
                                 <button className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 hover:text-emerald-700" onClick={() => updateMutation.mutate({ id: inst.id, status: 'paid', sale_id: inst.sale_id })}>
                                   <CheckCircle className="w-3 h-3" /> Pago
                                 </button>
                                 <button 
                                  className="text-[10px] font-bold flex items-center gap-1 text-gray-700 hover:text-blue-600"
                                  onClick={() => {
                                     const text = `Olá ${customerName}! Passando para lembrar da parcela de R$ ${Number(inst.amount).toFixed(2).replace('.',',')} com vencimento em ${format(dueDateObj, 'dd/MM/yyyy')}.`;
                                     const phoneClean = customerPhone.replace(/\D/g, '');
                                     if(phoneClean) window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, '_blank');
                                  }}
                                 >
                                   <Send className="w-3 h-3" /> Cobrar
                                 </button>
                                </>
                              )}
                              <button className="text-[10px] font-bold flex items-center gap-1 text-gray-400 hover:text-gray-900">
                                <Edit2 className="w-3 h-3" /> <span className="sr-only sm:not-sr-only">Editar</span>
                              </button>
                           </div>
                        </td>
                     </tr>
                   )
                })}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
