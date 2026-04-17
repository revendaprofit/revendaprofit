import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

import { Search, Share2, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PartnershipCatalogSheetProps {
  partnershipId: string;
  partnerEmail: string;
}

export default function PartnershipCatalogSheet({ partnershipId, partnerEmail }: PartnershipCatalogSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  const { data: myProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['my_products'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          supplier:suppliers(id, name)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && open
  });

  const { data: sharedIds = [], isLoading: loadingShared } = useQuery({
    queryKey: ['partnership_shared', partnershipId],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('partnership_shared_products')
        .select('product_id')
        .eq('partnership_id', partnershipId)
        .eq('owner_id', user.id);
      if (error) throw error;
      return data.map(d => d.product_id);
    },
    enabled: !!user && open
  });

  const toggleShareMutation = useMutation({
    mutationFn: async ({ productId, isShared }: { productId: string, isShared: boolean }) => {
      if (isShared) {
        // Remover compartilhamento
        const { error } = await supabase
          .from('partnership_shared_products')
          .delete()
          .match({ partnership_id: partnershipId, product_id: productId, owner_id: user?.id });
        if (error) throw error;
      } else {
        // Adicionar compartilhamento
        const { error } = await supabase
          .from('partnership_shared_products')
          .insert({
            partnership_id: partnershipId,
            product_id: productId,
            owner_id: user?.id
          });
        if (error) throw error;
      }
    },
    onMutate: async ({ productId, isShared }) => {
      // Optmistic Update
      await queryClient.cancelQueries({ queryKey: ['partnership_shared', partnershipId] });
      const previous = queryClient.getQueryData(['partnership_shared', partnershipId]);
      
      queryClient.setQueryData(['partnership_shared', partnershipId], (old: any) => {
        if (!old) return old;
        return isShared ? old.filter((id: string) => id !== productId) : [...old, productId];
      });
      return { previous };
    },
    onError: (err, newTodo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['partnership_shared', partnershipId], context.previous);
      }
      toast.error('Erro ao atualizar. Tente novamente.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership_shared', partnershipId] });
    }
  });

  const bulkToggleShareMutation = useMutation({
    mutationFn: async ({ productIds, isShared }: { productIds: string[], isShared: boolean }) => {
      if (!isShared) { // Se não estão compartilhados, vamos compartilhar todos (isShared é o alvo)
        const payload = productIds.map(id => ({
          partnership_id: partnershipId,
          product_id: id,
          owner_id: user?.id
        }));
        const { error } = await supabase.from('partnership_shared_products').upsert(payload);
        if (error) throw error;
      } else { // Se já estão compartilhados, vamos ocultar todos
        const { error } = await supabase
          .from('partnership_shared_products')
          .delete()
          .eq('partnership_id', partnershipId)
          .eq('owner_id', user?.id)
          .in('product_id', productIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership_shared', partnershipId] });
      toast.success('Alteração em massa concluída com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao processar em massa.');
    }
  });

  const handleToggle = (productId: string, isShared: boolean) => {
    toggleShareMutation.mutate({ productId, isShared });
  };

  const filteredProducts = myProducts.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSup = selectedSupplier === 'all' || p.supplier_id === selectedSupplier;
    return matchSearch && matchCat && matchSup;
  });

  // Extract unique categories and suppliers from currently loaded products
  const uniqueCategories = Array.from(new Map(myProducts.filter((p:any) => p.category).map((p:any) => [p.category.id, p.category.name])).entries());
  const uniqueSuppliers = Array.from(new Map(myProducts.filter((p:any) => p.supplier).map((p:any) => [p.supplier.id, p.supplier.name])).entries());

  const isAllFilteredShared = filteredProducts.length > 0 && filteredProducts.every((p: any) => sharedIds.includes(p.id));

  const handleBulkToggle = () => {
    const productIds = filteredProducts.map((p: any) => p.id);
    if (!productIds.length) return;
    bulkToggleShareMutation.mutate({ productIds, isShared: isAllFilteredShared });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 shadow-sm">
          <Share2 className="w-4 h-4 mr-2" /> Compartilhar Meu Estoque
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-emerald-600" /> Seu Guarda-Roupa Partilhado
          </SheetTitle>
          <SheetDescription>
            Defina quais peças do seu estoque estarão visíveis para <strong>{partnerEmail}</strong> vender.
          </SheetDescription>
        </SheetHeader>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar produto pelo nome..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">Todas Categorias</option>
            {uniqueCategories.map(([id, name]) => (
              <option key={id as string} value={id as string}>{name as string}</option>
            ))}
          </select>
          <select 
            value={selectedSupplier} 
            onChange={e => setSelectedSupplier(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">Todos Fornecedores</option>
            {uniqueSuppliers.map(([id, name]) => (
              <option key={id as string} value={id as string}>{name as string}</option>
            ))}
          </select>
        </div>

        {loadingProducts || loadingShared ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
              <div>
                <p className="font-bold text-emerald-800">Total Compartilhado</p>
                <p className="text-xs text-muted-foreground">Peças disponíveis para venda P2P</p>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {sharedIds.length}
                </div>
              </div>
              
              <Button 
                variant={isAllFilteredShared ? "destructive" : "default"} 
                className={!isAllFilteredShared ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                disabled={bulkToggleShareMutation.isPending || filteredProducts.length === 0}
                onClick={handleBulkToggle}
              >
                {bulkToggleShareMutation.isPending ? 'Processando...' : (isAllFilteredShared ? `Ocultar os ${filteredProducts.length} itens listados` : `Compartilhar todos os ${filteredProducts.length} itens listados`)}
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm p-4">Nenhum produto encontrado.</p>
            ) : (
              filteredProducts.map((product: any) => {
                const isShared = sharedIds.includes(product.id);
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-slate-100 border overflow-hidden flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <PackageOpen className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">Estoque Físico: {product.total_stock}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end pl-2">
                       <span className={`text-[10px] uppercase font-bold mb-1 ${isShared ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {isShared ? 'Compartilhado' : 'Escondido'}
                       </span>
                       <div 
                         onClick={() => { if (!toggleShareMutation.isPending) handleToggle(product.id, isShared) }}
                         className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isShared ? 'bg-emerald-600' : 'bg-slate-200'} ${toggleShareMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isShared ? 'translate-x-4' : 'translate-x-0'}`} />
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
