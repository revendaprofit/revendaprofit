import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Presentation, Filter, Share2, PackageX, Loader2, DollarSign, Target, MousePointerClick, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Componente Interno - Card Estatístico Simples
const StatCard = ({ title, value, icon: Icon, description, trend, isCurrency = true }: any) => (
  <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between text-muted-foreground mb-4">
      <h3 className="text-sm font-semibold uppercase">{title}</h3>
      <Icon className="h-5 w-5 opacity-50" />
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">
        {isCurrency ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
      </p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {trend && (
         <div className={`text-xs font-semibold mt-2 flex items-center ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
            {trend > 0 ? '+' : ''}{trend}%
         </div>
      )}
    </div>
  </div>
);

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30'); // '7', '30', '90', 'all'

  // Fetch das vendas
  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['analytics-sales', user?.id, period],
    queryFn: async () => {
      let q = supabase
        .from('sales')
        .select(`
          id, total_amount, created_at, sale_origin, status,
          sale_items ( quantity, unit_price, unit_cost )
        `)
        .in('status', ['completed', 'approved']);
      
      if (period !== 'all') {
         const d = new Date();
         d.setDate(d.getDate() - parseInt(period));
         q = q.gte('created_at', d.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch de eventos de catálogo (Funil)
  const { data: events = [] } = useQuery({
    queryKey: ['analytics-events', user?.id, period],
    queryFn: async () => {
      let q = supabase.from('catalog_events').select('session_id, event_type, created_at').eq('owner_id', user?.id);
      if (period !== 'all') {
         const d = new Date();
         d.setDate(d.getDate() - parseInt(period));
         q = q.gte('created_at', d.toISOString());
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch de estoque (Encahado / Imobilizado)
  const { data: stockData } = useQuery({
    queryKey: ['analytics-stock', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, cost_price, created_at, product_variants(stock)');
      if (!data) return [];
      return data.map(p => ({
         name: p.name,
         cost: p.cost_price,
         stock: p.product_variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0),
         created_at: p.created_at
      }));
    },
    enabled: !!user
  });

  if (isLoadingSales) return <div className="h-full flex items-center justify-center p-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  // ----------- CÁLCULOS: VISÃO FINANCEIRA -----------
  const grossRevenue = sales.reduce((acc, sale) => acc + sale.total_amount, 0);
  
  const totalCost = sales.reduce((acc, sale) => {
     const saleItemsCost = sale.sale_items.reduce((sum: number, item: any) => sum + ((item.unit_cost || 0) * item.quantity), 0);
     return acc + saleItemsCost;
  }, 0);
  
  const netProfit = grossRevenue - totalCost; // (Ignorando comissões complexas por hora para visão bruta)
  const margin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;
  const aov = sales.length > 0 ? (grossRevenue / sales.length) : 0;

  // ----------- CÁLCULOS: CANAIS -----------
  const salesByChannelMap = sales.reduce((acc: any, sale) => {
    const origin = sale.sale_origin || 'pdv';
    acc[origin] = (acc[origin] || 0) + sale.total_amount;
    return acc;
  }, {});
  
  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
  const channelData = Object.keys(salesByChannelMap).map(k => ({
     name: k === 'pdv' ? 'Loja Física/PDV' : k === 'catalog' ? 'Catálogo Online' : k === 'bag' ? 'Malinha' : k === 'partner_point' ? 'Ponto Parceiro' : k === 'bazar_vip' ? 'Bazar VIP' : k,
     value: salesByChannelMap[k]
  })).sort((a,b) => b.value - a.value);

  // Evolução Diária
  const evolutionMap = sales.reduce((acc: any, sale) => {
     const date = new Date(sale.created_at).toLocaleDateString('pt-BR');
     acc[date] = (acc[date] || 0) + sale.total_amount;
     return acc;
  }, {});
  const evolutionData = Object.keys(evolutionMap).map(k => ({ date: k, Faturamento: evolutionMap[k] }));

  // ----------- CÁLCULOS: TRÁFEGO & FUNIL -----------
  const uniqueSessions = new Set(events.map((e: any) => e.session_id)).size;
  const addToCartSessions = new Set(events.filter((e: any) => e.event_type === 'add_to_cart').map((e: any) => e.session_id)).size;
  const checkoutSessions = new Set(events.filter((e: any) => e.event_type === 'initiate_checkout').map((e: any) => e.session_id)).size;
  const conversionRate = uniqueSessions > 0 ? ((checkoutSessions / uniqueSessions) * 100).toFixed(2) : 0;

  // ----------- CÁLCULOS: ESTOQUE -----------
  const totalImobilizado = stockData ? stockData.reduce((acc: number, p: any) => acc + (p.cost * p.stock), 0) : 0;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" /> Analytics
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe a inteligência do seu negócio em tempo real.</p>
        </div>
        
        <div className="flex bg-white rounded-lg shadow-sm border p-1">
          {['7', '30', '90', 'all'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${period === p ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p === '7' ? '7 Dias' : p === '30' ? '30 Dias' : p === '90' ? '90 Dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 rounded-xl flex shadow-inner overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 font-semibold text-sm h-10 rounded-lg whitespace-nowrap"><Presentation className="w-4 h-4 mr-2" /> Visão Financeira</TabsTrigger>
          <TabsTrigger value="traffic" className="flex-1 font-semibold text-sm h-10 rounded-lg whitespace-nowrap"><MousePointerClick className="w-4 h-4 mr-2" /> Tráfego & Funil</TabsTrigger>
          <TabsTrigger value="channels" className="flex-1 font-semibold text-sm h-10 rounded-lg whitespace-nowrap"><Share2 className="w-4 h-4 mr-2" /> Canais de Venda</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 font-semibold text-sm h-10 rounded-lg whitespace-nowrap"><PackageX className="w-4 h-4 mr-2" /> Saúde de Estoque</TabsTrigger>
        </TabsList>

        {/* --- ABA 1: VISÃO FINANCEIRA --- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Faturamento Bruto" value={grossRevenue} icon={DollarSign} description="Receita total no período." />
            <StatCard title="Lucro Bruto Estimado" value={netProfit} icon={TrendingUp} description="Receita menos custo dos produtos." />
            <StatCard title="Margem Média" value={margin} icon={Target} isCurrency={false} description="% de margem sobre a receita." />
            <StatCard title="Ticket Médio" value={aov} icon={ShoppingCart} description="Gasto médio por pedido." />
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <h3 className="font-bold text-lg mb-6 text-slate-800">Evolução do Faturamento</h3>
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={evolutionData}>
                   <defs>
                     <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} fill="#64748b" />
                   <YAxis axisLine={false} tickLine={false} fontSize={12} fill="#64748b" tickFormatter={(v) => `R$${v}`} />
                   <RechartsTooltip cursor={{ stroke: '#cbd5e1' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Area type="monotone" dataKey="Faturamento" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </TabsContent>

        {/* --- ABA 2: TRÁFEGO E FUNIL --- */}
        <TabsContent value="traffic" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
                <p className="text-sm font-semibold uppercase text-slate-500 mb-2">1. Visitantes Únicos</p>
                <p className="text-5xl font-black text-slate-800">{uniqueSessions}</p>
                <p className="text-xs text-slate-400 mt-2">Pessoas que acessaram a loja.</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
                <p className="text-sm font-semibold uppercase text-slate-500 mb-2">2. Adições ao Carrinho</p>
                <p className="text-5xl font-black text-primary">{addToCartSessions}</p>
                <p className="text-xs text-slate-400 mt-2">Visitas com interesse.</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border shadow-sm text-center bg-gradient-to-br from-emerald-50 to-white">
                <p className="text-sm font-semibold uppercase text-emerald-600 mb-2">3. Checkouts Iniciados</p>
                <p className="text-5xl font-black text-emerald-600">{checkoutSessions}</p>
                <p className="text-xs text-emerald-700/60 mt-2">Botão WhatsApp final clicado.</p>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Taxa de Conversão do Catálogo</h3>
                <p className="text-sm text-slate-500">Qual a porcentagem de visitantes que chegam até o checkout.</p>
              </div>
              <div className="text-4xl font-black text-emerald-600">
                {conversionRate}%
              </div>
           </div>
        </TabsContent>

        {/* --- ABA 3: CANAIS DE VENDA --- */}
        <TabsContent value="channels">
           <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
             <h3 className="font-bold text-lg mb-6 text-slate-800">Receita por Canal (Origem)</h3>
             {channelData.length === 0 ? (
                <p className="text-slate-400 py-10">Nenhuma venda registrada no período.</p>
             ) : (
                <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                   <div className="w-[300px] h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%" cy="50%"
                            innerRadius={80} outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {channelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex flex-col gap-4 text-left min-w-[200px]">
                      {channelData.map((entry, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <div>
                               <p className="font-semibold text-slate-800">{entry.name}</p>
                               <p className="text-xs text-slate-500">R$ {entry.value.toFixed(2)} ({(entry.value / grossRevenue * 100).toFixed(1)}%)</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
           </div>
        </TabsContent>

        {/* --- ABA 4: SAÚDE DO ESTOQUE --- */}
        <TabsContent value="stock">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard title="Capital Imobilizado Atual" value={totalImobilizado} icon={DollarSign} description="Valor total parado no estoque baseado no seu Preço de Custo." />
           </div>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}
