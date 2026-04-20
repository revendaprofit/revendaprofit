import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag, Calendar, Banknote, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PartnerPointSalesTab({ pointId }: { pointId: string }) {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['partner-point-sales', pointId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, created_at, customer_id, customers ( name ), total_amount, payment_method, status, partner_settlement_id,
          sale_items ( quantity, unit_price, unit_cost, products ( name ) )
        `)
        .eq('partner_point_id', pointId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!pointId
  });

  const pendingSales = sales.filter(s => !s.partner_settlement_id);
  const settledSales = sales.filter(s => !!s.partner_settlement_id);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary"/> Histórico de Vendas</h2>
          <p className="text-sm text-muted-foreground">Vendas realizadas por este parceiro físico ou virtual.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total de Vendas</p>
            <p className="text-2xl font-black">{sales.length}</p>
         </div>
         <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-amber-900 mb-1">Vendas Pendentes (Em Aberto)</p>
            <p className="text-2xl font-black text-amber-700">{pendingSales.length}</p>
         </div>
         <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-emerald-900 mb-1">Vendas já Acertadas (Pagas)</p>
            <p className="text-2xl font-black text-emerald-700">{settledSales.length}</p>
         </div>
         <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-blue-900 mb-1">Faturamento Bruto Parceiro</p>
            <p className="text-2xl font-black text-blue-700">
               R$ {sales.reduce((acc, s) => acc + (s.total_amount || 0), 0).toFixed(2)}
            </p>
         </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status Acerto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando histórico de vendas...</TableCell></TableRow>
            ) : sales.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                 <Tag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                 <p className="font-semibold text-foreground">Nenhuma venda registrada ainda.</p>
                 <p className="text-sm">As vendas cairão aqui assim que o parceiro ou cliente finalizarem pedidos.</p>
              </TableCell></TableRow>
            ) : (
              sales.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm">{format(new Date(sale.created_at), "dd/MM/yyyy, HH:mm")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{sale.customers?.name || 'Cliente Avulso'}</TableCell>
                  <TableCell>
                     <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Banknote className="w-4 h-4" /> {sale.payment_method}
                     </div>
                  </TableCell>
                  <TableCell className="font-bold">R$ {Number(sale.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.partner_settlement_id ? (
                       <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                         Acerto Realizado
                       </span>
                    ) : (
                       <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 text-amber-600 border border-amber-200 bg-amber-50">
                         Pendente
                       </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
