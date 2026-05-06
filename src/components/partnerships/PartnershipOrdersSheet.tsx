import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, CheckCircle, XCircle, Clock, AlertTriangle, ShoppingCart, PackagePlus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  partnershipId: string;
  partnerEmail: string;
}

export default function PartnershipOrdersSheet({ partnershipId, partnerEmail }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [orderToReject, setOrderToReject] = React.useState<{id: string, sale_id: string, order_type: string} | null>(null);
  const [orderToReturn, setOrderToReturn] = React.useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['partnership-orders', partnershipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partnership_orders')
        .select(`
          id, quantity, sale_price, status, order_type, created_at, seller_id, owner_id, sale_id,
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

  // Mutation para vendas (fluxo original)
  const updateSaleStatusMutation = useMutation({
    mutationFn: async ({ id, status, sale_id }: { id: string, status: string, sale_id?: string }) => {
      const { error } = await supabase
        .from('partnership_orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      if (status === 'confirmed' && sale_id) {
         await supabase.rpc('mark_p2p_sale_completed', { p_sale_id: sale_id });
      }

      if (status === 'rejected') {
         await supabase.from('partnership_settlements').delete().eq('partnership_order_id', id);
         if (sale_id) {
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

  // Mutation para aceitar empréstimo (RPC dedicada)
  const acceptLoanMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('accept_p2p_loan', { p_order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empréstimo aceito! Peça transferida para o estoque da parceira.');
      queryClient.invalidateQueries({ queryKey: ['partnership-orders', partnershipId] });
    },
    onError: (e: any) => toast.error('Erro ao aceitar empréstimo: ' + e.message)
  });

  // Mutation para recusar empréstimo
  const rejectLoanMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('partnership_orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitação de empréstimo recusada.');
      queryClient.invalidateQueries({ queryKey: ['partnership-orders', partnershipId] });
    },
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  // Mutation para devolver peça emprestada
  const returnLoanMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('return_p2p_loan', { p_order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Peça devolvida com sucesso! Estoque restaurado.');
      setOrderToReturn(null);
      queryClient.invalidateQueries({ queryKey: ['partnership-orders', partnershipId] });
    },
    onError: (e: any) => toast.error('Erro ao devolver: ' + e.message)
  });

  const getOrderTypeIcon = (orderType: string) => {
    if (orderType === 'loan') return <PackagePlus className="w-3.5 h-3.5 text-amber-600" />;
    return <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />;
  };

  const getOrderTypeBadge = (orderType: string) => {
    if (orderType === 'loan') {
      return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">📦 Empréstimo</span>;
    }
    return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">🛒 Venda</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_confirmation': return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'confirmed': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Confirmado (P/ Entrega)</span>;
      case 'on_loan': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><PackagePlus className="w-3 h-3"/> Emprestada</span>;
      case 'returned': return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Devolvida</span>;
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
          <p className="text-sm text-slate-500">Acompanhe as peças vendidas ou emprestadas entre você e <span className="font-bold text-slate-800">{partnerEmail}</span>.</p>
        </SheetHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando solicitações...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <p className="text-slate-500 font-medium">Nenhuma solicitação de mercadoria ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Quando alguém vender ou solicitar um item do estoque do outro, aparecerá aqui.</p>
            </div>
          ) : (
            orders.map(order => {
              const iAmOwner = order.owner_id === user?.id;
              const orderType = (order as any).order_type || 'sale';
              const isLoan = orderType === 'loan';

              return (
                <div key={order.id} className={`bg-white rounded-xl p-4 border shadow-sm ${isLoan ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getOrderTypeBadge(orderType)}
                        {getStatusBadge(order.status)}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mt-1">
                         {getOrderTypeIcon(orderType)}
                         {(order.products as any)?.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span>Qtd: <strong className="text-slate-800">{order.quantity}</strong></span>
                        {order.product_variants && <span>• Tam: <strong className="text-slate-800">{(order.product_variants as any).size} {(order.product_variants as any).color}</strong></span>}
                      </p>
                    </div>
                    <div className="text-right">
                       {!isLoan && <p className="text-xs text-slate-400">Venda: R$ {order.sale_price.toFixed(2)}</p>}
                       {isLoan && <p className="text-xs text-amber-500 font-medium">Empréstimo</p>}
                       <p className="text-[10px] text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t bg-slate-50/50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <p className="text-xs font-medium text-slate-600">
                        {isLoan ? (
                          iAmOwner 
                            ? <span>A parceira quer pegar esta peça emprestada.</span>
                            : <span>Você solicitou esta peça emprestada.</span>
                        ) : (
                          iAmOwner 
                            ? <span>A parceira vendeu sua peça! Prepare o produto para repasse.</span>
                            : <span>Você vendeu a peça dela. Verifique se ela confirmou a entrega.</span>
                        )}
                     </p>

                     {/* Botões de ação para VENDAS (fluxo original) */}
                     {!isLoan && iAmOwner && order.status === 'pending_confirmation' && (
                        <div className="flex gap-2 shrink-0">
                           <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 bg-white" onClick={() => {
                               setOrderToReject({ id: order.id, sale_id: order.sale_id, order_type: 'sale' });
                           }}>Recusar (Sem Estoque)</Button>
                           <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-white" onClick={() => {
                               updateSaleStatusMutation.mutate({ id: order.id, status: 'confirmed', sale_id: order.sale_id });
                           }}>Liberar Peça & Faturar</Button>
                        </div>
                     )}

                     {/* Botões de ação para EMPRÉSTIMOS */}
                     {isLoan && iAmOwner && order.status === 'pending_confirmation' && (
                        <div className="flex gap-2 shrink-0">
                           <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 bg-white" onClick={() => {
                               setOrderToReject({ id: order.id, sale_id: order.sale_id, order_type: 'loan' });
                           }}>Recusar</Button>
                           <Button 
                             size="sm" 
                             className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                             disabled={acceptLoanMutation.isPending}
                             onClick={() => acceptLoanMutation.mutate(order.id)}
                           >
                             {acceptLoanMutation.isPending ? 'Transferindo...' : '📦 Liberar Empréstimo'}
                           </Button>
                        </div>
                     )}

                     {/* Botão de devolução para peças emprestadas */}
                     {isLoan && order.status === 'on_loan' && (
                        <div className="flex gap-2 shrink-0">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                             onClick={() => setOrderToReturn(order.id)}
                           >
                             <RotateCcw className="w-3 h-3 mr-1" /> Registrar Devolução
                           </Button>
                        </div>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>

      {/* Dialog de Recusa */}
      <Dialog open={!!orderToReject} onOpenChange={(open) => !open && setOrderToReject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle className="w-5 h-5" /> Confirmar Recusa
            </DialogTitle>
          </DialogHeader>
          <div className="bg-red-50 text-red-800 text-sm p-4 rounded-lg border border-red-100 shadow-inner">
            <p className="font-semibold mb-2">Você tem certeza que deseja recusar esta solicitação?</p>
            {orderToReject?.order_type === 'sale' ? (
              <p>Isso apagará a dívida prevista no Acerto Financeiro e a vendedora precisará estornar a venda no caixa dela para não lesar o cliente final.</p>
            ) : (
              <p>A parceira será notificada de que a peça não está disponível para empréstimo.</p>
            )}
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOrderToReject(null)}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 font-bold" onClick={() => {
              if (orderToReject) {
                if (orderToReject.order_type === 'loan') {
                  rejectLoanMutation.mutate(orderToReject.id);
                } else {
                  updateSaleStatusMutation.mutate({ id: orderToReject.id, status: 'rejected', sale_id: orderToReject.sale_id });
                }
                setOrderToReject(null);
              }
            }}>
              Sim, Recusar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Devolução */}
      <Dialog open={!!orderToReturn} onOpenChange={(open) => !open && setOrderToReturn(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 font-bold">
              <RotateCcw className="w-5 h-5" /> Confirmar Devolução
            </DialogTitle>
          </DialogHeader>
          <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-lg border border-amber-100 shadow-inner">
            <p className="font-semibold mb-2">Confirma a devolução desta peça?</p>
            <p>O estoque será removido de quem pegou emprestado e devolvido à dona original.</p>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOrderToReturn(null)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 font-bold" 
              disabled={returnLoanMutation.isPending}
              onClick={() => {
                if (orderToReturn) returnLoanMutation.mutate(orderToReturn);
              }}
            >
              {returnLoanMutation.isPending ? 'Devolvendo...' : 'Sim, Devolver Peça'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
