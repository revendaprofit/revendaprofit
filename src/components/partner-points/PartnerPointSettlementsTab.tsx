import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calculator, CheckCircle2, DollarSign, History, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PartnerPointSettlementsTab({ point }: { point: any }) {
  const queryClient = useQueryClient();
  const [isSettling, setIsSettling] = useState(false);

  // 1. Fetch pending sales to calculate the NEXT settlement
  const { data: pendingSales = [], isLoading: loadingPending } = useQuery({
    queryKey: ['partner-pending-sales', point.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('partner_point_id', point.id)
        .is('partner_settlement_id', null);

      if (error) throw error;
      return data;
    },
    enabled: !!point.id
  });

  // 2. Fetch past settlements
  const { data: pastSettlements = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['partner-settlements-history', point.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_point_settlements')
        .select('*')
        .eq('partner_point_id', point.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!point.id
  });

  // --- Financial Calculations for Pending Settlement ---
  const totalGross = pendingSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  
  // Calculate raw commission based on Arara config (can be improved later per-sale)
  const commissionRate = Number(point.commission_arara) / 100;
  const rawPartnerCommission = totalGross * commissionRate;

  // Calculate machine fees if partner receives (REMOOVED BY USER)
  const partnerReceives = point.payment_method === 'partner';
  const machineFeesTotal = 0;

  // Net calculations
  let netPartner = partnerReceives 
    ? rawPartnerCommission // partners keeps their commission
    : rawPartnerCommission; // if store receives, store pays partner raw commission

  let netStore = partnerReceives
    ? (totalGross - rawPartnerCommission) // partner has all the money, partner owes us this
    : (totalGross - rawPartnerCommission); // store has all money, store keeps this

  // Directions of who owes who
  const whoOwesWho = partnerReceives ? "Parceiro Ouro para Loja" : "Loja deve para Parceiro";
  const amountToTransfer = partnerReceives ? netStore : netPartner;

  const handleCreateSettlement = async () => {
    if (pendingSales.length === 0) return toast.error("Não há vendas pendentes para acerto.");
    
    setIsSettling(true);
    try {
      const periodStart = pendingSales.length > 0 ? new Date(Math.min(...pendingSales.map(s => new Date(s.created_at).getTime()))).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const periodEnd = new Date().toISOString().split('T')[0];

      // 1. Create Settlement Record
      const { data: newSettlement, error: settlementError } = await supabase
        .from('partner_point_settlements')
        .insert({
          partner_point_id: point.id,
          period_start: periodStart,
          period_end: periodEnd,
          total_sales: totalGross,
          partner_commission: rawPartnerCommission,
          machine_fees: machineFeesTotal,
          net_partner: netPartner,
          net_store: netStore,
          status: 'paid'
        })
        .select()
        .single();
        
      if (settlementError) throw settlementError;

      // 2. Update all pending sales with the new settlement ID
      const saleIds = pendingSales.map(s => s.id);
      const { error: salesError } = await supabase
        .from('sales')
        .update({ partner_settlement_id: newSettlement.id })
        .in('id', saleIds);

      if (salesError) throw salesError;

      toast.success("Acerto Financeiro efetuado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['partner-pending-sales'] });
      queryClient.invalidateQueries({ queryKey: ['partner-settlements-history'] });
      queryClient.invalidateQueries({ queryKey: ['partner-point-sales'] });
      
    } catch (e: any) {
      toast.error(`Erro ao gerar acerto: ${e.message}`);
    } finally {
      setIsSettling(false);
    }
  };


  return (
    <div className="p-4 md:p-6 space-y-8">
      
      {/* 1. Painel do Próximo Acerto (Pendente) */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100/50 border rounded-2xl p-6 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Calculator className="w-48 h-48" />
         </div>
         
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
            <div>
               <h2 className="text-xl font-black text-slate-800">Cálculo de Acerto em Aberto</h2>
               <p className="text-muted-foreground text-sm">Baseado nas vendas ainda não fechadas deste parceiro.</p>
            </div>
            {pendingSales.length > 0 && (
               <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200">
                 {pendingSales.length} Vendas Pendentes
               </span>
            )}
         </div>

         {pendingSales.length === 0 ? (
            <div className="bg-white/60 p-6 rounded-xl border border-dashed text-center relative z-10">
               <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
               <h3 className="font-bold text-lg">Tudo em dia!</h3>
               <p className="text-muted-foreground">Não há nenhuma nova venda pendente de comissionamento.</p>
            </div>
         ) : (
           <div className="grid md:grid-cols-2 gap-8 relative z-10">
             {/* Detalhamento */}
             <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                   <span className="text-muted-foreground text-sm font-medium">Vendas Brutas (Total)</span>
                   <span className="font-bold text-lg">R$ {totalGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                   <div className="flex items-center gap-1">
                     <span className="text-muted-foreground text-sm font-medium">Comissão Parceiro</span>
                     <span className="inline-flex items-center text-[10px] font-semibold rounded-md border px-1.5 py-0 h-4">{point.commission_arara}% arara</span>
                   </div>
                   <span className="font-bold text-rose-600">- R$ {rawPartnerCommission.toFixed(2)}</span>
                </div>
                {/* machine fees deductions were removed here */}
                <div className="flex justify-between items-center pt-2">
                   <span className="text-slate-800 font-bold">Líquido sua Loja (Lucro Bruto)</span>
                   <span className="font-black text-emerald-600 text-xl">R$ {netStore.toFixed(2)}</span>
                </div>
             </div>

             {/* Ação de Fechamento */}
             <div className="bg-slate-800 text-slate-50 p-6 rounded-xl shadow-md flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-700 rounded-full blur-2xl opacity-50"></div>
                <p className="text-slate-300 font-medium text-sm mb-1 uppercase tracking-wider">{whoOwesWho}</p>
                <h3 className="text-4xl font-black text-emerald-400 mb-6 drop-shadow-sm">
                   R$ {amountToTransfer.toFixed(2)}
                </h3>
                
                <div className="mt-auto space-y-3 relative z-10">
                   <div className="bg-slate-700/50 p-3 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                     <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                     <p>Ao realizar o acerto, todas as {pendingSales.length} vendas serão arquivadas e dadas como pagas. Confirme os valores antes de prosseguir.</p>
                   </div>
                   <Button 
                     size="lg" 
                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg font-bold text-base"
                     onClick={handleCreateSettlement}
                     disabled={isSettling}
                   >
                     {isSettling ? 'Gerando Acerto...' : 'Realizar Acerto e Zerar Saldo'}
                   </Button>
                </div>
             </div>
           </div>
         )}
      </section>

      {/* 2. Histórico de Acertos */}
      <section>
         <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><History className="w-5 h-5 text-muted-foreground"/> Histórico de Fechamentos</h3>
         <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
           <Table>
             <TableHeader className="bg-muted/30">
               <TableRow>
                 <TableHead>Data do Acerto</TableHead>
                 <TableHead>Período Base</TableHead>
                 <TableHead>Vendas Brutas</TableHead>
                 <TableHead>Comissão Paga</TableHead>
                 <TableHead>Líquido Recebido</TableHead>
                 <TableHead>Status</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loadingHistory ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Buscando histórico...</TableCell></TableRow>
               ) : pastSettlements.length === 0 ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum acerto financeiro foi realizado com este parceiro ainda.</TableCell></TableRow>
               ) : (
                 pastSettlements.map((settlement: any) => (
                   <TableRow key={settlement.id}>
                     <TableCell className="font-medium">
                       {format(new Date(settlement.created_at), "dd/MM/yyyy HH:mm")}
                     </TableCell>
                     <TableCell className="text-muted-foreground text-sm">
                       {format(new Date(settlement.period_start), "dd/MM")} a {format(new Date(settlement.period_end), "dd/MM")}
                     </TableCell>
                     <TableCell>R$ {Number(settlement.total_sales).toFixed(2)}</TableCell>
                     <TableCell className="text-rose-600">R$ {Number(settlement.partner_commission).toFixed(2)}</TableCell>
                     <TableCell className="text-emerald-600 font-bold">R$ {Number(settlement.net_store).toFixed(2)}</TableCell>
                     <TableCell>
                        <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">Pago</span>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
      </section>

    </div>
  );
}
