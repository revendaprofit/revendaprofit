import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, Briefcase, User, Calendar, Truck } from 'lucide-react';
import { toast } from 'sonner';

export interface CreateConsignmentBagDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateConsignmentBagDrawer({ open, onOpenChange }: CreateConsignmentBagDrawerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Formulário Principal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [maxDays, setMaxDays] = useState<string>('3');
  const [shippingCost, setShippingCost] = useState<string>('0');
  
  // Carrinho / Sacola
  const [cart, setCart] = useState<any[]>([]);
  
  // Produtos (Busca simples do catálogo)
  const [productSearch, setProductSearch] = useState('');

  // 1. Fetch Clientes
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers_for_bag'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user && open
  });

  // 2. Fetch Produtos
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products_for_bag'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('owner_id', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user && open
  });

  const filteredProducts = products.filter((p: any) => {
    const isSearchMatch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (p.internal_code && p.internal_code.toLowerCase().includes(productSearch.toLowerCase()));
      
    const totalStock = p.variants && p.variants.length > 0
      ? p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
      : (p.total_stock || 0);
      
    // Exibir apenas produtos que tem estoque real
    return isSearchMatch && totalStock > 0;
  });

  const addItemToCart = (product: any, variant: any = null) => {
    // Basic rules or checks can be added here
    const cartItemId = variant ? variant.id : product.id;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        cartItemId,
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        name: product.name,
        variant_name: variant ? variant.size || variant.color : 'Único',
        price: product.sale_price || 0,
        quantity: 1
      }]);
    }
  };

  const removeCartItem = (cartItemId: string) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  // 3. Mutação para Salvar Bolsa
  const createBagMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error("Selecione um cliente.");
      if (cart.length === 0) throw new Error("Adicione pelo menos um produto à bolsa.");
      if (!user) throw new Error("Usuário não autenticado.");

      const maxDaysInt = parseInt(maxDays) || 1;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + maxDaysInt);

      // Primeiro insere a Bag
      const { data: bag, error: bagError } = await supabase
        .from('consignment_bags')
        .insert({
          owner_id: user.id,
          customer_id: selectedCustomerId,
          max_days: maxDaysInt,
          shipping_cost: parseFloat(shippingCost) || 0,
          status: 'with_customer', // Já sai "Com o cliente"
          due_date: dueDate.toISOString()
        })
        .select()
        .single();

      if (bagError) throw bagError;

      // Depois insere os items
      const bagItems = cart.map(item => ({
        bag_id: bag.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        customer_decision: 'pending' as const
      }));

      const { error: itemsError } = await supabase
        .from('consignment_bag_items')
        .insert(bagItems);

      if (itemsError) throw itemsError;

      // TODO: Decrementar do stock virtualmente. Dependendo da regra da empresa.
      // Para já deixamos assim e lidamos no acerto, ou implementamos se for o desejo.

      return bag;
    },
    onSuccess: () => {
      toast.success('Bolsa Consignada gerada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['consignment_bags'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar a bolsa.');
    }
  });

  const resetForm = () => {
    setSelectedCustomerId('');
    setCart([]);
    setMaxDays('3');
    setShippingCost('0');
    setProductSearch('');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Sheet open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        <SheetHeader className="pb-4 border-b mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl font-black">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            Nova Bolsa Consignada
          </SheetTitle>
          <SheetDescription>
            Envie produtos para seu cliente provar. Selecione o cliente, prazo e os itens.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Seção 1: Dados do Cliente e Prazos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Selecionar Cliente</label>
              {loadingCustomers ? (
                <div className="text-sm text-muted-foreground animate-pulse">Carregando...</div>
              ) : (
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="" disabled>Escolha um cliente da lista...</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4"/> Prazo</label>
              <div className="relative">
                <Input type="number" min="1" value={maxDays} onChange={e => setMaxDays(e.target.value)} className="pr-12" />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Dias</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4"/> Taxa de Entrega</label>
              <Input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Seção 2: Adicionar Produtos (Catálogo) */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold border-b pb-2">Catálogo</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar produto..." 
                  className="pl-9"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {filteredProducts.map((p: any) => (
                  <div key={p.id} className="p-3 border rounded-lg bg-white shadow-sm flex flex-col gap-2">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="font-bold text-primary text-sm">{(p.sale_price || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</div>
                    {p.variants && p.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.variants.filter((v:any) => (v.stock || 0) > 0).map((v: any) => (
                          <Button key={v.id} size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => addItemToCart(p, v)}>
                            {v.size || v.color} ({v.stock} un) <Plus className="w-3 h-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs" onClick={() => addItemToCart(p)}>
                        Adicionar <Plus className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
                {filteredProducts.length === 0 && !loadingProducts && (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum produto encontrado.</p>
                )}
              </div>
            </div>

            {/* Seção 3: Itens da Bolsa (Carrinho) */}
            <div className="md:col-span-3 flex flex-col h-[450px]">
              <h3 className="font-bold border-b pb-2 mb-4">Itens na Bolsa ({totalItems})</h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <Briefcase className="w-12 h-12 mb-2" />
                    <p>A bolsa está vazia</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item.cartItemId + idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Var: {item.variant_name} | Val: {(item.price || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm">{item.quantity}x</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeCartItem(item.cartItemId)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Resumo Final */}
              <div className="border-t pt-4 mt-4 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground font-medium">Valor Total Projetado:</span>
                  <span className="font-black text-xl text-primary">{totalValue.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</span>
                </div>
                <Button 
                  className="w-full text-lg h-12 font-bold" 
                  disabled={cart.length === 0 || !selectedCustomerId || createBagMutation.isPending}
                  onClick={() => createBagMutation.mutate()}
                >
                  {createBagMutation.isPending ? 'Enviando...' : 'Finalizar Envío da Bolsa'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
