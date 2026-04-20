import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Loader2, PackagePlus, ArrowRight, CheckCircle2, Box } from 'lucide-react';

export default function PartnerPointSendStockDialog({ pointId, open, onOpenChange }: { pointId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // Fetch ALL global variants
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['global-variants-for-partner', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, image_url,
          product_variants ( id, size, color, sku, stock )
        `)
        .eq('owner_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;
      
      const flatVariants: any[] = [];
      data?.forEach(product => {
         product.product_variants?.forEach((variant: any) => {
            if (variant.stock > 0) {
               flatVariants.push({
                  ...variant,
                  product_id: product.id,
                  products: { name: product.name, image_url: product.image_url }
               });
            }
         });
      });
      return flatVariants;
    },
    enabled: !!user?.id && open
  });

  const filteredVariants = variants.filter(v => {
    const term = search.toLowerCase();
    const matchName = v.products?.name?.toLowerCase().includes(term);
    const matchSku = v.sku?.toLowerCase().includes(term);
    const matchSize = v.size?.toLowerCase().includes(term);
    return matchName || matchSku || matchSize;
  });

  const handleSendToPartner = async (variant: any, qtyToSend: number) => {
    if (qtyToSend <= 0 || qtyToSend > (variant.stock || 0)) {
      toast.error('Quantidade inválida.');
      return;
    }

    setLoadingItems(prev => ({ ...prev, [variant.id]: true }));
    try {
      // Check if already exists in partner_point_stock
      const { data: existing } = await supabase
        .from('partner_point_stock')
        .select('id, quantity')
        .eq('partner_point_id', pointId)
        .eq('variant_id', variant.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('partner_point_stock')
          .update({ quantity: existing.quantity + qtyToSend })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('partner_point_stock')
          .insert({
            partner_point_id: pointId,
            product_id: variant.product_id,
            variant_id: variant.id,
            quantity: qtyToSend
          });
        if (error) throw error;
      }

      toast.success(`${qtyToSend} un. enviadas para a arara!`);
      // Important trick: optimistically remove sent items from local display max
      variant.stock -= qtyToSend; 
      
      // Invalidate the stock tab to refresh
      queryClient.invalidateQueries({ queryKey: ['partner-point-stock', pointId] });
      
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoadingItems(prev => ({ ...prev, [variant.id]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="w-5 h-5 text-primary" /> Enviar Produtos para a Arara
          </DialogTitle>
          <DialogDescription>
             Selecione do seu estoque global abaixo quais as peças (e tamanhos) que você fisicamente levará para este parceiro.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center bg-muted/50 rounded-lg px-3 py-2 w-full border focus-within:ring-1 focus-within:ring-primary shadow-sm mt-2">
          <Search className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
          <input 
            className="bg-transparent border-none outline-none text-base w-full py-1" 
            placeholder="Buscar peças por nome ou código SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Carregando seu estoque disponível...</p>
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">Nenhuma peça em estoque encontrada com essa busca.</p>
            </div>
          ) : (
            filteredVariants.map((v) => (
              <VariantItemRow 
                key={v.id} 
                variant={v} 
                onSend={handleSendToPartner} 
                loading={loadingItems[v.id]}
              />
            ))
          )}
        </div>
        
        <div className="pt-4 border-t mt-2 flex justify-end">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar Janela</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sub-component for individual rows to handle their own quantity states
function VariantItemRow({ variant, onSend, loading }: { variant: any, onSend: (v: any, q: number) => void, loading: boolean }) {
   const [qty, setQty] = useState('1');
   
   // If it was fully exhausted locally in the screen session
   if ((variant.stock || 0) <= 0) {
      return (
        <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 opacity-70">
           <div className="w-12 h-12 bg-slate-200 rounded-md shrink-0 flex items-center justify-center overflow-hidden">
             {variant.products?.image_url ? <img src={variant.products.image_url} className="w-full h-full object-cover grayscale" /> : <Box className="w-5 h-5 text-slate-400" />}
           </div>
           <div className="flex-1">
             <h4 className="font-semibold text-sm line-clamp-1">{variant.products?.name}</h4>
             <p className="text-xs text-muted-foreground">{variant.size} {variant.color ? ` - ${variant.color}` : ''}</p>
           </div>
           <div className="text-right">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Peças Transferidas</span>
           </div>
        </div>
      );
   }

   return (
      <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg border bg-card shadow-sm hover:border-primary/30 transition-colors">
         <div className="w-12 h-12 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden border">
           {variant.products?.image_url ? <img src={variant.products.image_url} className="w-full h-full object-cover" /> : <Box className="w-5 h-5 text-muted-foreground/50" />}
         </div>
         <div className="flex-1 min-w-0">
           <h4 className="font-semibold text-sm line-clamp-1">{variant.products?.name}</h4>
           <div className="flex flex-wrap items-center gap-2 mt-1">
             <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Tamanho {variant.size}</span>
             {variant.color && <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{variant.color}</span>}
             <span className="text-[10px] text-muted-foreground">Dispo global: <strong className="text-foreground">{variant.stock || 0} un.</strong></span>
           </div>
         </div>
         <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
           <div className="flex items-center">
             <span className="text-xs font-semibold mr-2 text-muted-foreground uppercase hidden sm:inline">Qtd:</span>
             <Input 
               type="number" 
               min="1" 
               max={variant.stock || 1} 
               value={qty} 
               onChange={(e) => setQty(e.target.value)} 
               className="w-16 h-8 text-center px-1"
             />
           </div>
           <Button 
             size="sm" 
             disabled={loading}
             onClick={() => onSend(variant, parseInt(qty) || 0)} 
             className="h-8 gap-1 w-full sm:w-auto"
           >
             {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />} 
             <span className="hidden sm:inline">Enviar</span>
           </Button>
         </div>
      </div>
   );
}
