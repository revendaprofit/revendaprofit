import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, ArrowRightLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

interface Props {
  partnershipId: string;
  partnerEmail: string;
}

type DateFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'custom';

function getDateRange(filter: DateFilter, customFrom: string, customTo: string) {
  const now = new Date();
  if (filter === 'this_month') return { from: startOfMonth(now), to: endOfDay(now) };
  if (filter === 'last_month') {
    const lm = subMonths(now, 1);
    return { from: startOfMonth(lm), to: endOfMonth(lm) };
  }
  if (filter === 'last_3_months') return { from: startOfMonth(subMonths(now, 3)), to: endOfDay(now) };
  if (filter === 'custom') {
    return {
      from: customFrom ? startOfDay(new Date(customFrom + 'T00:00:00')) : null,
      to: customTo ? endOfDay(new Date(customTo + 'T00:00:00')) : null,
    };
  }
  return { from: null, to: null };
}

export default function PartnershipSettlementsSheet({ partnershipId, partnerEmail }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ['current-user-settlements'],
    queryFn: async () => (await supabase.auth.getUser()).data.user
  });

  const { from, to } = useMemo(
    () => getDateRange(dateFilter, customFrom, customTo),
    [dateFilter, customFrom, customTo]
  );

  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['partnership-settlements', partnershipId, dateFilter, customFrom, customTo],
    enabled: !!user && open,
    queryFn: async () => {
      let query = supabase
        .from('partnership_settlements')
        .select(`
          *,
          partnership_orders(
             quantity, sale_price, sale_id,
             products(name),
             product_variants(size, color)
          )
        `)
        .eq('partnership_id', partnershipId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (from) query = query.gte('created_at', from.toISOString());
      if (to) query = query.lte('created_at', to.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: receiptSale, isLoading: receiptLoading } = useQuery({
    queryKey: ['settlement-receipt', selectedSaleId],
    enabled: !!selectedSaleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          partner_points ( name, commission_arara ),
          sale_items ( id, product_id, unit_cost, unit_price, quantity, total_price, products ( name, cost_price ) ),
          partnership_orders ( product_id, partnership_settlements ( amount_owed, cost_slice, profit_slice, fee_slice ) )
        `)
        .eq('id', selectedSaleId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('partnership_settlements')
        .update({ status: 'settled', settled_at: new Date().toISOString() })
        .eq('partnership_id', partnershipId)
        .eq('debtor_id', user?.id)
        .eq('status', 'open');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dívidas zeradas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['partnership-settlements'] });
    },
    onError: (e: any) => toast.error(e.message)
  });

  const myDebt = settlements.filter(s => s.debtor_id === user?.id).reduce((acc, s) => acc + Number(s.amount_owed), 0);
  const myCredit = settlements.filter(s => s.creditor_id === user?.id).reduce((acc, s) => acc + Number(s.amount_owed), 0);
  const balance = myCredit - myDebt;

  const filterOptions: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'this_month', label: 'Este mês' },
    { key: 'last_month', label: 'Mês passado' },
    { key: 'last_3_months', label: 'Últimos 3 meses' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const renderReceiptContent = (sale: any) => {
    const saleItems = sale.sale_items || [];
    const pOrders = sale.partnership_orders || [];

    const grossRevenue = saleItems.reduce((acc: number, item: any) => {
      const price = Number(item.total_price) || (Number(item.unit_price || 0) * Number(item.quantity));
      return acc + price;
    }, 0) - Number(sale.discount || 0);

    const pureCost = saleItems.reduce((acc: number, item: any) => {
      const c = Number(item.unit_cost) > 0 ? Number(item.unit_cost) : Number(item.products?.cost_price || 0);
      return acc + c * Number(item.quantity);
    }, 0);

    const grossProfit = grossRevenue - pureCost;

    let totalRepasse = 0;
    let totalFeeSlices = 0;
    const repasseDetails: React.ReactNode[] = [];

    saleItems.forEach((item: any, idx: number) => {
      const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
      const pSetRaw = pOrder?.partnership_settlements;
      const pSett = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
      if (pSett?.amount_owed) {
        const cst = Number(pSett.cost_slice || 0);
        const prf = Number(pSett.profit_slice || 0);
        const fee = Number(pSett.fee_slice || 0);
        totalRepasse += Number(pSett.amount_owed);
        totalFeeSlices += fee;
        repasseDetails.push(
          <div key={idx} className="text-red-500 text-xs pl-4 border-l border-red-200 ml-1 mt-1">
            {item.products?.name}: R$ {prf.toFixed(2)} (LUCRO) + R$ {cst.toFixed(2)} (CUSTO)
            {fee > 0 && ` - R$ ${fee.toFixed(2)} (TAXA DIVIDIDA)`}
          </div>
        );
      }
    });

    const fees = Number(sale.payment_fee_amount || 0) + Number(sale.payment_fee_amount_2 || 0);
    const storeShipping = sale.shipping_payer === 'seller' ? Number(sale.shipping_cost || 0) : 0;
    const myFeeBurden = fees - totalFeeSlices;

    const totalProfitRepasse = saleItems.reduce((acc: number, item: any) => {
      const pOrder = pOrders.find((po: any) => po.product_id === item.product_id);
      const pSetRaw = pOrder?.partnership_settlements;
      const pSett = Array.isArray(pSetRaw) ? pSetRaw[0] : pSetRaw;
      return acc + (pSett?.amount_owed ? Number(pSett.profit_slice || 0) : 0);
    }, 0);

    const partnerComm = sale.partner_point_id && sale.partner_points
      ? Number(sale.total_amount) * Number(sale.partner_points.commission_arara) / 100 : 0;

    const netProfit = grossProfit - totalProfitRepasse - myFeeBurden - storeShipping - partnerComm;

    return (
      <div className="space-y-1 text-sm">
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

        {storeShipping > 0 && (
          <div className="flex justify-between text-red-600 mt-2">
            <span>Frete (Sua Loja):</span>
            <span>- R$ {storeShipping.toFixed(2)}</span>
          </div>
        )}

        {partnerComm > 0 && (
          <div className="flex justify-between text-red-600 mt-2">
            <span>Comissão Ponto Parceiro ({sale.partner_points.commission_arara}%):</span>
            <span>- R$ {partnerComm.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-black text-emerald-700 pt-2 border-t border-emerald-200 mt-2">
          <span>Lucro Líquido (Você):</span>
          <span>R$ {netProfit.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <Wallet className="w-4 h-4 mr-2" />
            Acerto de Contas
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Acerto Financeiro
            </SheetTitle>
            <SheetDescription>
              Balanço de vendas mútuas com <strong className="text-foreground">{partnerEmail}</strong>.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <p className="text-center py-6 text-muted-foreground">Carregando livro caixa...</p>
          ) : (
            <div className="space-y-6">

              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Eu Devo a Ela</p>
                  <p className="text-xl font-black text-red-700">R$ {myDebt.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Ela Me Deve</p>
                  <p className="text-xl font-black text-emerald-700">R$ {myCredit.toFixed(2)}</p>
                </div>
                <div className={`col-span-2 md:col-span-1 p-4 rounded-xl border ${balance > 0 ? 'bg-indigo-50 border-indigo-200' : balance < 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs font-bold uppercase mb-1 text-slate-500">Saldo Final (Encontro)</p>
                  <p className={`text-xl font-black ${balance > 0 ? 'text-indigo-700' : balance < 0 ? 'text-orange-700' : 'text-slate-700'}`}>
                    {balance > 0 ? `+ R$ ${Math.abs(balance).toFixed(2)}` : balance < 0 ? `- R$ ${Math.abs(balance).toFixed(2)}` : 'R$ 0.00'}
                  </p>
                </div>
              </div>

              {myDebt > 0 && (
                <div className="bg-indigo-600 p-4 rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                  <div>
                    <p className="font-bold">Liquidar Minhas Dívidas</p>
                    <p className="text-xs text-indigo-200">Faça o PIX para sua parceira e marque como pago aqui.</p>
                  </div>
                  <Button onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending} className="bg-white text-indigo-700 hover:bg-gray-100 font-bold w-full md:w-auto">
                    {settleMutation.isPending ? 'Zerando...' : `Zerar - R$ ${myDebt.toFixed(2)}`}
                  </Button>
                </div>
              )}

              {/* Extrato com filtro */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold text-sm text-slate-500 uppercase">Extrato Aberto</h3>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setDateFilter(opt.key)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                        dateFilter === opt.key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Inputs de data personalizada */}
                {dateFilter === 'custom' && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">De</p>
                      <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Até</p>
                      <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                )}

                {settlements.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">Nenhuma venda pendente de acerto neste período.</p>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((s: any) => {
                      const isMyDebt = s.debtor_id === user?.id;
                      const order = s.partnership_orders;
                      const product = order?.products;
                      const variant = order?.product_variants;
                      const saleId = order?.sale_id;

                      return (
                        <div key={s.id} className={`p-4 rounded-lg border ${isMyDebt ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isMyDebt ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isMyDebt ? 'Você Vendeu (A pagar)' : 'Parceira Vendeu (A receber)'}
                                </span>
                                <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="font-bold text-sm text-slate-800 truncate">{product?.name || 'Produto Desconhecido'}</p>
                              <p className="text-[11px] text-slate-500">{order?.quantity}x Peça • {variant?.size}{variant?.color ? ` - ${variant.color}` : ''}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                (Custo: R$ {Number(s.cost_slice).toFixed(2)} / Lucro sócia: R$ {Number(s.profit_slice).toFixed(2)}
                                {Number(s.fee_slice) > 0 && ` / Taxa dividida: -R$ ${Number(s.fee_slice).toFixed(2)}`})
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                              <p className={`font-black text-lg ${isMyDebt ? 'text-red-600' : 'text-emerald-600'}`}>
                                {isMyDebt ? '-' : '+'} R$ {Number(s.amount_owed).toFixed(2)}
                              </p>
                              {saleId && (
                                <button
                                  onClick={() => setSelectedSaleId(saleId)}
                                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Ver Venda
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de recibo — fora do Sheet para evitar conflito de portal */}
      <Dialog open={!!selectedSaleId} onOpenChange={(v) => { if (!v) setSelectedSaleId(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Balanço da Venda</DialogTitle>
          </DialogHeader>
          {receiptLoading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Carregando...</p>
          ) : receiptSale ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-3">Balanço Financeiro (Lucro Real)</p>
              {renderReceiptContent(receiptSale)}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
