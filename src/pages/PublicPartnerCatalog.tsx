import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, ShoppingBag, MapPin, Search, ArrowRight, Minus, Plus, ShoppingCart, Loader2, AlertCircle, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { notifyBotConversa } from '@/utils/notifyBotConversa';

export default function PublicPartnerCatalog() {
  const { slug } = useParams();
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Fetch Partner Info
  const { data: partner, isLoading: loadingPartner, error: partnerError } = useQuery({
    queryKey: ['public-partner', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_points')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  // Fetch Stock assigned to Partner
  const { data: stockItems = [], isLoading: loadingStock } = useQuery({
    queryKey: ['public-partner-stock', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('partner_point_stock')
        .select(`
          id, quantity, product_id, variant_id,
          products ( name, sale_price, image_url ),
          product_variants ( size, color, stock )
        `)
        .eq('partner_point_id', partner.id)
        .gt('quantity', 0); // Only show items that actually have stock here

      if (error) throw error;
      return data;
    },
    enabled: !!partner?.id
  });

  const stockError = undefined; // Keeping it simple

  // Track Page Views for Partner
  React.useEffect(() => {
    if (!partner?.id) return;
    let sessionId = localStorage.getItem('rp_visitor_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('rp_visitor_session', sessionId);
    }
    supabase.from('catalog_events').insert({
      owner_id: partner.owner_id,
      event_type: 'page_view',
      session_id: sessionId,
      partner_point_id: partner.id
    }).then();
  }, [partner?.id]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.variant_id === item.variant_id);
    
    // Rastrear adição ao carrinho
    const sessionId = localStorage.getItem('rp_visitor_session');
    if (partner?.id && sessionId) {
       supabase.from('catalog_events').insert({
          owner_id: partner.owner_id,
          event_type: 'add_to_cart',
          product_id: item.product_id,
          session_id: sessionId,
          partner_point_id: partner.id
       }).then();
    }

    if (existing) {
      if (existing.qty >= item.quantity) {
        toast.error('Quantidade máxima disponível na arara atingida.');
        return;
      }
      setCart(cart.map(c => c.variant_id === item.variant_id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    toast.success('Adicionado à sacola!');
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter(c => c.variant_id !== variantId));
  };

  const adjustQty = (variantId: string, delta: number, maxQty: number) => {
    setCart(cart.map(c => {
      if (c.variant_id === variantId) {
        const newQty = Math.max(1, Math.min(maxQty, c.qty + delta));
        return { ...c, qty: newQty };
      }
      return c;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.products?.sale_price * item.qty), 0);

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Preencha seu nome e telefone para continuar.');
      return;
    }
    if (cart.length === 0) return;

    // Track Initiate Checkout
    const sessionId = localStorage.getItem('rp_visitor_session');
    if (partner?.id && sessionId) {
       supabase.from('catalog_events').insert({
          owner_id: partner.owner_id,
          event_type: 'initiate_checkout',
          session_id: sessionId,
          partner_point_id: partner.id
       }).then();
    }

    setIsSynthesizing(true);
    try {
      const { data: orderCode, error: orderError } = await supabase.rpc('register_partner_order', {
         p_store_id: partner.owner_id,
         p_partner_point_id: partner.id,
         p_name: customerName,
         p_whatsapp: customerPhone,
         p_total_amount: cartTotal,
         p_items: cart.map((i: any) => ({
             ...i,
             product: { ...i.products, id: i.product_id },
             variant: i.product_variants ? { ...i.product_variants, id: i.variant_id } : null
         }))
      });

      if (orderError) throw orderError;

      // Notice: we DO NOT decrement stock here yet! The POS does that when "Converter em Venda" is clicked.
      // E.g. in PublicCatalog, the RPC does not decrement stock. It's done at checkout!
      // But wait! Partner point stock should be reserved? 
      // For now, we follow standard store_orders logic where stock is decremented at completion in POS.

      notifyBotConversa('partner_order', partner.owner_id, {
        nome: customerName,
        parceiro: partner.name,
        valor: `R$ ${cartTotal.toFixed(2)}`,
        codigo: String(orderCode),
      });

      toast.success('Pedido Enviado para a Loja!', { duration: 5000 });
      setCart([]);
      setIsCartOpen(false);
      setLeadCaptured(false);
      
      // Enviar pro whatsapp do parceiro!
      if (partner.phone) {
         let text = `*NOVO PEDIDO PARCEIRO: ${orderCode}*\n\nOlá!\nGostaria de concluir a compra das peças da sua Arara:\n\n`;
         cart.forEach((item, index) => {
           text += `${index + 1}. ${item.products?.name} (Tam: ${item.product_variants?.size || 'Un'}) - Qtd: ${item.qty} un - R$ ${(item.products?.sale_price * item.qty).toFixed(2)}\n`;
         });
         text += `\n*Total a Pagar:* R$ ${cartTotal.toFixed(2)}\n\nMeu nome é *${customerName}*. Aguardo chave pix ou link!`;
   
         const encodedText = encodeURIComponent(text);
         const wppLink = `https://wa.me/${partner.phone.replace(/\D/g, '')}?text=${encodedText}`;
         window.open(wppLink, '_blank');
      }

      window.location.reload();

    } catch (e: any) {
      toast.error(`Erro ao finalizar pedido: ${e.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };


  if (partnerError) return <div className="h-screen w-full flex items-center justify-center p-6 text-center text-red-500 font-bold break-words">Erro RLS Partner: {(partnerError as Error).message}</div>;
  if (loadingPartner) return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Carregando catálogo do parceiro...</div>;
  if (!partner) return <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center">
    <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
    <h1 className="text-xl font-bold">Catálogo Insponível</h1>
    <p className="text-muted-foreground mt-2">Este Ponto Parceiro pode ter sido desativado ou o link é inválido.</p>
  </div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-40 border-b shadow-sm border-slate-200">
         <div className="max-w-xl mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Store className="w-5 h-5" />
               </div>
               <div>
                 <h1 className="font-black text-slate-900 leading-tight truncate max-w-[180px]">{partner.name}</h1>
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ponto Revendedor</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-700" onClick={() => setIsCartOpen(true)}>
               <ShoppingBag className="w-6 h-6" />
               {cart.length > 0 && <span className="absolute max-w-[20px] top-0 right-0 -m-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
            </Button>
         </div>
      </header>

      {/* COVER / INFO */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/20 w-full p-6 text-center border-b">
         <div className="max-w-xl mx-auto mt-2 mb-4">
            <p className="text-sm font-medium text-primary/80 uppercase tracking-widest mb-1">PRODUTOS PRONTA-ENTREGA</p>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">Compre online, retire com o parceiro.</h2>
            {partner.address && (
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1 mt-3 mx-auto max-w-sm bg-white/60 p-2 rounded-lg border border-primary/10">
                 <MapPin className="w-3.5 h-3.5 text-primary" /> {partner.address}
              </p>
            )}
         </div>
      </div>

      {/* CATALOG GRID */}
      <main className="max-w-xl mx-auto p-4 mt-2">
         {loadingStock ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
               <Loader2 className="w-8 h-8 animate-spin mb-3" /> Carregando peças da arara...
            </div>
         ) : stockItems.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-2xl border border-dashed border-slate-300">
               <PackagePlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
               <h3 className="font-bold text-slate-800">A arara está vazia no momento</h3>
               <p className="text-sm text-slate-500">Novas coleções chegarão em breve neste ponto.</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {stockItems.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm group hover:shadow-md transition-shadow relative">
                     <span className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md">
                        {item.quantity} restando
                     </span>
                     <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                        {item.products?.image_url ? 
                           <img src={item.products.image_url} alt="img" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : 
                           <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">Sem Foto</div>
                        }
                     </div>
                     <div className="p-3">
                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-0.5">
                           {item.product_variants?.size} {item.product_variants?.color ? `/ ${item.product_variants?.color}` : ''}
                        </p>
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{item.products?.name}</h3>
                        <p className="font-black text-rose-600 mb-3">R$ {Number(item.products?.sale_price || 0).toFixed(2)}</p>
                        
                        <Button 
                          onClick={() => addToCart(item)}
                          className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold h-9"
                        >
                           Adicionar
                        </Button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </main>

      {/* BOTTOM DRAWER CART */}
      {isCartOpen && (
         <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
               <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Sacola</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)} className="rounded-full bg-slate-200 hover:bg-slate-300 w-8 h-8 p-0 text-slate-600">✕</Button>
               </div>
               
               <div className="p-5 overflow-y-auto flex-1 bg-white">
                  {cart.length === 0 ? (
                     <div className="text-center py-10 text-slate-500">
                        Sua sacola está vazia. Adicione itens do parceiro.
                     </div>
                  ) : (
                     <div className="space-y-4 mb-6">
                        {cart.map((item, idx) => (
                           <div key={idx} className="flex gap-3 border rounded-xl p-3 bg-white">
                              {item.products?.image_url ? 
                                 <img src={item.products.image_url} className="w-16 h-16 rounded-lg object-cover" /> :
                                 <div className="w-16 h-16 rounded-lg bg-slate-100"></div>
                              }
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm leading-tight">{item.products?.name}</h4>
                                 <p className="text-xs text-slate-500">{item.product_variants?.size} {item.product_variants?.color}</p>
                                 <p className="font-black text-rose-600 mt-1">R$ {Number(item.products?.sale_price).toFixed(2)}</p>
                              </div>
                              <div className="flex flex-col items-center justify-between">
                                 <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400" onClick={() => removeFromCart(item.variant_id)}>✕</Button>
                                 <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                    <button onClick={() => adjustQty(item.variant_id, -1, item.quantity)} className="w-6 h-6 flex items-center justify-center text-slate-600"><Minus className="w-3 h-3"/></button>
                                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                    <button onClick={() => adjustQty(item.variant_id, 1, item.quantity)} className="w-6 h-6 flex items-center justify-center text-slate-600"><Plus className="w-3 h-3"/></button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {cart.length > 0 && (
                     <div className="border-t pt-4">
                        <label className="text-sm font-bold block mb-1">Seu Nome *</label>
                        <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: João Silva" className="mb-3 bg-slate-50" />
                        
                        <label className="text-sm font-bold block mb-1">Seu WhatsApp *</label>
                        <Input
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          onBlur={async () => {
                            if (!leadCaptured && customerName.trim() && customerPhone.trim() && partner?.owner_id) {
                              setLeadCaptured(true);
                              await supabase.rpc('register_catalog_lead', {
                                p_store_id: partner.owner_id,
                                p_name: customerName.trim(),
                                p_phone: customerPhone.trim(),
                              });
                              notifyBotConversa('customer_signup', partner.owner_id, {
                                nome: customerName.trim(),
                                telefone: customerPhone.trim(),
                              });
                            }
                          }}
                          placeholder="(DD) 99999-9999"
                          className="mb-6 bg-slate-50"
                        />

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                           <div className="flex justify-between items-center text-slate-500 text-sm mb-1">
                              <span>Subtotal</span>
                              <span>R$ {cartTotal.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center font-black text-xl text-slate-900 border-t pt-2 mt-2">
                              <span>Total a Pagar</span>
                              <span>R$ {cartTotal.toFixed(2)}</span>
                           </div>
                        </div>

                        {partner.payment_method === 'store' && partner.accepted_payment_methods && partner.accepted_payment_methods.length > 0 && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4">
                             <p className="text-[10px] font-bold text-purple-900 uppercase mb-1">Pagamentos Aceitos (Dueto com a Loja)</p>
                             <ul className="text-xs text-purple-800 space-y-1">
                               {partner.accepted_payment_methods.map((method: any) => (
                                  <li key={method.id}>
                                    • {method.name} 
                                    {method.min_amount > 0 ? ` (Mínimo de R$ ${Number(method.min_amount).toFixed(2)})` : ' (Sem mínimo)'}
                                  </li>
                               ))}
                             </ul>
                          </div>
                        )}

                        <Button 
                           size="lg" 
                           onClick={handleCheckout} 
                           disabled={isSynthesizing}
                           className="w-full rounded-2xl h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-lg gap-2 shadow-lg shadow-emerald-500/30"
                        >
                           {isSynthesizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5"/> Finalizar Pedido</>}
                        </Button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
