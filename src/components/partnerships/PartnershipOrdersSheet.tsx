import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  partnershipId: string;
  partnerEmail: string;
}

export default function PartnershipOrdersSheet({ partnershipId, partnerEmail }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [orderToReject, setOrderToReject] = React.useState<{id: string, sale_id: string} | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['partnership-orders', partnershipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partnership_orders')
        .select(`
          id, quantity, sale_price, status, created_at, seller_id, owner_id, sale_id,
          products ( name ),
          product_variants ( size, color )
        `)
        .eq('partnership_id', partnershipId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filtrar pedidos de estoque próprio (seller === owner): esses não precisam de confirmação manual
      return (data || []).filter((o: any) => o.seller_id !== o.owner_id);
    },
    enabled: !!user
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, sale_id }: { id: string, status: string, sale_id?: string }) => {
      const { error } = await supabase
        .from('partnership_orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      if (status === 'confirmed' && sale_id) {
         // Chama a função RPC segura para ultrapassar a barreira de segurança e concluir a venda da sócia
         await supabase.rpc('mark_p2p_sale_completed', { p_sale_id: sale_id });
      }

      if (status === 'rejected') {
         // Apaga a dívida pré-lançada no settlement já que a peça não será entregue
         await supabase.from('partnership_settlements').delete().eq('partnership_order_id', id);
         
         if (sale_id) {
             // Sinaliza usando RLS Bypass a venda apontando que houve recusa do parceiro
             await supabase.rpc('mark_p2p_sale_rejected', { p_sale_id: sale_id });
         }
      }
    },
    onSuccess: () => {
      toast.success('Status da solicitação atualizado.');
      queryClient.invalidateQueries({ queryKey: ['partnership-orders', partnershipId] });
    },
    onError: (e: any) => toast.error('Erro ao atualizar: ' + e.message)
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_confirmation': return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'confirmed': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Confirmado (P/ Entrega)</span>;
      case 'settled': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Acertado</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><XCircle className="w-3 h-3"/> Recusado</span>;
      case 'cancelled': return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Cancelada</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 border-primary/20 hover:border-primary/50 text-slate-700">
          <Package className="w-4 h-4 text-primary" /> Solicitações P2P
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[95vw] md:max-w-2xl bg-slate-50 border-l border-slate-200 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Package className="w-6 h-6 text-primary" /> Solicitações de Peças
          </SheetTitle>
          <p className="text-sm text-slate-500">Acompanhe as peças vendidas ou repassadas entre você e <span className="font-bold text-slate-800">{partnerEmail}</span>.</p>
        </SheetHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando solicitações...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <p className="text-slate-500 font-medium">Nenhuma solicitação de mercadoria ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Quando alguém vender um item do estoque do outro, aparecerá aqui.</p>
            </div>
          ) : (
            orders.map(order => {
              const iAmOwner = order.owner_id === user?.id;
              return (
                <div key={order.id} className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                         {(order.products as any)?.name}
                         {getStatusBadge(order.status)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span>Qtd: <strong className="text-slate-800">{order.quantity}</strong></span>
                        {order.product_variants && <span>• Tam: <strong className="text-slate-800">{(order.product_variants as any).size} {(order.product_variants as any).color}</strong></span>}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400">Venda: R$ {order.sale_price.toFixed(2)}</p>
                       <p className="text-[10px] text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t bg-slate-50/50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <p className="text-xs font-medium text-slate-600">
                        {iAmOwner 
                          ? <span>A parceira vendeu sua peça! Prepare o produto para repasse.</span>
                          : <span>Você vendeu a peça dela. Verifique se ela confirmou a entrega.</span>
                        }
                     </p>

                     {iAmOwner && order.status === 'pending_confirmation' && (
                        <div className="flex gap-2 shrink-0">
                           <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 bg-white" onClick={() => {
                               setOrderToReject({ id: order.id, sale_id: order.sale_id });
                           }}>Recusar (Sem Estoque)</Button>
                           <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-white" onClick={() => {
                               updateStatusMutation.mutate({ id: order.id, status: 'confirmed', sale_id: order.sale_id });
                           }}>Liberar Peça & Faturar</Button>
                        </div>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>

      <Dialog open={!!orderToReject} onOpenChange={(open) => !open && setOrderToReject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle className="w-5 h-5" /> Confirmar Recusa de Entrega
            </DialogTitle>
          </DialogHeader>
          <div className="bg-red-50 text-red-800 text-sm p-4 rounded-lg border border-red-100 shadow-inner">
            <p className="font-semibold mb-2">Você tem certeza que deseja recusar o envio desta peça?</p>
            <p>Isso apagará a dívida prevista no Acerto Financeiro e a vendedora precisará estornar a venda no caixa dela para não lesar o cliente final.</p>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOrderToReject(null)}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 font-bold" onClick={() => {
              if (orderToReject) {
                updateStatusMutation.mutate({ id: orderToReject.id, status: 'rejected', sale_id: orderToReject.sale_id });
                setOrderToReject(null);
              }
            }}>
              Sim, Recusar Peça
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
