import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

function StockInputRow({ variant, updateStock, removeVariant }: any) {
  const [localVal, setLocalVal] = React.useState(String(variant.stock || 0));

  // Sincroniza se o estoque mudar por via externa (ex: clicou em somar lá em cima)
  React.useEffect(() => {
    setLocalVal(String(variant.stock || 0));
  }, [variant.stock]);

  const handleBlur = () => {
    const val = parseInt(localVal) || 0;
    if (val !== variant.stock) {
      updateStock.mutate({ id: variant.id, newStock: val });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-bold">{variant.size || '-'}</TableCell>
      <TableCell className="text-muted-foreground">{variant.sku || '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={localVal}
              onChange={e => setLocalVal(e.target.value)}
              className="w-24 h-8 font-mono text-center shadow-inner font-bold"
              onBlur={handleBlur}
            />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">(Editar e clicar fora)</span>
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

export default function ProductVariantsSection({ productId }: { productId: string }) {
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

         // Se ambos existem no mapa de prioridade
         if (scoreA !== undefined && scoreB !== undefined) return scoreA - scoreB;
         if (scoreA !== undefined) return -1; // Joga pra cima
         if (scoreB !== undefined) return 1;

         // Se for número (ex: sapatos 38, calças 40)
         const numA = parseInt(sizeA);
         const numB = parseInt(sizeB);
         if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
         
         // Fallback alfabético final
         return sizeA.localeCompare(sizeB);
      });
    }
  });

  const addVariant = useMutation({
    mutationFn: async () => {
      if (!size.trim()) throw new Error('O tamanho é obrigatório.');
      
      const user = (await supabase.auth.getUser()).data.user;
      
      // Check if size already exists (case insensitive)
      const existing = variants.find(v => (v.size || '').trim().toUpperCase() === size.trim().toUpperCase());
      
      if (existing) {
        // Update existing variant stock (Adds to current stock safely mapping objects)
        const currentStock = Number(existing.stock) || 0;
        const addStock = Number(stock) || 0;
        const { error } = await supabase.from('product_variants')
          .update({ stock: currentStock + addStock })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new variant
        const { error } = await supabase.from('product_variants').insert([{
          product_id: productId, owner_id: user?.id, size: size.trim(), sku: sku.trim(), stock
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Para sync de estoque global
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

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-muted/10">
      <h3 className="font-semibold text-lg">Variantes & Estoque</h3>
      <div className="flex gap-2 items-end">
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

      {variants.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tam.</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Manejar Estoque</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v: any) => (
               <StockInputRow key={v.id} variant={v} updateStock={updateStock} removeVariant={removeVariant} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
