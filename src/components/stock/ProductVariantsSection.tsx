import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Flame } from 'lucide-react';
import { toast } from 'sonner';

function StockInputRow({ variant, productSalePrice, updateStock, updateVariantPrice, removeVariant }: any) {
  const [localVal, setLocalVal] = React.useState(String(variant.stock || 0));
  const [localPrice, setLocalPrice] = React.useState(variant.sale_price ? String(variant.sale_price) : '');

  React.useEffect(() => {
    setLocalVal(String(variant.stock || 0));
  }, [variant.stock]);

  React.useEffect(() => {
    setLocalPrice(variant.sale_price ? String(variant.sale_price) : '');
  }, [variant.sale_price]);

  const handleStockBlur = () => {
    const val = parseInt(localVal) || 0;
    if (val !== variant.stock) {
      updateStock.mutate({ id: variant.id, newStock: val });
    }
  };

  const handlePriceBlur = () => {
    const rawVal = localPrice.replace(',', '.').trim();
    const val = rawVal ? parseFloat(rawVal) : null;
    const currentVal = variant.sale_price ? parseFloat(variant.sale_price) : null;
    
    if (val !== currentVal) {
      updateVariantPrice.mutate({ id: variant.id, newPrice: val });
    }
  };

  const hasSpecialPrice = variant.sale_price && parseFloat(variant.sale_price) > 0;
  const isDiscount = hasSpecialPrice && parseFloat(variant.sale_price) < productSalePrice;
  const discountPct = isDiscount ? Math.round((1 - parseFloat(variant.sale_price) / productSalePrice) * 100) : 0;

  return (
    <TableRow className={hasSpecialPrice ? 'bg-amber-50/50' : ''}>
      <TableCell className="font-bold">{variant.size || '-'}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{variant.sku || '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={localVal}
              onChange={e => setLocalVal(e.target.value)}
              className="w-20 h-8 font-mono text-center shadow-inner font-bold"
              onBlur={handleStockBlur}
            />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Input 
              type="text"
              inputMode="decimal"
              value={localPrice}
              onChange={e => setLocalPrice(e.target.value)}
              placeholder={`${productSalePrice.toFixed(2)}`}
              className={`w-28 h-8 text-xs font-mono text-center shadow-inner ${hasSpecialPrice ? 'border-amber-400 bg-amber-50 font-bold text-amber-800' : 'text-muted-foreground'}`}
              onBlur={handlePriceBlur}
            />
          </div>
          {isDiscount && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
              <Flame className="w-3 h-3" />-{discountPct}%
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
         <Button variant="ghost" size="icon" onClick={() => removeVariant.mutate(variant.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
         </Button>
      </TableCell>
    </TableRow>
  );
}

export default function ProductVariantsSection({ productId, productSalePrice = 0 }: { productId: string; productSalePrice?: number }) {
  const queryClient = useQueryClient();
  const [size, setSize] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(0);

  const { data: variants = [] } = useQuery({
    queryKey: ['product_variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('created_at', { ascending: true });
      if (error) throw error;
      
      const orderMap: Record<string, number> = {
        'PP': 1, 'P': 2, 'M': 3, 'G': 4, 'GG': 5, 'XG': 6, 'XXG': 7, 'XGG': 7, 'EXG': 7, 
        'G1': 8, 'G2': 9, 'G3': 10, 'G4': 11, 'U': 99, 'ÚNICO': 99, 'UNICO': 99
      };

      return data.sort((a, b) => {
         const sizeA = (a.size || '').trim().toUpperCase();
         const sizeB = (b.size || '').trim().toUpperCase();
         
         const scoreA = orderMap[sizeA];
         const scoreB = orderMap[sizeB];

         if (scoreA !== undefined && scoreB !== undefined) return scoreA - scoreB;
         if (scoreA !== undefined) return -1;
         if (scoreB !== undefined) return 1;

         const numA = parseInt(sizeA);
         const numB = parseInt(sizeB);
         if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
         
         return sizeA.localeCompare(sizeB);
      });
    }
  });

  const addVariant = useMutation({
    mutationFn: async () => {
      if (!size.trim()) throw new Error('O tamanho é obrigatório.');
      
      const user = (await supabase.auth.getUser()).data.user;
      
      const existing = variants.find(v => (v.size || '').trim().toUpperCase() === size.trim().toUpperCase());
      
      if (existing) {
        const currentStock = Number(existing.stock) || 0;
        const addStock = Number(stock) || 0;
        const { error } = await supabase.from('product_variants')
          .update({ stock: currentStock + addStock })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_variants').insert([{
          product_id: productId, owner_id: user?.id, size: size.trim(), sku: sku.trim(), stock
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSize(''); setSku(''); setStock(0);
      toast.success('Variante salva com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao adicionar variante.')
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, newStock }: { id: string, newStock: number }) => {
      const { error } = await supabase.from('product_variants').update({ stock: newStock }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Estoque atualizado!');
    }
  });

  const updateVariantPrice = useMutation({
    mutationFn: async ({ id, newPrice }: { id: string, newPrice: number | null }) => {
      const { error } = await supabase.from('product_variants').update({ sale_price: newPrice }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Preço da variante atualizado!');
    }
  });

  const removeVariant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const variantsWithSpecialPrice = variants.filter((v: any) => v.sale_price && parseFloat(v.sale_price) > 0);

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-muted/10">
      <h3 className="font-semibold text-lg">Variantes & Estoque</h3>
      <div className="flex gap-2 items-end flex-wrap">
        <div><label className="text-xs">Tamanho (Ex: P, M, G, 38, Único)</label><Input value={size} onChange={e => setSize(e.target.value)} placeholder="Tamanho" /></div>
        <div><label className="text-xs">SKU</label><Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Código" /></div>
        <div><label className="text-xs">Qtd a Adicionar</label><Input type="number" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className="w-32" /></div>
        <Button 
          onClick={() => addVariant.mutate()} 
          className="bg-[#D90089] hover:bg-[#D90089]/90 font-bold whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" /> Salvar / Somar Estoque
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-[#D90089] font-medium mt-1">
        💡 Dica: Se o tamanho já existir na lista, digitar a quantidade e salvar apenas somará o estoque à variante existente.
      </p>

      {variantsWithSpecialPrice.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>{variantsWithSpecialPrice.length} variante(s)</strong> com preço especial. Esses itens aparecerão na seção <strong>"🔥 Oportunidades"</strong> do site.</span>
        </div>
      )}

      {variants.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tam.</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Preço Especial
                  <span className="text-[9px] font-normal text-muted-foreground">(vazio = R$ {productSalePrice.toFixed(2)})</span>
                </div>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v: any) => (
               <StockInputRow 
                 key={v.id} 
                 variant={v} 
                 productSalePrice={productSalePrice}
                 updateStock={updateStock} 
                 updateVariantPrice={updateVariantPrice}
                 removeVariant={removeVariant} 
               />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
