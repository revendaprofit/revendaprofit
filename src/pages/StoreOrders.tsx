import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, CheckCircle, Clock, XCircle, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function StoreOrders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['store-orders'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          id, order_code, status, total_amount, items, created_at, partner_point_id,
          customers ( id, name, phone ),
          partner_points ( name )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('store_orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status do pedido atualizado!');
      queryClient.invalidateQueries({ queryKey: ['store-orders'] });
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Buscando pedidos...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Pedidos da Loja
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pedidos recebidos através do seu catálogo online. 
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${order.status !== 'pending' ? 'opacity-70' : ''}`}>
            {/* Header do Card */}
            <div className={`p-4 border-b flex justify-between items-center ${order.status === 'pending' ? 'bg-amber-50/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-800 text-sm bg-white px-2 py-1 rounded shadow-sm">
                  {order.order_code}
                </span>
                {order.status === 'pending' && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Aguardando</span>}
                {order.status === 'completed' && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3"/> Convertido</span>}
                {order.status === 'cancelled' && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3"/> Cancelado</span>}
                {order.partner_points?.name && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-100 px-2 py-0.5 rounded-full" title={`Veio do parceiro: ${order.partner_points.name}`}>
                    PARCEIRO: {order.partner_points.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {new Date(order.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </span>
            </div>

            {/* Corpo do Cartão */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Cliente:</p>
                <div className="flex justify-between items-center">
                   <p className="font-bold text-gray-800">{order.customers?.name || 'Cliente Desconhecido'}</p>
                   <a 
                     href={`https://wa.me/${order.customers?.phone?.replace(/\D/g, '')}`} 
                     target="_blank" 
                     className="text-emerald-600 bg-emerald-50 p-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                     title="Abrir WhatsApp"
                   >
                     <MessageCircle className="h-4 w-4" />
                   </a>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm flex-1 mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Resumo do Carrinho</p>
                <ul className="space-y-1.5 font-medium text-gray-700">
                  {order.items?.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate pr-2">{item.qty}x {item.product?.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-end mt-auto pt-4 border-t border-dashed">
                <div>
                  <p className="text-xs text-gray-500">Valor Total Estimado</p>
                  <p className="text-lg font-black text-primary">R$ {Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Ações */}
            {order.status === 'pending' && (
              <div className="p-3 bg-gray-50 border-t flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if(window.confirm('Tem certeza que deseja cancelar e descartar este pedido?')) {
                      updateStatusMutation.mutate({ id: order.id, status: 'cancelled' });
                    }
                  }}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Descartar
                </Button>
                <Button 
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                     localStorage.setItem('revenda_pos_pending_order', JSON.stringify(order));
                     navigate('/pos');
                  }}
                >
                  <ArrowRight className="w-3 h-3 mr-1" /> Registrar Venda
                </Button>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed">
             <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
             <h3 className="font-bold text-gray-900">Nenhum pedido ainda</h3>
             <p className="text-sm text-gray-500 max-w-xs mt-1">Os pedidos feitos pelos clientes no seu Catálogo Online aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
