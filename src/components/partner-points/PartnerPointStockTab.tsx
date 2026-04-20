import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PackagePlus, AlertCircle, ArrowLeftRight, Loader2, Minus, Plus } from 'lucide-react';
import PartnerPointSendStockDialog from './PartnerPointSendStockDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function PartnerPointStockTab({ pointId, isContractSigned }: { pointId: string, isContractSigned: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isSendStockOpen, setIsSendStockOpen] = useState(false);
  
  // Return stock state
  const [returningItem, setReturningItem] = useState<any>(null);
  const [returningQty, setReturningQty] = useState<number>(1);
  const [isReturning, setIsReturning] = useState(false);

  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ['partner-point-stock', pointId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_point_stock')
        .select(`
          id, quantity, product_id, variant_id,
          products ( name, cost_price, sale_price, image_url ),
          product_variants ( size, color, sku )
        `)
        .eq('partner_point_id', pointId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!pointId
  });

  const filteredItems = stockItems.filter((item: any) => {
    const term = search.toLowerCase();
    const matchName = item.products?.name?.toLowerCase().includes(term);
    const matchSku = item.product_variants?.sku?.toLowerCase().includes(term);
    return matchName || matchSku;
  });

  const totalPieces = stockItems.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
  const totalValue = stockItems.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.products?.sale_price || 0)), 0);

  const handleConfirmReturn = async () => {
     if (!returningItem || returningQty <= 0 || returningQty > returningItem.quantity) return;
     
     setIsReturning(true);
     try {
        const newQty = returningItem.quantity - returningQty;
        
        if (newQty <= 0) {
           // Delete the allocation completely
           const { error } = await supabase.from('partner_point_stock').delete().eq('id', returningItem.id);
           if (error) throw error;
        } else {
           // Update the allocation
           const { error } = await supabase.from('partner_point_stock').update({ quantity: newQty }).eq('id', returningItem.id);
           if (error) throw error;
        }

        toast.success(`${returningQty} peças recolhidas da arara!`);
        queryClient.invalidateQueries({ queryKey: ['partner-point-stock', pointId] });
        setReturningItem(null);
     } catch (e: any) {
        toast.error(`Erro ao recolher: ${e.message}`);
     } finally {
        setIsReturning(false);
     }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold">Peças Disponíveis na Arara</h2>
          <p className="text-sm text-muted-foreground">Estoque físico localizado sob a guarda do parceiro.</p>
        </div>
        <Button 
          onClick={() => {
            if (!isContractSigned) {
               return toast.error("O contrato precisa ser assinado pelo parceiro primeiro!");
            }
            setIsSendStockOpen(true)
          }} 
          className="gap-2 shrink-0"
          disabled={!isContractSigned}
        >
          <PackagePlus className="w-4 h-4" /> Enviar Produtos para Parceiro
        </Button>
      </div>

      {!isContractSigned && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-sm">
           <div>
             <p className="font-bold text-rose-900 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Envio Bloqueado por Segurança Administrativa</p>
             <p className="text-rose-700 mt-1">O parceiro ainda não assinou o termo digital. O seu estoque e liberação sistêmica estão bloqueados para proteger suas peças.</p>
           </div>
        </div>
      )}

      <div className="bg-muted/30 p-4 border rounded-xl flex flex-wrap gap-6 items-center">
         <div>
            <p className="text-xs uppercase font-bold text-muted-foreground">Volume de Peças</p>
            <p className="text-xl font-black">{totalPieces} un.</p>
         </div>
         <div className="h-10 w-px bg-border hidden sm:block"></div>
         <div>
            <p className="text-xs uppercase font-bold text-muted-foreground">Valor Estimado Total</p>
            <p className="text-xl font-black text-emerald-600">R$ {totalValue.toFixed(2)}</p>
         </div>
         <div className="h-10 w-px bg-border hidden sm:block"></div>
         <div className="flex bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-200 ml-auto items-center gap-2 max-w-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-[10px] sm:text-xs">
              <strong>Estoque Compartilhado:</strong> As peças enviadas não saem do seu portal online geral, 
              mas o sistema rastreará essas unidades para calcular as comissões.
            </p>
         </div>
      </div>

      <div className="flex items-center bg-background rounded-lg px-3 py-1.5 w-full sm:max-w-md border focus-within:ring-1 focus-within:ring-primary shadow-sm transition-all">
        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        <input 
          className="bg-transparent border-none outline-none text-sm w-full py-1" 
          placeholder="Buscar peça na arara por nome ou SKU..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Variação</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead className="text-center">Qtd. Arara</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">Buscando inventário do parceiro...</TableCell></TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                 <PackagePlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                 <p className="font-semibold text-foreground">A arara está vazia.</p>
                 <p className="text-sm">Clique no botão acima para enviar as primeiras peças.</p>
              </TableCell></TableRow>
            ) : (
              filteredItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.products?.image_url ? 
                      <img src={item.products.image_url} alt="Prod" className="w-10 h-10 object-cover rounded-md border" /> : 
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground border">Sem img</div>
                    }
                  </TableCell>
                  <TableCell className="font-medium">{item.products?.name}</TableCell>
                  <TableCell>
                    {item.product_variants ? (
                      <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-md border">
                        {item.product_variants.size} {item.product_variants.color ? ` - ${item.product_variants.color}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Tamanho Único</span>
                    )}
                    {item.product_variants?.sku && <div className="text-[10px] text-muted-foreground mt-1 font-mono">SKU: {item.product_variants.sku}</div>}
                  </TableCell>
                  <TableCell>R$ {Number(item.products?.sale_price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-black text-lg text-primary bg-primary/10 px-3 py-1 rounded-full">{item.quantity}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setReturningItem(item);
                        setReturningQty(1);
                      }}
                      className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Recolher
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isSendStockOpen && (
        <PartnerPointSendStockDialog 
           pointId={pointId} 
           open={isSendStockOpen} 
           onOpenChange={setIsSendStockOpen} 
        />
      )}

      {/* Return Stock Dialog */}
      <Dialog open={!!returningItem} onOpenChange={(open) => !open && setReturningItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recolher Peças da Arara</DialogTitle>
            <DialogDescription>
              Quantas peças deste produto você está retirando do Ponto Parceiro e trazendo de volta para a sua loja principal?
            </DialogDescription>
          </DialogHeader>

          {returningItem && (
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg border flex gap-3 items-center">
                 {returningItem.products?.image_url && <img src={returningItem.products.image_url} className="w-10 h-10 object-cover rounded-md" />}
                 <div>
                    <p className="font-semibold text-sm line-clamp-1">{returningItem.products?.name}</p>
                    <p className="text-xs text-muted-foreground">Disponível na Arara: {returningItem.quantity} un.</p>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Quantidade a Recolher</label>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setReturningQty(Math.max(1, returningQty - 1))}><Minus className="w-4 h-4"/></Button>
                    <Input 
                      type="number" 
                      min="1" 
                      max={returningItem.quantity}
                      value={returningQty}
                      onChange={(e) => setReturningQty(Math.min(returningItem.quantity, parseInt(e.target.value) || 1))}
                      className="text-center text-lg font-bold"
                    />
                    <Button variant="outline" size="icon" onClick={() => setReturningQty(Math.min(returningItem.quantity, returningQty + 1))}><Plus className="w-4 h-4"/></Button>
                 </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturningItem(null)}>Cancelar</Button>
            <Button variant="default" onClick={handleConfirmReturn} disabled={isReturning}>
               {isReturning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
               Confirmar Recolhimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
