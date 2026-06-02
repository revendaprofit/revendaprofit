import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store, Camera, Link as LinkIcon, Smartphone, CreditCard, Plus, Trash2, Edit2, CalendarClock, Palette, Image as ImageIcon, ExternalLink, Globe, Megaphone, Type, LayoutGrid, List, Star, ShoppingBag, Flame, Lock, Power } from 'lucide-react';
import { toast } from 'sonner';

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button
    type="button"
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? 'bg-primary' : 'bg-input'}`}
    onClick={() => onChange(!checked)}
  >
    <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

export default function StoreSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ 
    store_name: '', slug: '', whatsapp: '',
    page_title: '', primary_color: '#000000', bg_color: '#f9fafb', card_bg_color: '#ffffff',
    title_font: 'Inter', body_font: 'Inter',
    announcement_text: '', instagram_url: '', tiktok_url: '', footer_text: '',
    product_layout: 'grid',
    featured_product_ids: [] as string[],
    meta_pixel_id: '',
    ga4_measurement_id: '',
    deals_password: '',
    notify_new_order: true,
    notify_partner_order: true,
    notify_customer_signup: true,
    notify_bag_accepted: true,
    notify_bag_finalized: true,
    notify_birthday: true,
    notify_overdue_installment: true,
    is_store_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [bannerDesktopFile, setBannerDesktopFile] = useState<File | null>(null);
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);

  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmForm, setPmForm] = useState({ id: '', name: '', fee_percentage: 0, is_installment: false, is_active: true });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from('store_settings').select('*').eq('owner_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        slug: settings.slug || '',
        whatsapp: settings.whatsapp || '',
        page_title: settings.page_title || '',
        primary_color: settings.primary_color || '#000000',
        bg_color: settings.bg_color || '#f9fafb',
        card_bg_color: settings.card_bg_color || '#ffffff',
        title_font: settings.title_font || 'Inter',
        body_font: settings.body_font || 'Inter',
        announcement_text: settings.announcement_text || '',
        instagram_url: settings.instagram_url || '',
        tiktok_url: settings.tiktok_url || '',
        footer_text: settings.footer_text || '',
        product_layout: settings.product_layout || 'grid',
        featured_product_ids: settings.featured_product_ids || [],
        meta_pixel_id: settings.meta_pixel_id || '',
        ga4_measurement_id: settings.ga4_measurement_id || '',
        deals_password: settings.deals_password || '',
        notify_new_order: (settings as any).notify_new_order ?? true,
        notify_partner_order: (settings as any).notify_partner_order ?? true,
        notify_customer_signup: (settings as any).notify_customer_signup ?? true,
        notify_bag_accepted: (settings as any).notify_bag_accepted ?? true,
        notify_bag_finalized: (settings as any).notify_bag_finalized ?? true,
        notify_birthday: (settings as any).notify_birthday ?? true,
        notify_overdue_installment: (settings as any).notify_overdue_installment ?? true,
        is_store_active: (settings as any).is_store_active ?? true,
      });
    }
  }, [settings]);

  // Suggest slug from store name
  const handleNameChange = (name: string) => {
    if (!settings?.slug) {
      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData({ ...formData, store_name: name, slug: autoSlug });
    } else {
      setFormData({ ...formData, store_name: name });
    }
  };

  const { data: payMethods = [], isLoading: loadingPM } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from('payment_methods').select('*').eq('owner_id', user.id).order('created_at');
      if (error) throw error;
      
      let fetchedData = data || [];
      if (fetchedData.length === 0) {
          const { data: adminProf } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
          if (adminProf?.id && adminProf.id !== user.id) {
              const { data: adminMethods } = await supabase.from('payment_methods').select('*').eq('owner_id', adminProf.id).order('created_at');
              if (adminMethods && adminMethods.length > 0) {
                  const clones = adminMethods.map(m => ({
                      owner_id: user.id,
                      name: m.name,
                      fee_percentage: m.fee_percentage,
                      is_installment: m.is_installment,
                      is_active: m.is_active
                  }));
                  await supabase.from('payment_methods').insert(clones);
                  const { data: newData } = await supabase.from('payment_methods').select('*').eq('owner_id', user.id).order('created_at');
                  if (newData) fetchedData = newData;
              }
          }
      }
      return fetchedData;
    }
  });
  const { data: allProducts } = useQuery({
    queryKey: ['store-active-products'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      const { data } = await supabase.from('products').select('id, name, image_url').eq('owner_id', user.id).eq('marketing_status', 'active');
      return data || [];
    }
  });

  const pmMutation = useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      
      if (payload.id) {
         const { error } = await supabase.from('payment_methods').update(payload).eq('id', payload.id);
         if (error) throw error;
      } else {
         const { id, ...insertPayload } = payload;
         const { error } = await supabase.from('payment_methods').insert([{...insertPayload, owner_id: user.id}]);
         if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Forma de Pagamento salva!');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setPmModalOpen(false);
    }
  });

  const togglePmStatus = async (id: string, currentActive: boolean) => {
     const { error } = await supabase.from('payment_methods').update({ is_active: !currentActive }).eq('id', id);
     if(error) toast.error('Erro ao atualizar status');
     queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
  };

  const pmDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Forma removida!');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");

      let logoUrl = settings?.logo_url;
      let faviconUrl = settings?.favicon_url;
      let bannerDesktopUrl = settings?.banner_desktop_url;
      let bannerMobileUrl = settings?.banner_mobile_url;

      const uploadFile = async (file: File, prefix: string) => {
         const fileExt = file.name.split('.').pop();
         const filePath = `${user.id}/${prefix}_${Math.random()}.${fileExt}`;
         const { error } = await supabase.storage.from('product-images').upload(filePath, file, { upsert: true });
         if (error) throw error;
         return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
      };

      if (logoFile) logoUrl = await uploadFile(logoFile, 'logo');
      if (faviconFile) faviconUrl = await uploadFile(faviconFile, 'favicon');
      if (bannerDesktopFile) bannerDesktopUrl = await uploadFile(bannerDesktopFile, 'banner_desk');
      if (bannerMobileFile) bannerMobileUrl = await uploadFile(bannerMobileFile, 'banner_mob');

      const payload = {
        store_name: formData.store_name,
        slug: formData.slug || formData.store_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        whatsapp: formData.whatsapp,
        logo_url: logoUrl,
        page_title: formData.page_title,
        favicon_url: faviconUrl,
        banner_desktop_url: bannerDesktopUrl,
        banner_mobile_url: bannerMobileUrl,
        primary_color: formData.primary_color,
        bg_color: formData.bg_color,
        card_bg_color: formData.card_bg_color,
        title_font: formData.title_font,
        body_font: formData.body_font,
        announcement_text: formData.announcement_text,
        instagram_url: formData.instagram_url,
        tiktok_url: formData.tiktok_url,
        footer_text: formData.footer_text,
        product_layout: formData.product_layout,
        featured_product_ids: formData.featured_product_ids,
        deals_password: formData.deals_password || null,
        notify_new_order: formData.notify_new_order,
        notify_partner_order: formData.notify_partner_order,
        notify_customer_signup: formData.notify_customer_signup,
        notify_bag_accepted: formData.notify_bag_accepted,
        notify_bag_finalized: formData.notify_bag_finalized,
        notify_birthday: formData.notify_birthday,
        notify_overdue_installment: formData.notify_overdue_installment,
        is_store_active: formData.is_store_active,
      };

      if (settings?.id) {
        const { error } = await supabase.from('store_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_settings').insert([{ ...payload, owner_id: user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Configurações da Loja atualizadas!');
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
    },
    onError: (e: any) => {
      if(e?.message?.includes('store_settings_slug_key') || e?.code === '23505') {
        toast.error('Este link personalizado (slug) já está em uso por outra loja!');
      } else {
        toast.error(`Erro: ${e.message}`);
      }
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" /> Minha Loja (Catálogo)
        </h1>
        <p className="text-muted-foreground mt-1">Configure o perfil online da sua loja para receber pedidos.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando configurações...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b bg-muted/20 font-semibold">Perfil da Marca</div>
            <div className="p-5 space-y-5">
              
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="h-24 w-24 rounded-full border-4 border-muted overflow-hidden flex items-center justify-center bg-background relative group">
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="h-full w-full object-cover" />
                  ) : settings?.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-10 w-10 text-muted-foreground opacity-50" />
                  )}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </div>
                <div className="text-center text-sm text-muted-foreground">Suba sua Logomarca (opcional)</div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Nome Comercial da Loja</label>
                <Input 
                  value={formData.store_name} 
                  onChange={e => handleNameChange(e.target.value)} 
                  placeholder="Ex: Closet da Maria" 
                  className="font-medium"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Título da Página no Navegador</label>
                <Input 
                  value={formData.page_title} 
                  onChange={e => setFormData({...formData, page_title: e.target.value})} 
                  placeholder="Ex: Closet da Maria - Moda Feminina" 
                />
                <p className="text-xs text-muted-foreground mt-1">Este será o título exibido na aba do navegador.</p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Favicon (Ícone do Navegador)</label>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 border rounded shadow-sm overflow-hidden flex items-center justify-center relative group bg-background">
                     {faviconFile ? (
                       <img src={URL.createObjectURL(faviconFile)} alt="Favicon Preview" className="h-8 w-8 object-contain" />
                     ) : settings?.favicon_url ? (
                       <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                     ) : (
                       <Globe className="h-5 w-5 text-muted-foreground opacity-50" />
                     )}
                     <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                       <Camera className="h-4 w-4 text-white" />
                     </div>
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setFaviconFile(e.target.files?.[0] || null)} />
                  </div>
                  <p className="text-xs text-muted-foreground flex-1">Imagem em miniatura que fica visível na lateral esquerda do título na aba do navegador (Recomendado 512x512px).</p>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> Número de WhatsApp <span className="text-xs text-muted-foreground font-normal">(Receberá pedidos)</span>
                </label>
                <Input 
                  value={formData.whatsapp} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                  placeholder="5511999999999" 
                  type="text"
                />
                <p className="text-xs text-muted-foreground mt-1">Coloque o código do país (55) + DDD + Número. Ex: 5511988887777.</p>
              </div>

            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b bg-muted/20 font-semibold bg-primary/5 text-primary border-primary/20 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Seu Catálogo Online
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${formData.is_store_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {formData.is_store_active ? 'Online' : 'Offline'}
                </span>
                <button
                  type="button"
                  title={formData.is_store_active ? 'Desativar loja' : 'Ativar loja'}
                  onClick={async () => {
                    const newVal = !formData.is_store_active;
                    setFormData(prev => ({ ...prev, is_store_active: newVal }));
                    if (settings?.id) {
                      const { error } = await supabase.from('store_settings').update({ is_store_active: newVal }).eq('id', settings.id);
                      if (error) {
                        toast.error('Erro ao atualizar status da loja');
                        setFormData(prev => ({ ...prev, is_store_active: !newVal }));
                      } else {
                        toast.success(newVal ? 'Loja ativada!' : 'Loja desativada!');
                        queryClient.invalidateQueries({ queryKey: ['store-settings'] });
                      }
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${formData.is_store_active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <Power className={`absolute left-1 h-3 w-3 transition-all ${formData.is_store_active ? 'text-white opacity-100' : 'text-gray-500 opacity-60'}`} />
                  <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${formData.is_store_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5 flex-1">
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Endereço Exclusivo (Link)</label>
                <div className="flex bg-muted rounded-md border focus-within:ring-2 focus-within:ring-primary overflow-hidden">
                  <div className="px-3 flex items-center text-sm text-muted-foreground bg-muted border-r select-none">
                    revendaprofit.com/loja/
                  </div>
                  <input 
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-semibold text-primary"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                    placeholder="sua-loja"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Este é o link que você enviará para os clientes verem seus produtos.</p>
              </div>

              {settings?.slug && (
                <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">Sua vitrine já está online!</p>
                  <a 
                    href={`/loja/${settings.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex text-sm text-green-700 underline font-bold hover:text-green-900 duration-200"
                  >
                    Acessar meu catálogo público ↗
                  </a>
                </div>
              )}

              <hr className="my-6 border-muted" />

              <div className="bg-gradient-to-r from-muted/50 to-muted/20 p-4 border rounded-xl">
                 <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                    <div>
                       <h4 className="font-semibold text-sm">Conectar Domínio Próprio</h4>
                       <p className="text-xs text-muted-foreground mt-1 mb-3">
                         Compre seu domínio (suamarca.com.br) e conecte com nossa assessoria VIP para deixar seu catálogo 100% profissional.
                       </p>
                       <Button size="sm" variant="outline" className="text-xs w-full sm:w-auto h-8 bg-background" onClick={() => window.open('https://wa.me/5548991823483?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20conectar%20um%20dom%C3%ADnio%20pr%C3%B3prio%20no%20meu%20cat%C3%A1logo', '_blank')}>
                          Falar com Suporte <ExternalLink className="h-3 w-3 ml-2" />
                       </Button>
                    </div>
                 </div>
              </div>

            </div>
            
            <div className="p-5 bg-muted/30 border-t mt-auto">
              <Button 
                onClick={() => updateMutation.mutate()} 
                disabled={!formData.store_name || !formData.slug || updateMutation.isPending}
                className="w-full h-12 shadow-md text-base"
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* Aparência da Loja - Banners e Cores */}
      {!isLoading && (
         <div className="grid gap-6 md:grid-cols-2">
            
            {/* Secao de Cores */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
               <div className="p-5 border-b bg-muted/20 font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" /> Cores da Loja
               </div>
               <div className="p-5 space-y-5 flex-1">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Cor Primária (Botões e Destaques)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="color" 
                         value={formData.primary_color}
                         onChange={e => setFormData({...formData, primary_color: e.target.value})}
                         className="h-10 w-20 cursor-pointer rounded bg-transparent border-0 p-0"
                       />
                       <div 
                          className="px-4 py-2 rounded-md font-semibold text-white shadow-sm text-sm" 
                          style={{ backgroundColor: formData.primary_color }}
                       >
                          Preview do Botão
                       </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Cor de Fundo da Página (Opcional)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="color" 
                         value={formData.bg_color}
                         onChange={e => setFormData({...formData, bg_color: e.target.value})}
                         className="h-10 w-20 cursor-pointer rounded bg-transparent border-0 p-0"
                       />
                       <span className="text-sm text-muted-foreground">{formData.bg_color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Cor de Fundo dos Cards (Opcional)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="color" 
                         value={formData.card_bg_color}
                         onChange={e => setFormData({...formData, card_bg_color: e.target.value})}
                         className="h-10 w-20 cursor-pointer rounded bg-transparent border-0 p-0"
                       />
                       <span className="text-sm text-muted-foreground">{formData.card_bg_color}</span>
                    </div>
                  </div>
                  
                  <hr className="border-muted my-2" />
                  
                  <div className="flex items-center gap-2 mb-2">
                     <h4 className="font-semibold text-sm text-primary">Layout da Vitrine</h4>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block">Visualização Inicial dos Produtos</label>
                    <div className="flex bg-muted/50 p-1 rounded-lg border w-full max-w-xs gap-1 cursor-pointer">
                      <div 
                         onClick={() => setFormData({...formData, product_layout: 'grid'})}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${formData.product_layout === 'grid' ? 'bg-background shadow-sm border font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                         <LayoutGrid className="h-4 w-4" /> Grade (Cards)
                      </div>
                      <div 
                         onClick={() => setFormData({...formData, product_layout: 'list'})}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${formData.product_layout === 'list' ? 'bg-background shadow-sm border font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                         <List className="h-4 w-4" /> Lista Detalhada
                      </div>
                    </div>
                  </div>

                  <hr className="border-muted my-2" />
                  
                  <div className="flex items-center gap-2 mb-2">
                     <h4 className="font-semibold text-sm text-primary">Tipografia (Fontes)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-semibold mb-1 block">Fonte dos Títulos</label>
                       <select 
                         className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                         value={formData.title_font}
                         onChange={e => setFormData({...formData, title_font: e.target.value})}
                       >
                         <option value="Inter">Inter (Elegante)</option>
                         <option value="Montserrat">Montserrat (Moderna)</option>
                         <option value="Playfair Display">Playfair (Clássica)</option>
                         <option value="Poppins">Poppins (Redonda)</option>
                         <option value="Oswald">Oswald (Impacto)</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs font-semibold mb-1 block">Fonte do Corpo</label>
                       <select 
                         className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                         value={formData.body_font}
                         onChange={e => setFormData({...formData, body_font: e.target.value})}
                       >
                         <option value="Inter">Inter</option>
                         <option value="Roboto">Roboto</option>
                         <option value="Lato">Lato</option>
                         <option value="Open Sans">Open Sans</option>
                       </select>
                     </div>
                  </div>

               </div>
               <div className="p-5 bg-muted/30 border-t mt-auto">
                 <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full shadow-sm">
                   Salvar Aparência
                 </Button>
               </div>
            </div>

            {/* Secao de Banners */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
               <div className="p-5 border-b bg-muted/20 font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Banners Promocionais
               </div>
               <div className="p-5 space-y-6 flex-1">
                  
                  <div>
                     <label className="text-sm font-semibold mb-2 block">Banner Principal Desktop</label>
                     <p className="text-xs text-muted-foreground mb-3">Tamanho recomendado: 1920x400px</p>
                     <div className="relative border-2 border-dashed border-muted-foreground/30 h-28 rounded-lg overflow-hidden flex items-center justify-center group bg-muted/10 hover:bg-muted/20 transition-colors">
                        {bannerDesktopFile ? (
                           <img src={URL.createObjectURL(bannerDesktopFile)} alt="Desktop Preview" className="h-full w-full object-cover" />
                        ) : settings?.banner_desktop_url ? (
                           <img src={settings.banner_desktop_url} alt="Desktop Preview" className="h-full w-full object-cover" />
                        ) : (
                           <div className="flex flex-col items-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                              <span className="text-xs font-medium">Clique para subir</span>
                           </div>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setBannerDesktopFile(e.target.files?.[0] || null)} />
                     </div>
                  </div>

                  <div>
                     <label className="text-sm font-semibold mb-2 block">Banner Mobile</label>
                     <p className="text-xs text-muted-foreground mb-3">Tamanho recomendado: 1080x1080px (Quadrado)</p>
                     <div className="relative border-2 border-dashed border-muted-foreground/30 h-32 w-32 rounded-lg overflow-hidden flex items-center justify-center group bg-muted/10 hover:bg-muted/20 transition-colors">
                        {bannerMobileFile ? (
                           <img src={URL.createObjectURL(bannerMobileFile)} alt="Mobile Preview" className="h-full w-full object-cover" />
                        ) : settings?.banner_mobile_url ? (
                           <img src={settings.banner_mobile_url} alt="Mobile Preview" className="h-full w-full object-cover" />
                        ) : (
                           <div className="flex flex-col items-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                              <span className="text-xs font-medium text-center px-2">Subir Mobile</span>
                           </div>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setBannerMobileFile(e.target.files?.[0] || null)} />
                     </div>
                  </div>

               </div>
               <div className="p-5 bg-muted/30 border-t mt-auto">
                 <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full shadow-sm">
                   Salvar Banners
                 </Button>
               </div>
            </div>

         </div>
      )}

      {/* Configurações Extras: Sociais e Textos */}
      {!isLoading && (
         <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col mb-6">
            <div className="p-5 border-b bg-muted/20 font-semibold flex items-center gap-2">
               <Megaphone className="h-5 w-5 text-primary" /> Elementos Extras & Redes Sociais
            </div>
            <div className="p-5 grid gap-6 md:grid-cols-2">
               
               <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold mb-1 block flex items-center gap-2"><Megaphone className="h-4 w-4 text-orange-500" /> Barra de Anúncio Global (Topo)</label>
                    <Input 
                      value={formData.announcement_text} 
                      onChange={e => setFormData({...formData, announcement_text: e.target.value})} 
                      placeholder="Ex: Frete Grátis acima de R$ 300,00 🚚" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Este texto ficará em destaque no topo do seu catálogo público.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block flex items-center gap-2"><Type className="h-4 w-4 border rounded p-0.5" /> Texto de Rodapé (Copyright/CNPJ)</label>
                    <Input 
                      value={formData.footer_text} 
                      onChange={e => setFormData({...formData, footer_text: e.target.value})} 
                      placeholder="Ex: Closet da Maria - CNPJ: 00.000.000/0001-00" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Texto exibido na parte inferior do site. Ideal para CNPJ ou Termos.</p>
                  </div>
               </div>

               <div className="space-y-5 border-l pl-0 md:pl-6">
                  <div>
                    <label className="text-sm font-semibold mb-1 block flex items-center gap-2"><Camera className="h-4 w-4 text-pink-600" /> Link do Instagram</label>
                    <Input 
                      value={formData.instagram_url} 
                      onChange={e => setFormData({...formData, instagram_url: e.target.value})} 
                      placeholder="https://instagram.com/suamarca" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block flex items-center gap-2"><Smartphone className="h-4 w-4 text-black" /> Link do TikTok</label>
                    <Input 
                      value={formData.tiktok_url} 
                      onChange={e => setFormData({...formData, tiktok_url: e.target.value})} 
                      placeholder="https://tiktok.com/@suamarca" 
                    />
                  </div>
               </div>

            </div>
            <div className="p-5 bg-muted/30 border-t flex justify-end">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full md:w-auto shadow-sm">
                Salvar Elementos Extras
              </Button>
            </div>
         </div>
      )}

      {/* Oportunidades VIP */}
      {!isLoading && (
         <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col mb-6 border-red-200">
            <div className="p-5 border-b bg-gradient-to-r from-red-50 to-orange-50 font-semibold flex items-center gap-2 text-red-700">
               <Flame className="h-5 w-5" /> Oportunidades VIP
            </div>
            <div className="p-5 space-y-5">
               <div>
                 <label className="text-sm font-semibold mb-1 block flex items-center gap-2">
                   <Lock className="h-4 w-4 text-red-500" /> Senha de Acesso (Opcional)
                 </label>
                 <Input 
                   value={formData.deals_password} 
                   onChange={e => setFormData({...formData, deals_password: e.target.value})} 
                   placeholder="Ex: VIP2026" 
                   className="max-w-xs font-mono"
                 />
                 <p className="text-xs text-muted-foreground mt-2">
                   {formData.deals_password ? (
                     <span className="text-green-700 font-medium">🔒 Protegido — Seus clientes precisarão digitar "{formData.deals_password}" para ver as oportunidades.</span>
                   ) : (
                     <span>Se vazio, as Oportunidades ficarão visíveis para todos os visitantes (sem senha).</span>
                   )}
                 </p>
               </div>
               <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                 <p className="font-medium mb-1">💡 Como usar:</p>
                 <ol className="list-decimal list-inside space-y-1">
                   <li>Cadastre preços especiais nas <strong>variantes dos produtos</strong> (tela de edição)</li>
                   <li>Defina uma senha acima para criar exclusividade</li>
                   <li>Envie a senha por WhatsApp/Instagram para seus clientes VIP</li>
                 </ol>
               </div>
            </div>
            <div className="p-5 bg-muted/30 border-t flex justify-end">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full md:w-auto shadow-sm bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white">
                Salvar Oportunidades
              </Button>
            </div>
         </div>
      )}

      {/* Rastreamento e Analytics */}
      {!isLoading && (
         <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col mb-6">
            <div className="p-5 border-b bg-muted/20 font-semibold flex items-center gap-2">
               <Globe className="h-5 w-5 text-indigo-500" /> Rastreamento e Pixels
            </div>
            <div className="p-5 grid gap-6 md:grid-cols-2">
               <div>
                 <label className="text-sm font-semibold mb-1 block">Meta Pixel ID</label>
                 <Input 
                   value={formData.meta_pixel_id} 
                   onChange={e => setFormData({...formData, meta_pixel_id: e.target.value})} 
                   placeholder="Ex: 102938475610293" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Dispara PageView e InitiateCheckout no Facebook/Instagram Ads.</p>
               </div>
               <div>
                 <label className="text-sm font-semibold mb-1 block">Google Analytics 4 (GA4)</label>
                 <Input 
                   value={formData.ga4_measurement_id} 
                   onChange={e => setFormData({...formData, ga4_measurement_id: e.target.value})} 
                   placeholder="Ex: G-XXXXXXXXXX" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">ID de Métrica do Google.</p>
               </div>
            </div>
            <div className="p-5 bg-muted/30 border-t flex justify-end">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full md:w-auto shadow-sm">
                Salvar Pixels
              </Button>
            </div>
         </div>
      )}

      {/* Aba de Pagamentos */}
      {!isLoading && (
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="p-5 border-b bg-muted/20 font-semibold flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Formas de Pagamento Personalizadas
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-1">Configure suas formas de pagamento e taxas</p>
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                setPmForm({ id: '', name: '', fee_percentage: 0, is_installment: false, is_active: true });
                setPmModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          </div>
          
          <div className="p-5 space-y-3">
             {loadingPM ? (
               <p className="text-muted-foreground text-sm">Carregando...</p>
             ) : payMethods.length === 0 ? (
               <p className="text-muted-foreground text-sm flex items-center gap-2"> Nenhuma forma configurada.</p>
             ) : (
               payMethods.map((pm: any) => (
                 <div key={pm.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                   <div className="flex items-center gap-4">
                     <Switch checked={pm.is_active} onChange={() => togglePmStatus(pm.id, pm.is_active)} />
                     <div>
                       <p className="font-semibold text-sm flex items-center gap-2">
                          {pm.name} 
                          {pm.is_installment && <span className="bg-muted text-[10px] px-1.5 py-0.5 rounded border flex items-center font-normal"><CalendarClock className="h-3 w-3 mr-1"/> A prazo</span>}
                       </p>
                       <p className="text-xs text-muted-foreground">Taxa: {Number(pm.fee_percentage)}%</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setPmForm(pm); setPmModalOpen(true); }}>
                       <Edit2 className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { if(window.confirm('Excluir forma de pagamento?')) pmDeleteMutation.mutate(pm.id) }}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}



      {/* Notificações via WhatsApp (BotConversa) */}
      {!isLoading && (
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Notificações via WhatsApp
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-1">
              Escolha quais eventos enviam uma mensagem automática para o seu WhatsApp cadastrado.
            </p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { key: 'notify_new_order',           label: 'Nova venda na loja online',              desc: 'Receba aviso quando um cliente fechar um pedido no catálogo.' },
              { key: 'notify_partner_order',        label: 'Nova venda em ponto parceiro',           desc: 'Receba aviso quando um pedido for feito na arara de um parceiro.' },
              { key: 'notify_customer_signup',      label: 'Cadastro sem pedido (lead)',             desc: 'Cliente preencheu nome e WhatsApp mas não finalizou o pedido.' },
              { key: 'notify_bag_accepted',         label: 'Aceite de malinha consignada',           desc: 'Cliente respondeu quais peças ficou/devolveu na malinha.' },
              { key: 'notify_bag_finalized',        label: 'Finalização de malinha consignada',      desc: 'Malinha foi fechada pelo administrador.' },
              { key: 'notify_birthday',             label: 'Aniversariantes do dia',                 desc: 'Receba aviso diário com clientes que fazem aniversário hoje.' },
              { key: 'notify_overdue_installment',  label: 'Parcelas vencidas',                      desc: 'Receba aviso diário quando houver parcelas em atraso.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={(formData as any)[key] ?? true}
                  onChange={v => setFormData({ ...formData, [key]: v } as any)}
                />
              </div>
            ))}
          </div>
          <div className="p-5 bg-muted/30 border-t flex justify-end">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full md:w-auto">
              Salvar Preferências
            </Button>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      <Dialog open={pmModalOpen} onOpenChange={setPmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pmForm.id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Nome *</label>
              <Input placeholder="Ex: Pix a prazo..." value={pmForm.name} onChange={e => setPmForm({...pmForm, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Taxa (%)</label>
              <Input type="number" step="0.01" placeholder="0" value={pmForm.fee_percentage} onChange={e => setPmForm({...pmForm, fee_percentage: parseFloat(e.target.value) || 0})} />
              <p className="text-[10px] text-muted-foreground mt-1">Taxa que será descontada automaticamente nas vendas</p>
            </div>
            <div className="flex justify-between items-center border rounded-lg p-3 bg-muted/10">
              <div>
                <label className="text-sm font-semibold block">Pagamento a Prazo</label>
                <p className="text-[10px] text-muted-foreground">Solicitar data de vencimento ao finalizar venda</p>
              </div>
              <Switch checked={pmForm.is_installment} onChange={v => setPmForm({...pmForm, is_installment: v})} />
            </div>
            {pmForm.is_installment && (
              <div className="bg-red-50 text-red-600 text-[11px] p-3 rounded border border-red-100 flex items-start gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                 <p>Ao usar esta forma de pagamento, você poderá definir a data de vencimento e receberá lembretes com o WhatsApp do cliente para cobrança.</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setPmModalOpen(false)}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => pmMutation.mutate(pmForm)} disabled={!pmForm.name || pmMutation.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
