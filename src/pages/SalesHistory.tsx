import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, Search, XCircle, CreditCard, Banknote, UndoIcon, Eye, Filter, CheckCircle, Store } from 'lucide-react';
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
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'complete' | 'reopenpos' | null>(null);
  const [search, setSearch] = useState('');

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
          sale_items ( product_id, unit_cost, quantity, products ( name, cost_price ) ),
          partnership_orders ( product_id, partnership_settlements ( amount_owed, cost_slice, profit_slice ) )
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Venda estornada com sucesso e estoque devolvido.');
      setIsDetailsOpen(false);
    },
    onError: (e: any) => toast.error(`Erro ao cancelar: ${e.message}`)
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

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Concluída</span>;
    }
    if (status === 'installment') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">Venda a Prazo</span>;
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

  // Calcula Resumo Financeiro Dinâmico por Filtros
  const selectedSale = sales.find(s => s.id === selectedSaleId);
  const sumVendas = filteredSales.reduce((a, b) => a + Number(b.total_amount || 0), 0);
  const sumCustos = filteredSales.reduce((a, s) => {
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
  const sumLucroLiquido = sumVendas - sumCustos - filteredSales.reduce((a, s) => a + (Number(s.payment_fee_amount) || 0) + (Number(s.payment_fee_amount_2) || 0) + (s.shipping_payer === 'seller' ? (Number(s.shipping_cost) || 0) : 0), 0); const margemLucro = sumVendas > 0 ? (sumLucroLiquido / sumVendas) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Histórico de Vendas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu faturamento, custos e lucro dos filtros selecionados.</p>
      </div>

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
                  <TableCell>{getPaymentLabel(sale.payment_method)}</TableCell>
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
                    {getPaymentLabel(selectedSale.payment_method)}
                    {selectedSale.payment_method_2 && ` + ${getPaymentLabel(selectedSale.payment_method_2)}`}
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
                  const repasseDetails: any[] = [];

                  saleItems.forEach(item => {
                     const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
                     const pSetRaw = pOrder?.partnership_settlements;
                     const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
                     
                     if (pSettlement && pSettlement.amount_owed) {
                         const cstSlice = Number(pSettlement.cost_slice || 0);
                         const prfSlice = Number(pSettlement.profit_slice || 0);
                         totalRepasse += Number(pSettlement.amount_owed);
                         repasseDetails.push(
                            <div key={item.id} className="text-red-500 text-xs pl-4 border-l border-red-200 ml-1 mt-1">
                               {item.products?.name}: R$ {prfSlice.toFixed(2)} (LUCRO) + R$ {cstSlice.toFixed(2)} (REEMB. CUSTO)
                            </div>
                         );
                     }
                  });

                  const fees = Number(selectedSale.payment_fee_amount || 0) + Number(selectedSale.payment_fee_amount_2 || 0);
                  const storeShippingCost = selectedSale.shipping_payer === 'seller' ? Number(selectedSale.shipping_cost || 0) : 0;
                  const feesAndShipping = fees + storeShippingCost;
                  
                  // Lucro Líquido = Lucro Bruto - (Apenas o Repasse de Lucro, pois o repasse de custo já saiu do Lucro Bruto ao abater pureCost) - Taxas
                  const totalProfitRepasse = saleItems.reduce((acc, item) => {
                     const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
                     const pSetRaw = pOrder?.partnership_settlements;
                     const pSettlement = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
                     return acc + (pSettlement?.amount_owed ? Number(pSettlement.profit_slice || 0) : 0);
                  }, 0);

                  const netProfit = grossProfit - totalProfitRepasse - feesAndShipping;

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

                      {feesAndShipping > 0 && (
                        <div className="flex justify-between text-red-600 mt-2">
                          <span>Taxas/Frete (Sua Loja):</span>
                          <span>- R$ {feesAndShipping.toFixed(2)}</span>
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

              {(selectedSale.status === 'completed' || selectedSale.status === 'open' || selectedSale.status === 'rejected_p2p') && (
                <div className="pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4 flex-wrap">
                  
                  {selectedSale.status === 'rejected_p2p' && (
                     <>
                       <Button 
                         variant="outline" 
                         className="flex w-full sm:w-auto items-center justify-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                         onClick={() => setConfirmAction('complete')}
                         disabled={forceCompleteMutation.isPending}
                       >
                         <CheckCircle className="h-4 w-4" /> 
                         {forceCompleteMutation.isPending ? 'Resolvendo...' : 'Resolver: Marcar Como Entregue'}
                       </Button>

                       <Button 
                         variant="outline" 
                         className="flex w-full sm:w-auto items-center justify-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                         onClick={() => setConfirmAction('reopenpos')}
                       >
                         <Store className="h-4 w-4" /> 
                         Resolver: Editar no PDV
                       </Button>
                     </>
                  )}

                  <Button 
                    variant="destructive" 
                    className="flex w-full sm:w-auto items-center justify-center gap-2"
                    onClick={() => setConfirmAction('cancel')}
                    disabled={cancelSaleMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" /> 
                    {cancelSaleMutation.isPending ? 'Estornando...' : 'Devolver Dinheiro (Estornar)'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação das Ações */}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className={
                  confirmAction === 'cancel' ? "text-red-600 flex gap-2 items-center" : 
                  (confirmAction === 'reopenpos' ? "text-blue-700 flex gap-2 items-center" : "text-emerald-700 flex gap-2 items-center")
               }>
                  {confirmAction === 'cancel' && <XCircle className="w-5 h-5"/>}
                  {confirmAction === 'complete' && <CheckCircle className="w-5 h-5"/>}
                  {confirmAction === 'reopenpos' && <Store className="w-5 h-5"/>}
                  
                  {confirmAction === 'cancel' ? 'Confirmar Cancelamento' : (confirmAction === 'reopenpos' ? 'Reabrir no Caixa (PDV)' : 'Concluir Venda Manualmente')}
               </DialogTitle>
            </DialogHeader>
            <div className={`p-4 text-sm rounded-lg border shadow-inner ${confirmAction === 'cancel' ? 'bg-red-50 text-red-900 border-red-100' : (confirmAction === 'reopenpos' ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-emerald-50 text-emerald-900 border-emerald-100')}`}>
               {confirmAction === 'cancel' ? (
                  <>
                    <p className="font-bold mb-2">Atenção: Cancelar esta venda é uma ação irreversível.</p>
                    <p>Ao aprovar isso, as contabilizações financeiras dela serão zeradas no seu balanço. Você deverá devolver o dinheiro à sua cliente (via PIX, etc) por fora do sistema.</p>
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
