import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Search, Plus, Minus, Send, AlertCircle, Camera, Link as LinkIcon, X, Star, Sparkles, Flame, Lock, Clock, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { consolidateProducts } from '@/utils/productConsolidator';
import { notifyBotConversa } from '@/utils/notifyBotConversa';

function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  const current = images[index];
  const isVideo = typeof current === 'string' && (current.includes('.mp4') || current.includes('.webm') || current.includes('.mov'));

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {isVideo ? (
          <video src={current} className="max-w-full max-h-full object-contain" autoPlay controls playsInline />
        ) : (
          <img src={current} alt="" className="max-w-full max-h-full object-contain select-none" draggable={false} />
        )}
      </div>
    </div>
  );
}

function ProductCard({ p, isList, store, cart, onAddToCart, onSelectProduct, inConsignmentVariantIds, onWaitlist }: any) {
  const rawInStockVariants = p.product_variants?.filter((v: any) => v.stock > 0) || [];
  const inStockVariants = Object.values(rawInStockVariants.reduce((acc: Record<string, any>, v: any) => {
    const key = `${v.size || ''}_${v.color || ''}`.trim();
    if (!acc[key]) {
      acc[key] = v;
    } else if (acc[key]._is_p2p && !v._is_p2p) {
      acc[key] = v;
    }
    return acc;
  }, {})) as any[];
  const mediaList = [p.image_url, p.image_url_2, p.image_url_3, p.video_url].filter(Boolean);
  const hasAnyDeal = inStockVariants.some((v: any) => v.sale_price && parseFloat(v.sale_price) > 0 && parseFloat(v.sale_price) < p.sale_price);
  // Get the lowest variant price for display
  const lowestVariantPrice = hasAnyDeal ? Math.min(...inStockVariants.filter((v: any) => v.sale_price && parseFloat(v.sale_price) > 0).map((v: any) => parseFloat(v.sale_price))) : null;

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isFeatured = store?.featured_product_ids?.includes(p.id);
  const imageOnlyMedia = mediaList.filter((m: string) => !m.includes('.mp4') && !m.includes('.webm') && !m.includes('.mov'));

  const activeMedia = mediaList[currentMediaIndex] || p.image_url;
  const isVideo = activeMedia && typeof activeMedia === 'string' && (activeMedia.includes('.mp4') || activeMedia.includes('.webm') || activeMedia.includes('.mov'));

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mediaList.length <= 1) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Preload images 2+ once (browser caches them; no repeat CDN fetch)
          mediaList.slice(1).forEach((src: string) => {
            if (typeof src === 'string' && !src.includes('.mp4') && !src.includes('.webm') && !src.includes('.mov')) {
              const img = new Image();
              img.src = src;
            }
          });
          interval = setInterval(() => {
            setCurrentMediaIndex(prev => (prev + 1) % mediaList.length);
          }, 3000);
        } else {
          if (interval) clearInterval(interval);
          setCurrentMediaIndex(0);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [mediaList.length]);

  return (
    <div ref={cardRef} className={`rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow group flex ${isList ? 'flex-row min-h-[128px] md:min-h-[160px]' : 'flex-col'}`} style={{ backgroundColor: store.card_bg_color || '#ffffff', borderColor: 'rgba(0,0,0,0.05)' }}>
      {lightboxIndex !== null && imageOnlyMedia.length > 0 && (
        <Lightbox images={imageOnlyMedia} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <div
        onClick={() => {
          if (imageOnlyMedia.length > 0) setLightboxIndex(currentMediaIndex < imageOnlyMedia.length ? currentMediaIndex : 0);
        }}
        className={`${isList ? 'w-24 md:w-32 shrink-0' : 'aspect-[4/5]'} bg-gray-100 relative overflow-hidden flex items-center justify-center cursor-zoom-in group/img`}
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
            <img
              src={activeMedia}
              alt={p.name}
              loading="lazy"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'/%3E%3Cpath d='M3 6h18'/%3E%3Cpath d='M16 10a4 4 0 0 1-8 0'/%3E%3C/svg%3E";
                e.currentTarget.className = "object-contain w-16 h-16 opacity-40";
              }}
            />
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

        {p._is_p2p && !isList && (
           <div className="absolute top-2 left-2 z-20">
              <div className="bg-blue-600/90 backdrop-blur-sm text-white p-1.5 rounded-full shadow-sm" title="Produto de parceria">
                 <LinkIcon className="h-3 w-3" />
              </div>
           </div>
        )}

        {hasAnyDeal && !isList && (
           <div className={`absolute ${p._is_p2p ? 'top-8' : 'top-2'} left-2 z-20`}>
              <div className="bg-gradient-to-r from-red-600 to-orange-500 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider animate-pulse">
                 <Flame className="h-3 w-3" /> Oportunidade
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
        <h3
          onClick={() => onSelectProduct(p)}
          className={`font-semibold text-gray-900 leading-tight mb-2 ${isList ? 'line-clamp-1 text-sm md:text-base' : 'line-clamp-2 md:text-lg'} font-store-title cursor-pointer hover:text-primary transition-colors`}
        >{p.name}</h3>
        <div className="mt-auto">
          {hasAnyDeal && lowestVariantPrice ? (
            <div className="mb-3">
              <p className="text-xs text-gray-400 line-through">R$ {p.sale_price.toFixed(2)}</p>
              <p className="text-lg font-bold text-red-600">A partir de R$ {lowestVariantPrice.toFixed(2)}</p>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-900 mb-3">R$ {p.sale_price.toFixed(2)}</p>
          )}
          
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
                    const isInConsignment = inConsignmentVariantIds?.has(v.id);
                    const isDeal = !isInConsignment && v.sale_price && parseFloat(v.sale_price) > 0 && parseFloat(v.sale_price) < p.sale_price;
                    return (
                      <button
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInConsignment) { onWaitlist?.(p, v); }
                          else { onAddToCart(p, v); }
                        }}
                        disabled={!isInConsignment && qtyInCart >= v.stock}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-md border flex items-center justify-center transition-colors z-30 relative ${
                          isInConsignment
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : isDeal
                              ? 'border-red-300 bg-red-50 text-red-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        title={isInConsignment ? 'Em malinha — entrar na fila de espera' : (v.sale_price && parseFloat(v.sale_price) > 0 ? `R$ ${parseFloat(v.sale_price).toFixed(2)}` : `R$ ${p.sale_price.toFixed(2)}`)}
                      >
                        {isInConsignment && <Clock className="h-3 w-3 mr-1 text-yellow-500" />}
                        {!isInConsignment && v._is_p2p && <LinkIcon className="h-3 w-3 mr-1 text-blue-500" />}
                        {isDeal && <Flame className="h-3 w-3 mr-0.5 text-red-500" />}
                        {v.size}
                        {isDeal && (
                          <span className="ml-1 text-[9px] font-bold text-red-600">R${parseFloat(v.sale_price).toFixed(0)}</span>
                        )}
                        {!isInConsignment && qtyInCart > 0 && <span className="ml-1.5 bg-primary text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">{qtyInCart}</span>}
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
          <img
            src={item.images[0]}
            alt={item.title}
            loading="lazy"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'/%3E%3Cpath d='M3 6h18'/%3E%3Cpath d='M16 10a4 4 0 0 1-8 0'/%3E%3C/svg%3E";
              e.currentTarget.className = "object-contain w-10 h-10 group-hover:scale-105 transition-transform duration-500";
            }}
          />
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
  const [showDeals, setShowDeals] = useState(false);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Waitlist (Fila de Espera)
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistProduct, setWaitlistProduct] = useState<any>(null);
  const [waitlistVariant, setWaitlistVariant] = useState<any>(null);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // VIP Deals password
  const [dealsUnlocked, setDealsUnlocked] = useState(false);
  const [dealsPasswordInput, setDealsPasswordInput] = useState('');
  const [dealsPasswordModalOpen, setDealsPasswordModalOpen] = useState(false);
  const [dealsPasswordError, setDealsPasswordError] = useState(false);

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

  // Check if deals were previously unlocked in this session
  useEffect(() => {
    if (!store) return; // Wait until store is loaded

    if (store.deals_password) {
      const savedPass = localStorage.getItem(`rp_deals_${slug}`);
      if (savedPass === store.deals_password) {
        setDealsUnlocked(true);
      } else {
        setDealsUnlocked(false);
      }
    } else {
      // No password set = always unlocked
      setDealsUnlocked(true);
    }
  }, [store, slug]);

  const handleDealsClick = () => {
    if (showDeals) {
      // Toggle off
      setShowDeals(false);
      return;
    }
    // If no password or already unlocked -> show deals
    if (!store?.deals_password || dealsUnlocked) {
      setShowDeals(true); setShowBazar(false); setSelectedCategory(null); setSelectedSubcategory(null);
    } else {
      // Show password modal
      setDealsPasswordInput('');
      setDealsPasswordError(false);
      setDealsPasswordModalOpen(true);
    }
  };

  const handleDealsPasswordSubmit = () => {
    if (dealsPasswordInput.trim() === store?.deals_password) {
      setDealsUnlocked(true);
      setShowDeals(true);
      setShowBazar(false);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setDealsPasswordModalOpen(false);
      localStorage.setItem(`rp_deals_${slug}`, dealsPasswordInput.trim());
    } else {
      setDealsPasswordError(true);
    }
  };

  // Track Page Views & Inject Pixels
  useEffect(() => {
    if (!store?.owner_id) return;

    // 1. Session internal tracking
    let sessionId = localStorage.getItem('rp_visitor_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('rp_visitor_session', sessionId);
    }
    supabase.from('catalog_events').insert({
      owner_id: store.owner_id,
      event_type: 'page_view',
      session_id: sessionId
    }).then();

    // 2. Inject Meta Pixel
    if (store.meta_pixel_id) {
       let f = window as any;
       if (!f.fbq) {
          f.fbq = function() {
            f.fbq.callMethod ? f.fbq.callMethod.apply(f.fbq, arguments) : f.fbq.queue.push(arguments)
          };
          if(!f._fbq) f._fbq=f.fbq;
          f.fbq.push=f.fbq; f.fbq.loaded=!0; f.fbq.version='2.0';
          f.fbq.queue=[];
          const script = document.createElement('script');
          script.async = true; script.src='https://connect.facebook.net/en_US/fbevents.js';
          document.head.appendChild(script);
       }
       f.fbq('init', store.meta_pixel_id);
       f.fbq('track', 'PageView');
    }

    // 3. Inject GA4
    if (store.ga4_measurement_id) {
       const w = window as any;
       w.dataLayer = w.dataLayer || [];
       function gtag(){w.dataLayer.push(arguments);}
       w.gtag = gtag;
       if (!document.getElementById('ga4-script')) {
          const gaScript = document.createElement('script');
          gaScript.id = 'ga4-script';
          gaScript.async = true;
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${store.ga4_measurement_id}`;
          document.head.appendChild(gaScript);
          w.gtag('js', new Date());
       }
       w.gtag('config', store.ga4_measurement_id);
    }
  }, [store?.owner_id, store?.meta_pixel_id, store?.ga4_measurement_id]);

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
          product_variants (id, size, color, stock, sale_price)
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

  // Variantes atualmente em malinhas ativas (para badge amarelo)
  const { data: consignmentVariantData = [] } = useQuery({
    queryKey: ['public-consignment-variants', store?.owner_id],
    enabled: !!store?.owner_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc('get_variants_in_consignment', {
        p_owner_id: store!.owner_id,
      });
      return data || [];
    },
  });

  const inConsignmentVariantIds = useMemo(
    () => new Set<string>(consignmentVariantData.map((r: any) => r.variant_id)),
    [consignmentVariantData],
  );

  // Mescla produtos locais + hub importados + parcerias
  const products = useMemo(() => {
    return consolidateProducts([...localProducts, ...hubImportedProducts, ...partnershipProducts]);
  }, [localProducts, hubImportedProducts, partnershipProducts]);

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
       
       if (cat && cat.name) {
          const normCatName = cat.name.trim().toLowerCase();
          if (!map.has(normCatName)) {
             map.set(normCatName, { id: normCatName, name: cat.name.trim(), subcategories: [] });
          }
          if (sub && sub.name) {
             const mCat = map.get(normCatName)!;
             const normSubName = sub.name.trim().toLowerCase();
             if (!mCat.subcategories.find(s => s.id === normSubName)) {
                 mCat.subcategories.push({ id: normSubName, name: sub.name.trim() });
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

  // Se a loja não tem senha, as oportunidades ficam sempre visíveis nos cards (comportamento original)
  // Se a loja TEM senha, as oportunidades só ficam visíveis quando o filtro showDeals está ativado (após destrancar)
  const dealsActive = !store?.deals_password ? true : (showDeals && dealsUnlocked);

  const displayProducts = useMemo(() => {
     if (dealsActive) return products;
     return products.map((p: any) => ({
        ...p,
        product_variants: p.product_variants?.map((v: any) => ({...v, sale_price: null})) || []
     }));
  }, [products, dealsActive]);

  const filteredProducts = displayProducts.filter((p: any) => {
    // Esconder produtos totalmente esgotados
    const inStockVariants = p.product_variants?.filter((v: any) => (v.stock || 0) > 0) || [];
    if (inStockVariants.length === 0) return false;

    const pCat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const pSub = Array.isArray(p.subcategories) ? p.subcategories[0] : p.subcategories;
    
    const pCatName = pCat?.name?.trim().toLowerCase();
    const pSubName = pSub?.name?.trim().toLowerCase();
    
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory ? (pCatName === selectedCategory) : true;
    const matchSub = (selectedCategory && selectedSubcategory) ? (pSubName === selectedSubcategory) : true;
    const matchSize = selectedSize ? p.product_variants?.some((v: any) => v.stock > 0 && v.size === selectedSize) : true;
    const matchColor = selectedColor ? p.product_variants?.some((v: any) => v.stock > 0 && v.color === selectedColor) : true;
    const matchDeals = showDeals ? inStockVariants.some((v: any) => v.sale_price && parseFloat(v.sale_price) > 0 && parseFloat(v.sale_price) < p.sale_price) : true;
    return matchSearch && matchCat && matchSub && matchSize && matchColor && matchDeals;
  }).sort((a: any, b: any) => {
     const featuredIds = store?.featured_product_ids || [];
     const indexA = featuredIds.indexOf(a.id);
     const indexB = featuredIds.indexOf(b.id);
     
     if (indexA !== -1 && indexB !== -1) return indexA - indexB;
     if (indexA !== -1) return -1;
     if (indexB !== -1) return 1;
     
     return a.name.localeCompare(b.name);
  });
  
  const totalCart = cart.reduce((acc, item) => {
    // Use variant sale_price if available and deals are active, otherwise product sale_price
    const variantPrice = dealsActive && item.variant?.sale_price && parseFloat(item.variant.sale_price) > 0 ? parseFloat(item.variant.sale_price) : item.product.sale_price;
    return acc + (variantPrice * item.qty);
  }, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleAddToCart = (product: any, variant: any) => {
    if (variant.stock <= 0) return;
    
    // Track internal Add To Cart
    const sessionId = localStorage.getItem('rp_visitor_session');
    if (store?.owner_id && sessionId) {
       supabase.from('catalog_events').insert({
          owner_id: store.owner_id,
          event_type: 'add_to_cart',
          product_id: product.id,
          session_id: sessionId
       }).then();
    }
    
    // Track Pixel Add To Cart
    if (store?.meta_pixel_id) {
       let f = window as any;
       if (f.fbq) {
          f.fbq('track', 'AddToCart', {
             value: product.sale_price,
             currency: 'BRL',
             content_ids: [product.id],
             content_name: product.name,
             content_type: 'product'
          });
       }
    }
    if (store?.ga4_measurement_id) {
       let w = window as any;
       if (w.gtag) {
          w.gtag('event', 'add_to_cart', {
            currency: 'BRL',
            value: product.sale_price,
            items: [{ item_id: product.id, item_name: product.name, price: product.sale_price }]
          });
       }
    }

    setCart(prev => {
      const existing = prev.find(c => c.variant_id === variant.id);
      if (existing) {
        if (existing.qty >= variant.stock) return prev;
        return prev.map(c => c.variant_id === variant.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { 
        variant_id: variant.id, 
        product: { ...product, id: variant._parent_id ?? product.id, _is_p2p: variant._is_p2p ?? product._is_p2p }, 
        variant, 
        qty: 1 
      }];
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

  const handleWaitlistOpen = (product: any, variant: any) => {
    setWaitlistProduct(product);
    setWaitlistVariant(variant);
    setWaitlistName('');
    setWaitlistPhone('');
    setWaitlistSubmitted(false);
    setWaitlistOpen(true);
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistName.trim() || !waitlistPhone.trim() || !store?.owner_id || !waitlistVariant) return;
    setWaitlistSubmitting(true);
    try {
      await supabase.rpc('register_waitlist_interest', {
        p_owner_id: store.owner_id,
        p_variant_id: waitlistVariant.id,
        p_customer_name: waitlistName.trim(),
        p_customer_phone: waitlistPhone.trim(),
      });
      setWaitlistSubmitted(true);
    } catch {
      toast.error('Erro ao entrar na fila. Tente novamente.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const finishPurchaseWhatsApp = async () => {
    if (!store.whatsapp) return toast.error('O lojista não configurou um WhatsApp para receber pedidos.');
    if (!customerName || !customerWhatsapp) return toast.error('Preencha seu nome e WhatsApp para continuarmos.');

    // Track internal Initiate Checkout
    const sessionId = localStorage.getItem('rp_visitor_session');
    if (store?.owner_id && sessionId) {
       supabase.from('catalog_events').insert({
          owner_id: store.owner_id,
          event_type: 'initiate_checkout',
          session_id: sessionId
       }).then();
    }
    
    // Track Pixel Initiate Checkout
    if (store?.meta_pixel_id) {
       let f = window as any;
       if (f.fbq) {
          f.fbq('track', 'InitiateCheckout', {
             value: totalCart,
             currency: 'BRL',
             num_items: totalItems
          });
       }
    }
    if (store?.ga4_measurement_id) {
       let w = window as any;
       if (w.gtag) {
          w.gtag('event', 'begin_checkout', {
            currency: 'BRL',
            value: totalCart,
            items: cart.map(c => ({ item_id: c.product.id, item_name: c.product.name, price: c.product.sale_price, quantity: c.qty }))
          });
       }
    }

    setIsSubmitting(true);
    try {
      // Enriquecer cada item com o effective_price (preço real cobrado, respeitando promoção de variante)
      const enrichedItems = cart.map(item => {
        const effectivePrice = dealsActive && item.variant?.sale_price && parseFloat(item.variant.sale_price) > 0
          ? parseFloat(item.variant.sale_price)
          : item.product.sale_price;
        return { ...item, effective_price: effectivePrice };
      });

      const { data: orderCode, error } = await supabase.rpc('register_public_order', {
         p_store_id: store.owner_id,
         p_name: customerName,
         p_whatsapp: customerWhatsapp,
         p_total_amount: totalCart,
         p_items: enrichedItems
      });

      if (error) {
         console.error(error);
         throw new Error("Erro ao gerar pedido.");
      }

      let text = `*NOVO PEDIDO: ${orderCode}*\n(Via Catálogo Online)\n\nOlá, ${store.store_name}!\nGostaria de concluir a compra dos itens abaixo:\n\n`;
      cart.forEach((item, index) => {
        const dealsActive = !store?.deals_password || dealsUnlocked;
        const unitPrice = dealsActive && item.variant?.sale_price && parseFloat(item.variant.sale_price) > 0 ? parseFloat(item.variant.sale_price) : item.product.sale_price;
        text += `${index + 1}. ${item.product.name} (Tamanho: ${item.variant.size || 'Un'}, Cor: ${item.variant.color || '-'}) - Qtd: ${item.qty} un - R$ ${(unitPrice * item.qty).toFixed(2)}\n`;
      });
      text += `\n*Total estimado:* R$ ${totalCart.toFixed(2)}\n\nMeu nome é *${customerName}*. Aguardo confirmação e link de pagamento!`;

      const encodedText = encodeURIComponent(text);
      const wppLink = `https://wa.me/${store.whatsapp}?text=${encodedText}`;
      window.open(wppLink, '_blank');

      notifyBotConversa('new_order', store.owner_id, {
        nome: customerName,
        valor: `R$ ${totalCart.toFixed(2)}`,
        codigo: String(orderCode),
      });

      setCart([]);
      setCheckoutModalOpen(false);
      setCustomerName('');
      setCustomerWhatsapp('');
      setLeadCaptured(false);
      toast.success("Pedido gerado com sucesso! Redirecionando para o WhatsApp...");
    } catch (err) {
      toast.error('Ocorreu um erro ao processar o pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (storeLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500"><AlertCircle className="mb-4 h-12 w-12 text-gray-400" /><h1 className="text-xl font-bold">Loja não encontrada</h1><p>Verifique se o link está correto.</p></div>;

  if ((store as any).is_store_active === false) {
    const wppMsg = encodeURIComponent(`Olá, ${store.store_name}! Vi que a loja está temporariamente fechada. Gostaria de mais informações.`);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center" style={{ backgroundColor: store.bg_color || '#f9fafb' }}>
        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');` }} />
        {store.logo_url && (
          <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md mb-6" />
        )}
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{store.store_name}</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Nossa loja está temporariamente offline. Entre em contato direto pelo WhatsApp!</p>
        {store.whatsapp && (
          <a
            href={`https://wa.me/${store.whatsapp}?text=${wppMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg text-base transition-all hover:scale-105"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Falar no WhatsApp
          </a>
        )}
      </div>
    );
  }

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
              <img src={store.banner_desktop_url} alt="Banner Promocional" loading="lazy" className="w-full object-cover rounded-xl shadow-sm" />
            </div>
         )}
         {store.banner_mobile_url && (
            <div className="block sm:hidden w-full h-auto mt-4 px-4">
              <img src={store.banner_mobile_url} alt="Banner Promocional" loading="lazy" className="w-full object-cover rounded-xl shadow-sm" />
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
                     else { setShowBazar(true); setSelectedCategory(null); setSelectedSubcategory(null); setShowDeals(false); }
                   }}
                   className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${showBazar ? 'bg-purple-600 text-white shadow-md transform scale-105' : 'bg-white border hover:bg-purple-50 text-purple-700 border-purple-200'}`}
                 >
                   <Sparkles className="h-4 w-4" /> Bazar VIP
                 </button>
               )}
               <button
                 onClick={handleDealsClick}
                 className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${showDeals ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md transform scale-105' : 'bg-white border hover:bg-red-50 text-red-600 border-red-200'}`}
               >
                 <Flame className="h-4 w-4" /> 
                 Oportunidades
                 {store?.deals_password && !dealsUnlocked && <Lock className="h-3 w-3 ml-1 opacity-70" />}
               </button>
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
                inConsignmentVariantIds={inConsignmentVariantIds}
                onWaitlist={handleWaitlistOpen}
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
                     {(() => {
                       const effPrice = dealsActive && item.variant?.sale_price && parseFloat(item.variant.sale_price) > 0
                         ? parseFloat(item.variant.sale_price)
                         : item.product.sale_price;
                       const isPromo = effPrice < item.product.sale_price;
                       return (
                         <span className="font-bold text-gray-900 text-right">
                           {isPromo && <span className="text-[10px] text-gray-400 line-through block">{(item.product.sale_price * item.qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                           <span className={isPromo ? 'text-red-600' : ''}>{(effPrice * item.qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                         </span>
                       );
                     })()}
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
                                  <img src={media} alt={`${selectedProduct?.name} ${index + 1}`} loading="lazy" className="object-cover w-full h-full" />
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
                  const rawModalInStock = selectedProduct?.product_variants?.filter((v: any) => v.stock > 0) || [];
                  const modalInStock = Object.values(rawModalInStock.reduce((acc: Record<string, any>, v: any) => {
                    const key = `${v.size || ''}_${v.color || ''}`.trim();
                    if (!acc[key]) {
                      acc[key] = v;
                    } else if (acc[key]._is_p2p && !v._is_p2p) {
                      acc[key] = v;
                    }
                    return acc;
                  }, {})) as any[];
                  if (modalInStock.length === 0) return (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 flex items-center justify-center">Esgotado no momento</div>
                  );
                  return (
                    <div className="mb-8 mt-auto p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-3">Opções de Compra</label>
                      <div className="flex flex-wrap gap-2">
                        {modalInStock.map((v: any) => {
                          const qtyInCart = cart.find(c => c.variant_id === v.id)?.qty || 0;
                          const isInConsignment = inConsignmentVariantIds.has(v.id);
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                if (isInConsignment) {
                                  setSelectedProduct(null);
                                  handleWaitlistOpen(selectedProduct, v);
                                } else {
                                  handleAddToCart(selectedProduct, v);
                                }
                              }}
                              disabled={!isInConsignment && qtyInCart >= v.stock}
                              className={`text-sm font-medium px-4 py-2 rounded-lg border flex items-center justify-center transition-all shadow-sm ${
                                isInConsignment
                                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                  : 'bg-white hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary focus:ring-1 focus:ring-primary'
                              }`}
                              title={isInConsignment ? 'Em malinha — entrar na fila de espera' : undefined}
                            >
                              {isInConsignment && <Clock className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />}
                              {v.size} {v.color && `- ${v.color}`}
                              {isInConsignment && <span className="ml-1.5 text-[10px] font-bold">Fila</span>}
                              {!isInConsignment && qtyInCart > 0 && <span className="ml-2 bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full flex items-center justify-center">{qtyInCart}</span>}
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
                  onBlur={async () => {
                    if (!leadCaptured && customerName.trim() && customerWhatsapp.trim() && store?.owner_id) {
                      setLeadCaptured(true);
                      await supabase.rpc('register_catalog_lead', {
                        p_store_id: store.owner_id,
                        p_name: customerName.trim(),
                        p_phone: customerWhatsapp.trim(),
                      });
                      notifyBotConversa('customer_signup', store.owner_id, {
                        nome: customerName.trim(),
                        telefone: customerWhatsapp.trim(),
                      });
                    }
                  }}
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

      {/* Modal Fila de Espera */}
      <Dialog open={waitlistOpen} onOpenChange={(o) => { setWaitlistOpen(o); if (!o) setWaitlistSubmitted(false); }}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-store-title text-gray-900 border-b pb-4 mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" /> Fila de Espera
            </DialogTitle>
          </DialogHeader>

          {waitlistSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Bell className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Você está na fila!</p>
              <p className="text-sm text-gray-500">Assim que a peça retornar ao estoque, você receberá uma mensagem no WhatsApp.</p>
              <Button className="w-full mt-2" onClick={() => setWaitlistOpen(false)}>Fechar</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                {waitlistProduct?.image_url && (
                  <img src={waitlistProduct.image_url} className="w-12 h-14 object-cover rounded-lg shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{waitlistProduct?.name}</p>
                  <p className="text-xs text-yellow-700 font-medium mt-0.5">
                    Tamanho: {waitlistVariant?.size}{waitlistVariant?.color ? ` · ${waitlistVariant.color}` : ''}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">⏳ Esta peça está em uma malinha de outra cliente</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">Deixe seus dados para ser avisada quando a peça voltar:</p>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Seu nome</label>
                <Input
                  placeholder="Como podemos te chamar?"
                  value={waitlistName}
                  onChange={e => setWaitlistName(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Seu WhatsApp</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={waitlistPhone}
                  onChange={e => setWaitlistPhone(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <Button
                onClick={handleWaitlistSubmit}
                disabled={waitlistSubmitting || !waitlistName.trim() || !waitlistPhone.trim()}
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold border-none"
              >
                {waitlistSubmitting ? 'Registrando...' : '🔔 Entrar na Fila de Espera'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Senha VIP Oportunidades */}
      <Dialog open={dealsPasswordModalOpen} onOpenChange={setDealsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border-red-200">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold font-store-title text-gray-900 border-b pb-4 mb-2 flex items-center gap-2 text-red-700">
               <Lock className="h-6 w-6" /> Área VIP Oportunidades
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 pt-2">
             <p className="text-sm text-gray-600 mb-4">Esta seção é exclusiva para clientes VIP. Por favor, insira a senha para acessar as oportunidades especiais.</p>
             
             <div>
                <Input 
                  type="password"
                  placeholder="Digite a senha..." 
                  value={dealsPasswordInput}
                  onChange={e => {
                    setDealsPasswordInput(e.target.value);
                    setDealsPasswordError(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleDealsPasswordSubmit();
                  }}
                  className={`h-12 bg-gray-50 focus:bg-white transition-colors text-center text-lg tracking-widest ${dealsPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                />
                {dealsPasswordError && <p className="text-xs text-red-500 mt-2 text-center font-semibold">Senha incorreta. Tente novamente.</p>}
             </div>
             
             <Button 
                onClick={handleDealsPasswordSubmit} 
                className="w-full h-12 mt-4 text-base font-bold text-white shadow-md bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 transition-all"
             >
                Acessar Oportunidades
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
