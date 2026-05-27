import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Briefcase, CheckCircle, XCircle, ChevronRight, PackageOpen, Info, ArrowLeftRight, PaintBucket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { notifyBotConversa } from "@/utils/notifyBotConversa"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function PublicConsignmentBag() {
  const { bag_id } = useParams()
  const queryClient = useQueryClient()
  
  // Local state to track user selections before submitting
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [exchanges, setExchanges] = useState<Record<string, string | null>>({})
  
  // Modal de troca
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
  const [activeExchangeItem, setActiveExchangeItem] = useState<any>(null)

  // Fetch bag details
  const { data: bag, isLoading, error } = useQuery({
    queryKey: ['public_bag', bag_id],
    queryFn: async () => {
      if (!bag_id) throw new Error("ID inválido")
      const { data, error } = await supabase
        .from('consignment_bags')
        .select(`
          *,
          items:consignment_bag_items(
            id, quantity, customer_decision, variant_id, exchange_variant_id,
            product:products(id, name, sale_price, image_url, variants:product_variants(id, size, color, stock))
          )
        `)
        .eq('id', bag_id)
        .single()
        
      if (error) throw error

      // Buscar perfil da loja separadamente
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, store_name, logo_url')
        .eq('id', data.owner_id)
        .single()
        
      data.owner = profile;
      
      // Initialize local state
      const initialDecisions: Record<string, string> = {}
      const initialExchanges: Record<string, string | null> = {}
      data.items.forEach((item: any) => {
        initialDecisions[item.id] = item.customer_decision || 'pending'
        initialExchanges[item.id] = item.exchange_variant_id || null
      })
      setDecisions(initialDecisions)
      setExchanges(initialExchanges)
      
      return data
    },
    enabled: !!bag_id
  })

  // Submit decisions
  const submitDecisionsMutation = useMutation({
    mutationFn: async () => {
      // Check se todos foram respondidos
      const undecided = Object.values(decisions).filter(d => d === 'pending')
      if (undecided.length > 0) {
        throw new Error("Por favor, marque se vai ficar ou devolver todas as peças antes de concluir.")
      }

      // Update cada item
      const updates = Object.entries(decisions).map(([itemId, decision]) => {
        return supabase
          .from('consignment_bag_items')
          .update({ 
             customer_decision: decision,
             exchange_variant_id: decision === 'wrong_size' ? exchanges[itemId] : null
          })
          .eq('id', itemId)
      })
      
      const results = await Promise.all(updates)
      const hasError = results.find(r => r.error)
      if (hasError) throw hasError.error

      // Muda o status da bolsa para aguardando acerto pela loja
      const { error: bagError } = await supabase
        .from('consignment_bags')
        .update({ status: 'pending_approval' })
        .eq('id', bag_id)
        
      if (bagError) throw bagError
    },
    onSuccess: () => {
      toast.success("Ótima escolha! Sua resposta foi enviada para a loja.")
      queryClient.invalidateQueries({ queryKey: ['public_bag', bag_id] })
      if (bag?.owner_id) {
        notifyBotConversa('bag_accepted', bag.owner_id, {
          cliente: bag.customer_name || 'Cliente',
          malinha: bag.name || bag_id || '',
          pecas_ficaram: String(Object.values(decisions).filter(d => d === 'kept').length),
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar resposta.")
    }
  })

  const handleDecision = (itemId: string, decision: string, exchangeId: string | null = null) => {
    if (bag?.status !== 'with_customer') return;
    setDecisions(prev => ({ ...prev, [itemId]: decision }))
    if (exchangeId !== null) {
      setExchanges(prev => ({ ...prev, [itemId]: exchangeId }))
    }
  }

  const openExchangeModal = (item: any) => {
    if (bag?.status !== 'with_customer') return;
    setActiveExchangeItem(item);
    setExchangeModalOpen(true);
  }

  const confirmExchange = (variantId: string) => {
    if (!activeExchangeItem) return;
    handleDecision(activeExchangeItem.id, 'wrong_size', variantId);
    setExchangeModalOpen(false);
    toast.success("Troca registrada! A peça atual será devolvida.");
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando sua malinha...</div>
  }

  if (error || !bag) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <PackageOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Malinha não encontrada</h2>
        <p className="text-muted-foreground mt-2">O link pode estar quebrado ou a malinha já foi finalizada pela loja.</p>
      </div>
    )
  }

  const isAnswered = bag.status !== 'with_customer'
  const storeName = bag.owner?.store_name || "Sua Loja"
  const keptItems = Object.values(decisions).filter(d => d === 'kept').length
  const totalValueKept = bag.items.reduce((acc: number, item: any) => acc + (decisions[item.id] === 'kept' ? (item.product?.sale_price * item.quantity || 0) : 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-primary px-6 py-8 text-primary-foreground text-center rounded-b-3xl shadow-lg">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black mb-1">Malinha {storeName}</h1>
        <p className="opacity-90">Experimente no conforto de casa!</p>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-4">
        {isAnswered && (
          <div className="bg-emerald-500 text-white rounded-xl p-4 mb-6 shadow-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold">Resposta enviada!</h3>
              <p className="text-sm opacity-90">A loja já recebeu suas escolhas. Entre em contato com eles para finalizar o pagamento e a devolução ou troca das peças.</p>
            </div>
          </div>
        )}

        {!isAnswered && (
          <div className="bg-blue-50 text-blue-800 rounded-xl p-4 mb-6 shadow-sm border border-blue-100 flex items-start gap-3">
             <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
             <p className="text-sm font-medium">Por favor, marque quais peças você vai **Ficar**, **Devolver** ou se deseja **Trocar**. Isso ajuda a loja a separar tudo rápido pra você!</p>
          </div>
        )}

        <div className="space-y-6">
          {bag.items.map((item: any) => {
            const decision = decisions[item.id];
            
            // Encontrar qual tamanho ele recebeu originalmente para exibir
            let sentVariantLabel = null;
            if (item.variant_id && item.product?.variants) {
               const variantData = item.product.variants.find((v:any) => v.id === item.variant_id);
               if (variantData) {
                  sentVariantLabel = variantData.size || variantData.color;
               }
            }

            // Achar o texto da troca se ele pediu
            let exchangeLabel = null;
            if (decision === 'wrong_size' && exchanges[item.id]) {
                const requestedVariant = item.product?.variants?.find((v:any) => v.id === exchanges[item.id]);
                if (requestedVariant) {
                   exchangeLabel = requestedVariant.size || requestedVariant.color;
                }
            }

            return (
              <div key={item.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${decision === 'kept' ? 'border-emerald-500 shadow-emerald-500/10' : decision === 'wrong_size' ? 'border-amber-400 shadow-amber-400/10' : decision === 'returned' ? 'border-slate-800 shadow-slate-800/10' : 'border-transparent'}`}>
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><PackageOpen className="w-6 h-6 text-slate-300"/></div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col pt-1">
                    <h3 className="font-semibold leading-tight line-clamp-2">{item.product?.name}</h3>
                    <p className="text-lg font-black text-primary mt-1">{(item.product?.sale_price || 0).toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                       <span className="bg-secondary px-2 py-1 rounded-md text-xs font-bold text-foreground">
                         Qtd: {item.quantity}
                       </span>
                       {sentVariantLabel && (
                         <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200 flex items-center gap-1">
                           <PaintBucket className="w-3 h-3"/> Cor/Tamanho: {sentVariantLabel}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                {decision === 'wrong_size' && (
                  <div className="mt-4 bg-amber-50 text-amber-900 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-amber-200">
                     <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                     Troca solicitada para o tamanho: <span className="underline decoration-amber-500 underline-offset-2">{exchangeLabel}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 border-t pt-4">
                  <Button 
                    variant={decision === 'kept' ? 'default' : 'outline'} 
                    className={`h-10 sm:h-12 rounded-xl transition-all font-bold text-xs sm:text-sm ${decision === 'kept' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : 'border-dashed'}`}
                    onClick={() => handleDecision(item.id, 'kept')}
                    disabled={isAnswered}
                  >
                    <CheckCircle className={`w-4 h-4 mr-2 ${decision === 'kept' ? 'opacity-100' : 'opacity-40'}`} />
                    FICAR
                  </Button>
                  
                  <Button 
                    variant={decision === 'wrong_size' ? 'default' : 'outline'} 
                    className={`h-10 sm:h-12 rounded-xl transition-all font-bold text-xs sm:text-sm ${decision === 'wrong_size' ? 'bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 border-none' : 'border-dashed'}`}
                    onClick={() => openExchangeModal(item)}
                    disabled={isAnswered}
                  >
                    <ArrowLeftRight className={`w-4 h-4 mr-2 ${decision === 'wrong_size' ? 'opacity-100' : 'opacity-40'}`} />
                    TROCAR
                  </Button>

                  <Button 
                    variant={decision === 'returned' ? 'default' : 'outline'} 
                    className={`h-10 sm:h-12 rounded-xl transition-all font-bold text-xs sm:text-sm ${decision === 'returned' ? 'bg-slate-800 hover:bg-slate-900 focus:bg-slate-900 border-none' : 'border-dashed'}`}
                    onClick={() => handleDecision(item.id, 'returned')}
                    disabled={isAnswered}
                  >
                    <XCircle className={`w-4 h-4 mr-2 ${decision === 'returned' ? 'opacity-100' : 'opacity-40'}`} />
                    DEVOLVER
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Seu Carrinho</p>
            <p className="text-xl font-black text-emerald-600">{totalValueKept.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</p>
            <p className="text-xs font-medium text-slate-500">{keptItems} {keptItems === 1 ? 'peça comprada' : 'peças compradas'}</p>
          </div>
          <Button 
            className="rounded-full shadow-lg h-12 px-8 font-bold"
            disabled={isAnswered || submitDecisionsMutation.isPending}
            onClick={() => submitDecisionsMutation.mutate()}
          >
            {submitDecisionsMutation.isPending ? 'Enviando...' : 'Concluir Malinha'} <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Modal de Troca de Tamanho */}
      <Dialog open={exchangeModalOpen} onOpenChange={setExchangeModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
             <DialogTitle>Trocar Tamanho</DialogTitle>
             <DialogDescription>
               Qual novo tamanho/cor você quer que a loja reserve e te envie?
             </DialogDescription>
          </DialogHeader>

          {activeExchangeItem && (
             <div className="py-4">
                <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 mb-4 border">
                   <div className="w-12 h-16 bg-white rounded flex items-center justify-center border shrink-0">
                      {activeExchangeItem.product?.image_url ? <img src={activeExchangeItem.product.image_url} className="w-full h-full object-cover rounded" /> : <PackageOpen className="w-5 h-5 text-slate-300"/>}
                   </div>
                   <div>
                     <p className="font-bold text-sm leading-tight text-slate-800">{activeExchangeItem.product?.name}</p>
                     <p className="text-xs text-muted-foreground mt-1">Este item marcado, naturalmente, voltará para a loja.</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="font-bold text-sm">Opções Disponíveis (em estoque):</p>
                   {(!activeExchangeItem.product.variants || activeExchangeItem.product.variants.length === 0) && (
                      <p className="text-sm text-destructive font-medium p-3 bg-red-50 rounded-lg">Desculpe, este produto não tem outras variações de cor/tamanho cadastradas.</p>
                   )}
                   
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                     {activeExchangeItem.product.variants?.map((v: any) => {
                        // Não pode pedir pra trocar pelo tamanho que ela já está na mão
                        if (v.id === activeExchangeItem.variant_id) return null;
                        
                        const hasStock = v.stock > 0;
                        return (
                           <Button 
                             key={v.id} 
                             variant="outline" 
                             className={`h-14 flex flex-col items-center justify-center border-2 ${!hasStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-primary hover:bg-primary/5'}`}
                             disabled={!hasStock}
                             onClick={() => confirmExchange(v.id)}
                           >
                             <span className="font-bold">{v.size || v.color}</span>
                             {!hasStock && <span className="text-[10px] text-destructive">Esgotado</span>}
                           </Button>
                        )
                     })}
                   </div>
                </div>
             </div>
          )}

          <DialogFooter className="sm:justify-start">
             <Button type="button" variant="ghost" onClick={() => setExchangeModalOpen(false)}>
               Cancelar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
