import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Plus, Briefcase, Clock, Calendar, CheckCircle, Store, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { format, isPast, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import CreateConsignmentBagDrawer from "@/components/consignment-bags/CreateConsignmentBagDrawer"
import ConsignmentSettlementSheet from "@/components/consignment-bags/ConsignmentSettlementSheet"

export default function ConsignmentBags() {
  const { user } = useAuth()
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('with_customer')
  const [settlementBagId, setSettlementBagId] = useState<string | null>(null)

  const { data: bags = [], isLoading } = useQuery({
    queryKey: ['consignment_bags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consignment_bags')
        .select(`
          *,
          customer:customers(name, phone),
          items:consignment_bag_items(quantity, product:products(sale_price))
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const activeBags = bags.filter((b: any) => b.status === 'with_customer' || b.status === 'pending_approval')
  const closedBags = bags.filter((b: any) => b.status === 'returned' || b.status === 'concluded')

  const renderBagCard = (bag: any) => {
    const totalItems = bag.items ? bag.items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0
    const totalProjectedValue = bag.items ? bag.items.reduce((acc: number, item: any) => acc + (item.quantity * (item.product?.sale_price || 0)), 0) : 0
    
    // Calcula situação de tempo para bolsas abertas
    let timeStatusInfo = null;
    if (bag.status === 'with_customer' && bag.due_date) {
      const dueDate = new Date(bag.due_date);
      const isLate = isPast(dueDate);
      const daysDiff = Math.abs(differenceInDays(new Date(), dueDate));
      
      if (isLate) {
        timeStatusInfo = <span className="text-destructive font-bold flex items-center text-xs bg-destructive/10 px-2 py-1 rounded-full"><AlertTriangle className="w-3 h-3 mr-1"/> Atrasada {daysDiff} dia(s)</span>;
      } else {
        timeStatusInfo = <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">{daysDiff === 0 ? 'Vence hoje' : `Faltam ${daysDiff} dia(s)`}</span>;
      }
    }

    return (
      <div key={bag.id} className="bg-card border shadow-sm rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
        <div className="flex gap-4 items-start">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bag.status === 'concluded' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
            {bag.status === 'concluded' ? <CheckCircle className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{bag.customer?.name || "Cliente sem Nome"}</h3>
              {timeStatusInfo}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Saída: {format(new Date(bag.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
              {bag.due_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Prev: {format(new Date(bag.due_date), "dd/MM", { locale: ptBR })}</span>}
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="bg-secondary px-2 py-0.5 rounded-md text-foreground">{totalItems} peças</span>
              <span className="text-primary">{totalProjectedValue.toLocaleString('pt-br',{style:'currency', currency:'BRL'})}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[140px]">
          {bag.status === 'with_customer' && (
             <>
               <Button variant="outline" className="w-full text-xs font-bold border-dashed" onClick={() => {
                 const link = `${window.location.origin}/malinha/${bag.id}`;
                 navigator.clipboard.writeText(link);
                 toast.success("Link copiado para a área de transferência!");
               }}>
                 Copiar Link
               </Button>
               <Button variant="default" className="w-full shadow-sm bg-emerald-500 hover:bg-emerald-600 border-none" onClick={() => {
                 const link = `${window.location.origin}/malinha/${bag.id}`;
                 const text = `Oi ${bag.customer?.name || ''}! Preparei uma malinha exclusiva com peças da minha loja. Clique no link para ver o que enviei e escolher as que você amou: ${link}`;
                 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
               }}>
                 Enviar Link (WhatsApp)
               </Button>
               <Button variant="secondary" className="w-full shadow-sm mt-2 text-xs" onClick={() => setSettlementBagId(bag.id)}>
                 Pular e Acertar Agora
               </Button>
             </>
          )}

          {bag.status === 'pending_approval' && (
            <Button variant="default" className="w-full shadow-sm bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSettlementBagId(bag.id)}>
               Cliente Respondeu! (Acertar)
            </Button>
          )}

          {(bag.status === 'returned' || bag.status === 'concluded') && (
             <Button variant="outline" className="w-full text-muted-foreground border-dashed" onClick={() => setSettlementBagId(bag.id)}>
               Ver Detalhes/Recibo
             </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bolsas Consignadas</h1>
          <p className="text-muted-foreground mt-1">
            Controle as malinhas que estão na rua com seus clientes.
          </p>
        </div>
        <Button onClick={() => setIsCreateDrawerOpen(true)} className="shadow-md hover:-translate-y-0.5 transition-transform">
          <Plus className="w-4 h-4 mr-2" />
          Nova Bolsa
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="with_customer">Ativas na Rua ({activeBags.length})</TabsTrigger>
          <TabsTrigger value="closed">Acertadas ({closedBags.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="with_customer" className="mt-6">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando bolsas...</div>
          ) : activeBags.length === 0 ? (
            <div className="bg-muted/50 border-dashed rounded-xl border-2 flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
              <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nenhuma bolsa na rua</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Você não possui bolsas com clientes no momento. Assim que enviar uma, ela aparecerá aqui com contagem de prazo.
              </p>
              <Button onClick={() => setIsCreateDrawerOpen(true)} variant="outline">Criar Primeira Bolsa</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeBags.map(renderBagCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {closedBags.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">Nenhum histórico de bolsas acertadas ainda.</div>
          ) : (
             <div className="grid gap-4">
               {closedBags.map(renderBagCard)}
             </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateConsignmentBagDrawer 
        open={isCreateDrawerOpen} 
        onOpenChange={setIsCreateDrawerOpen} 
      />

      <ConsignmentSettlementSheet 
        bagId={settlementBagId}
        open={!!settlementBagId}
        onOpenChange={(open) => !open && setSettlementBagId(null)}
      />
    </div>
  )
}
