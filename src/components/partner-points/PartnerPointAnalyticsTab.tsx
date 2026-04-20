import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Target, Users, ShoppingBag, DollarSign, TrendingUp, Search } from 'lucide-react';

export default function PartnerPointAnalyticsTab({ pointId }: { pointId: string }) {
  
  // 1. Visitantes do Catalog
  const { data: events = [] } = useQuery({
     queryKey: ['partner-events', pointId],
     queryFn: async () => {
        const { data } = await supabase.from('catalog_events')
           .select('session_id, event_type')
           .eq('partner_point_id', pointId);
        return data || [];
     }
  });

  // 2. Vendas do Parceiro
  const { data: sales = [] } = useQuery({
     queryKey: ['partner-sales', pointId],
     queryFn: async () => {
        const { data } = await supabase.from('sales')
           .select('id, total_amount, commission_partner, sale_items(quantity, unit_cost)')
           .eq('partner_point_id', pointId)
           .in('status', ['completed', 'approved']);
        return data || [];
     }
  });

  // 3. Estoque Atual do Parceiro (Para eficiencia)
  const { data: stockItems = [] } = useQuery({
     queryKey: ['partner-stock-efficiency', pointId],
     queryFn: async () => {
        const { data } = await supabase.from('partner_point_stock')
           .select('quantity, products(cost_price, sale_price)')
           .eq('partner_point_id', pointId);
        return data || [];
     }
  });

  // === CALCULOS DE FUNIL ===
  const uniqueSessions = new Set(events.filter(e => e.event_type === 'page_view').map((e: any) => e.session_id)).size;
  const uniqueAddCart = new Set(events.filter(e => e.event_type === 'add_to_cart').map((e: any) => e.session_id)).size;
  const uniqueCheckout = new Set(events.filter(e => e.event_type === 'initiate_checkout').map((e: any) => e.session_id)).size;
  const purchases = sales.length;

  const funnelData = [
     { name: 'Leituras do QR (Visitas)', value: uniqueSessions, fill: '#6366f1' },
     { name: 'Adicionaram à Sacola', value: uniqueAddCart, fill: '#8b5cf6' },
     { name: 'Iniciaram Checkout', value: uniqueCheckout, fill: '#ec4899' },
     { name: 'Compras Feitas', value: purchases, fill: '#10b981' }
  ];

  const conversionRate = uniqueSessions > 0 ? ((purchases / uniqueSessions) * 100).toFixed(1) : 0;

  // === CALCULOS FINANCEIROS ===
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_amount, 0);
  const totalCosts = sales.reduce((acc, s) => {
     let cost = 0;
     s.sale_items?.forEach((i: any) => cost += (i.unit_cost || 0) * i.quantity);
     return acc + cost;
  }, 0);
  const totalCommission = sales.reduce((acc, s) => acc + (s.commission_partner || 0), 0);
  const myNetProfit = totalRevenue - totalCosts - totalCommission;

  // === CALCULOS DE ESTOQUE ===
  const currentItemsQty = stockItems.reduce((acc, s) => acc + s.quantity, 0);
  const soldItemsQty = sales.reduce((acc, s) => {
      let qty = 0;
      s.sale_items?.forEach((i: any) => qty += i.quantity);
      return acc + qty;
  }, 0);
  const totalSentQty = currentItemsQty + soldItemsQty;
  const stockTurnoverRate = totalSentQty > 0 ? ((soldItemsQty / totalSentQty) * 100).toFixed(1) : 0;

  return (
     <div className="space-y-6 pt-2">
        {/* ROW 1: RESUMO FUNIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="bg-slate-50 border p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                 <h3 className="text-xs font-semibold uppercase">Escaneamentos (QR)</h3>
                 <Search className="h-4 w-4 opacity-50" />
              </div>
              <p className="text-3xl font-black text-slate-800">{uniqueSessions}</p>
           </div>
           
           <div className="bg-slate-50 border p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                 <h3 className="text-xs font-semibold uppercase">Lucro Líquido Real</h3>
                 <DollarSign className="h-4 w-4 opacity-50 text-emerald-600" />
              </div>
              <div>
                 <p className="text-3xl font-black text-emerald-600">R$ {myNetProfit.toFixed(2)}</p>
                 <p className="text-[10px] text-muted-foreground mt-1">Após descontar custo e comissão ({totalCommission.toFixed(2)} pagas)</p>
              </div>
           </div>

           <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 mb-3">
                 <h3 className="text-xs font-semibold uppercase">Taxa Conversão (QR ➔ Venda)</h3>
                 <Target className="h-4 w-4 opacity-50" />
              </div>
              <p className="text-3xl font-black text-emerald-700">{conversionRate}%</p>
           </div>

           <div className="bg-slate-50 border p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-700 mb-3">
                 <h3 className="text-xs font-semibold uppercase">Giro do Estoque</h3>
                 <TrendingUp className="h-4 w-4 opacity-50" />
              </div>
              <div>
                 <p className="text-3xl font-black text-indigo-700">{stockTurnoverRate}%</p>
                 <p className="text-[10px] text-muted-foreground mt-1">{soldItemsQty} vendidas de {totalSentQty} enviadas.</p>
              </div>
           </div>
        </div>

        {/* ROW 2: GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="border rounded-2xl p-5 shadow-sm">
             <h3 className="font-bold text-sm mb-6 text-slate-800">Funil de Intenção do Cliente</h3>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} width={130} />
                   <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                   <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>

           <div className="border rounded-2xl p-5 shadow-sm text-sm text-slate-600 space-y-4">
              <h3 className="font-bold text-sm mb-4 text-slate-800 flex items-center"><Search className="w-4 h-4 mr-1 text-primary"/> Diagnóstico da Inteligência</h3>
              
              {uniqueSessions === 0 ? (
                 <p className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">O QR Code não foi escaneado nenhuma vez. Peça ao parceiro para dar mais visibilidade à sua arara e encorajar as pessoas.</p>
              ) : uniqueCheckout > 0 && purchases === 0 ? (
                 <p className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-800">As pessoas escaneiam, vão até o WhatsApp, mas a venda não conclui. Pode haver falha no atendimento do seu lojista (demora para responder o WhatsApp) ou na forma de pagamento.</p>
              ) : myNetProfit <= 0 && purchases > 0 ? (
                 <p className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-800">Você está tendo vendas, mas o lucro está negativando. A comissão que você paga ao parceiro ou o frete estão corroendo sua margem.</p>
              ) : parseFloat(stockTurnoverRate) < 10 && totalSentQty > 5 ? (
                 <p className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-800">Muitos itens parados. Considere recolher as peças não movimentadas e trocar o mix do parceiro para itens de menor valor.</p>
              ) : (
                 <p className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-800 font-bold">Parceria saudável! O ponto de venda está se pagando.</p>
              )}
           </div>
        </div>
     </div>
  );
}
