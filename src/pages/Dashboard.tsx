import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, TrendingUp, Package, Users, ShoppingBag, Bell, Gift, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics-advanced'],
    queryFn: async () => {
      // Basic counts
      const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: totalCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true });
      const { count: totalSuppliers } = await supabase.from('suppliers').select('*', { count: 'exact', head: true });
      const { count: totalCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true });

      // Sales Data (Last 30 Days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0,0,0,0);

      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          total_amount, discount, payment_method, payment_method_2, 
          payment_fee_amount, payment_fee_amount_2, 
          created_at, status, sale_origin, shipping_payer, shipping_cost,
          sale_items ( total_price, unit_cost, quantity, products ( cost_price ) )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .in('status', ['completed', 'open']); // open included for installment sales

      let totalRevenue = 0;
      let totalNetProfit = 0;

      // Aggregations
      const chartMap = new Map();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartMap.set(dateStr, { name: dateStr, Receitas: 0, Lucro: 0 });
      }

      const methodCount: Record<string, number> = {};
      const originCount: Record<string, number> = {};

      salesData?.forEach(sale => {
         // Parcela de Consórcio: sem itens, total_amount é lucro puro
         const isParcelaConsorcio = sale.sale_origin === 'Parcela Consórcio' && (!sale.sale_items || sale.sale_items.length === 0);

         let grossRevenue: number;
         let totalCost: number;
         let netProfit: number;

         if (isParcelaConsorcio) {
           grossRevenue = Number(sale.total_amount) - Number(sale.discount);
           totalCost = 0;
           const fees = Number(sale.payment_fee_amount || 0) + Number(sale.payment_fee_amount_2 || 0);
           netProfit = grossRevenue - fees;
         } else {
           // Calculating true Gross Revenue (Items - Discount)
           grossRevenue = sale.sale_items.reduce((acc: number, item: any) => acc + Number(item.total_price), 0) - Number(sale.discount);
         
           totalCost = sale.sale_items.reduce((acc: number, item: any) => {
              const c = item.unit_cost && item.unit_cost > 0 ? item.unit_cost : (item.products?.cost_price || 0);
              return acc + (Number(c) * item.quantity);
           }, 0);
         
           const fees = Number(sale.payment_fee_amount || 0) + Number(sale.payment_fee_amount_2 || 0);
           const storeShipping = sale.shipping_payer === 'seller' ? Number(sale.shipping_cost || 0) : 0;
           netProfit = grossRevenue - totalCost - fees - storeShipping;
         }

         totalRevenue += grossRevenue;
         totalNetProfit += netProfit;

         const dateKey = sale.created_at.split('T')[0];
         if (chartMap.has(dateKey)) {
            const entry = chartMap.get(dateKey);
            entry.Receitas += grossRevenue;
            entry.Lucro += netProfit;
         }

         // Payment Method Chart
         const parsePayMethod = (m: string) => {
             if (m === 'pix') return 'PIX';
             if (m === 'credit') return 'Crédito';
             if (m === 'debit') return 'Débito';
             if (m === 'cash') return 'Dinheiro';
             if (m === 'link') return 'Link Pagto';
             return m;
         };
         
         if (sale.payment_method) {
             const m1 = parsePayMethod(sale.payment_method);
             methodCount[m1] = (methodCount[m1] || 0) + 1;
         }
         if (sale.payment_method_2) {
             const m2 = parsePayMethod(sale.payment_method_2);
             methodCount[m2] = (methodCount[m2] || 0) + 1;
         }

         // Sale Origin Chart
         const ori = sale.sale_origin || 'Presencial';
         originCount[ori] = (originCount[ori] || 0) + 1;
      });

      const timelineData = Array.from(chartMap.values()).map(d => ({
         name: `${d.name.split('-')[2]}/${d.name.split('-')[1]}`,
         Receitas: Number(d.Receitas.toFixed(2)),
         Lucro: Number(d.Lucro.toFixed(2))
      }));

      const pieData = Object.keys(methodCount).map(k => ({ name: k, value: methodCount[k] })).sort((a,b) => b.value - a.value);
      const originData = Object.keys(originCount).map(k => ({ name: k, value: originCount[k] })).sort((a,b) => b.value - a.value);

      const todayDateStr = new Date().toISOString().split('T')[0];
      const mmdd = todayDateStr.substring(5);

      const [
        { data: storeOrders },
        { data: installmentsData },
        { data: customersRaw }
      ] = await Promise.all([
         supabase.from('store_orders').select('id').eq('status', 'pending'),
         supabase.from('sale_installments').select('due_date').eq('status', 'pending'),
         supabase.from('customers').select('name, birth_date').not('birth_date', 'is', null)
      ]);

      const alerts: {type: string, title: string, desc: string, link: string}[] = [];

      if (storeOrders && storeOrders.length > 0) {
        alerts.push({ type: 'order', title: `${storeOrders.length} pedido(s) pendente(s)`, desc: 'Aguardando ação em Pedidos da Loja.', link: '/orders' });
      }

      if (installmentsData && installmentsData.length > 0) {
         let vencendoHoje = 0;
         let vencidas = 0;
         installmentsData.forEach(i => {
            if (i.due_date < todayDateStr) vencidas++;
            else if (i.due_date === todayDateStr) vencendoHoje++;
         });
         
         if (vencidas > 0) alerts.push({ type: 'danger', title: `${vencidas} parcela(s) vencida(s)`, desc: 'Há pagamentos a prazo em atraso.', link: '/installments' });
         if (vencendoHoje > 0) alerts.push({ type: 'warning', title: `${vencendoHoje} parcela(s) vence(m) hoje`, desc: 'Hora de garantir o recebimento.', link: '/installments' });
      }

      if (customersRaw && customersRaw.length > 0) {
         const bdays = customersRaw.filter(c => c.birth_date && c.birth_date.substring(5) === mmdd);
         if (bdays.length > 0) {
            alerts.push({ type: 'birthday', title: `${bdays.length} aniversariante(s) hoje!`, desc: bdays.map(b => b.name).join(', '), link: '/customers' });
         }
      }

      return {
        products: totalProducts || 0,
        categories: totalCategories || 0,
        suppliers: totalSuppliers || 0,
        customers: totalCustomers || 0,
        totalRevenue,
        totalNetProfit,
        timelineData,
        pieData,
        originData,
        margin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0,
        alerts
      };
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando métricas executivas...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
        <p className="text-muted-foreground mt-1">Inteligência Financeira e Visão de Negócio (Últimos 30 dias)</p>
      </header>

      {/* Avisos do Sistema */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {metrics.alerts.map((alert: any, idx: number) => (
             <Link key={idx} to={alert.link} className={`block border rounded-xl p-4 shadow-sm transition-all hover:scale-[1.01] ${
               alert.type === 'danger' ? 'bg-red-50 border-red-100' :
               alert.type === 'warning' ? 'bg-amber-50 border-amber-100' :
               alert.type === 'birthday' ? 'bg-fuchsia-50 border-fuchsia-100' :
               'bg-blue-50 border-blue-100'
             }`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${
                     alert.type === 'danger' ? 'bg-red-100 text-red-600' :
                     alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                     alert.type === 'birthday' ? 'bg-fuchsia-100 text-fuchsia-600' :
                     'bg-blue-100 text-blue-600'
                   }`}>
                     {alert.type === 'birthday' ? <Gift className="h-5 w-5" /> :
                      alert.type === 'order' ? <ShoppingBag className="h-5 w-5" /> :
                      <AlertCircle className="h-5 w-5" />}
                   </div>
                   <div>
                      <h4 className={`font-bold text-sm ${
                        alert.type === 'danger' ? 'text-red-900' :
                        alert.type === 'warning' ? 'text-amber-900' :
                        alert.type === 'birthday' ? 'text-fuchsia-900' :
                        'text-blue-900'
                      }`}>{alert.title}</h4>
                      <p className={`text-xs mt-0.5 ${
                        alert.type === 'danger' ? 'text-red-700' :
                        alert.type === 'warning' ? 'text-amber-700' :
                        alert.type === 'birthday' ? 'text-fuchsia-700' :
                        'text-blue-700'
                      }`}>{alert.desc}</p>
                   </div>
                </div>
             </Link>
          ))}
        </div>
      )}

      {/* Top Highlight Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-2xl p-6 border shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Receita Bruta Vendas</h3>
            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">R$ {metrics?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <p className="text-sm text-blue-600 font-medium mt-1">Vendas dos últimos 30 dias</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lucro Líquido Real</h3>
             <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
               <ArrowUpRight className="h-5 w-5" />
             </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">R$ {metrics?.totalNetProfit?.toFixed(2) || '0.00'}</div>
          <p className="text-sm text-emerald-600/80 font-medium mt-1">Após custos, taxas e fretes</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border shadow-sm relative overflow-hidden text-white">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Margem de Lucro</h3>
             <div className="bg-slate-700 text-white p-2 rounded-lg">
               <ShoppingBag className="h-5 w-5" />
             </div>
          </div>
          <div className="text-4xl font-black text-emerald-400">{metrics?.margin?.toFixed(1) || '0.0'}%</div>
          <p className="text-sm text-slate-400 font-medium mt-1">Performance do seu negócio</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Receita vs Lucro Líquido</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.timelineData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="Receitas" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold mb-4">Métodos de Pagamento</h3>
          {metrics && metrics.pieData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {metrics.pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: 'none' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold mb-4">Origem das Vendas</h3>
          {metrics && metrics.originData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.originData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {metrics.originData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: 'none' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
          )}
        </div>
      </div>

      {/* Cadastrais */}
      <h3 className="text-xl font-bold mt-8 mb-4">Dados Cadastrais</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg"><Package className="h-6 w-6 text-primary" /></div>
          <div>
            <div className="text-2xl font-bold">{metrics?.products ?? 0}</div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Produtos</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-lg"><Users className="h-6 w-6 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{metrics?.customers ?? 0}</div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Clientes</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex items-center gap-4">
          <div className="bg-orange-500/10 p-3 rounded-lg"><ShoppingBag className="h-6 w-6 text-orange-600" /></div>
          <div>
            <div className="text-2xl font-bold">{metrics?.categories ?? 0}</div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Categorias</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex items-center gap-4">
          <div className="bg-slate-500/10 p-3 rounded-lg"><Users className="h-6 w-6 text-slate-600" /></div>
          <div>
            <div className="text-2xl font-bold">{metrics?.suppliers ?? 0}</div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Fornecedores</p>
          </div>
        </div>
      </div>
    </div>
  );
}
