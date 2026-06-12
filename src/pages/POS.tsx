import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, CheckCircle, Search, Trash2, ArrowRight, MapPin, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { consolidateProducts } from '@/utils/productConsolidator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Customer = { id: string; name: string; phone?: string };
type Product = { id: string; name: string; sale_price: number; cost_price: number; image_url: string; product_variants: Variant[]; _is_hub?: boolean; _hub_product_id?: string; _supplier_id?: string; };
type Variant = { id: string; size: string; color: string; stock: number; _partner_allocated_qty?: number; _partner_names?: string[] };
type CartItem = { 
  variant_id: string; 
  product_id: string; 
  name: string;
  variant_desc: string;
  price: number; 
  cost_price: number;
  quantity: number; 
  max_stock: number;
  _is_hub?: boolean;
  _hub_product_id?: string;
  _supplier_id?: string;
  _is_partner?: boolean;
  _partner_agreement_id?: string;
  _partner_stock_owner_id?: string;
};

export default function POS() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');


  // Fields
  const [saleOrigin, setSaleOrigin] = useState('');
  const [cartImportCode, setCartImportCode] = useState('');
  const [storeOrderId, setStoreOrderId] = useState<string | null>(null);
  const [consignmentBagId, setConsignmentBagId] = useState<string | null>(null);
  const [checkoutPartnerPointId, setCheckoutPartnerPointId] = useState<string | null>(null);

  useEffect(() => {
    const pendingJson = localStorage.getItem('revenda_pos_pending_order');
    if (pendingJson) {
      try {
        const order = JSON.parse(pendingJson);
        if (order.customers?.id) {
           setSelectedCustomerId(order.customers.id);
           setCustomerMode('registered');
        }
        if (Array.isArray(order.items)) {
           setCart(order.items.map((i: any) => {
              const productId = i.product?.id || '';
              const isHub = i.product?._is_hub || String(productId).startsWith('hub_');
              const realId = isHub && String(productId).startsWith('hub_') ? productId.replace('hub_', '') : productId;
               // effective_price é gravado pelo catálogo online respeitando o preço promocional da variante
               // Fallback: variant.sale_price > product.sale_price (compra direta no PDV)
               const variantSalePrice = i.variant?.sale_price && parseFloat(i.variant.sale_price) > 0
                 ? parseFloat(i.variant.sale_price)
                 : null;
               const effectivePrice = i.effective_price ?? i.unit_price ?? variantSalePrice ?? i.product?.sale_price ?? 0;
               return {
                variant_id: i.variant_id,
                product_id: realId,
                name: i.product?.name || 'Produto',
                variant_desc: `${i.variant?.size || ''} ${i.variant?.color ? `- ${i.variant.color}` : ''}`.trim(),
                price: effectivePrice,
                cost_price: i.product?.cost_price || 0,
                quantity: i.qty || 1,
                max_stock: i.variant?.stock || 99,
                _is_hub: isHub || false,
                _hub_product_id: isHub ? (i.product?._hub_product_id || realId) : undefined,
                _supplier_id: i.product?._supplier_id || undefined
               };
            }));
        }
        
        if (order.consignment_bag_id) {
           setConsignmentBagId(order.consignment_bag_id);
           setSaleOrigin('Bolsa Consignada');
        } else if (order.partner_point_id) {
           setCheckoutPartnerPointId(order.partner_point_id);
           setSaleOrigin('Ponto Parceiro');
        } else {
           setSaleOrigin('Loja Online');
        }
        
        setStoreOrderId(order.id);
        toast.info(`Pedido ${order.order_code} importado com sucesso!`);
        localStorage.removeItem('revenda_pos_pending_order');
      } catch(e) {
        console.error("Erro processando pedido do catálogo:", e);
      }
    }
  }, []);
  
  const [customerMode, setCustomerMode] = useState<'registered' | 'manual'>('registered');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualInstagram, setManualInstagram] = useState('');
  
  const [payment1Method, setPayment1Method] = useState('');
  const [payment2Method, setPayment2Method] = useState('');
  const [payment1Amount, setPayment1Amount] = useState(0);
  const [payment2Amount, setPayment2Amount] = useState(0);
  const [hasSecondPayment, setHasSecondPayment] = useState(false);
  const [releaseTicketUrl, setReleaseTicketUrl] = useState<string | null>(null);
  const [releaseTicketCustomerPhone, setReleaseTicketCustomerPhone] = useState('');
  const [releaseTicketCustomerName, setReleaseTicketCustomerName] = useState('');
  
  type Installment = { dueDate: string; amount: number; };
  const [installmentsCount1, setInstallmentsCount1] = useState(1);
  const [installments1, setInstallments1] = useState<Installment[]>([]);
  const [installmentsCount2, setInstallmentsCount2] = useState(1);
  const [installments2, setInstallments2] = useState<Installment[]>([]);
  
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  
  const [shippingMethod, setShippingMethod] = useState('presential');
  const [postalCompany, setPostalCompany] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingPayer, setShippingPayer] = useState<'buyer' | 'seller'>('buyer');
  const [observations, setObservations] = useState('');
  // Consórcio
  const [consortiumParticipantId, setConsortiumParticipantId] = useState<string | null>(null);
  const [consortiumCreditRemaining, setConsortiumCreditRemaining] = useState(0);

  const handleSendTrackingWpp = () => {
    let phoneStr = '';
    if (customerMode === 'registered') {
       const c = customers.find(x => x.id === selectedCustomerId);
       phoneStr = c?.phone || '';
    } else {
       phoneStr = manualPhone || '';
    }

    if (!phoneStr) {
       toast.error("Telefone não encontrado.");
       return;
    }

    const text = `Sua compra foi postada!\n📦 Empresa: ${postalCompany}\n🏷️ Rastreio: ${trackingCode}`;
    const cleanPhone = phoneStr.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('id, name, phone').order('name');
      return (data || []) as Customer[];
    }
  });

  // Participantes contemplados com crédito restante (só quando origem é Consórcio)
  const { data: drawnParticipants = [] } = useQuery({
    queryKey: ['consortium-drawn-participants'],
    queryFn: async () => {
      // 1) Buscar participantes contemplados
      const { data: participants, error } = await supabase
        .from('consortium_participants')
        .select('id, consortium_id, credit_awarded, credit_used, customer_id, customer_name, phone')
        .eq('status', 'drawn');

      console.log('[POS Consórcio] Participantes drawn:', participants, 'Erro:', error);
      if (error || !participants) return [];

      // Filtrar quem ainda tem crédito
      const withCredit = participants.filter((p: any) => ((p.credit_awarded || 0) - (p.credit_used || 0)) > 0);
      if (withCredit.length === 0) return [];

      // 2) Buscar nome do consórcio
      const consortiumIds = [...new Set(withCredit.map((p: any) => p.consortium_id))];
      const { data: consortiums } = await supabase
        .from('consortiums')
        .select('id, name')
        .in('id', consortiumIds);

      // 3) Buscar nome do cliente (quando tem customer_id)
      const customerIds = withCredit.map((p: any) => p.customer_id).filter(Boolean);
      let customersMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: custs } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);
        if (custs) custs.forEach((c: any) => { customersMap[c.id] = c.name; });
      }

      // 4) Montar resultado enriquecido
      return withCredit.map((p: any) => ({
        ...p,
        consortium_name: consortiums?.find((c: any) => c.id === p.consortium_id)?.name || '',
        resolved_name: p.customer_name || customersMap[p.customer_id] || 'Sem nome',
      }));
    },
    enabled: saleOrigin === 'Consórcio',
    refetchOnWindowFocus: true,
  });

  const { data: partnerPoints = [] } = useQuery({
    queryKey: ['partner_points_pos'],
    queryFn: async () => {
       const user = (await supabase.auth.getUser()).data.user;
       if (!user) return [];
       const { data, error } = await supabase.from('partner_points').select('id, name, payment_method').eq('owner_id', user.id).eq('status', 'active');
       if (error) throw error;
       return data || [];
    }
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-pos'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];

      // 1. Produtos locais
      const { data: localData, error } = await supabase
        .from('products')
        .select(`
          id, name, sale_price, cost_price, image_url,
          product_variants ( id, size, color, stock, sale_price, partner_point_stock ( quantity, partner_points ( name ) ) )
        `)
        .eq('owner_id', user.id)
        .order('name');
      
      if (error) throw error;
      let localProducts = (localData || []).map((p: any) => ({
        ...p,
        product_variants: (p.product_variants || []).map((v: any) => {
          const partnerStock = v.partner_point_stock || [];
          const partnerAllocQty = partnerStock.reduce((acc: number, ps: any) => acc + (ps.quantity || 0), 0);
          const partnerNames = Array.from(new Set(partnerStock.filter((ps: any) => ps.quantity > 0 && ps.partner_points?.name).map((ps: any) => ps.partner_points.name)));
          return {
            ...v,
            _partner_allocated_qty: partnerAllocQty,
            _partner_names: partnerNames
          };
        })
      })) as Product[];

      // 2. Produtos importados do Hub
      let hubProducts: Product[] = [];
      const { data: hubImports } = await supabase
        .from('hub_imports')
        .select('hub_product_id, retail_price, supplier_id')
        .eq('tenant_id', user.id)
        .eq('is_active', true);

      if (hubImports && hubImports.length > 0) {
        const hubIds = hubImports.map(i => i.hub_product_id);
        const { data: hubData } = await supabase
          .from('hub_products')
          .select('*, hub_product_variants (*)')
          .in('id', hubIds)
          .eq('status', 'active');

        hubProducts = (hubData || []).map((hp: any) => {
          const imp = hubImports.find(i => i.hub_product_id === hp.id);
          return {
            id: hp.id,
            name: `🏪 ${hp.name}`,
            sale_price: imp?.retail_price || hp.suggested_retail_price || hp.wholesale_price,
            cost_price: hp.wholesale_price,
            image_url: hp.image_url,
            _is_hub: true,
            _hub_product_id: hp.id,
            _supplier_id: imp?.supplier_id || hp.supplier_id,
            product_variants: (hp.hub_product_variants || []).map((v: any) => ({
              id: v.id,
              size: v.size || '',
              color: v.color || '',
              stock: v.stock
            }))
          } as Product;
        });
      }

      return consolidateProducts([...localProducts, ...hubProducts]) as Product[];
    }
  });

  // Produtos de parceiras ativas
  const { data: partnerProducts = [] } = useQuery({
    queryKey: ['partner-products-pos'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      // Buscar produtos compartilhados comigo
      const { data: shared } = await supabase
        .from('partner_agreement_products')
        .select(`
          id, agreement_id, product_id, owner_id,
          partner_agreements!inner(status),
          products(id, name, sale_price, cost_price, image_url, product_variants(id, size, color, stock))
        `)
        .eq('shared_with_id', user.id)
        .eq('partner_agreements.status', 'active');
      if (!shared) return [];
      return shared.map((s: any) => ({
        ...s.products,
        _is_partner: true,
        _partner_agreement_id: s.agreement_id,
        _partner_stock_owner_id: s.owner_id,
        name: s.products?.name || 'Produto',
      }));
    }
  });

  const { data: payMethods = [] } = useQuery({
    queryKey: ['payment-methods-pos'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      const { data, error } = await supabase.from('payment_methods').select('*').eq('owner_id', user.id).eq('is_active', true).order('created_at');
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
                  const { data: newData } = await supabase.from('payment_methods').select('*').eq('owner_id', user.id).eq('is_active', true).order('created_at');
                  if (newData) fetchedData = newData;
              }
          }
      }
      return fetchedData;
    }
  });

  useEffect(() => {
    if (payMethods.length > 0) {
      if (!payment1Method) setPayment1Method(payMethods[0].id);
      if (!payment2Method) setPayment2Method(payMethods[0].id);
    }
  }, [payMethods, payment1Method, payment2Method]);

  const recalculateInstallments = (amount: number, numInst: number, setter: any) => {
    const list = [];
    let date = new Date();
    const baseAmt = Math.floor((amount / numInst) * 100) / 100;
    const rem = amount - (baseAmt * numInst);

    for (let i = 0; i < numInst; i++) {
        date = new Date(date.setMonth(date.getMonth() + 1));
        list.push({
           dueDate: date.toISOString().split('T')[0],
           amount: i === 0 ? Number((baseAmt + rem).toFixed(2)) : baseAmt
        });
    }
    setter(list);
  };

  const subTotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
  
  const getActualDiscount = () => {
    if (discountType === 'percentage') return subTotal * (discountValue / 100);
    return discountValue;
  };
  
  const actualDiscount = getActualDiscount();
  const applyShippingToTotal = (shippingMethod !== 'presential' && shippingPayer === 'buyer') ? shippingCost : 0;
  const grandTotal = Math.max(0, subTotal - actualDiscount + applyShippingToTotal);

  // Sincronizar o payment1 com o grandTotal caso o total mude (por causa do carrinho ou desconto)
  useEffect(() => {
    if (!hasSecondPayment) {
      setPayment1Amount(grandTotal);
      setPayment2Amount(0);
      recalculateInstallments(grandTotal, installmentsCount1, setInstallments1);
    } else {
      if (Math.abs(payment1Amount + payment2Amount - grandTotal) > 0.01) {
        setPayment1Amount(Math.max(0, grandTotal - payment2Amount));
      }
    }
  }, [grandTotal, hasSecondPayment]);

  const isPartnerDirectReceive = saleOrigin === 'Ponto Parceiro' && partnerPoints.find((p:any) => p.id === checkoutPartnerPointId)?.payment_method === 'partner';

  const handleP1AmountChange = (val: number) => {
    const v = Math.max(0, val);

    setPayment1Amount(v);
    if (hasSecondPayment) {
      setPayment2Amount(Math.max(0, grandTotal - v));
    }
  };

  const handleP2AmountChange = (val: number) => {
    const v = Math.max(0, val);
    setPayment2Amount(v);
    if (hasSecondPayment) {
      setPayment1Amount(Math.max(0, grandTotal - v));
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");

      // Registrar cliente se manual
      let customer_id = customerMode === 'registered' ? (selectedCustomerId || null) : null;
      if (customerMode === 'manual' && manualName) {
        const { data, error } = await supabase.from('customers').insert([{
          name: manualName,
          phone: manualPhone,
          instagram: manualInstagram,
          owner_id: user.id
        }]).select('id').single();
        if (error) throw error;
        customer_id = data.id;
      }

      // Validar origin
      if (!saleOrigin) throw new Error("Selecione a origem da venda");
      if (cart.length === 0) throw new Error("Carrinho vazio");
      if (!isPartnerDirectReceive && !payment1Method) throw new Error("Selecione uma Forma de Pagamento. (Caso não possua, configure na aba Ajustes/Pagamentos).");

      const pm1 = isPartnerDirectReceive ? null : payMethods.find((p:any) => p.id === payment1Method);
      const pm2 = hasSecondPayment && payment2Method && !isPartnerDirectReceive ? payMethods.find((p:any) => p.id === payment2Method) : null;
      const hasInstallments = !isPartnerDirectReceive && ((pm1?.is_installment && installments1.length > 0) || (pm2?.is_installment && installments2.length > 0));

      const saleStatus = hasInstallments ? 'installment' : 'completed';

      // Calcular taxas das formas de pagamento (fee_percentage)
      const fee1 = (!isPartnerDirectReceive && pm1 && !pm1.is_installment) ? (grandTotal * (Number(pm1.fee_percentage) || 0) / 100) : 0;
      const fee2 = (!isPartnerDirectReceive && pm2 && !pm2.is_installment && payment2Amount) ? (payment2Amount * (Number(pm2.fee_percentage) || 0) / 100) : 0;

      // Inserir venda
      const { data: sale, error } = await supabase.from('sales').insert([{
        owner_id: user.id,
        total_amount: grandTotal,
        discount: actualDiscount,
        payment_method: payment1Method,
        payment_method_2: (!isPartnerDirectReceive && hasSecondPayment && payment2Method) ? payment2Method : null,
        payment_amount_2: isPartnerDirectReceive ? null : (hasSecondPayment ? payment2Amount : null),
        payment_fee_amount: fee1,
        payment_fee_amount_2: fee2,
        status: saleStatus,
        sale_origin: saleOrigin,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        shipping_payer: shippingPayer,
        discount_type: discountType,
        customer_id: customer_id || null,
        partner_point_id: checkoutPartnerPointId || null
      }]).select('id').single();

      if (error) throw error;
      const firstSaleId = sale.id;

      // Itens da Venda
      const saleItemsData = cart.map(c => ({
        owner_id: user.id,
        sale_id: sale.id,
        product_id: c.product_id,
        variant_id: c.variant_id || null,
        quantity: c.quantity,
        unit_price: c.price,
        unit_cost: c.cost_price,
        total_price: c.price * c.quantity
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsData);
      if (itemsError) throw itemsError;

      // Criar log de parceria para itens de produtos em parceria
      const partnerItems = cart.filter(c => c._is_partner && c._partner_agreement_id);
      for (const pItem of partnerItems) {
        const grossProfit = (pItem.price * pItem.quantity) - (pItem.cost_price * pItem.quantity);
        const fees = fee1 + fee2;
        const feePerItem = partnerItems.length > 0 ? fees / cart.length * pItem.quantity : 0;
        const netProfit = grossProfit - feePerItem;
        await supabase.from('partner_sale_log').insert({
          agreement_id: pItem._partner_agreement_id,
          sale_id: sale.id,
          seller_id: user.id,
          stock_owner_id: pItem._partner_stock_owner_id || user.id,
          product_id: pItem.product_id,
          quantity: pItem.quantity,
          sale_price: pItem.price * pItem.quantity,
          cost_price: pItem.cost_price * pItem.quantity,
          fees: parseFloat(feePerItem.toFixed(2)),
          gross_profit: parseFloat(grossProfit.toFixed(2)),
          net_profit: parseFloat(netProfit.toFixed(2)),
        });
        // Decrementar estoque da dona do produto
        if (pItem._partner_stock_owner_id && pItem.variant_id) {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('id, stock')
            .eq('id', pItem.variant_id)
            .single();
          if (vData) {
            await supabase.from('product_variants')
              .update({ stock: Math.max(0, vData.stock - pItem.quantity) })
              .eq('id', pItem.variant_id);
          }
        }
      }

      // Se a origem foi Ponto Parceiro, abater do estoque do parceiro
      if (checkoutPartnerPointId && cart.length > 0) {
         for (const item of cart) {
             const { data: currentStock } = await supabase
               .from('partner_point_stock')
               .select('id, quantity')
               .eq('partner_point_id', checkoutPartnerPointId)
               .eq('product_id', item.product_id)
               .eq(item.variant_id ? 'variant_id' : 'variant_id', item.variant_id || null)
               .single();
             
             if (currentStock) {
                const newQty = Math.max(0, currentStock.quantity - item.quantity);
                if (newQty === 0) {
                   await supabase.from('partner_point_stock').delete().eq('id', currentStock.id);
                } else {
                   await supabase.from('partner_point_stock').update({ quantity: newQty }).eq('id', currentStock.id);
                }
             }
         }
      }

      // Itens Hub: criar fulfillment orders
      const hubItems = cart.filter(c => c._is_hub);
      for (const hubItem of hubItems) {
        const customerName = customerMode === 'registered' ? (customers.find((c:any) => c.id === selectedCustomerId)?.name || 'Cliente') : (manualName || 'Cliente');
        const customerPhone = customerMode === 'registered' ? (customers.find((c:any) => c.id === selectedCustomerId)?.phone || '') : (manualPhone || '');
        const { error: fulfillErr } = await supabase.from('hub_fulfillment_orders').insert({
          hub_product_id: hubItem._hub_product_id,
          hub_variant_id: hubItem.variant_id || null,
          supplier_id: hubItem._supplier_id,
          tenant_id: user.id,
          quantity: hubItem.quantity,
          status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: observations || null
        });
        if (fulfillErr) toast.error(`Erro envio hub: ${hubItem.name}`);
      }

      // Parcelas
      if (pm1?.is_installment && installments1.length > 0) {
        const instsToInsert = installments1.map((inst, index) => ({
            sale_id: sale.id,
            installment_number: index + 1,
            due_date: inst.dueDate,
            amount: inst.amount,
            status: 'pending'
        }));
        await supabase.from('sale_installments').insert(instsToInsert);
      }
      if (hasSecondPayment && pm2?.is_installment && installments2.length > 0) {
        const instsToInsert = installments2.map((inst, index) => ({
            sale_id: sale.id,
            installment_number: index + 1,
            due_date: inst.dueDate,
            amount: inst.amount,
            status: 'pending'
        }));
        await supabase.from('sale_installments').insert(instsToInsert);
      }

      if (storeOrderId) {
         await supabase.from('store_orders').update({ status: 'completed' }).eq('id', storeOrderId);
      }

      if (consignmentBagId) {
         await supabase.from('consignment_bags').update({ status: 'concluded' }).eq('id', consignmentBagId);
      }

      // Atualizar crédito utilizado do participante contemplado
      if (saleOrigin === 'Consórcio' && consortiumParticipantId && actualDiscount > 0) {
        const part = (drawnParticipants as any[]).find((p: any) => p.id === consortiumParticipantId);
        if (part) {
          const newUsed = (part.credit_used || 0) + actualDiscount;
          await supabase
            .from('consortium_participants')
            .update({ credit_used: newUsed })
            .eq('id', consortiumParticipantId);
        }
      }

      return firstSaleId;
    },
    onSuccess: (firstSaleId) => {
      toast.success('Venda concluída com sucesso!');
      
      if (saleOrigin === 'Ponto Parceiro' && checkoutPartnerPointId && firstSaleId && !isPartnerDirectReceive) {
        setReleaseTicketUrl(`${window.location.origin}/liberacao/${firstSaleId}`);
      }

      setCart([]);
      setObservations('');
      setManualName('');
      setManualPhone('');
      setManualInstagram('');
      setSelectedCustomerId('');
      setSearch('');
      setStoreOrderId(null);
      setConsignmentBagId(null);
      setCheckoutPartnerPointId(null);
      setConsortiumParticipantId(null);
      setConsortiumCreditRemaining(0);
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (e: any) => {
      toast.error('Erro ao registrar venda: ' + e.message);
    }
  });

  const addToCart = (product: Product, variant: Variant) => {
    const existing = cart.find(c => c.variant_id === variant.id);
    if (existing) {
       if (existing.quantity >= variant.stock) { toast.error('Estoque insuficiente'); return; }
       setCart(cart.map(c => c.variant_id === variant.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
       setCart([...cart, {
           variant_id: variant.id,
           product_id: (variant as any)._parent_id ?? product.id,
           name: product.name,
           variant_desc: `${variant.size} ${variant.color}`,
           price: (variant as any).sale_price && parseFloat((variant as any).sale_price) > 0 ? parseFloat((variant as any).sale_price) : product.sale_price,
           cost_price: product.cost_price || 0,
           quantity: 1,
           max_stock: variant.stock,
           _is_hub: (variant as any)._is_hub ?? product._is_hub,
           _hub_product_id: (variant as any)._hub_product_id ?? product._hub_product_id,
           _supplier_id: (variant as any)._supplier_id ?? product._supplier_id,
           _is_partner: (product as any)._is_partner ?? false,
           _partner_agreement_id: (product as any)._partner_agreement_id ?? undefined,
           _partner_stock_owner_id: (product as any)._partner_stock_owner_id ?? undefined,
       }]);
    }
  };

  const removeFromCart = (variant_id: string) => setCart(cart.filter(c => c.variant_id !== variant_id));

  const updateQuantity = (variant_id: string, newQ: number, max: number) => {
    if (newQ <= 0) return removeFromCart(variant_id);
    if (newQ > max) return toast.error("Estoque insuficiente.");
    setCart(cart.map(c => c.variant_id === variant_id ? { ...c, quantity: newQ } : c));
  };

  const handleValidationBeforeCheckout = () => {
     if (cart.length === 0) return toast.error("Carrinho vazio");
     
     if (saleOrigin === 'Ponto Parceiro' && !checkoutPartnerPointId) {
         return toast.error("Selecione abaixo o Ponto Parceiro no qual ocorreu a venda.");
     }
     
     checkoutMutation.mutate();
  };

  const allProducts = [...products, ...partnerProducts.filter((pp: any) =>
    !products.some((p: any) => p.id === pp.id)
  )];

  const filteredProducts = allProducts.filter((p: any) => {
     const matchesName = p.name.toLowerCase().includes(search.toLowerCase());
     const hasStock = p.product_variants && p.product_variants.some((v: any) => v.stock > 0);
     return matchesName && hasStock;
  });
  const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);


  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative z-0">
        
        {/* Header - Importar */}
        <div className="p-4 md:p-8 border-b bg-slate-50/80">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
               <ShoppingCart className="w-6 h-6 text-primary" />
               Registrar Venda
            </h2>
          </div>
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
               <span className="absolute left-3 top-3.5 text-primary font-bold w-4 h-4"><ArrowRight className="w-4 h-4"/></span>
               <Input placeholder="Importar carrinho (ex: VP-ASF2)..." className="pl-9 h-12 rounded-xl border-slate-200 focus-visible:ring-primary bg-white shadow-sm font-medium" value={cartImportCode} onChange={e => setCartImportCode(e.target.value)} />
            </div>
            <Button variant="outline" className="h-12 shrink-0 px-8 rounded-xl border-slate-200 hover:bg-slate-100 font-bold" onClick={() => toast.info('Integração em breve')}>Importar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-6">
          
          {/* Lado Esquerdo - Busca e Carrinho */}
          <div className="flex flex-col gap-5">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Buscar Produto</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input placeholder="Digite o nome do produto..." className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-primary shadow-sm text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              
              {/* Resultados da Busca (Flutuante) */}
              {search.length > 0 && (
                <div className="absolute top-16 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                   {filteredProducts.length === 0 ? (
                     <div className="p-4 text-sm text-center text-gray-500">Nenhum produto encontrado.</div>
                   ) : (
                     filteredProducts.map(p => {
                        const av = p.product_variants?.filter((v: any) => v.stock > 0) || [];
                        return (
                           <div key={p.id} className={`p-3 border-b flex flex-col gap-2 hover:bg-gray-50 ${(p as any)._is_partner ? 'bg-blue-50/40' : ''}`}>
                               <div className="flex items-center gap-2">
                                 <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                                 {(p as any)._is_partner && (
                                   <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">🤝 Parceria</span>
                                 )}
                               </div>
                              <div className="flex flex-wrap gap-2">
                                 {av.length > 0 ? av.map((v: any) => (
                                    <Button key={v.id} variant="outline" size="sm" className={`h-7 text-xs px-2 ${(p as any)._is_partner ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50' : 'border-primary/30 hover:border-primary hover:bg-primary/5'}`} onClick={() => {addToCart(p as any,v); setSearch('');}}>
                                       {v.size}
                                       <span className="ml-1 text-[9px] opacity-50">({v.stock})</span>
                                    </Button>
                                 )) : <span className="text-[10px] text-red-500 border border-red-100 bg-red-50 px-2 py-1 rounded">Sem estoque</span>}
                              </div>
                           </div>
                        )
                     })
                   )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-[350px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Carrinho ({totalItems} itens)</label>
              <div className="flex-1 border border-slate-200 rounded-2xl overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar relative shadow-inner">
                 {cart.length === 0 ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                     <ShoppingCart className="h-12 w-12 mb-3 text-slate-200" />
                     <p className="text-sm font-medium text-slate-500">Carrinho vazio</p>
                     <p className="text-xs mt-1 text-slate-400">Adicione produtos para continuar</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {cart.map(c => (
                        <div key={c.variant_id} className={`bg-white p-3 py-2 rounded-lg border shadow-sm text-sm flex gap-3 relative ${c._is_partner ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                          <div className="flex-1 pr-6">
                             <div className="flex items-center gap-1.5">
                               <p className="font-bold text-gray-900">{c.name}</p>
                               {c._is_partner && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-semibold">🤝</span>}
                             </div>
                             <p className="text-[11px] text-gray-500 mt-0.5">{c.variant_desc}</p>
                             <div className="flex items-center justify-between mt-2">
                                <p className="font-black text-emerald-600">R$ {(c.price * c.quantity).toFixed(2)}</p>
                                <div className="flex items-center border border-gray-200 rounded-md">
                                  <button className="px-2.5 py-1 text-gray-600 hover:bg-gray-100" onClick={() => updateQuantity(c.variant_id, c.quantity - 1, c.max_stock)}>-</button>
                                  <span className="w-5 text-center text-xs font-bold border-x border-gray-200 py-1">{c.quantity}</span>
                                  <button className="px-2.5 py-1 text-gray-600 hover:bg-gray-100" onClick={() => updateQuantity(c.variant_id, c.quantity + 1, c.max_stock)}>+</button>
                                </div>
                             </div>
                          </div>
                          <button className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" onClick={() => removeFromCart(c.variant_id)}><Trash2 className="h-4 w-4"/></button>
                        </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
            
          </div>

          {/* Lado Direito - Checkout Form */}
          <div className="flex flex-col gap-6 pl-0 md:pl-6 md:border-l border-slate-100">
             
             <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-wider mb-2 block">Origem da Venda *</label>
                 <select className="w-full h-12 border border-primary/20 text-sm rounded-xl px-4 bg-primary/5 cursor-pointer outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 font-semibold transition-all shadow-sm" value={saleOrigin} onChange={e => { const next = e.target.value; setSaleOrigin(next); if (next !== 'Consórcio') { setConsortiumParticipantId(null); setConsortiumCreditRemaining(0); } }}>
                   <option value="">Selecione a origem...</option>
                   <option value="Loja Online">Loja Online</option>
                   <option value="Evento">Evento</option>
                   <option value="Bolsa Consignada">Bolsa Consignada</option>
                   <option value="Consórcio">Consórcio</option>
                   <option value="Bazar VIP">Bazar VIP</option>
                   <option value="Ponto Parceiro">Ponto Parceiro</option>
                   <option value="Loja Física">Loja Física</option>
                </select>
                 {saleOrigin === 'Ponto Parceiro' && (
                    <div className="mt-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-2 block flex justify-between">
                          Qual Parceiro? <span>*</span>
                      </label>
                      <select 
                        className="w-full h-11 border border-purple-200 text-sm rounded-lg px-3 bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400 shadow-sm font-semibold text-purple-900 placeholder:text-purple-300" 
                        value={checkoutPartnerPointId || ''} 
                        onChange={e => setCheckoutPartnerPointId(e.target.value)}
                      >
                         <option value="">Selecione o Parceiro...</option>
                         {partnerPoints.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                 )}
                {!saleOrigin && <p className="text-[10px] text-primary mt-1 font-medium">Selecione a origem da venda para continuar</p>}
             </div>

              <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Cliente</label>
                   {saleOrigin === 'Consórcio' ? (
                     <div className="space-y-2">
                       <select
                         className="w-full h-12 border border-amber-300 text-sm rounded-xl px-4 bg-amber-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400 shadow-sm font-medium"
                         value={consortiumParticipantId || ''}
                         onChange={e => {
                           const p = (drawnParticipants as any[]).find((x: any) => x.id === e.target.value);
                           if (p) {
                             setConsortiumParticipantId(p.id);
                             const rem = (p.credit_awarded || 0) - (p.credit_used || 0);
                             setConsortiumCreditRemaining(rem);
                             setDiscountType('fixed');
                             setDiscountValue(rem);
                             if (p.customer_id) { setCustomerMode('registered'); setSelectedCustomerId(p.customer_id); }
                           } else {
                             setConsortiumParticipantId(null); setConsortiumCreditRemaining(0); setDiscountValue(0);
                           }
                         }}
                       >
                         <option value="">Selecione o contemplado...</option>
                         {(drawnParticipants as any[]).map((p: any) => {
                            const remaining = (p.credit_awarded || 0) - (p.credit_used || 0);
                            return <option key={p.id} value={p.id}>{p.resolved_name} — Crédito: R$ {remaining.toFixed(2)}{p.consortium_name ? ` (${p.consortium_name})` : ''}</option>;
                          })}
                       </select>
                       {consortiumParticipantId && consortiumCreditRemaining > 0 && (
                         <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                           <span className="text-lg">💎</span>
                           <span className="text-amber-800 font-semibold">Crédito disponível: R$ {consortiumCreditRemaining.toFixed(2)}</span>
                           <span className="text-amber-600 text-xs ml-1">(desconto automático)</span>
                         </div>
                       )}
                       {(drawnParticipants as any[]).length === 0 && <p className="text-xs text-muted-foreground">Nenhum contemplado com crédito restante</p>}
                     </div>
                   ) : (
                     <select className="w-full h-12 border border-slate-200 text-sm rounded-xl px-4 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary shadow-sm font-medium" value={customerMode === 'manual' ? 'manual' : (selectedCustomerId || '')} onChange={e => {
                        if (e.target.value === 'manual') setCustomerMode('manual');
                        else if (e.target.value === '') { setCustomerMode('registered'); setSelectedCustomerId(''); }
                        else { setCustomerMode('registered'); setSelectedCustomerId(e.target.value); }
                     }}>
                        <option value="">Selecione um Cliente (Opcional)</option>
                        <option value="manual">➕ Digitar Nome Manualmente</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                   )}
                </div>
               {customerMode === 'manual' && saleOrigin !== 'Consórcio' && (
                   <>
                     <div>
                       <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nome do Cliente</label>
                       <Input placeholder="Opcional" className="h-10 border-gray-200" value={manualName} onChange={e => setManualName(e.target.value)}/>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold text-gray-700 mb-1.5 block">Telefone</label>
                         <Input placeholder="(00) 00000-0000" className="h-10 border-gray-200" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-gray-700 mb-1.5 block">@ Instagram</label>
                         <Input placeholder="@usuario" className="h-10 border-gray-200" value={manualInstagram} onChange={e => setManualInstagram(e.target.value)} />
                       </div>
                     </div>
                   </>
                )}
              </div>

             <div className="pt-2">
                {isPartnerDirectReceive ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-2 flex items-center justify-between">
                     <div>
                       <p className="font-bold text-purple-900 flex items-center gap-2"><MapPin className="w-4 h-4"/> Parceiro Recebe o Pagamento</p>
                       <p className="text-purple-700 text-xs mt-1">Este Parceiro recebe o dinheiro no balcão e esse valor virá detalhado no Acerto de Vendas do parceiro. Nenhuma cobrança deve ser feita aqui.</p>
                     </div>
                  </div>
                ) : (
                  <>
                  <div className="flex justify-between items-end mb-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Forma de Pagamento</label>
                     {!hasSecondPayment && payMethods.length > 1 && <button className="text-[10px] text-primary font-bold hover:underline" onClick={() => setHasSecondPayment(true)}>+ Dividir pagamento</button>}
                  </div>
                  
                  <div className="space-y-2 mb-2">
                   <div className={`flex gap-2 ${hasSecondPayment ? 'items-center' : ''}`}>
                     <select className="w-full h-12 border border-slate-200 text-sm rounded-xl px-4 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary shadow-sm font-medium flex-1" value={payment1Method} onChange={e => {
                           setPayment1Method(e.target.value);
                           const pm = payMethods.find((p:any) => p.id === e.target.value);
                           if (pm?.is_installment) recalculateInstallments(payment1Amount, installmentsCount1, setInstallments1);
                     }}>
                       {payMethods.length === 0 ? <option value="">Configure em Ajustes</option> : payMethods.map((pm:any) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                     </select>
                     {hasSecondPayment && (
                       <Input type="number" placeholder="0,00" value={parseFloat(payment1Amount.toFixed(2)) || ''} onChange={e => handleP1AmountChange(parseFloat(e.target.value) || 0)} className="w-24 h-10 font-bold" />
                     )}
                   </div>
                      
                   {(() => {
                      const pm = payMethods.find((p:any) => p.id === payment1Method);
                      if (pm?.is_installment) {
                        return (
                           <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-600">Qtd Parcelas:</label>
                                <Input type="number" min={1} className="w-16 h-8 text-xs bg-white" value={installmentsCount1} onChange={e => {
                                    const c = parseInt(e.target.value) || 1;
                                    setInstallmentsCount1(c);
                                    recalculateInstallments(payment1Amount, c, setInstallments1);
                                }} />
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {installments1.map((inst, i) => (
                                  <div key={i} className="flex gap-1 items-center bg-white p-1 rounded border border-gray-200">
                                    <span className="w-4 text-center font-bold text-[10px] text-gray-500">{i+1}</span>
                                    <Input type="date" className="h-6 text-[10px] px-1 border-gray-100 flex-1" value={inst.dueDate} onChange={e => { const newInsts = [...installments1]; newInsts[i].dueDate = e.target.value; setInstallments1(newInsts); }} />
                                    <Input type="number" step="0.01" className="h-6 text-[10px] px-1 border-gray-100 w-14 font-medium" value={inst.amount} onChange={e => { const newInsts = [...installments1]; newInsts[i].amount = parseFloat(e.target.value) || 0; setInstallments1(newInsts); }} />
                                  </div>
                                ))}
                              </div>
                           </div>
                        )
                      }
                   })()}
                </div>

                {hasSecondPayment && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                     <div className="flex gap-2 items-center">
                       <select className="w-full h-10 border border-gray-200 text-sm rounded-md px-3 bg-white outline-none focus:border-primary flex-1" value={payment2Method} onChange={e => {
                             setPayment2Method(e.target.value);
                             const pm = payMethods.find((p:any) => p.id === e.target.value);
                             if (pm?.is_installment) recalculateInstallments(payment2Amount, installmentsCount2, setInstallments2);
                       }}>
                         {payMethods.map((pm:any) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                       </select>
                       <Input type="number" placeholder="0,00" value={parseFloat(payment2Amount.toFixed(2)) || ''} onChange={e => handleP2AmountChange(parseFloat(e.target.value) || 0)} className="w-24 h-10 font-bold" />
                       <button className="text-gray-400 hover:text-red-500 p-2" onClick={() => {setHasSecondPayment(false); setPayment2Amount(0);}}><Trash2 className="h-4 w-4" /></button>
                     </div>
                        
                     {(() => {
                        const pm = payMethods.find((p:any) => p.id === payment2Method);
                        if (pm?.is_installment) {
                          return (
                             <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-gray-600">Qtd Parcelas (Pag. 2):</label>
                                  <Input type="number" min={1} className="w-16 h-8 text-xs bg-white" value={installmentsCount2} onChange={e => {
                                      const c = parseInt(e.target.value) || 1;
                                      setInstallmentsCount2(c);
                                      recalculateInstallments(payment2Amount, c, setInstallments2);
                                  }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {installments2.map((inst, i) => (
                                    <div key={i} className="flex gap-1 items-center bg-white p-1 rounded border border-gray-200">
                                      <span className="w-4 text-center font-bold text-[10px] text-gray-500">{i+1}</span>
                                      <Input type="date" className="h-6 text-[10px] px-1 border-gray-100 flex-1" value={inst.dueDate} onChange={e => { const newInsts = [...installments2]; newInsts[i].dueDate = e.target.value; setInstallments2(newInsts); }} />
                                      <Input type="number" step="0.01" className="h-6 text-[10px] px-1 border-gray-100 w-14 font-medium" value={inst.amount} onChange={e => { const newInsts = [...installments2]; newInsts[i].amount = parseFloat(e.target.value) || 0; setInstallments2(newInsts); }} />
                                    </div>
                                  ))}
                                </div>
                             </div>
                          )
                        }
                     })()}
                  </div>
                )}
                </>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-700 mb-1.5 block">Tipo de Desconto</label>
                   <select className="w-full h-10 border border-gray-200 text-sm rounded-md px-3 bg-white outline-none focus:border-primary" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                     <option value="fixed">R$ Fixo</option>
                     <option value="percentage">% Porcentagem</option>
                     <option value="exchange">⟲ Permuta</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-700 mb-1.5 block">Valor do Desconto</label>
                   <Input type="number" placeholder="0" className="h-10 border-gray-200 font-bold" value={discountValue || ''} onChange={e => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))} />
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Forma de Envio</label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { id: 'presential', label: 'Presencial', desc: 'Entrega em mãos' },
                     { id: 'postal', label: 'Postagem', desc: 'Correios, Jadlog, etc' },
                     { id: 'app', label: 'Aplicativos', desc: 'Uber, 99, etc' },
                     { id: 'other', label: 'Outras', desc: 'Outra forma de envio' }
                   ].map(env => (
                     <div 
                       key={env.id}
                       className={`border rounded-lg p-3 cursor-pointer transition-all ${shippingMethod === env.id ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                       onClick={() => setShippingMethod(env.id)}
                     >
                       <div className="font-bold text-sm mb-0.5">{env.label}</div>
                       <div className={`text-[10px] ${shippingMethod === env.id ? 'text-primary/70' : 'text-gray-500'}`}>{env.desc}</div>
                     </div>
                   ))}
                </div>

                {shippingMethod === 'postal' && (
                  <div className="mt-4 space-y-4 p-4 border border-dashed border-gray-300 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Empresa de Envios</label>
                        <Input placeholder="Ex: Correios" className="h-9 bg-white text-sm" value={postalCompany} onChange={e => setPostalCompany(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Código de Rastreio</label>
                        <Input placeholder="Código..." className="h-9 bg-white text-sm" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-9 font-semibold text-green-700 border-green-200 hover:bg-green-50" onClick={handleSendTrackingWpp} disabled={!trackingCode || !postalCompany}>
                         Avisar envio no WhatsApp
                    </Button>
                  </div>
                )}
                {(shippingMethod === 'app' || shippingMethod === 'other') && (
                  <div className="mt-4 p-4 border border-dashed border-gray-300 bg-gray-50 rounded-lg">
                    <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">{shippingMethod === 'app' ? 'Qual Aplicativo?' : 'Tipo de Envio'}</label>
                    <Input placeholder={shippingMethod === 'app' ? "Ex: Uber Moto..." : "Especifique..."} className="h-9 bg-white text-sm" value={postalCompany} onChange={e => setPostalCompany(e.target.value)} />
                  </div>
                )}

                {/* Custos de Envio se não for presencial */}
                {shippingMethod !== 'presential' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Custo de Envio (R$)</label>
                      <Input type="number" placeholder="0,00" className="h-9 bg-white text-sm font-bold" value={shippingCost || ''} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Quem Paga?</label>
                      <select className="w-full h-9 border border-gray-200 text-sm rounded-md px-2 bg-white" value={shippingPayer} onChange={e => setShippingPayer(e.target.value as 'buyer'|'seller')}>
                        <option value="buyer">Comprador</option>
                        <option value="seller">Vendedor</option>
                      </select>
                    </div>
                  </div>
                )}
             </div>

             <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Endereço de Entrega (Opcional)</label>
                <textarea 
                  className="w-full min-h-[80px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-400"
                  placeholder="Endereço completo de entrega..."
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                />
             </div>

          </div>
        </div>

        {/* Rodapé - Totais e Confirmar */}
        <div className="bg-slate-900 border-t border-slate-800 p-5 md:px-8 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex gap-6 w-full md:w-auto overflow-x-auto text-white">
               <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold text-lg">R$ {subTotal.toFixed(2)}</span>
               </div>
               
               {applyShippingToTotal > 0 && (
                 <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Frete Extra</span>
                    <span className="font-bold text-lg text-slate-300">+ R$ {applyShippingToTotal.toFixed(2)}</span>
                 </div>
               )}

               {actualDiscount > 0 && (
                 <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Descontos</span>
                    <span className="font-bold text-lg text-primary">- R$ {actualDiscount.toFixed(2)}</span>
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto shrink-0 justify-between md:justify-end">
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Total a Receber</span>
                  <span className="text-3xl font-black text-white">R$ {grandTotal.toFixed(2)}</span>
               </div>
               
               <Button 
                className="h-14 px-8 text-lg font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 border-none transition-all hover:scale-105 active:scale-95" 
                onClick={handleValidationBeforeCheckout}
                disabled={cart.length === 0 || checkoutMutation.isPending || !saleOrigin}
               >
                 {checkoutMutation.isPending ? 'Processando...' : (
                   <div className="flex items-center gap-2">
                     <CheckCircle className="h-6 w-6" /> 
                     <span>Finalizar</span>
                   </div>
                 )}
               </Button>
            </div>
        </div>



        {/* Ticket Release Dialog */}
        <Dialog open={!!releaseTicketUrl} onOpenChange={(open) => !open && setReleaseTicketUrl(null)}>
           <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="flex justify-center items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-6 h-6" /> Pagamento Confirmado!
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm font-semibold text-slate-700 leading-tight">
                  Como essa venda foi em um <span className="text-purple-600 font-bold">Ponto Parceiro</span>, gere e copie o seu Passe de Liberação para enviar ao cliente!
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 relative">
                   <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Link Antifraude:</p>
                   <Input readOnly value={releaseTicketUrl || ''} className="text-xs text-center bg-white h-10 font-mono text-slate-500 pr-10 truncate" />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (releaseTicketUrl) {
                        navigator.clipboard.writeText(releaseTicketUrl);
                        toast.success("Link copiado!");
                      }
                    }}
                    variant="outline"
                    className="h-12 font-bold flex-1 border-slate-300"
                  >
                    Copiar
                  </Button>
                  <Button 
                    onClick={() => {
                        let phoneStr = releaseTicketCustomerPhone.replace(/\D/g, '');
                        if (phoneStr && phoneStr.length < 12 && phoneStr.length >= 10) phoneStr = '55' + phoneStr;
                        const cName = releaseTicketCustomerName ? releaseTicketCustomerName.split(' ')[0] : 'Cliente';
                        const text = `Oi ${cName}! Pagamento recebido com sucesso ✅\n\nAqui está o seu Passe de Liberação Digital.\nApresente esta tela na recepção para retirar suas peças:\n${releaseTicketUrl}`;
                        const url = phoneStr 
                            ? `https://wa.me/${phoneStr}?text=${encodeURIComponent(text)}`
                            : `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                    }}
                    className="h-12 font-bold text-sm sm:text-base flex-[2.5] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_5px_15px_rgba(5,150,105,0.4)] transition-all hover:scale-[1.02]"
                  >
                    Enviar no WhatsApp
                  </Button>
                </div>
              </div>
              <DialogFooter className="sm:justify-center">
                 <button onClick={() => setReleaseTicketUrl(null)} className="text-xs text-slate-400 font-semibold hover:text-slate-600 uppercase border-b border-transparent hover:border-slate-400 pb-0.5">ESTOU NO LOCAL (NÃO ENVIAR LINK)</button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
