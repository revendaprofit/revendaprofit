import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Search, Plus, Minus, Send, AlertCircle, Camera, Link as LinkIcon, X, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function ProductCard({ p, isList, store, cart, onAddToCart, onSelectProduct }: any) {
  const inStockVariants = p.product_variants?.filter((v: any) => v.stock > 0) || [];
  const mediaList = [p.image_url, p.image_url_2, p.image_url_3, p.video_url].filter(Boolean);
  
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const isFeatured = store?.featured_product_ids?.includes(p.id);

  const activeMedia = mediaList[currentMediaIndex] || p.image_url;
  const isVideo = activeMedia && typeof activeMedia === 'string' && (activeMedia.includes('.mp4') || activeMedia.includes('.webm') || activeMedia.includes('.mov'));

  useEffect(() => {
    if (mediaList.length <= 1) return;
    if (isVideo) return; // Se for vídeo, aguarda terminar
    
    const timer = setTimeout(() => {
      setCurrentMediaIndex(prev => (prev + 1) % mediaList.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentMediaIndex, isVideo, mediaList.length]);

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow group flex ${isList ? 'flex-row min-h-[128px] md:min-h-[160px]' : 'flex-col'}`} style={{ backgroundColor: store.card_bg_color || '#ffffff', borderColor: 'rgba(0,0,0,0.05)' }}>
      <div 
        onClick={() => onSelectProduct(p)}
        className={`${isList ? 'w-24 md:w-32 shrink-0' : 'aspect-[4/5]'} bg-gray-100 relative overflow-hidden flex items-center justify-center cursor-pointer`}
      >
        {activeMedia ? (
          isVideo ? (
            <video 
              src={activeMedia} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
              autoPlay 
              muted 
              playsInline 
              onEnded={() => {
                if (mediaList.length > 1) {
                  setCurrentMediaIndex(prev => (prev + 1) % mediaList.length);
                }
              }}
            />
          ) : (
            <img src={activeMedia} alt={p.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
          )
        ) : (
          <ShoppingBag className="h-10 w-10 text-gray-300" />
        )}
        
        {/* Indicators */}
        {!isList && mediaList.length > 1 && (
           <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
              {mediaList.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentMediaIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/50'}`} />
              ))}
           </div>
        )}

        {isFeatured && !isList && (
           <div className="absolute top-2 right-2 z-20">
              <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
                 <Star className="h-3 w-3 fill-current" /> Destaque
              </div>
           </div>
        )}

        {inStockVariants.length === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="bg-gray-800 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Esgotado</span>
          </div>
        )}
      </div>
      
      <div className={`p-4 flex flex-col flex-1 ${isList ? 'justify-center overflow-y-auto custom-scrollbar' : ''}`}>
        {!isList && <p className="text-[10px] sm:text-xs text-primary font-bold mb-1 opacity-80 uppercase tracking-wider">{(p.categories as any)?.name || (Array.isArray(p.categories) && (p.categories as any)[0]?.name) || 'Geral'}</p>}
        <h3 className={`font-semibold text-gray-900 leading-tight mb-2 ${isList ? 'line-clamp-1 text-sm md:text-base' : 'line-clamp-2 md:text-lg'} font-store-title`}>{p.name}</h3>
        <div className="mt-auto">
          <p className="text-lg font-bold text-gray-900 mb-3">R$ {p.sale_price.toFixed(2)}</p>
          
          {inStockVariants.length > 0 ? (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Selecionar Tamanho</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'EG', 'EGG'];
                  const sorted = [...inStockVariants].sort((a: any, b: any) => {
                    const idxA = sizeOrder.indexOf((a.size || '').toUpperCase());
                    const idxB = sizeOrder.indexOf((b.size || '').toUpperCase());
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    // Numéricos (34, 36, 38...)
                    const numA = parseFloat(a.size); const numB = parseFloat(b.size);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return (a.size || '').localeCompare(b.size || '');
                  });
                  return sorted.map((v: any) => {
                    const qtyInCart = cart.find((c:any) => c.variant_id === v.id)?.qty || 0;
                    return (
                      <button 
                        key={v.id}
                        onClick={(e) => { e.stopPropagation(); onAddToCart(p, v); }}
                        disabled={qtyInCart >= v.stock}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-md border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors z-30 relative"
                        title={`Estoque: ${v.stock}`}
                      >
                        {v.size}
                        {qtyInCart > 0 && <span className="ml-1.5 bg-primary text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">{qtyInCart}</span>}
                      </button>
                    )
                  });
                })()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BazarCard({ item, store, cart, handleAddToCart }: { item: any; store: any; cart: any[]; handleAddToCart: any }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow group flex flex-col" style={{ backgroundColor: store.card_bg_color || '#ffffff', borderColor: 'rgba(0,0,0,0.05)' }}>
      <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden flex items-center justify-center">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <ShoppingBag className="h-10 w-10 text-gray-300" />
        )}
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Peça Única
          </div>
        </div>
        {item.condition && (
          <div className="absolute top-2 right-2 z-20 bg-white/80 backdrop-blur text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-slate-600">
            {item.condition === 'new' ? 'Nova' : item.condition === 'like_new' ? 'Seminova' : item.condition === 'used' ? 'Usada' : 'Com Desgaste'}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 leading-tight mb-1 line-clamp-2 md:text-lg font-store-title">{item.title}</h3>
        {item.size && <p className="text-xs text-gray-500 mb-2">Tam: {item.size} {item.color ? `· ${item.color}` : ''}</p>}
        <div className="mt-auto">
          <p className="text-lg font-bold text-gray-900 mb-3">R$ {Number(item.final_price).toFixed(2)}</p>
          <button
            onClick={() => {
              const bazarProduct = { ...item, name: item.title, sale_price: Number(item.final_price), _is_bazar: true };
              const bazarVariant = { id: `bazar_${item.id}`, size: item.size || 'Único', color: item.color || '', stock: 1 };
              handleAddToCart(bazarProduct, bazarVariant);
            }}
            disabled={cart.some((c: any) => c.variant_id === `bazar_${item.id}`)}
            className="w-full text-xs font-bold px-4 py-2.5 rounded-lg border flex items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cart.some((c: any) => c.variant_id === `bazar_${item.id}`) ? '✓ No Carrinho' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicCatalog() {
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{ variant_id: string, product: any, variant: any, qty: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showBazar, setShowBazar] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega as configurações da loja baseadas no slug (URL)
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.from('store_settings').select('*').eq('slug', slug).single();
      if (error) throw error;
      return data;
    }
  });

  // Carrega produtos daquela loja específica (onde marketing_status = 'active')
  const { data: localProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products', store?.owner_id],
    enabled: !!store?.owner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id,
          categories(id, name),
          subcategories(id, name),
          product_variants (id, size, color, stock)
        `)
        .eq('owner_id', store.owner_id)
        .eq('marketing_status', 'active');
        
      if (error) throw error;
      return data;
    }
  });

  // Carrega produtos importados do Hub para esta loja
  const { data: hubImportedProducts = [] } = useQuery({
    queryKey: ['public-hub-imports', store?.owner_id],
    enabled: !!store?.owner_id,
    queryFn: async () => {
      // Busca importacoes ativas deste lojista
      const { data: imports, error: impErr } = await supabase
        .from('hub_imports')
        .select('hub_product_id, retail_price')
        .eq('tenant_id', store.owner_id)
        .eq('is_active', true);
      
      if (impErr || !imports || imports.length === 0) return [];

      const hubProductIds = imports.map(i => i.hub_product_id);
      
      // Busca os produtos do hub com variantes
      const { data: hubProducts, error: hpErr } = await supabase
        .from('hub_products')
        .select('*, hub_product_variants (*)')
        .in('id', hubProductIds)
        .eq('status', 'active');
      
      if (hpErr || !hubProducts) return [];

      // Normaliza os produtos do hub para o mesmo formato dos produtos locais
      return hubProducts.map((hp: any) => {
        const imp = imports.find(i => i.hub_product_id === hp.id);
        return {
          id: hp.id,
          _hub_product_id: hp.id,
          _is_hub: true,
          _supplier_id: hp.supplier_id,
          name: hp.name,
          description: hp.description,
          sale_price: imp?.retail_price || hp.suggested_retail_price || hp.wholesale_price,
          image_url: hp.image_url,
          image_url_2: hp.image_url_2,
          image_url_3: hp.image_url_3,
          video_url: hp.video_url,
          category_id: null,
          subcategory_id: null,
          categories: hp.category ? { id: 'hub', name: hp.category } : null,
          subcategories: null,
          product_variants: (hp.hub_product_variants || []).map((v: any) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock: v.stock
          }))
        };
      });
    }
  });

  // Carrega produtos vindos de parcerias P2P ativas
  const { data: partnershipProducts = [] } = useQuery({
    queryKey: ['public-partnership-products', store?.owner_id],
    enabled: !!store?.owner_id,
    queryFn: async () => {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_p2p_shared_products', { p_tenant_id: store.owner_id });
      
      if (rpcError || !rpcData) return [];

      return rpcData.map((p: any) => ({
        ...p,
        categories: p.category_name ? { id: p.category_id, name: p.category_name } : null,
        subcategories: p.subcategory_name ? { id: p.subcategory_id, name: p.subcategory_name } : null,
        product_variants: p.variants || [],
        _is_p2p: true
      }));
    }
  });

  // Carrega itens do Bazar VIP
  const { data: bazarItems = [] } = useQuery({
    queryKey: ['public-bazar-items', store?.owner_id],
    enabled: !!store?.owner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bazar_items')
        .select('*')
        .eq('owner_id', store.owner_id)
        .eq('status', 'approved');
      if (error) return [];
      return data || [];
    }
  });

  // Mescla produtos locais + hub importados + parcerias
  const products = [...localProducts, ...hubImportedProducts, ...partnershipProducts];

  useEffect(() => {
    if (store?.page_title) {
      document.title = store.page_title;
    }
    if (store?.favicon_url) {
      let link: any = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = store.favicon_url;
    }
  }, [store]);


  const { availableCategories, availableSizes, availableColors } = useMemo(() => {
    const map = new Map<string, { id: string, name: string, subcategories: {id: string, name: string}[] }>();
    const sizes = new Set<string>();
    const colors = new Set<string>();
    
    products.forEach((p: any) => {
       const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
       const sub = Array.isArray(p.subcategories) ? p.subcategories[0] : p.subcategories;
       
       if (cat && cat.id) {
          if (!map.has(cat.id)) {
             map.set(cat.id, { id: cat.id, name: cat.name, subcategories: [] });
          }
          if (sub && sub.id) {
             const mCat = map.get(cat.id)!;
             if (!mCat.subcategories.find(s => s.id === sub.id)) {
                 mCat.subcategories.push({ id: sub.id, name: sub.name });
             }
          }
       }
       
       p.product_variants?.forEach((v: any) => {
           if (v.stock > 0) {
              if (v.size) sizes.add(v.size);
              if (v.color) colors.add(v.color);
           }
       });
    });
    // Ordem fixa das categorias (badges)
    const categoryOrder = [
      'Lançamentos', 'Feminino', 'Masculino', 'Acessórios',
      'Infantil', 'Moda Praia', 'Óculos', 'Bazar VIP'
    ];
    const sortedCategories = Array.from(map.values()).sort((a, b) => {
      const idxA = categoryOrder.findIndex(c => c.toLowerCase() === a.name.toLowerCase());
      const idxB = categoryOrder.findIndex(c => c.toLowerCase() === b.name.toLowerCase());
      // Categorias na lista fixa vêm primeiro na ordem definida; o resto vai ao final em ordem alfabética
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      availableCategories: sortedCategories,
      availableSizes: Array.from(sizes).sort(),
      availableColors: Array.from(colors).sort()
    };
  }, [products]);

  const filteredProducts = products.filter((p: any) => {
    // Esconder produtos totalmente esgotados
    const inStockVariants = p.product_variants?.filter((v: any) => (v.stock || 0) > 0) || [];
    if (inStockVariants.length === 0) return false;

    const pCatId = Array.isArray(p.categories) ? p.categories[0]?.id : p.categories?.id;
    const pSubId = Array.isArray(p.subcategories) ? p.subcategories[0]?.id : p.subcategories?.id;
    
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory ? (pCatId === selectedCategory) : true;
    const matchSub = (selectedCategory && selectedSubcategory) ? (pSubId === selectedSubcategory) : true;
    const matchSize = selectedSize ? p.product_variants?.some((v: any) => v.stock > 0 && v.size === selectedSize) : true;
    const matchColor = selectedColor ? p.product_variants?.some((v: any) => v.stock > 0 && v.color === selectedColor) : true;
    return matchSearch && matchCat && matchSub && matchSize && matchColor;
  }).sort((a: any, b: any) => {
     const featuredIds = store?.featured_product_ids || [];
     const indexA = featuredIds.indexOf(a.id);
     const indexB = featuredIds.indexOf(b.id);
     
     if (indexA !== -1 && indexB !== -1) return indexA - indexB;
     if (indexA !== -1) return -1;
     if (indexB !== -1) return 1;
     
     return a.name.localeCompare(b.name);
  });
  
  const totalCart = cart.reduce((acc, item) => acc + (item.product.sale_price * item.qty), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleAddToCart = (product: any, variant: any) => {
    if (variant.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.variant_id === variant.id);
      if (existing) {
        if (existing.qty >= variant.stock) return prev;
        return prev.map(c => c.variant_id === variant.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { variant_id: variant.id, product, variant, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (variant_id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.variant_id === variant_id);
      if (existing && existing.qty > 1) {
        return prev.map(c => c.variant_id === variant_id ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.variant_id !== variant_id);
    });
  };

  const finishPurchaseWhatsApp = async () => {
    if (!store.whatsapp) return toast.error('O lojista não configurou um WhatsApp para receber pedidos.');
    if (!customerName || !customerWhatsapp) return toast.error('Preencha seu nome e WhatsApp para continuarmos.');

    setIsSubmitting(true);
    try {
      const { data: orderCode, error } = await supabase.rpc('register_public_order', {
         p_store_id: store.owner_id,
         p_name: customerName,
         p_whatsapp: customerWhatsapp,
         p_total_amount: totalCart,
         p_items: cart
      });

      if (error) {
         console.error(error);
         throw new Error("Erro ao gerar pedido.");
      }

      let text = `*NOVO PEDIDO: ${orderCode}*\n(Via Catálogo Online)\n\nOlá, ${store.store_name}!\nGostaria de concluir a compra dos itens abaixo:\n\n`;
      cart.forEach((item, index) => {
        text += `${index + 1}. ${item.product.name} (Tamanho: ${item.variant.size || 'Un'}, Cor: ${item.variant.color || '-'}) - Qtd: ${item.qty} un - R$ ${(item.product.sale_price * item.qty).toFixed(2)}\n`;
      });
      text += `\n*Total estimado:* R$ ${totalCart.toFixed(2)}\n\nMeu nome é *${customerName}*. Aguardo confirmação e link de pagamento!`;

      const encodedText = encodeURIComponent(text);
      const wppLink = `https://wa.me/${store.whatsapp}?text=${encodedText}`;
      window.open(wppLink, '_blank');

      setCart([]);
      setCheckoutModalOpen(false);
      setCustomerName('');
      setCustomerWhatsapp('');
      toast.success("Pedido gerado com sucesso! Redirecionando para o WhatsApp...");
    } catch (err) {
      toast.error('Ocorreu um erro ao processar o pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (storeLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500"><AlertCircle className="mb-4 h-12 w-12 text-gray-400" /><h1 className="text-xl font-bold">Loja não encontrada</h1><p>Verifique se o link está correto.</p></div>;

  return (
    <div className="min-h-screen pb-32 font-store-body text-store-body transition-colors" style={{ 
      backgroundColor: store.bg_color || '#f9fafb',
      fontFamily: store.body_font ? `"${store.body_font}", sans-serif` : 'Inter, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@400;600;700;900&family=Poppins:wght@400;600;700;900&family=Oswald:wght@400;600;700;900&family=Roboto:wght@400;500;700;900&family=Lato:wght@400;700;900&family=Open+Sans:wght@400;600;700;900&display=swap');
        
        ${store.primary_color ? `
        .text-primary { color: ${store.primary_color} !important; }
        .bg-primary { background-color: ${store.primary_color} !important; color: #fff !important; }
        .border-primary { border-color: ${store.primary_color} !important; }
        .focus\\:ring-primary:focus { --tw-ring-color: ${store.primary_color} !important; }
        .focus\\:border-primary:focus { border-color: ${store.primary_color} !important; }
        .bg-primary\\/10 { background-color: ${store.primary_color}20 !important; color: ${store.primary_color} !important; }
        ` : ''}

        .font-store-title {
           font-family: "${store.title_font || 'Inter'}", sans-serif !important;
        }
      `}} />

      {store.announcement_text && (
        <div className="w-full bg-primary text-primary-foreground text-center py-2 px-4 text-xs sm:text-sm font-semibold tracking-wide font-store-title z-50 relative">
          {store.announcement_text}
        </div>
      )}

    
      {/* Banners */}
      <div className="max-w-5xl mx-auto">
         {store.banner_desktop_url && (
            <div className="hidden sm:block w-full h-auto mt-4 px-4">
              <img src={store.banner_desktop_url} alt="Banner Promocional" className="w-full object-cover rounded-xl shadow-sm" />
            </div>
         )}
         {store.banner_mobile_url && (
            <div className="block sm:hidden w-full h-auto mt-4 px-4">
              <img src={store.banner_mobile_url} alt="Banner Promocional" className="w-full object-cover rounded-xl shadow-sm" />
            </div>
         )}
      </div>

      {/* Busca e Filtros Avançados */}
      <div className="max-w-5xl mx-auto px-4 py-8 relative">
        <div className="mb-8 max-w-3xl mx-auto flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              className="w-full bg-white border border-gray-200 outline-none h-12 rounded-full pl-11 pr-4 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="O que você está procurando?"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(availableSizes.length > 0 || availableColors.length > 0) && (
             <div className="flex gap-3">
                {availableSizes.length > 0 && (
                   <select 
                     className="bg-white border border-gray-200 h-12 rounded-full px-4 text-sm font-semibold text-gray-600 shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-[110px] cursor-pointer"
                     value={selectedSize}
                     onChange={e => setSelectedSize(e.target.value)}
                   >
                     <option value="">Tamanho</option>
                     {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                )}
                {availableColors.length > 0 && (
                   <select 
                     className="bg-white border border-gray-200 h-12 rounded-full px-4 text-sm font-semibold text-gray-600 shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-[110px] cursor-pointer"
                     value={selectedColor}
                     onChange={e => setSelectedColor(e.target.value)}
                   >
                     <option value="">Cor</option>
                     {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                )}
             </div>
          )}
        </div>

        {(availableCategories.length > 0 || bazarItems.length > 0) && (
           <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
             <div className="flex gap-2 min-w-max">
               {availableCategories.filter(c => c.name.toLowerCase() !== 'bazar vip').map(c => (
                 <button 
                   key={c.id} 
                   onClick={() => { 
                     if (selectedCategory === c.id) { setSelectedCategory(null); setSelectedSubcategory(null); } 
                     else { setSelectedCategory(c.id); setSelectedSubcategory(null); setShowBazar(false); }
                   }}
                   className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${selectedCategory === c.id ? 'bg-primary text-primary-foreground shadow-md transform scale-105' : 'bg-white border hover:bg-gray-50 text-gray-700'}`}
                 >
                   {c.name}
                 </button>
               ))}
               {bazarItems.length > 0 && (
                 <button
                   onClick={() => { 
                     if (showBazar) { setShowBazar(false); }
                     else { setShowBazar(true); setSelectedCategory(null); setSelectedSubcategory(null); }
                   }}
                   className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${showBazar ? 'bg-purple-600 text-white shadow-md transform scale-105' : 'bg-white border hover:bg-purple-50 text-purple-700 border-purple-200'}`}
                 >
                   <Sparkles className="h-4 w-4" /> Bazar VIP
                 </button>
               )}
             </div>
             
             {(() => {
                const activeCat = availableCategories.find(c => c.id === selectedCategory);
                if (activeCat && activeCat.subcategories.length > 0) {
                   return (
                     <div className="flex gap-2 min-w-max pl-4 mt-4 animate-in slide-in-from-left-4 fade-in duration-300">
                       <button 
                         onClick={() => setSelectedSubcategory(null)}
                         className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!selectedSubcategory ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'}`}
                       >
                         Ver Tudo em {activeCat.name}
                       </button>
                       {activeCat.subcategories.map(s => (
                         <button 
                           key={s.id} 
                           onClick={() => setSelectedSubcategory(s.id)}
                           className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedSubcategory === s.id ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'}`}
                         >
                           {s.name}
                         </button>
                       ))}
                     </div>
                   )
                }
                return null;
             })()}
           </div>
        )}

        {showBazar ? (
          /* Bazar VIP Grid (aba exclusiva) */
          bazarItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400">Nenhuma peça no Bazar VIP ainda.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bazarItems.map((item: any) => (
                <BazarCard key={item.id} item={item} store={store} cart={cart} handleAddToCart={handleAddToCart} />
              ))}
            </div>
          )
        ) : productsLoading ? (
          <div className="text-center py-20 text-gray-400">Desempacotando prateleiras...</div>
        ) : filteredProducts.length === 0 && bazarItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Nenhum produto encontrado.</div>
        ) : (
          <div className={store.product_layout === 'list' ? "flex flex-col gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"}>
            {filteredProducts.map(p => (
              <ProductCard 
                key={p.id} 
                p={p} 
                isList={store.product_layout === 'list'} 
                store={store} 
                cart={cart} 
                onAddToCart={handleAddToCart}
                onSelectProduct={setSelectedProduct}
              />
            ))}
            {/* Itens do Bazar VIP misturados em "Todos Produtos" */}
            {!selectedCategory && bazarItems.map((item: any) => (
              <BazarCard key={`bazar-${item.id}`} item={item} store={store} cart={cart} handleAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Público da Loja */}
      <footer className="mt-12 py-12 border-t text-center px-4" style={{ backgroundColor: store.card_bg_color || '#ffffff' }}>
         <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
            {(store.instagram_url || store.tiktok_url) && (
              <div className="flex items-center justify-center gap-6">
                {store.instagram_url && (
                  <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-primary/10 transition-colors text-gray-700 hover:text-primary">
                    <Camera className="h-5 w-5" />
                  </a>
                )}
                {store.tiktok_url && (
                  <a href={store.tiktok_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-primary/10 transition-colors text-gray-700 hover:text-primary">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  </a>
                )}
              </div>
            )}
            {store.footer_text && (
              <p className="text-xs font-medium text-gray-500 opacity-80">{store.footer_text}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-4">Tecnologia fornecida por Catálogo Revenda Profit</p>
         </div>
      </footer>

      {/* Carrinho Flutuante Inferior */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="max-w-5xl mx-auto w-full pointer-events-auto">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between animate-in slide-in-from-bottom-10 fade-in border border-gray-700">
              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ShoppingBag className="h-8 w-8 text-white/80" />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">{totalItems}</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">Total do seu Carrinho</p>
                    <p className="text-lg sm:text-xl font-bold">R$ {totalCart.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => setCheckoutModalOpen(true)} className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white border-none shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <Send className="mr-2 h-5 w-5" /> Fazer Pedido
              </Button>
            </div>
            
            {/* Lista dos Itens do Carrinho (Pequena) */}
            <div className="bg-white/95 backdrop-blur-md mt-2 rounded-2xl shadow-lg border border-gray-200 p-4 max-h-48 overflow-y-auto w-full pointer-events-auto">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Seus Itens</p>
              {cart.map(item => (
                <div key={item.variant_id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                  <div className="flex-1 truncate pr-4 text-gray-800">
                    <span className="font-semibold">{item.product.name}</span> <span className="text-gray-500">({item.variant.size} {item.variant.color})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">R$ {(item.product.sale_price * item.qty).toFixed(2)}</span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-black" onClick={() => handleRemoveFromCart(item.variant_id)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center font-bold text-xs text-gray-700">{item.qty}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-black" onClick={() => handleAddToCart(item.product, item.variant)} disabled={item.qty >= item.variant.stock}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Produto */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-white rounded-2xl border-0 h-[85vh] md:h-auto max-h-[90vh] custom-scrollbar z-50">
          <div className="flex flex-col md:flex-row max-h-[90vh]">
            <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center relative shadow-[inset_-10px_0_20px_rgba(0,0,0,0.03)] border-b md:border-b-0 md:border-r border-gray-100">
              <div className="absolute top-4 left-4 z-10 bg-white/50 backdrop-blur rounded-full px-3 py-1 shadow-sm border text-xs font-bold text-gray-800 uppercase tracking-widest hidden md:block">
                 {(selectedProduct?.categories as any)?.name || (Array.isArray(selectedProduct?.categories) && (selectedProduct?.categories as any)[0]?.name) || 'Geral'}
              </div>
                {/* Carrossel de Mídia no Modal */}
                {(() => {
                  const mediaList = [selectedProduct?.image_url, selectedProduct?.image_url_2, selectedProduct?.image_url_3, selectedProduct?.video_url].filter(Boolean);
                  
                  return (
                    <div className="w-full relative h-[300px] md:h-[600px] bg-gray-50 overflow-hidden flex items-center justify-center">
                      {mediaList.length > 0 ? (
                        <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full scrollbar-none">
                          {mediaList.map((media, index) => {
                            const isVideo = typeof media === 'string' && (media.includes('.mp4') || media.includes('.webm') || media.includes('.mov'));
                            return (
                              <div key={index} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-gray-50">
                                {isVideo ? (
                                  <video src={media} className="object-cover w-full h-full" autoPlay muted loop controls playsInline />
                                ) : (
                                  <img src={media} alt={`${selectedProduct?.name} ${index + 1}`} className="object-cover w-full h-full" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <ShoppingBag className="h-20 w-20 text-gray-300 my-20" />
                      )}
                      
                      {mediaList.length > 1 && (
                         <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointers-events-none">
                           <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                             Arraste para o lado
                           </div>
                         </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-2xl md:text-3xl font-bold font-store-title text-gray-900 leading-tight">
                  {selectedProduct?.name}
                </DialogTitle>
                <div className="text-xs text-primary font-bold opacity-80 uppercase tracking-wider block md:hidden mt-2">
                 {(selectedProduct?.categories as any)?.name || (Array.isArray(selectedProduct?.categories) && (selectedProduct?.categories as any)[0]?.name) || 'Geral'}
                </div>
              </DialogHeader>
              
              <div className="mt-4 flex-1 flex flex-col">
                <p className="text-3xl font-bold text-gray-900 mb-6">R$ {selectedProduct?.sale_price?.toFixed(2)}</p>
                
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Sobre o Produto</h4>
                {selectedProduct?.description ? (
                  <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
                    {selectedProduct.description}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-8">Nenhuma descrição detalhada disponível.</p>
                )}
                {/* Variantes no Modal */}
                {(() => {
                  const modalInStock = selectedProduct?.product_variants?.filter((v: any) => v.stock > 0) || [];
                  if (modalInStock.length === 0) return (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 flex items-center justify-center">Esgotado no momento</div>
                  );
                  return (
                    <div className="mb-8 mt-auto p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-3">Opções de Compra</label>
                      <div className="flex flex-wrap gap-2">
                        {modalInStock.map((v: any) => {
                          const qtyInCart = cart.find(c => c.variant_id === v.id)?.qty || 0;
                          return (
                            <button 
                              key={v.id}
                              onClick={() => handleAddToCart(selectedProduct, v)}
                              disabled={qtyInCart >= v.stock}
                              className="text-sm font-medium px-4 py-2 rounded-lg border bg-white flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                              {v.size} {v.color && `- ${v.color}`}
                              {qtyInCart > 0 && <span className="ml-2 bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full flex items-center justify-center">{qtyInCart}</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="mt-auto pt-6 border-t mt-8">
                <Button className="w-full h-12 bg-gray-900 hover:bg-black text-white font-bold" onClick={() => setSelectedProduct(null)}>
                  Voltar ao Catálogo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Checkout Identificação */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold font-store-title text-gray-900 border-b pb-4 mb-2">Já estamos quase lá!</DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 pt-2">
             <p className="text-sm text-gray-600 mb-4">Para enviarmos a reserva do seu pedido à <span className="font-bold text-primary">{store.store_name}</span>, precisamos de alguns dados rápidos:</p>
             
             <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Como podemos te chamar?</label>
                <Input 
                  placeholder="Seu nome ou apelido" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
             </div>
             
             <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Seu WhatsApp</label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={customerWhatsapp}
                  onChange={e => setCustomerWhatsapp(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
             </div>
             
             <Button 
                onClick={finishPurchaseWhatsApp} 
                disabled={isSubmitting || !customerName || !customerWhatsapp} 
                className="w-full h-14 mt-4 text-base font-bold text-white shadow-xl hover:scale-[1.02] transition-all"
             >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                    Gerando Reserva...
                  </span>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Confirmar e Enviar Pedido
                  </>
                )}
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
