import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { notifyBotConversa } from "@/utils/notifyBotConversa"
import { PackageOpen, CheckCircle, XCircle, ArrowLeftRight, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react"

type Props = {
  bagId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ConsignmentSettlementSheet({ bagId, open, onOpenChange }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch bag details
  const { data: bag, isLoading } = useQuery({
    queryKey: ['admin_bag_settlement', bagId],
    queryFn: async () => {
      if (!bagId) return null;
      const { data, error } = await supabase
        .from('consignment_bags')
        .select(`
          *,
          customer:customers(name, phone),
          items:consignment_bag_items(
            id, quantity, customer_decision, variant_id, exchange_variant_id,
            product:products(id, name, sale_price, image_url, variants:product_variants(id, size, color, stock))
          )
        `)
        .eq('id', bagId)
        .single()
        
      if (error) throw error
      return data
    },
    enabled: !!bagId && open
  })

  // Concluir e Enviar para PDV
  const sendToPOSMutation = useMutation({
    mutationFn: async () => {
      if (!bag) throw new Error("Bolsa não encontrada");

      // 1. Filtrar as peças que o cliente escolheu FICAR
      const keptItems = bag.items.filter((i: any) => i.customer_decision === 'kept');

      // Se NÃO tiver peças para ficar, concluímos a malinha aqui mesmo (Arquivar)
      if (keptItems.length === 0) {
        const { error: bagError } = await supabase
          .from('consignment_bags')
          .update({ status: 'concluded' })
          .eq('id', bagId);
          
        if (bagError) throw bagError;
        return 0;
      }

      // Se TIVER peças para ficar, NÃO concluímos a malinha agora. 
      // Montamos o payload pro PDV e passamos o ID da malinha para ele concluir no final.
      const orderPayload = {
        customers: { id: bag.customer_id },
        order_code: `Malinha: ${bag.customer?.name || ''}`,
        consignment_bag_id: bagId,
        items: keptItems.map((item: any) => {
           const variantData = item.product?.variants?.find((v:any) => v.id === item.variant_id);
           return {
              variant_id: item.variant_id,
              qty: item.quantity,
              product: {
                 id: item.product.id,
                 name: item.product.name,
                 sale_price: item.product.sale_price,
                 cost_price: 0
              },
              variant: {
                 size: variantData?.size || '',
                 color: variantData?.color || '',
                 stock: variantData?.stock || 1
              }
           };
        })
      };
      
      localStorage.setItem('revenda_pos_pending_order', JSON.stringify(orderPayload));
      
      return keptItems.length;
    },
    onSuccess: (keptCount) => {
      queryClient.invalidateQueries({ queryKey: ['consignment_bags'] });
      onOpenChange(false);

      if (bag?.owner_id) {
        notifyBotConversa('bag_finalized', bag.owner_id, {
          cliente: bag.customer?.name || 'Cliente',
          malinha: bag.name || bagId || '',
          pecas_compradas: String(keptCount),
          valor: `R$ ${keptItems.reduce((acc: number, item: any) => acc + (item.product?.sale_price * item.quantity || 0), 0).toFixed(2)}`,
        });

        // Notify waitlist customers for returned/pending variants
        const returnedVariantIds = [...returnedItems, ...pendingItems]
          .map((i: any) => i.variant_id)
          .filter(Boolean);
        if (returnedVariantIds.length > 0) {
          (async () => {
            const { data: waitlistEntries } = await supabase
              .from('product_waitlist')
              .select('id, customer_name, customer_phone, variant_id')
              .eq('owner_id', bag.owner_id)
              .in('variant_id', returnedVariantIds)
              .is('notified_at', null);

            for (const entry of waitlistEntries || []) {
              const item = [...returnedItems, ...pendingItems].find(
                (i: any) => i.variant_id === entry.variant_id,
              );
              const variantSize =
                item?.product?.variants?.find((v: any) => v.id === entry.variant_id)?.size || '';
              await notifyBotConversa(
                'waitlist_available',
                bag.owner_id,
                {
                  cliente: entry.customer_name,
                  telefone: entry.customer_phone,
                  produto: item?.product?.name || 'Produto',
                  tamanho: variantSize,
                },
              );
              await supabase
                .from('product_waitlist')
                .update({ notified_at: new Date().toISOString() })
                .eq('id', entry.id);
            }
          })();
        }
      }

      if (keptCount > 0) {
          toast.success("Enviando peças para o PDV...");
          navigate('/pos');
      } else {
          toast.info("Malinha arquivada. (Nenhuma peça comprada).");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao tentar concluir a malinha.");
    }
  });

  if (!bag) return null;

  const keptItems = bag.items.filter((i: any) => i.customer_decision === 'kept');
  const returnedItems = bag.items.filter((i: any) => i.customer_decision === 'returned');
  const exchangeItems = bag.items.filter((i: any) => i.customer_decision === 'wrong_size');
  const pendingItems = bag.items.filter((i: any) => i.customer_decision === 'pending' || !i.customer_decision);

  const totalSaleValue = keptItems.reduce((acc: number, item: any) => acc + (item.product?.sale_price * item.quantity || 0), 0);



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-50 flex flex-col h-full border-l px-0">
        <SheetHeader className="px-6 py-4 bg-white border-b shrink-0 flex flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" /> Acerto da Malinha
            </SheetTitle>
            <SheetDescription>
              Resumo das escolhas do cliente: <span className="font-bold text-foreground">{bag.customer?.name}</span>
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="space-y-6 pb-20">
            {/* Aviso Pendentes */}
            {pendingItems.length > 0 && (
               <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3">
                 <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                 <p className="text-sm font-medium">Atenção: O cliente não parece ter decidido todas as peças (ou a seleção foi feita manualmente na loja). As peças pendentes serão tratadas como DEVOLVIDAS se você concluir agora.</p>
               </div>
            )}

            {/* Listas de Produtos Reparicionadas por Decisão */}

            {/* FICAR (Venda Efetiva) */}
            <div className="space-y-3">
               <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                 <CheckCircle className="w-4 h-4" /> Vão Ficar (Venda Efetiva) - {keptItems.length} peças
               </h3>
               {keptItems.length === 0 ? (
                 <p className="text-sm text-muted-foreground p-4 bg-white rounded-xl border border-dashed">Nenhuma peça escolhida para ficar.</p>
               ) : (
                 <div className="bg-white rounded-xl border border-emerald-100 shadow-sm divide-y">
                   {keptItems.map((item: any) => (
                     <div key={item.id} className="p-3 flex items-center gap-3">
                       <div className="w-12 h-14 bg-slate-100 rounded bg-cover bg-center shrink-0" style={{backgroundImage: `url(${item.product?.image_url})`}} />
                       <div className="flex-1">
                         <p className="font-semibold text-sm leading-tight text-slate-800">{item.product?.name}</p>
                         <p className="text-emerald-600 font-bold text-sm mt-0.5">{(item.product?.sale_price || 0).toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</p>
                       </div>
                       <div className="text-sm font-medium text-slate-500 bg-slate-100 px-2 rounded">
                          Qtd: {item.quantity}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* TROCA (Atenção Logística) */}
            {exchangeItems.length > 0 && (
              <div className="space-y-3">
                 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                   <ArrowLeftRight className="w-4 h-4" /> Pediu Troca - {exchangeItems.length} peças
                 </h3>
                 <div className="bg-white rounded-xl border border-amber-200 shadow-sm divide-y">
                   {exchangeItems.map((item: any) => {
                     const reqSize = item.product?.variants?.find((v:any)=> v.id === item.exchange_variant_id);
                     return (
                       <div key={item.id} className="p-3 flex items-center gap-3">
                         <div className="w-12 h-14 bg-slate-100 rounded bg-cover bg-center shrink-0" style={{backgroundImage: `url(${item.product?.image_url})`}} />
                         <div className="flex-1">
                           <p className="font-semibold text-sm leading-tight text-slate-800">{item.product?.name}</p>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs text-muted-foreground line-through">Tamanho atual será devolvido</span>
                             <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Enviar Tamanho: {reqSize?.size || reqSize?.color || 'Indefinido'}</span>
                           </div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
              </div>
            )}

            {/* DEVOLVER (Volta pro Estoque) */}
            <div className="space-y-3">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <XCircle className="w-4 h-4" /> Devoluções/Rejeições - {returnedItems.length} peças
               </h3>
               {returnedItems.length === 0 && pendingItems.length === 0 ? (
                 <p className="text-sm text-muted-foreground p-4 bg-white rounded-xl border border-dashed">Nenhuma devolução confirmada.</p>
               ) : (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y opacity-75">
                   {[...returnedItems, ...pendingItems].map((item: any) => (
                     <div key={item.id} className="p-3 flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0">
                         {item.product?.image_url ? <img src={item.product?.image_url} className="w-full h-full object-cover rounded opacity-50"/> : <PackageOpen className="w-4 h-4 text-slate-400" />}
                       </div>
                       <div className="flex-1">
                         <p className="font-medium text-sm leading-tight text-slate-600 line-clamp-1">{item.product?.name}</p>
                         <p className="text-xs text-slate-400 mt-0.5">{item.customer_decision === 'pending' ? 'Não respondido (assumindo devolução)' : 'Devolvido'}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

          </div>
        </div>

        {/* Footer com Recebimento */}
        {totalSaleValue > 0 ? (
          <div className="p-6 bg-white border-t space-y-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total da Venda</p>
                <p className="text-3xl font-black text-emerald-600 leading-none">{totalSaleValue.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</p>
              </div>
            </div>

            <Button 
               size="lg" 
               className="w-full h-12 font-bold text-base bg-emerald-600 hover:bg-emerald-700" 
               disabled={sendToPOSMutation.isPending}
               onClick={() => sendToPOSMutation.mutate()}
            >
              {sendToPOSMutation.isPending ? 'Enviando...' : 'Finalizar e Enviar p/ PDV'} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="p-6 bg-white border-t shrink-0 flex flex-col gap-3">
             <p className="text-center font-bold text-slate-500">O cliente não ficou com nenhuma peça.</p>
             <Button 
               size="lg" 
               variant="outline"
               className="w-full" 
               disabled={sendToPOSMutation.isPending}
               onClick={() => sendToPOSMutation.mutate()}
            >
              Arquivar Malinha
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
