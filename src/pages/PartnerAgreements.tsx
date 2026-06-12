import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Handshake, Plus, Check, X, Search, Package, ChevronDown, ChevronUp, Users, Info, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function PartnerAgreements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [productTab, setProductTab] = useState<'mine' | 'theirs'>('mine');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Buscar acordos
  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['partner-agreements', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_agreements')
        .select('*')
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Enriquecer com emails dos parceiros
      const enriched = await Promise.all((data || []).map(async (ag: any) => {
        const partnerId = ag.user_a_id === user!.id ? ag.user_b_id : ag.user_a_id;
        if (!partnerId) return { ...ag, partner_email: ag.invited_email || 'Convite pendente' };
        const { data: prof } = await supabase.from('profiles').select('email').eq('id', partnerId).single();
        return { ...ag, partner_id: partnerId, partner_email: prof?.email || ag.invited_email || partnerId };
      }));
      return enriched;
    }
  });

  // Buscar meus produtos para compartilhar
  const { data: myProducts = [] } = useQuery({
    queryKey: ['my-products-for-sharing', user?.id],
    enabled: !!user?.id && !!selectedAgreement,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, category_id, categories(name), product_variants(id, size, color, stock)')
        .eq('owner_id', user!.id)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar produtos já compartilhados nesse acordo
  const { data: sharedProducts = [] } = useQuery({
    queryKey: ['shared-products', selectedAgreement?.id],
    enabled: !!selectedAgreement?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_agreement_products')
        .select('*, products(id, name, image_url, categories(name), product_variants(id, size, color, stock))')
        .eq('agreement_id', selectedAgreement.id);
      if (error) throw error;
      return data || [];
    }
  });

  const mySharedProductIds = new Set(
    sharedProducts.filter((sp: any) => sp.owner_id === user?.id).map((sp: any) => sp.product_id)
  );
  const partnerSharedProducts = sharedProducts.filter((sp: any) => sp.owner_id !== user?.id);

  // Categorias disponíveis para filtro
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    myProducts.forEach((p: any) => {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      if (cat?.name) cats.add(cat.name);
    });
    return Array.from(cats);
  }, [myProducts]);

  const filteredMyProducts = myProducts.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const matchCat = productCategoryFilter === 'all' || cat?.name === productCategoryFilter;
    return matchSearch && matchCat;
  });

  // Convidar parceira
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!user?.id) throw new Error('Não autenticado');
      // Verificar se o email existe no sistema
      const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', email).single();
      const { error } = await supabase.from('partner_agreements').insert({
        user_a_id: user.id,
        user_b_id: profiles?.id || null,
        invited_email: email,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite enviado!');
      setInviteEmail('');
      setShowInviteInput(false);
      queryClient.invalidateQueries({ queryKey: ['partner-agreements'] });
    },
    onError: (e: any) => toast.error('Erro ao convidar: ' + e.message)
  });

  // Aceitar convite
  const acceptMutation = useMutation({
    mutationFn: async (agId: string) => {
      const { error } = await supabase.from('partner_agreements').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', agId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria ativada!');
      queryClient.invalidateQueries({ queryKey: ['partner-agreements'] });
    },
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  // Recusar/cancelar
  const declineMutation = useMutation({
    mutationFn: async (agId: string) => {
      const { error } = await supabase.from('partner_agreements').update({ status: 'inactive' }).eq('id', agId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria encerrada.');
      queryClient.invalidateQueries({ queryKey: ['partner-agreements'] });
    }
  });

  // Adicionar produto ao acordo
  const addProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!selectedAgreement || !user?.id) return;
      const partnerId = selectedAgreement.user_a_id === user.id ? selectedAgreement.user_b_id : selectedAgreement.user_a_id;
      const { error } = await supabase.from('partner_agreement_products').insert({
        agreement_id: selectedAgreement.id,
        product_id: productId,
        owner_id: user.id,
        shared_with_id: partnerId
      });
      if (error && error.code !== '23505') throw error; // ignorar duplicado
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-products'] }),
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  // Remover produto do acordo
  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!selectedAgreement || !user?.id) return;
      const { error } = await supabase.from('partner_agreement_products')
        .delete()
        .eq('agreement_id', selectedAgreement.id)
        .eq('product_id', productId)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-products'] })
  });

  // Adicionar tudo
  const addAllMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgreement || !user?.id) return;
      const partnerId = selectedAgreement.user_a_id === user.id ? selectedAgreement.user_b_id : selectedAgreement.user_a_id;
      const toAdd = filteredMyProducts.filter((p: any) => !mySharedProductIds.has(p.id));
      for (const p of toAdd) {
        await supabase.from('partner_agreement_products').upsert({
          agreement_id: selectedAgreement.id,
          product_id: p.id,
          owner_id: user.id,
          shared_with_id: partnerId
        }, { onConflict: 'agreement_id,product_id', ignoreDuplicates: true });
      }
    },
    onSuccess: () => {
      toast.success('Todos os produtos adicionados!');
      queryClient.invalidateQueries({ queryKey: ['shared-products'] });
    },
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  const activeAgreements = agreements.filter((a: any) => a.status === 'active');
  const pendingReceived = agreements.filter((a: any) => a.status === 'pending' && a.user_b_id === user?.id);
  const pendingSent = agreements.filter((a: any) => a.status === 'pending' && a.user_a_id === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Handshake className="h-7 w-7 text-primary" /> Parcerias
          </h1>
          <p className="text-slate-500 text-sm mt-1">Compartilhe produtos com outras revendedoras e expanda seu catálogo</p>
        </div>
        <Button onClick={() => setShowInviteInput(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Convidar Parceira
        </Button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Como funciona:</strong> Convide uma parceira pelo e-mail dela. Após aceitar, cada uma escolhe quais produtos compartilha.
          Os produtos aparecem no catálogo e PDV da parceira com a tag <span className="bg-blue-100 px-1 rounded font-semibold">🤝 Parceria</span>.
          Ao vender um produto da parceria, um log é gerado automaticamente para o acerto de contas.
        </div>
      </div>

      {/* Convites recebidos */}
      {pendingReceived.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="font-semibold text-amber-800 mb-3">📬 Convites Recebidos</h2>
          <div className="space-y-2">
            {pendingReceived.map((ag: any) => (
              <div key={ag.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                <div>
                  <p className="font-medium text-slate-800">{ag.partner_email}</p>
                  <p className="text-xs text-slate-500">quer fazer uma parceria com você</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptMutation.mutate(ag.id)} className="gap-1 bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => declineMutation.mutate(ag.id)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                    <X className="h-3 w-3" /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convites enviados */}
      {pendingSent.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold text-slate-600 mb-3">⏳ Convites Enviados (aguardando)</h2>
          <div className="space-y-2">
            {pendingSent.map((ag: any) => (
              <div key={ag.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-700">{ag.partner_email}</p>
                <Button size="sm" variant="ghost" onClick={() => declineMutation.mutate(ag.id)} className="text-red-500 text-xs">Cancelar</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parcerias Ativas */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Parcerias Ativas ({activeAgreements.length})
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Carregando...</div>
        ) : activeAgreements.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <Handshake className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma parceria ativa ainda</p>
            <p className="text-sm mt-1">Convide uma revendedora para começar!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeAgreements.map((ag: any) => (
              <div key={ag.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">{ag.partner_email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{ag.partner_email}</p>
                      <p className="text-xs text-green-600 font-medium">✅ Parceria Ativa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelectedAgreement(selectedAgreement?.id === ag.id ? null : ag); setProductSearch(''); setProductCategoryFilter('all'); setProductTab('mine'); }}
                      className="gap-1"
                    >
                      <Package className="h-3 w-3" />
                      Gerenciar Produtos
                      {selectedAgreement?.id === ag.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => declineMutation.mutate(ag.id)} className="text-red-500 text-xs">Encerrar</Button>
                  </div>
                </div>

                {selectedAgreement?.id === ag.id && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    {/* Abas */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setProductTab('mine')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${productTab === 'mine' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        Meus Produtos Compartilhados ({mySharedProductIds.size})
                      </button>
                      <button
                        onClick={() => setProductTab('theirs')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${productTab === 'theirs' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        Produtos da Parceira ({partnerSharedProducts.length})
                      </button>
                    </div>

                    {productTab === 'mine' && (
                      <>
                        {/* Filtros */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Buscar produto..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-9 h-9 text-sm"
                            />
                          </div>
                          <select
                            value={productCategoryFilter}
                            onChange={(e) => setProductCategoryFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                          >
                            <option value="all">Todas as categorias</option>
                            {categories.map((cat: string) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addAllMutation.mutate()}
                            disabled={addAllMutation.isPending}
                            className="gap-1 border-primary text-primary hover:bg-primary/5"
                          >
                            <CheckSquare className="h-4 w-4" />
                            Adicionar Tudo ({filteredMyProducts.filter((p: any) => !mySharedProductIds.has(p.id)).length})
                          </Button>
                        </div>

                        {/* Lista de produtos */}
                        <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                          {filteredMyProducts.map((p: any) => {
                            const isShared = mySharedProductIds.has(p.id);
                            const totalStock = (p.product_variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
                            const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
                            return (
                              <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isShared ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 m-auto mt-2.5 text-slate-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                  <p className="text-xs text-slate-500">{cat?.name || 'Sem categoria'} · {totalStock} em estoque</p>
                                </div>
                                <button
                                  onClick={() => isShared ? removeProductMutation.mutate(p.id) : addProductMutation.mutate(p.id)}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isShared ? 'bg-green-500 text-white hover:bg-red-500' : 'border-2 border-slate-300 hover:border-primary'}`}
                                >
                                  {isShared ? <Check className="h-3 w-3" /> : null}
                                </button>
                              </div>
                            );
                          })}
                          {filteredMyProducts.length === 0 && (
                            <p className="text-center text-slate-400 py-4 text-sm">Nenhum produto encontrado</p>
                          )}
                        </div>
                      </>
                    )}

                    {productTab === 'theirs' && (
                      <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                        {partnerSharedProducts.length === 0 ? (
                          <p className="text-center text-slate-400 py-6 text-sm">A parceira ainda não compartilhou produtos</p>
                        ) : partnerSharedProducts.map((sp: any) => {
                          const p = sp.products;
                          if (!p) return null;
                          const totalStock = (p.product_variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
                          const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
                          return (
                            <div key={sp.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-blue-50 border-blue-100">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 m-auto mt-2.5 text-slate-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                <p className="text-xs text-slate-500">{cat?.name || 'Sem categoria'} · {totalStock} em estoque</p>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">🤝 Parceria</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal convite */}
      <Dialog open={showInviteInput} onOpenChange={setShowInviteInput}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" /> Convidar Nova Parceira
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">Digite o e-mail da revendedora que você quer convidar para a parceria:</p>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inviteEmail && inviteMutation.mutate(inviteEmail)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteInput(false)}>Cancelar</Button>
            <Button onClick={() => inviteEmail && inviteMutation.mutate(inviteEmail)} disabled={!inviteEmail || inviteMutation.isPending}>
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
