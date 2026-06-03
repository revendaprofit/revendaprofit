import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, Search, XCircle, CreditCard, Banknote, UndoIcon, Eye, Filter, CheckCircle, Store, Trash2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Sale = {
  id: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  payment_method_2?: string;
  payment_amount_2?: number;
  payment_fee_amount?: number;
  payment_fee_amount_2?: number;
  status: string;
  created_at: string;
  sale_origin?: string;
  shipping_method?: string;
  shipping_cost?: number;
  discount_type?: string;
  shipping_payer?: string;
  customers: any;
  customer_id?: string;
  sale_items?: { unit_cost: number, quantity: number }[];
  partnership_orders?: any[];
  partner_point_id?: string;
  partner_points?: any;
  sale_installments?: { status: string, amount: number, payment_method_id: string }[];
};

type SaleItem = {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  total_price: number;
  products: any;
  product_variants: any;
};

export default function SalesHistory() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'complete' | 'reopenpos' | 'hard_delete' | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'vendas' | 'auditoria'>('vendas');
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set());
  const [confirmFixOpen, setConfirmFixOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterShipping, setFilterShipping] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDiscount, setFilterDiscount] = useState('');
  const [filterPayer, setFilterPayer] = useState('');

  // Busca Vendas
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, total_amount, discount, payment_method, payment_method_2, payment_amount_2, payment_fee_amount, payment_fee_amount_2, status, created_at,
          sale_origin, shipping_method, shipping_cost, discount_type, shipping_payer, customer_id, partner_point_id,
          customers ( name ),
          partner_points ( name, commission_arara ),
          sale_installments ( status, amount, payment_method_id ),
          sale_items ( product_id, unit_cost, quantity, products ( name, cost_price ) ),
          partnership_orders ( product_id, partnership_settlements ( amount_owed, cost_slice, profit_slice, fee_slice ) )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  // Busca Itens da Venda Selecionada (só roda se houver saleId)
  const { data: saleItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['sale-items', selectedSaleId],
    enabled: !!selectedSaleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id, product_id, variant_id, quantity, unit_price, unit_cost, total_price,
          products ( name, cost_price ),
          product_variants ( size, color )
        `)
        .eq('sale_id', selectedSaleId);
      
      if (error) throw error;
      return data as SaleItem[];
    }
  });

  const { data: payMethods = [] } = useQuery({
    queryKey: ['payment-methods-history'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      const { data, error } = await supabase.from('payment_methods').select('*').eq('owner_id', user.id).eq('is_active', true).order('created_at');
      if (error) throw error;
      return data;
    }
  });

  const cancelSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      // Cancelar parcelas pendentes para não aparecerem no relatório a prazo
      await supabase
        .from('sale_installments')
        .update({ status: 'cancelled' })
        .eq('sale_id', id)
        .eq('status', 'pending');
      // Limpar acerto de parceria: busca o partnership_order desta venda
      const { data: pOrders } = await supabase
        .from('partnership_orders')
        .select('id')
        .eq('sale_id', id);
      if (pOrders && pOrders.length > 0) {
        const pOrderIds = pOrders.map((o: any) => o.id);
        // Deleta settlements abertos vinculados a esses partnership_orders
        await supabase
          .from('partnership_settlements')
          .delete()
          .in('partnership_order_id', pOrderIds)
          .eq('status', 'open');
        // Marca os partnership_orders como cancelados
        await supabase
          .from('partnership_orders')
          .update({ status: 'cancelled' })
          .in('id', pOrderIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Venda estornada com sucesso e estoque devolvido.');
      setIsDetailsOpen(false);
    },
    onError: (e: any) => toast.error(`Erro ao cancelar: ${e.message}`)
  });

  const hardDeleteSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      // Primeiro cancelar para garantir a devolução do estoque via trigger
      const sale = sales.find(s => s.id === id);
      if (sale && sale.status !== 'cancelled') {
        await supabase.from('sales').update({ status: 'cancelled' }).eq('id', id);
      }
      // Depois apagar fisicamente
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Venda excluída permanentemente.');
      setIsDetailsOpen(false);
    },
    onError: (e: any) => toast.error(`Erro ao excluir: ${e.message}`)
  });

  const forceCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Venda concluída manualmente.');
      setIsDetailsOpen(false);
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  });

  const handleOpenDetails = (id: string) => {
    setSelectedSaleId(id);
    setIsDetailsOpen(true);
  };

  const getPaymentLabel = (method: string) => {
    const pm = payMethods.find((p:any) => p.id === method);
    if (pm) return pm.name;
    switch (method) {
      case 'pix': return 'PIX';
      case 'credit': return 'Cartão de Crédito';
      case 'debit': return 'Cartão de Débito';
      case 'cash': return 'Dinheiro';
      case 'link': return 'Link de Pagamento';
      default: return method;
    }
  };

  const getSalePaymentMethods = (sale: Sale) => {
    // Se não houver parcelas, ou se as parcelas não estiverem pagas, mostrar o método original
    const paidInstallments = sale.sale_installments?.filter(i => (i.status === 'paid' || i.status === 'completed') && i.payment_method_id) || [];
    
    if (paidInstallments.length === 0) {
      let label = getPaymentLabel(sale.payment_method);
      if (sale.payment_method_2) label += ` + ${getPaymentLabel(sale.payment_method_2)}`;
      return label;
    }

    // Se houver parcelas pagas, agrupar os métodos
    const methods = new Set<string>();
    
    // Adicionar métodos de pagamentos diretos que não são a prazo
    // (Apenas se não for o método principal de parcelamento)
    const pm1 = payMethods.find((p:any) => p.id === sale.payment_method);
    if (pm1 && !pm1.is_installment) methods.add(pm1.name);
    else if (!pm1 && !['installment', 'prazo'].some(s => sale.payment_method.toLowerCase().includes(s))) methods.add(getPaymentLabel(sale.payment_method));

    const pm2 = payMethods.find((p:any) => p.id === sale.payment_method_2);
    if (pm2 && !pm2.is_installment) methods.add(pm2.name);
    else if (sale.payment_method_2 && !pm2) methods.add(getPaymentLabel(sale.payment_method_2));

    // Adicionar métodos das parcelas
    paidInstallments.forEach(inst => {
      methods.add(getPaymentLabel(inst.payment_method_id));
    });

    return Array.from(methods).join(' + ');
  };

  // Mutation: corrige o histórico financeiro dos itens selecionados
  const fixPriceMutation = useMutation({
    mutationFn: async (itemsToFix: any[]) => {
      // Agrupar por sale_id para recalcular total_amount de cada venda
      const bySaleId: Record<string, { saleItemId: string; correctPrice: number; qty: number; oldTotal: number; newTotal: number }[]> = {};

      for (const item of itemsToFix) {
        const correctPrice = parseFloat(item.product_variants?.sale_price);
        const newTotal = correctPrice * item.quantity;
        const oldTotal = Number(item.unit_price) * item.quantity;

        // 1. Atualiza unit_price e total_price do sale_item
        const { error: itemErr } = await supabase
          .from('sale_items')
          .update({ unit_price: correctPrice, total_price: newTotal })
          .eq('id', item.id);
        if (itemErr) throw new Error(`Erro ao corrigir item ${item.id}: ${itemErr.message}`);

        if (!bySaleId[item.sale_id]) bySaleId[item.sale_id] = [];
        bySaleId[item.sale_id].push({ saleItemId: item.id, correctPrice, qty: item.quantity, oldTotal, newTotal });
      }

      // 2. Para cada venda afetada, recalcular total_amount somando todos os itens
      for (const [saleId, fixedItems] of Object.entries(bySaleId)) {
        const { data: allItems, error: fetchErr } = await supabase
          .from('sale_items')
          .select('total_price')
          .eq('sale_id', saleId);
        if (fetchErr) throw new Error(`Erro ao buscar itens da venda ${saleId}: ${fetchErr.message}`);

        const newTotalAmount = (allItems || []).reduce((acc: number, si: any) => acc + Number(si.total_price), 0);
        const { error: saleErr } = await supabase
          .from('sales')
          .update({ total_amount: newTotalAmount })
          .eq('id', saleId);
        if (saleErr) throw new Error(`Erro ao atualizar venda ${saleId}: ${saleErr.message}`);

        // 3. Ajustar partnership_settlements abertos vinculados a esta venda
        for (const fi of fixedItems) {
          const { data: pOrders } = await supabase
            .from('partnership_orders')
            .select('id, sale_price')
            .eq('sale_id', saleId);

          if (pOrders && pOrders.length > 0) {
            for (const po of pOrders) {
              const oldSalePrice = Number(po.sale_price || fi.correctPrice);
              if (oldSalePrice === 0) continue;
              const { data: settlements } = await supabase
                .from('partnership_settlements')
                .select('id, profit_slice, cost_slice, fee_slice')
                .eq('partnership_order_id', po.id)
                .eq('status', 'open');

              if (settlements && settlements.length > 0) {
                // Atualiza também o sale_price no partnership_order
                await supabase
                  .from('partnership_orders')
                  .update({ sale_price: fi.correctPrice })
                  .eq('id', po.id);

                for (const s of settlements) {
                  const ratio = fi.correctPrice / oldSalePrice;
                  const newProfitSlice = Number(s.profit_slice) * ratio;
                  const newAmountOwed = Math.max(0, Number(s.cost_slice) + newProfitSlice - Number(s.fee_slice));
                  await supabase
                    .from('partnership_settlements')
                    .update({ profit_slice: newProfitSlice, amount_owed: newAmountOwed })
                    .eq('id', s.id);
                }
              }
            }
          }
        }
      }

      return Object.keys(bySaleId).length;
    },
    onSuccess: (count) => {
      toast.success(`✅ ${count} venda(s) corrigida(s) com sucesso no histórico financeiro!`);
      setSelectedAuditIds(new Set());
      setConfirmFixOpen(false);
      setFixingAll(false);
      queryClient.invalidateQueries({ queryKey: ['audit-price-discrepancy'] });
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (e: any) => {
      toast.error('Erro ao corrigir: ' + e.message);
      setConfirmFixOpen(false);
      setFixingAll(false);
    }
  });

  const getStatusBadge = (status: string) => {
    if (status === 'completed' || status === 'p2p_settlement') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wide">Concluída</span>;
    }
    if (status === 'installment' || status === 'p2p_pending_payment') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">Pagamento Pendente</span>;
    }
    if (status === 'open') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">Em Aberto</span>;
    }
    if (status === 'rejected_p2p') {
      return <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase shadow-sm animate-pulse whitespace-nowrap">🚨 Ação Nec: Parceiro Recusou</span>;
    }
    return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">Cancelada</span>;
  };

  const filteredSales = sales.filter(s => {
    // Cliente/Search
    const customerMatch = s.customers?.name?.toLowerCase().includes(search.toLowerCase());
    const isAnonymous = search.toLowerCase() === 'anônimo' && !s.customers;
    const matchesSearch = search === '' ? true : (customerMatch || isAnonymous || s.id.includes(search));

    // Data
    const saleDate = new Date(s.created_at).toISOString().split('T')[0];
    const matchesDateFrom = dateFrom ? saleDate >= dateFrom : true;
    const matchesDateTo = dateTo ? saleDate <= dateTo : true;

    // Filters
    const matchesOrigin = filterOrigin ? s.sale_origin === filterOrigin : true;
    const matchesPayment = filterPayment ? (s.payment_method === filterPayment || s.payment_method_2 === filterPayment) : true;
    const matchesShipping = filterShipping ? s.shipping_method === filterShipping : true;
    const matchesStatus = filterStatus ? s.status === filterStatus : true;
    const matchesDiscount = filterDiscount ? s.discount_type === filterDiscount : true;
    const matchesPayer = filterPayer ? s.shipping_payer === filterPayer : true;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesOrigin && matchesPayment && matchesShipping && matchesStatus && matchesDiscount && matchesPayer;
  });

  // Calcula Resumo Financeiro Dinâmico por Filtros (ignorando vendas canceladas)
  const selectedSale = sales.find(s => s.id === selectedSaleId);
  const validSales = filteredSales.filter(s => s.status !== 'cancelled');
  const sumVendas = validSales.reduce((a, b) => a + Number(b.total_amount || 0), 0);
  const sumCustos = validSales.reduce((a, s) => {
      // Para cada item da venda, verifica se tem settlement de parceria para compor o custo real
      const pOrders = s.partnership_orders || [];
      const itemsCost = s.sale_items?.reduce((acc: number, item: any) => {
          const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
          const pSetRaw = pOrder?.partnership_settlements;
          const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
          
          const pureCst = Number(item.unit_cost) || Number(item.products?.cost_price) || 0;
          const pureCostTotal = pureCst * Number(item.quantity || 1);

          if (pSettlement && pSettlement.amount_owed) {
             // O custo reflete minha obrigação total com o parceiro + a parte do meu custo que eu banquei
             // Wait, if pureCost is 76, and partner repaid 38. The total money leaving my domain is pureCost (part gone out the window) + profit_slice to partner.
             // But actually, sumCustos for the top dashboard should just be: Total Owed to partner + MY cost liability.
             // Actually, let's keep sumCustos as Pure Cost + Repasse portion, or maybe just Pure Cost is easier for the dashboard.
             // The dashboard should probably reflect pure cost. Let's make it the Pure Cost.
             return acc + pureCostTotal;
          } else {
             return acc + pureCostTotal;
          }
      }, 0) || 0;
      
      const repassesCost = s.partnership_orders?.reduce((acc: number, po: any) => {
          const pSetRaw = po.partnership_settlements;
          const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
          return acc + (pSettlement?.profit_slice ? Number(pSettlement.profit_slice) : 0);
      }, 0) || 0;

      const ppCommissionRate = Number(s.partner_points?.commission_arara || 0) / 100;
      const ppCommissionCost = s.partner_point_id ? (Number(s.total_amount) * ppCommissionRate) : 0;

      return a + itemsCost + repassesCost + ppCommissionCost;
  }, 0);
  const sumLucroLiquido = sumVendas - sumCustos - validSales.reduce((a, s) => a + (Number(s.payment_fee_amount) || 0) + (Number(s.payment_fee_amount_2) || 0) + (s.shipping_payer === 'seller' ? (Number(s.shipping_cost) || 0) : 0), 0); const margemLucro = sumVendas > 0 ? (sumLucroLiquido / sumVendas) * 100 : 0;

  // Auditoria: busca itens de venda onde o unit_price diverge do sale_price da variante
  // (indica possível impacto do bug de preço promocional)
  const { data: auditItems = [], isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ['audit-price-discrepancy'],
    enabled: activeTab === 'auditoria',
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      // Busca sale_items que têm variante com sale_price preenchido e menor que o unit_price registrado
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id, sale_id, product_id, variant_id, quantity, unit_price, total_price,
          products ( name, sale_price ),
          product_variants ( size, color, sale_price ),
          sales!inner ( owner_id, created_at, status, sale_origin, customers ( name ) )
        `)
        .eq('sales.owner_id', user.id)
        .neq('sales.status', 'cancelled')
        .not('variant_id', 'is', null)
        .order('sales(created_at)', { ascending: false })
        .limit(500);
      if (error) throw error;
      // Filtrar somente os que têm discrepância: variante tem preço promocional diferente do registrado
      return (data || []).filter((item: any) => {
        const variantPromoPrice = item.product_variants?.sale_price
          ? parseFloat(item.product_variants.sale_price)
          : null;
        if (!variantPromoPrice || variantPromoPrice <= 0) return false;
        const productNormalPrice = parseFloat(item.products?.sale_price || 0);
        // Só é promoção se o preço da variante for MENOR que o produto
        if (variantPromoPrice >= productNormalPrice) return false;
        // Há discrepância se o unit_price registrado NÃO é o preço promocional
        return Math.abs(Number(item.unit_price) - variantPromoPrice) > 0.01;
      });
    }
  });


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Histórico de Vendas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu faturamento, custos e lucro dos filtros selecionados.</p>
      </div>

      {/* Abas de Navegação */}
      <div className="flex gap-2 border-b pb-0">
        <button
          id="tab-vendas"
          onClick={() => setActiveTab('vendas')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'vendas'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Receipt className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Vendas
        </button>
        <button
          id="tab-auditoria"
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'auditoria'
              ? 'border-amber-500 text-amber-700 bg-amber-50'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Auditoria de Preços
        </button>
      </div>


      {activeTab === 'vendas' && (
        <>
      {/* Mini Relatório Dinâmico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Vendas</p>
              <p className="text-2xl font-black text-emerald-600 truncate">R$ {sumVendas.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Lucro Líquido</p>
              <p className="text-2xl font-black text-blue-600 truncate">R$ {sumLucroLiquido.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Margem de Lucro</p>
              <p className="text-2xl font-black text-purple-600 truncate">{margemLucro.toFixed(2)}%</p>
            </div>
          </div>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Filter className="h-4 w-4"/> Filtros Avançados</h3>
          <div className="flex items-center bg-muted rounded-lg px-3 py-1.5 w-full sm:max-w-xs border border-transparent focus-within:bg-background focus-within:border-primary/50 transition-colors">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              className="bg-transparent border-none outline-none text-sm w-full" 
              placeholder="Buscar por cliente ou ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Data Início</label>
              <Input type="date" className="h-8 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Data Fim</label>
              <Input type="date" className="h-8 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Origem</label>
              <select className="w-full text-sm h-8 rounded-md border border-input bg-background px-2 focus:ring-1 focus:ring-primary shadow-sm" value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}>
                 <option value="">Todas</option>
                 <option value="Loja Online">Loja Online</option>
                 <option value="Evento">Evento</option>
                 <option value="Bolsa Consignada">Bolsa Consignada</option>
                 <option value="Consórcio">Consórcio</option>
                 <option value="Parcela Consórcio">Parcela Consórcio</option>
                 <option value="Bazar VIP">Bazar VIP</option>
                 <option value="Ponto Parceiro">Ponto Parceiro</option>
                 <option value="Loja Física">Loja Física</option>
                 <option value="Instagram">Instagram</option>
                 <option value="WhatsApp">WhatsApp</option>
              </select>
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Pagamento</label>
              <select className="w-full text-sm h-8 rounded-md border border-input bg-background px-2 focus:ring-1 focus:ring-primary shadow-sm" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                 <option value="">Todas</option>
                 {payMethods.map((pm:any) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                 <option value="pix">PIX (Antigo)</option>
                 <option value="credit">Cartão de Crédito (Antigo)</option>
                 <option value="debit">Cartão de Débito (Antigo)</option>
                 <option value="cash">Dinheiro (Antigo)</option>
              </select>
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
              <select className="w-full text-sm h-8 rounded-md border border-input bg-background px-2 focus:ring-1 focus:ring-primary shadow-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                 <option value="">Todos</option>
                 <option value="completed">Concluída</option>
                 <option value="open">Em aberto</option>
                 <option value="p2p_settlement">Acerto de Contas</option>
                 <option value="cancelled">Cancelada</option>
                 <option value="rejected_p2p">Ação Necessária (Recusada)</option>
              </select>
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Envio</label>
              <select className="w-full text-sm h-8 rounded-md border border-input bg-background px-2 focus:ring-1 focus:ring-primary shadow-sm" value={filterShipping} onChange={e => setFilterShipping(e.target.value)}>
                 <option value="">Todos</option>
                 <option value="presential">Presencial</option>
                 <option value="postal">Postagem</option>
                 <option value="app">Aplicativo</option>
                 <option value="other">Outros</option>
              </select>
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Pagador Frete</label>
              <select className="w-full text-sm h-8 rounded-md border border-input bg-background px-2 focus:ring-1 focus:ring-primary shadow-sm" value={filterPayer} onChange={e => setFilterPayer(e.target.value)}>
                 <option value="">Todos</option>
                 <option value="buyer">Comprador</option>
                 <option value="seller">Vendedor</option>
              </select>
           </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[150px]">Data/Hora</TableHead>
              <TableHead className="min-w-[150px]">Cliente</TableHead>
              <TableHead className="min-w-[100px]">Forma Pag.</TableHead>
              <TableHead className="min-w-[100px]">Total</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando histórico...</TableCell></TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma venda encontrada.</TableCell></TableRow>
            ) : (
              filteredSales.map(sale => (
                <TableRow key={sale.id} className={sale.status === 'cancelled' ? 'opacity-60 bg-muted/30' : ''}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {new Date(sale.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{sale.customers?.name || <span className="text-muted-foreground italic">Anônimo</span>}</TableCell>
                  <TableCell>{getSalePaymentMethods(sale)}</TableCell>
                  <TableCell>
                    <span className="font-bold whitespace-nowrap">R$ {Number(sale.total_amount).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(sale.id)}>
                      <Eye className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Visualizar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

        </>
      )}

      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          {/* Informações sobre a auditoria */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">Auditoria de Preços Promocionais</h3>
              <p className="text-sm text-amber-800">
                Esta tela detecta automaticamente vendas onde o preço registrado <strong>não corresponde</strong> ao preço promocional da variante.
                Isso pode ter ocorrido antes da correção do sistema. Use esta auditoria para identificar vendas que podem ter sido faturadas incorretamente.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded-full font-semibold">✅ Correção aplicada: novas vendas não serão afetadas</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">🔍 Mostrando as últimas 500 peças vendidas</span>
              </div>
            </div>
            <button
              id="btn-refresh-audit"
              onClick={() => refetchAudit()}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </button>
          </div>

          {loadingAudit ? (
            <div className="text-center py-10 text-muted-foreground">Analisando vendas...</div>
          ) : auditItems.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center text-center">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="font-bold text-emerald-900 text-lg mb-1">Nenhuma discrepância encontrada!</h3>
              <p className="text-sm text-emerald-700 max-w-sm">
                Todas as vendas analisadas foram registradas com o preço correto da variante.
                Ou ainda não há variantes com preço promocional cadastrado.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <div className="p-4 bg-amber-50 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <span className="font-semibold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {auditItems.length} item(ns) com discrepância de preço encontrado(s)
                </span>
                <div className="flex gap-2 flex-wrap">
                  {selectedAuditIds.size > 0 && (
                    <button
                      id="btn-fix-selected"
                      onClick={() => { setFixingAll(false); setConfirmFixOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors"
                      disabled={fixPriceMutation.isPending}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Corrigir Selecionados ({selectedAuditIds.size})
                    </button>
                  )}
                  <button
                    id="btn-fix-all"
                    onClick={() => { setFixingAll(true); setConfirmFixOpen(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors"
                    disabled={fixPriceMutation.isPending}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Corrigir Todos ({auditItems.length})
                  </button>
                </div>
              </div>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-8">
                      <input
                        type="checkbox"
                        id="audit-select-all"
                        className="rounded"
                        checked={selectedAuditIds.size === auditItems.length && auditItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAuditIds(new Set(auditItems.map((i: any) => i.id)));
                          else setSelectedAuditIds(new Set());
                        }}
                      />
                    </TableHead>
                    <TableHead>Data da Venda</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead className="text-right">Preço Cobrado</TableHead>
                    <TableHead className="text-right text-emerald-700">Preço Correto</TableHead>
                    <TableHead className="text-right text-red-600">Diferença</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditItems.map((item: any) => {
                    const correctPrice = parseFloat(item.product_variants?.sale_price);
                    const chargedPrice = Number(item.unit_price);
                    const diff = (chargedPrice - correctPrice) * item.quantity;
                    const saleDate = item.sales?.created_at ? new Date(item.sales.created_at).toLocaleDateString('pt-BR') : '-';
                    return (
                      <TableRow
                        key={item.id}
                        className={`hover:bg-amber-50 transition-colors ${selectedAuditIds.has(item.id) ? 'bg-amber-50' : 'bg-red-50/20'}`}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            id={`audit-check-${item.id}`}
                            className="rounded"
                            checked={selectedAuditIds.has(item.id)}
                            onChange={(e) => {
                              const next = new Set(selectedAuditIds);
                              if (e.target.checked) next.add(item.id); else next.delete(item.id);
                              setSelectedAuditIds(next);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{saleDate}</TableCell>
                        <TableCell className="text-xs">{item.sales?.customers?.name || <span className="italic text-muted-foreground">Anônimo</span>}</TableCell>
                        <TableCell className="text-xs">{item.sales?.sale_origin || '-'}</TableCell>
                        <TableCell className="font-medium text-xs">{item.products?.name}</TableCell>
                        <TableCell className="text-xs">{item.product_variants?.size} {item.product_variants?.color}</TableCell>
                        <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right text-xs">
                          <span className="font-medium text-red-600">R$ {chargedPrice.toFixed(2)}</span>
                          <span className="text-[10px] text-gray-400 block">(normal: R$ {parseFloat(item.products?.sale_price).toFixed(2)})</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700 text-xs">R$ {correctPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-red-600 text-xs">+ R$ {diff.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              id={`audit-open-sale-${item.sale_id}`}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => { setActiveTab('vendas'); handleOpenDetails(item.sale_id); }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              id={`audit-fix-item-${item.id}`}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold"
                              disabled={fixPriceMutation.isPending}
                              onClick={() => { setSelectedAuditIds(new Set([item.id])); setFixingAll(false); setConfirmFixOpen(true); }}
                            >
                              Corrigir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="p-4 bg-amber-50/50 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-amber-900 font-semibold">
                    Impacto total estimado:
                    <span className="ml-2 text-red-600 text-base font-black">
                      + R$ {auditItems.reduce((acc: number, item: any) => acc + ((Number(item.unit_price) - parseFloat(item.product_variants?.sale_price)) * item.quantity), 0).toFixed(2)}
                    </span>
                    <span className="text-amber-700 font-normal"> a mais registrado vs. preço promocional correto</span>
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    ⚠️ A correção atualiza o histórico. Ela NÃO devolve dinheiro — apenas corrige o registro financeiro interno.
                  </p>
                </div>
                {selectedAuditIds.size > 0 && (
                  <button
                    onClick={() => { setFixingAll(false); setConfirmFixOpen(true); }}
                    className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                    disabled={fixPriceMutation.isPending}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Corrigir {selectedAuditIds.size} item(ns) selecionado(s)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diálogo de Confirmação de Correção */}
      <Dialog open={confirmFixOpen} onOpenChange={(o) => !fixPriceMutation.isPending && setConfirmFixOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirmar Correção do Histórico
            </DialogTitle>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 space-y-2">
            <p className="font-bold">Você está prestes a corrigir o histórico financeiro.</p>
            <p>
              Serão corrigidos <strong>{fixingAll ? auditItems.length : selectedAuditIds.size}</strong> item(ns).
              O sistema vai:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Atualizar o <code>unit_price</code> e <code>total_price</code> de cada item de venda</li>
              <li>Recalcular o <code>total_amount</code> de cada venda afetada</li>
              <li>Ajustar proporcionalmente os repasses P2P (se houver)</li>
            </ul>
            <p className="text-amber-700 font-semibold text-xs mt-2">
              ⚠️ Esta ação NÃO devolve dinheiro ao cliente — apenas corrige o registro interno.
              Certifique-se de que os preços estão corretos antes de prosseguir.
            </p>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setConfirmFixOpen(false)} disabled={fixPriceMutation.isPending}>
              Cancelar
            </Button>
            <Button
              id="btn-confirm-fix"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              disabled={fixPriceMutation.isPending}
              onClick={() => {
                const toFix = fixingAll
                  ? auditItems
                  : auditItems.filter((i: any) => selectedAuditIds.has(i.id));
                fixPriceMutation.mutate(toFix);
              }}
            >
              {fixPriceMutation.isPending ? 'Corrigindo...' : 'Sim, Corrigir Histórico'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Venda */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-xl p-4 sm:p-6 rounded-xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Recibo da Venda</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between bg-muted/40 p-4 rounded-lg border gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                  <p className="font-medium">{selectedSale.customers?.name || 'Cliente Anônimo'}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  {getStatusBadge(selectedSale.status)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 border-b pb-2">Itens Comprados</h4>
                {loadingItems ? (
                  <p className="text-sm text-muted-foreground">Carregando itens...</p>
                ) : (
                  <div className="space-y-3">
                    {saleItems.map(item => (
                      <div key={item.id} className="flex justify-between items-start sm:items-center text-sm gap-2">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x</span> {item.products?.name}
                          {item.product_variants && (
                            <span className="text-muted-foreground ml-1">
                              ({item.product_variants.size} {item.product_variants.color})
                            </span>
                          )}
                        </div>
                        <div className="font-medium whitespace-nowrap">R$ {Number(item.total_price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método(s) de Pagamento:</span>
                  <span className="font-medium text-right">
                    {getSalePaymentMethods(selectedSale)}
                  </span>
                </div>
                {Number(selectedSale.discount) > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Desconto Aplicado:</span>
                    <span>- R$ {Number(selectedSale.discount).toFixed(2)}</span>
                  </div>
                )}
                {selectedSale.shipping_method && selectedSale.shipping_method !== 'presential' && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Frete ({selectedSale.shipping_payer === 'buyer' ? 'Pago pelo Comprador' : 'Pago pela Loja'}):</span>
                     <span>{selectedSale.shipping_payer === 'buyer' ? '+' : '-'} R$ {Number(selectedSale.shipping_cost || 0).toFixed(2)}</span>
                   </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t">
                  <span className="font-bold">Total Pago:</span>
                  <span className="font-black text-primary">R$ {Number(selectedSale.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Balanço Financeiro Real */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-2 mt-4 text-sm">
                <h4 className="font-semibold text-emerald-900 border-b border-emerald-200 pb-2 mb-3">Balanço Financeiro (Lucro Real)</h4>
                
                {(() => {
                  // Parcela de Consórcio: sem itens = lucro puro
                  const isParcelaConsorcio = selectedSale.sale_origin === 'Parcela Consórcio' && saleItems.length === 0;

                  if (isParcelaConsorcio) {
                    const revenue = Number(selectedSale.total_amount) - Number(selectedSale.discount);
                    const fees = Number(selectedSale.payment_fee_amount || 0) + Number(selectedSale.payment_fee_amount_2 || 0);
                    const netProfit = revenue - fees;
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                          <span className="text-lg">📄</span>
                          <span className="text-amber-800 font-semibold text-xs">Parcela de Consórcio (receita pura, sem custo de produto)</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Receita da Parcela:</span>
                          <span className="font-semibold">R$ {revenue.toFixed(2)}</span>
                        </div>
                        {fees > 0 && (
                          <div className="flex justify-between text-red-600 mt-1">
                            <span>Taxas:</span>
                            <span>- R$ {fees.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-black text-emerald-700 pt-2 border-t border-emerald-200 mt-2">
                          <span>Lucro Líquido (Você):</span>
                          <span>R$ {netProfit.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  }

                  const grossRevenue = saleItems.reduce((acc, item) => acc + Number(item.total_price), 0) - Number(selectedSale.discount);
                  
                  const pOrders = selectedSale.partnership_orders || [];
                  const pureCost = saleItems.reduce((acc, item) => {
                       const c = item.unit_cost && item.unit_cost > 0 ? item.unit_cost : (item.products?.cost_price || 0);
                       return acc + (Number(c) * item.quantity);
                  }, 0);
                  
                  const grossProfit = grossRevenue - pureCost;

                  let totalRepasse = 0;
                  let totalFeeSlices = 0;
                  const repasseDetails: any[] = [];

                  saleItems.forEach(item => {
                     const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
                     const pSetRaw = pOrder?.partnership_settlements;
                     const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;

                     if (pSettlement && pSettlement.amount_owed) {
                         const cstSlice = Number(pSettlement.cost_slice || 0);
                         const prfSlice = Number(pSettlement.profit_slice || 0);
                         const feeSlice = Number(pSettlement.fee_slice || 0);
                         totalRepasse += Number(pSettlement.amount_owed);
                         totalFeeSlices += feeSlice;
                         repasseDetails.push(
                            <div key={item.id} className="text-red-500 text-xs pl-4 border-l border-red-200 ml-1 mt-1">
                               {item.products?.name}: R$ {prfSlice.toFixed(2)} (LUCRO) + R$ {cstSlice.toFixed(2)} (REEMB. CUSTO)
                               {feeSlice > 0 && ` - R$ ${feeSlice.toFixed(2)} (TAXA DIVIDIDA)`}
                            </div>
                         );
                     }
                  });

                  const fees = Number(selectedSale.payment_fee_amount || 0) + Number(selectedSale.payment_fee_amount_2 || 0);
                  const storeShippingCost = selectedSale.shipping_payer === 'seller' ? Number(selectedSale.shipping_cost || 0) : 0;
                  // Taxas que a vendedora efetivamente paga (descontada a fatia absorvida pela sócia)
                  const myFeeBurden = fees - totalFeeSlices;

                  // Lucro Líquido = Lucro Bruto - Repasse de Lucro - Taxas da Loja - Frete da Loja
                  const totalProfitRepasse = saleItems.reduce((acc, item) => {
                     const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
                     const pSetRaw = pOrder?.partnership_settlements;
                     const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
                     return acc + (pSettlement?.amount_owed ? Number(pSettlement.profit_slice || 0) : 0);
                  }, 0);

                  const netProfit = grossProfit - totalProfitRepasse - myFeeBurden - storeShippingCost;

                  return (
                    <>
                      {selectedSale.sale_origin === 'Consórcio' && Number(selectedSale.discount) > 0 && (
                        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                          <span className="text-lg">💎</span>
                          <span className="text-blue-800 font-semibold text-xs">Venda com crédito de consórcio (desconto = crédito utilizado, só custo impacta o caixa)</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-700">
                        <span>Total Pago:</span>
                        <span className="font-semibold">R$ {grossRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 mt-1">
                        <span>Custo da Peça:</span>
                        <span>- R$ {pureCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-blue-700 font-semibold border-b border-blue-100 pb-2 mt-1">
                        <span>Lucro Bruto:</span>
                        <span>R$ {grossProfit.toFixed(2)}</span>
                      </div>

                      {totalRepasse > 0 && (
                        <div className="flex flex-col mt-2">
                           <div className="flex justify-between text-red-600">
                             <span>Repasse P2P (Lucro + Custo):</span>
                             <span>- R$ {totalRepasse.toFixed(2)}</span>
                           </div>
                           {repasseDetails}
                        </div>
                      )}

                      {myFeeBurden > 0 && (
                        <div className="flex justify-between text-red-600 mt-2">
                          <span>Taxas de Pagamento (Sua Loja):</span>
                          <span>- R$ {myFeeBurden.toFixed(2)}</span>
                        </div>
                      )}

                      {storeShippingCost > 0 && (
                        <div className="flex justify-between text-red-600 mt-2">
                          <span>Frete (Sua Loja):</span>
                          <span>- R$ {storeShippingCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {selectedSale.partner_point_id && selectedSale.partner_points && (
                        <div className="flex justify-between text-red-600 mt-2">
                          <span>Comissão Ponto Parceiro ({selectedSale.partner_points.commission_arara}%):</span>
                          <span>- R$ {(Number(selectedSale.total_amount) * Number(selectedSale.partner_points.commission_arara) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-base font-black text-emerald-700 pt-2 border-t border-emerald-200 mt-2">
                        <span>Lucro Líquido (Você):</span>
                        <span>R$ {(netProfit - (selectedSale.partner_point_id && selectedSale.partner_points ? (Number(selectedSale.total_amount) * Number(selectedSale.partner_points.commission_arara) / 100) : 0)).toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4 flex-wrap">
                  {selectedSale.status !== 'cancelled' && (
                     <>
                        {selectedSale.status === 'rejected_p2p' && (
                           <Button 
                             variant="outline" 
                             className="flex w-full sm:w-auto items-center justify-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                             onClick={() => setConfirmAction('complete')}
                             disabled={forceCompleteMutation.isPending}
                           >
                             <CheckCircle className="h-4 w-4" /> 
                             {forceCompleteMutation.isPending ? 'Resolvendo...' : 'Resolver: Marcar Como Entregue'}
                           </Button>
                        )}

                        <Button 
                          variant="outline" 
                          className="flex w-full sm:w-auto items-center justify-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                          onClick={() => setConfirmAction('reopenpos')}
                        >
                          <Store className="h-4 w-4" /> 
                          {selectedSale.status === 'rejected_p2p' ? 'Resolver: Editar no PDV' : 'Reabrir e Editar no PDV'}
                        </Button>

                        <Button 
                          variant="destructive" 
                          className="flex w-full sm:w-auto items-center justify-center gap-2"
                          onClick={() => setConfirmAction('cancel')}
                          disabled={cancelSaleMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" /> 
                          {cancelSaleMutation.isPending ? 'Estornando...' : 'Estornar e Devolver Estoque'}
                        </Button>
                     </>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="flex w-full sm:w-auto items-center justify-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => setConfirmAction('hard_delete')}
                    disabled={hardDeleteSaleMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> 
                    {hardDeleteSaleMutation.isPending ? 'Excluindo...' : 'Excluir Definitivamente'}
                  </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação das Ações */}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className={
                  confirmAction === 'cancel' || confirmAction === 'hard_delete' ? "text-red-600 flex gap-2 items-center" : 
                  (confirmAction === 'reopenpos' ? "text-blue-700 flex gap-2 items-center" : "text-emerald-700 flex gap-2 items-center")
               }>
                  {confirmAction === 'cancel' && <XCircle className="w-5 h-5"/>}
                  {confirmAction === 'hard_delete' && <Trash2 className="w-5 h-5"/>}
                  {confirmAction === 'complete' && <CheckCircle className="w-5 h-5"/>}
                  {confirmAction === 'reopenpos' && <Store className="w-5 h-5"/>}
                  
                  {confirmAction === 'cancel' ? 'Confirmar Estorno' : (confirmAction === 'reopenpos' ? 'Reabrir no Caixa (PDV)' : (confirmAction === 'hard_delete' ? 'Excluir Venda Permanentemente' : 'Concluir Venda Manualmente'))}
               </DialogTitle>
            </DialogHeader>
            <div className={`p-4 text-sm rounded-lg border shadow-inner ${confirmAction === 'cancel' || confirmAction === 'hard_delete' ? 'bg-red-50 text-red-900 border-red-100' : (confirmAction === 'reopenpos' ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-emerald-50 text-emerald-900 border-emerald-100')}`}>
               {confirmAction === 'cancel' ? (
                  <>
                    <p className="font-bold mb-2">Atenção: Cancelar esta venda é uma ação irreversível.</p>
                    <p>O financeiro será anulado e os itens devolvidos ao estoque, mas o registro do cancelamento ficará salvo no histórico. Devolva o dinheiro do cliente por fora do sistema.</p>
                  </>
               ) : confirmAction === 'hard_delete' ? (
                  <>
                    <p className="font-bold mb-2">Perigo: A exclusão permanente não pode ser desfeita.</p>
                    <p>O estoque será devolvido, mas o registro dessa venda e todos os seus itens desaparecerão completamente do banco de dados.</p>
                  </>
               ) : confirmAction === 'reopenpos' ? (
                  <>
                    <p className="font-bold mb-2">Esta venda atual será automaticamente CANCELADA e todo o seu conteúdo será reenviado para o painel do Caixa (PDV).</p>
                    <p>Você poderá alterar o pedido trocando as peças para o cliente ou ajustando os descontos antes de regravar o recibo no sistema.</p>
                  </>
               ) : (
                  <>
                    <p className="font-bold mb-2">Atenção: Ao concluir manualmente, você assumirá a responsabilidade pela entrega.</p>
                    <p>O acerto com parceiro P2P NÃO será gerado (visto que a peça foi recusada). O lucro desta venda subirá como 100% da sua loja.</p>
                  </>
               )}
            </div>
            <div className="flex gap-2 justify-end mt-4 flex-wrap">
               <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Desistir</Button>
               {confirmAction === 'cancel' ? (
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 font-bold" onClick={() => {
                     if (selectedSaleId) cancelSaleMutation.mutate(selectedSaleId);
                     setConfirmAction(null);
                  }}>Sim, Estornar Tudo</Button>
               ) : confirmAction === 'hard_delete' ? (
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 font-bold" onClick={() => {
                     if (selectedSaleId) hardDeleteSaleMutation.mutate(selectedSaleId);
                     setConfirmAction(null);
                  }}>Apagar do Banco</Button>
               ) : confirmAction === 'reopenpos' ? (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => {
                     setConfirmAction(null);
                     if (!selectedSale || !saleItems.length) return;
                     
                     // Constroi o Array para o PDV sugar na montagem (idêntico ao import do Hub)
                     const pendingOrder = {
                       id: selectedSale.id, // O ID não será reaproveitado, vai gerar nova venda.
                       order_code: selectedSale.id.split('-')[0], // Só para não quebrar a tipagem de sucesso,
                       customers: selectedSale.customer_id ? { id: selectedSale.customer_id } : null,
                       items: saleItems.map(item => ({
                          product: {
                             id: item.product_id,
                             name: item.products?.name,
                             sale_price: item.unit_price,
                             cost_price: item.unit_cost
                          },
                          variant_id: item.variant_id,
                          variant: item.product_variants ? { size: item.product_variants.size, color: item.product_variants.color } : null,
                          qty: item.quantity
                       }))
                     };
                     
                     localStorage.setItem('revenda_pos_pending_order', JSON.stringify(pendingOrder));
                     cancelSaleMutation.mutate(selectedSale.id); 
                     toast.success("Enviando venda para o PDV...");
                     setTimeout(() => navigate('/pos'), 1000); // pequeno delay visual
                  }}>Reabrir & Editar no PDV</Button>
               ) : (
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => {
                     if (selectedSaleId) forceCompleteMutation.mutate(selectedSaleId);
                     setConfirmAction(null);
                  }}>Sim, Concluir Venda</Button>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1"/>
    <rect width="5" height="5" x="16" y="3" rx="1"/>
    <rect width="5" height="5" x="3" y="16" rx="1"/>
    <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
    <path d="M21 21v.01"/>
    <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
    <path d="M3 12h.01"/>
    <path d="M12 3h.01"/>
    <path d="M12 16v.01"/>
    <path d="M16 12h1"/>
    <path d="M21 12v.01"/>
    <path d="M12 21v-1"/>
  </svg>
);
