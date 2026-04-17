import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, Package, Truck, CheckCircle, XCircle, Clock, 
  FileText, Download, CreditCard, Image, Eye, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  label_ready: { label: 'Etiqueta Pronta', color: 'bg-blue-100 text-blue-700', icon: FileText },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function SupplierOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['supplier-fulfillment-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_fulfillment_orders')
        .select('*, hub_products(name, image_url)')
        .eq('supplier_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      if (data && data.length > 0) {
        const tenantIds = [...new Set(data.map((o: any) => o.tenant_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', tenantIds);
        
        return data.map((o: any) => {
          const tenant = profiles?.find((p: any) => p.id === o.tenant_id);
          return { ...o, _tenant_name: tenant?.full_name || tenant?.email || 'Lojista' };
        });
      }
      return data || [];
    },
    enabled: !!user
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('hub_fulfillment_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-fulfillment-orders'] });
      toast.success('Pedido atualizado!');
    },
    onError: (err: any) => toast.error('Erro: ' + err.message)
  });

  const filtered = filter === 'all' ? orders : orders.filter((o: any) => o.status === filter);

  const stats = {
    pending: orders.filter((o: any) => o.status === 'pending' || o.status === 'label_ready').length,
    shipped: orders.filter((o: any) => o.status === 'shipped').length,
    revenue: orders.filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.total_wholesale) || 0), 0),
    unpaid: orders.filter((o: any) => o.payment_status !== 'confirmed' && o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.total_wholesale) || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-purple-500/20 p-3.5 rounded-2xl border border-purple-500/30">
            <ClipboardList className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Pedidos Recebidos</h1>
            <p className="text-slate-400 font-medium mt-1">Pedidos dos lojistas aguardando envio</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">A Despachar</p>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Enviados</p>
          <p className="text-2xl font-black text-purple-600">{stats.shipped}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Faturamento</p>
          <p className="text-lg font-black text-emerald-700">R$ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-red-400 uppercase">Pendente Pgto</p>
          <p className="text-lg font-black text-red-600">R$ {stats.unpaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Todos' }, ...Object.entries(statusConfig).map(([key, val]) => ({ key, label: val.label }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f.label} {f.key !== 'all' && `(${orders.filter((o: any) => o.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum pedido {filter !== 'all' ? 'com esse status' : ''}</h3>
          <p className="text-sm text-slate-500 mt-2">Quando lojistas fizerem vendas dos seus produtos, os pedidos aparecerao aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const hasLabel = !!order.label_url;
            const paymentPending = order.payment_status === 'pending';
            const paymentSent = order.payment_status === 'sent';
            const paymentConfirmed = order.payment_status === 'confirmed';
            const readyToShip = hasLabel && paymentConfirmed;

            return (
              <div key={order.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${readyToShip && order.status !== 'shipped' && order.status !== 'delivered' ? 'border-emerald-300 ring-1 ring-emerald-200' : ''}`}>
                <div className="flex flex-col gap-4">
                  {/* Top Row */}
                  <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {order.hub_products?.image_url ? (
                          <img src={order.hub_products.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-slate-400">{order.order_code || '—'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{order.hub_products?.name || 'Produto'} x{order.quantity}</p>
                        <p className="text-xs text-slate-500">
                          Lojista: <span className="font-bold text-indigo-600">{order._tenant_name}</span>
                          <span className="text-slate-400 ml-2">• {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Atacado</p>
                      <p className="text-lg font-black text-emerald-700">R$ {Number(order.total_wholesale || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Status Badges Row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Payment Status */}
                    <div className={`rounded-lg p-2.5 border text-center ${paymentConfirmed ? 'bg-emerald-50 border-emerald-200' : paymentSent ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                      <CreditCard className={`w-4 h-4 mx-auto mb-1 ${paymentConfirmed ? 'text-emerald-500' : paymentSent ? 'text-amber-500' : 'text-red-400'}`} />
                      <p className={`text-[10px] font-bold ${paymentConfirmed ? 'text-emerald-700' : paymentSent ? 'text-amber-700' : 'text-red-600'}`}>
                        {paymentConfirmed ? 'Pago ✓' : paymentSent ? 'Comprovante Recebido' : 'Aguardando Pgto'}
                      </p>
                      {paymentSent && order.payment_proof_url && (
                        <div className="mt-1 flex gap-1 justify-center">
                          <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> Ver
                          </a>
                          <button className="text-[10px] text-emerald-600 hover:underline font-bold"
                            onClick={() => updateMutation.mutate({ id: order.id, updates: { payment_status: 'confirmed', payment_confirmed_at: new Date().toISOString() } })}>
                            ✓ Confirmar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Label Status */}
                    <div className={`rounded-lg p-2.5 border text-center ${hasLabel ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <FileText className={`w-4 h-4 mx-auto mb-1 ${hasLabel ? 'text-blue-500' : 'text-slate-300'}`} />
                      <p className={`text-[10px] font-bold ${hasLabel ? 'text-blue-700' : 'text-slate-400'}`}>
                        {hasLabel ? 'Etiqueta Disponivel' : 'Sem Etiqueta'}
                      </p>
                      {hasLabel && (
                        <a href={order.label_url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 justify-center mt-1">
                          <Download className="w-3 h-3" /> Baixar
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {readyToShip && (order.status === 'pending' || order.status === 'label_ready') && (
                      <div className="flex gap-2 items-center">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Pronto para despachar!
                        </div>
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white text-xs h-8 px-4"
                          onClick={() => updateMutation.mutate({ id: order.id, updates: { status: 'shipped', shipped_at: new Date().toISOString() } })}>
                          <Truck className="w-3.5 h-3.5 mr-1" /> Marcar Enviado
                        </Button>
                      </div>
                    )}

                    {!readyToShip && (order.status === 'pending' || order.status === 'label_ready') && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-[11px] text-amber-700 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Aguardando: {!paymentConfirmed && 'pagamento'}{!paymentConfirmed && !hasLabel && ' + '}{!hasLabel && 'etiqueta'}
                      </div>
                    )}

                    {order.status === 'shipped' && (
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8"
                        onClick={() => updateMutation.mutate({ id: order.id, updates: { status: 'delivered', delivered_at: new Date().toISOString() } })}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmar Entrega
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
