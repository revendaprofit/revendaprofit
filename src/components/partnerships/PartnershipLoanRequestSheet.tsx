import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PackagePlus, Minus, Plus, Send, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  partnershipId: string;
  partnerEmail: string;
}

interface VariantItem {
  id: string;
  size: string;
  color: string;
  stock: number;
  sale_price: number | null;
}

interface ProductItem {
  id: string;
  name: string;
  sale_price: number;
  cost_price: number;
  image_url: string | null;
  variants: VariantItem[];
  p2p_partnership_id: string;
  p2p_owner_id: string;
}

interface LoanCartItem {
  product: ProductItem;
  variant: VariantItem;
  quantity: number;
}

export default function PartnershipLoanRequestSheet({ partnershipId, partnerEmail }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loanCart, setLoanCart] = useState<LoanCartItem[]>([]);

  const { data: partnerProducts = [], isLoading } = useQuery({
    queryKey: ['p2p-loan-catalog', partnershipId],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_my_p2p_shared_products', { p_tenant_id: user.id });
      if (error) throw error;
      // Filtrar apenas produtos desta parceria específica
      return (data || []).filter((p: any) => p.p2p_partnership_id === partnershipId) as ProductItem[];
    },
    enabled: !!user && open
  });

  const submitLoanMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      if (loanCart.length === 0) throw new Error('Selecione pelo menos uma peça');

      for (const item of loanCart) {
        const { error } = await supabase.from('partnership_orders').insert({
          partnership_id: partnershipId,
          seller_id: user.id,
          owner_id: item.product.p2p_owner_id,
          product_id: item.product.id,
          variant_id: item.variant.id,
          sale_id: null,
          quantity: item.quantity,
          sale_price: item.product.cost_price || 0,
          status: 'pending_confirmation',
          order_type: 'loan'
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Solicitação de empréstimo enviada! Aguarde a parceira aceitar.');
      setLoanCart([]);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['partnership-orders'] });
    },
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  const addToLoanCart = (product: ProductItem, variant: VariantItem) => {
    const existing = loanCart.find(c => c.variant.id === variant.id);
    if (existing) {
      if (existing.quantity >= variant.stock) return toast.error('Estoque insuficiente');
      setLoanCart(loanCart.map(c => c.variant.id === variant.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setLoanCart([...loanCart, { product, variant, quantity: 1 }]);
    }
  };

  const updateLoanQty = (variantId: string, delta: number) => {
    setLoanCart(prev => prev.map(c => {
      if (c.variant.id !== variantId) return c;
      const newQ = c.quantity + delta;
      if (newQ <= 0) return c;
      if (newQ > c.variant.stock) { toast.error('Estoque insuficiente'); return c; }
      return { ...c, quantity: newQ };
    }));
  };

  const removeFromLoanCart = (variantId: string) => {
    setLoanCart(prev => prev.filter(c => c.variant.id !== variantId));
  };

  const filteredProducts = partnerProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLoanItems = loanCart.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setLoanCart([]); setSearchTerm(''); } }}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 border-amber-200 shadow-sm flex items-center gap-2">
          <PackagePlus className="w-4 h-4" /> Solicitar Peça
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-slate-50">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Package className="w-6 h-6 text-amber-600" /> Solicitar Peça (Empréstimo)
          </SheetTitle>
          <SheetDescription className="text-sm">
            Solicite peças do estoque de <strong className="text-foreground">{partnerEmail}</strong> para sua cliente ver ou provar. A peça será transferida para o seu estoque quando aceita.
          </SheetDescription>
        </SheetHeader>

        {/* Barra de Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto da parceira..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Catálogo */}
        <div className="space-y-3 mb-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum produto compartilhado encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">A parceira precisa compartilhar peças no catálogo.</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const availableVariants = (product.variants || []).filter((v: VariantItem) => v.stock > 0);
              if (availableVariants.length === 0) return null;

              return (
                <div key={product.id} className="bg-white rounded-xl border shadow-sm p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border overflow-hidden flex items-center justify-center shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-slate-400">Custo: R$ {(product.cost_price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableVariants.map((v: VariantItem) => {
                      const inCart = loanCart.find(c => c.variant.id === v.id);
                      return (
                        <Button
                          key={v.id}
                          variant="outline"
                          size="sm"
                          className={`h-7 text-xs px-2.5 transition-all ${inCart
                            ? 'border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                            : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                          onClick={() => addToLoanCart(product, v)}
                        >
                          {v.size} {v.color && `- ${v.color}`}
                          <span className="ml-1 text-[9px] opacity-50">({v.stock})</span>
                          {inCart && <span className="ml-1 text-[9px] font-black text-amber-600">×{inCart.quantity}</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Carrinho de Empréstimo */}
        {loanCart.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-amber-200 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 -mx-6 -mb-6 space-y-3">
            <h4 className="font-black text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-amber-600" />
              Peças Solicitadas ({totalLoanItems})
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {loanCart.map(item => (
                <div key={item.variant.id} className="flex items-center justify-between bg-amber-50/50 rounded-lg p-2 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500">{item.variant.size} {item.variant.color && `- ${item.variant.color}`}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                      onClick={() => {
                        if (item.quantity <= 1) removeFromLoanCart(item.variant.id);
                        else updateLoanQty(item.variant.id, -1);
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                      onClick={() => updateLoanQty(item.variant.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20"
              disabled={submitLoanMutation.isPending}
              onClick={() => submitLoanMutation.mutate()}
            >
              {submitLoanMutation.isPending ? (
                'Enviando solicitação...'
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Solicitar {totalLoanItems} peça{totalLoanItems > 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
