import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, Clock, CheckCircle, ShoppingBag, XCircle, Eye, Copy, DollarSign, Package, Ban, Banknote, ArrowRight } from 'lucide-react';

type BazarItem = {
  id: string; title: string; description: string; customer_price: number; commission_value: number; final_price: number;
  weight: number; height: number; width: number; length: number;
  images: string[]; condition: string; size: string; color: string; category: string;
  status: string; rejection_reason: string; buyer_name: string; buyer_phone: string;
  sold_at: string; seller_paid: boolean; seller_paid_at: string; created_at: string;
  seller_id: string; owner_id: string;
  profiles?: { full_name?: string; email?: string; cep?: string; city?: string; state?: string };
};

export default function BazarAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'sold' | 'rejected'>('pending');
  const [selectedItem, setSelectedItem] = useState<BazarItem | null>(null);
  const [commissionInput, setCommissionInput] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);

  // Fetch items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['bazar-admin-items'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      
      // Busca items sem JOIN (evita falha do PostgREST com FK para auth.users)
      const { data: rawItems, error } = await supabase
        .from('bazar_items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!rawItems || rawItems.length === 0) return [];

      // Buscar perfis dos vendedores separadamente
      const sellerIds = [...new Set(rawItems.map(i => i.seller_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, cep, city, state')
        .in('id', sellerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return rawItems.map(item => ({
        ...item,
        profiles: profileMap.get(item.seller_id) || null
      })) as BazarItem[];
    }
  });

  // Fetch store slug for invite link
  const { data: storeSettings } = useQuery({
    queryKey: ['bazar-store-settings'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return null;
      const { data } = await supabase.from('store_settings').select('slug, store_name').eq('owner_id', user.id).single();
      return data;
    }
  });

  const inviteLink = storeSettings?.slug ? `${window.location.origin}/bazar/${storeSettings.slug}` : '';

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, commission }: { id: string; commission: number }) => {
      const { error } = await supabase.from('bazar_items').update({ commission_value: commission, status: 'approved' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Peça aprovada e publicada!');
      queryClient.invalidateQueries({ queryKey: ['bazar-admin-items'] });
      setSelectedItem(null);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.from('bazar_items').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Peça rejeitada.');
      queryClient.invalidateQueries({ queryKey: ['bazar-admin-items'] });
      setShowRejectModal(false); setRejectReason(''); setRejectItemId(null);
    }
  });

  // Mark seller as paid
  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bazar_items').update({ seller_paid: true, seller_paid_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Repasse marcado como feito!');
      queryClient.invalidateQueries({ queryKey: ['bazar-admin-items'] });
    }
  });

  // Unpublish
  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bazar_items').update({ status: 'pending' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Peça despublicada.');
      queryClient.invalidateQueries({ queryKey: ['bazar-admin-items'] });
    }
  });

  const filteredItems = items.filter(i => i.status === activeTab);

  // Metrics
  const pending = items.filter(i => i.status === 'pending').length;
  const published = items.filter(i => i.status === 'approved').length;
  const soldItems = items.filter(i => i.status === 'sold');
  const totalSold = soldItems.reduce((a, b) => a + Number(b.final_price || 0), 0);
  const totalOwedToSellers = soldItems.filter(i => !i.seller_paid).reduce((a, b) => a + Number(b.customer_price || 0), 0);

  const conditionLabel = (c: string) => {
    switch (c) { case 'new': return 'Nova'; case 'like_new': return 'Seminova'; case 'used': return 'Usada'; case 'worn': return 'Com Desgaste'; default: return c; }
  };

  const tabs = [
    { key: 'pending', label: 'Pendentes', icon: Clock, count: pending, color: 'text-amber-600 bg-amber-50' },
    { key: 'approved', label: 'Publicados', icon: CheckCircle, count: published, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'sold', label: 'Vendidos', icon: ShoppingBag, count: soldItems.length, color: 'text-blue-600 bg-blue-50' },
    { key: 'rejected', label: 'Rejeitados', icon: XCircle, count: items.filter(i => i.status === 'rejected').length, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" /> Bazar VIP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as peças enviadas pelos seus clientes.</p>
        </div>
        {inviteLink && (
          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 font-bold" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Link de convite copiado!'); }}>
            <Copy className="h-4 w-4 mr-2" /> Copiar Link de Convite
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-amber-100 text-amber-600 p-2.5 rounded-full"><Clock className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pendentes</p>
            <p className="text-xl font-black text-amber-600">{pending}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-full"><CheckCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Publicados</p>
            <p className="text-xl font-black text-emerald-600">{published}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full"><DollarSign className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vendido (R$)</p>
            <p className="text-xl font-black text-blue-600">R$ {totalSold.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-rose-100 text-rose-600 p-2.5 rounded-full"><Banknote className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">A Repassar</p>
            <p className="text-xl font-black text-rose-600">R$ {totalOwedToSellers.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.key ? t.color + ' shadow-sm border' : 'text-muted-foreground hover:bg-muted'}`}>
            <t.icon className="h-4 w-4" /> {t.label} <span className="bg-white/80 px-1.5 py-0.5 rounded-md text-xs font-black">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Carregando peças...</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Nenhuma peça nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {item.images?.[0] ? (
                  <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-slate-300" /></div>
                )}
                {item.condition && (
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider text-slate-700">
                    {conditionLabel(item.condition)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-slate-800 truncate">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  por {item.profiles?.full_name || item.profiles?.email || 'Vendedor'}
                  {item.profiles?.city && ` — ${item.profiles.city}/${item.profiles.state}`}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Quer receber</span>
                    <span className="text-lg font-black text-slate-800">R$ {Number(item.customer_price).toFixed(2)}</span>
                  </div>
                  {item.status === 'approved' && (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 uppercase font-bold block">Preço Final</span>
                      <span className="text-lg font-black text-emerald-600">R$ {Number(item.final_price).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {item.status === 'pending' && (
                    <>
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs" onClick={() => { setSelectedItem(item); setCommissionInput(String(item.commission_value || '')); }}>
                        <Eye className="h-3 w-3 mr-1" /> Analisar
                      </Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs" onClick={() => { setRejectItemId(item.id); setShowRejectModal(true); }}>
                        <Ban className="h-3 w-3 mr-1" /> Rejeitar
                      </Button>
                    </>
                  )}
                  {item.status === 'approved' && (
                    <Button size="sm" variant="outline" className="flex-1 text-xs font-bold" onClick={() => { if (window.confirm('Despublicar esta peça?')) unpublishMutation.mutate(item.id); }}>
                      Despublicar
                    </Button>
                  )}
                  {item.status === 'sold' && !item.seller_paid && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" onClick={() => { if (window.confirm(`Confirma repasse de R$ ${Number(item.customer_price).toFixed(2)} ao vendedor?`)) markPaidMutation.mutate(item.id); }}>
                      <DollarSign className="h-3 w-3 mr-1" /> Marcar Repasse
                    </Button>
                  )}
                  {item.status === 'sold' && item.seller_paid && (
                    <span className="flex-1 text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">✅ Repassado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analysis / Pricing Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><Eye className="h-5 w-5 text-purple-600" /> Curadoria da Peça</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6 pt-2">
              {/* Images */}
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedItem.images.map((img, i) => (
                    <img key={i} src={img} className="h-40 w-40 rounded-xl object-cover border-2 border-slate-200 shrink-0" />
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Título</span><span className="font-bold">{selectedItem.title}</span></div>
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Vendedor</span><span className="font-bold">{selectedItem.profiles?.full_name || selectedItem.profiles?.email}</span></div>
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Estado</span><span className="font-bold">{conditionLabel(selectedItem.condition)}</span></div>
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Tamanho / Cor</span><span className="font-bold">{selectedItem.size || '-'} / {selectedItem.color || '-'}</span></div>
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Origem (CEP)</span><span className="font-bold">{selectedItem.profiles?.cep || '-'} — {selectedItem.profiles?.city}/{selectedItem.profiles?.state}</span></div>
                <div><span className="text-muted-foreground text-xs font-bold uppercase block">Dimensões</span><span className="font-bold">{selectedItem.weight || '-'}kg · {selectedItem.height || '-'}×{selectedItem.width || '-'}×{selectedItem.length || '-'}cm</span></div>
              </div>

              {selectedItem.description && (
                <div>
                  <span className="text-muted-foreground text-xs font-bold uppercase block mb-1">Descrição</span>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border">{selectedItem.description}</p>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-4">
                <h4 className="font-black text-purple-800 text-sm uppercase tracking-wider">Formação de Preço</h4>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <span className="text-[10px] text-purple-600 uppercase font-bold block mb-1">Preço do Vendedor</span>
                    <p className="text-2xl font-black text-slate-800">R$ {Number(selectedItem.customer_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-600 uppercase font-bold block mb-1">+ Comissão da Loja</span>
                    <Input type="number" step="0.01" min="0" value={commissionInput} onChange={e => setCommissionInput(e.target.value)} className="h-12 bg-white text-lg font-bold border-purple-300 focus:border-purple-500" placeholder="0.00" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block mb-1">= Preço Final</span>
                    <p className="text-2xl font-black text-emerald-600">R$ {(Number(selectedItem.customer_price) + Number(commissionInput || 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedItem(null)} className="flex-1">Cancelar</Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                  onClick={() => approveMutation.mutate({ id: selectedItem.id, commission: parseFloat(commissionInput) || 0 })}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><XCircle className="h-5 w-5" /> Rejeitar Peça</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Informe o motivo da rejeição para que o vendedor possa entender e melhorar a submissão.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ex: Fotos com pouca qualidade, peça com defeito não informado..."
              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none"
            />
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="flex-1">Cancelar</Button>
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold" disabled={rejectMutation.isPending} onClick={() => { if (rejectItemId) rejectMutation.mutate({ id: rejectItemId, reason: rejectReason }); }}>
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
