import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, GripVertical, X as CloseIcon, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function FeaturedProducts() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for the 10 slots (array of product IDs, empty slots are null)
  const [slots, setSlots] = useState<(string | null)[]>(Array(10).fill(null));
  
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickingSlotIndex, setPickingSlotIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from('store_settings').select('*').eq('owner_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['store-active-products'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      const { data } = await supabase.from('products').select('id, name, image_url').eq('owner_id', user.id).eq('marketing_status', 'active');
      return data || [];
    }
  });

  useEffect(() => {
    if (settings?.featured_product_ids) {
      const arr = Array(10).fill(null);
      settings.featured_product_ids.forEach((id: string, i: number) => {
        if (i < 10) arr[i] = id;
      });
      setSlots(arr);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (newIds: string[]) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      
      const { error } = await supabase.from('store_settings').update({ featured_product_ids: newIds }).eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Destaques salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      setIsOpen(false);
    }
  });

  const handleSave = () => {
    const compactIds = slots.filter(id => id !== null) as string[];
    updateMutation.mutate(compactIds);
  };

  const handlePick = (productId: string) => {
    if (slots.includes(productId)) {
       toast.error("Este produto já está em destaque!");
       return;
    }
    if (pickingSlotIndex !== null) {
      const newSlots = [...slots];
      newSlots[pickingSlotIndex] = productId;
      setSlots(newSlots);
    }
    setPickerOpen(false);
    setSearch('');
  };

  const handleRemove = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  // Drag and drop handlers
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    const newSlots = [...slots];
    const draggedItem = newSlots[draggedIdx];
    
    // Swap the items
    newSlots[draggedIdx] = newSlots[targetIdx];
    newSlots[targetIdx] = draggedItem;
    
    setSlots(newSlots);
    setDraggedIdx(null);
  };

  const configuredCount = slots.filter(s => s !== null).length;
  const filteredProducts = allProducts.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
          Produtos em Destaque
        </h1>
        <p className="text-sm text-gray-500">Escolha até 10 produtos para aparecer primeiro no catálogo</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b bg-gray-50/50">
           <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
             <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
             Destaques Configurados
           </h2>
           <p className="text-sm text-gray-500 mt-1">
             Você tem {configuredCount} produto(s) em destaque. Arraste as linhas para reordenar a prioridade de exibição na vitrine.
           </p>
        </div>
        
        <div className="p-6 bg-gray-50/30">
          <div className="space-y-2">
            {slots.map((productId, index) => {
              const product = allProducts.find((p: any) => p.id === productId);

              if (!product) {
                return (
                   <div 
                     key={index}
                     className="flex items-center gap-4 p-3 border border-pink-200 border-dashed rounded-lg bg-pink-50/30 cursor-pointer hover:bg-pink-50 transition-colors"
                     onClick={() => {
                       setPickingSlotIndex(index);
                       setPickerOpen(true);
                     }}
                   >
                      <span className="w-6 text-center text-xs font-bold text-gray-400">{index + 1}</span>
                      <span className="text-xs text-gray-500 font-medium">Clique para adicionar</span>
                   </div>
                );
              }

              return (
                 <div 
                   key={index}
                   draggable
                   onDragStart={(e) => onDragStart(e, index)}
                   onDragOver={(e) => onDragOver(e, index)}
                   onDrop={(e) => onDrop(e, index)}
                   className={`flex items-center gap-4 p-2 bg-white border border-gray-200 rounded-lg shadow-sm transition-all ${draggedIdx === index ? 'opacity-50' : ''}`}
                 >
                    <div className="text-gray-300 ml-1 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="w-4 text-center text-xs font-bold text-gray-300">{index + 1}</span>
                    <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                       {product.image_url ? (
                         <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                       ) : (
                         <ShoppingBag className="w-5 h-5 text-gray-300" />
                       )}
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemove(index)}>
                      <CloseIcon className="w-4 h-4" />
                    </Button>
                 </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50/50 flex justify-end">
          <Button 
            className="min-w-[150px] bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md h-12 text-md font-bold" 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Destaques'}
          </Button>
        </div>
      </div>

        {/* Modal de Seleção de Produto */}
        <Dialog open={pickerOpen} onOpenChange={v => { setPickerOpen(v); if(!v) setSearch(''); }}>
           <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]">
             <div className="p-4 border-b">
               <DialogTitle className="text-lg">Selecionar Produto</DialogTitle>
             </div>
             <div className="p-4 border-b bg-gray-50/50">
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                 <Input 
                  className="pl-9 bg-white" 
                  placeholder="Buscar produto..." 
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  autoFocus
                 />
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">Nenhum produto encontrado.</p>
                ) : (
                  filteredProducts.map((p: any) => (
                    <div 
                      key={p.id}
                      className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors"
                      onClick={() => handlePick(p.id)}
                    >
                      <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-gray-800">{p.name}</span>
                    </div>
                  ))
                )}
             </div>
           </DialogContent>
         </Dialog>

    </div>
  );
}
