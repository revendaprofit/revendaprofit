import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, TrendingUp, AlertTriangle, ClipboardList } from 'lucide-react';

export default function SupplierDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['supplier-stats', user?.id],
    queryFn: async () => {
      const [productsRes, variantsRes, ordersRes] = await Promise.all([
        supabase.from('hub_products').select('id, status', { count: 'exact' }).eq('supplier_id', user!.id),
        supabase.from('hub_product_variants').select('stock').eq('supplier_id', user!.id),
        supabase.from('hub_fulfillment_orders').select('id, status', { count: 'exact' }).eq('supplier_id', user!.id)
      ]);

      const totalProducts = productsRes.count || 0;
      const activeProducts = productsRes.data?.filter(p => p.status === 'active').length || 0;
      const totalStock = variantsRes.data?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      const lowStockCount = variantsRes.data?.filter(v => v.stock > 0 && v.stock <= 5).length || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === 'pending' || o.status === 'label_ready').length || 0;
      const totalOrders = ordersRes.count || 0;

      return { totalProducts, activeProducts, totalStock, lowStockCount, pendingOrders, totalOrders };
    },
    enabled: !!user
  });

  const cards = [
    { title: 'Produtos no Hub', value: stats?.activeProducts || 0, subtitle: `${stats?.totalProducts || 0} total`, icon: Package, color: 'amber' },
    { title: 'Estoque Total', value: stats?.totalStock || 0, subtitle: `${stats?.lowStockCount || 0} com estoque baixo`, icon: TrendingUp, color: 'emerald' },
    { title: 'Pedidos Pendentes', value: stats?.pendingOrders || 0, subtitle: 'Aguardando envio', icon: AlertTriangle, color: 'red' },
    { title: 'Total de Pedidos', value: stats?.totalOrders || 0, subtitle: 'Historico completo', icon: ClipboardList, color: 'blue' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-3.5 rounded-2xl border border-amber-500/30">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Painel do Fornecedor</h1>
            <p className="text-slate-400 font-medium mt-1">Visao geral do seu catalogo e pedidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl border ${colorMap[card.color]}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{card.title}</p>
              <p className="text-xs text-slate-400">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
