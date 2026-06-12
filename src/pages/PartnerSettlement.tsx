import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calculator, TrendingUp, Package, Calendar, ChevronDown } from 'lucide-react';

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }

export default function PartnerSettlement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgreementId, setSelectedAgreementId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'settled' | 'all'>('pending');
  const [costPct, setCostPct] = useState('');
  const [profitPct, setProfitPct] = useState('');

  // Buscar acordos ativos
  const { data: agreements = [] } = useQuery({
    queryKey: ['partner-agreements-active', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_agreements')
        .select('*')
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .eq('status', 'active');
      const enriched = await Promise.all((data || []).map(async (ag: any) => {
        const partnerId = ag.user_a_id === user!.id ? ag.user_b_id : ag.user_a_id;
        const { data: prof } = await supabase.from('profiles').select('email').eq('id', partnerId).single();
        return { ...ag, partner_id: partnerId, partner_email: prof?.email || ag.invited_email || 'Parceira' };
      }));
      return enriched;
    }
  });

  const selectedAgreement = agreements.find((a: any) => a.id === selectedAgreementId);
  const partnerLabel = selectedAgreement?.partner_email || 'Parceira';

  // Buscar logs de vendas da parceria
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['partner-sale-logs', selectedAgreementId, startDate, endDate, statusFilter],
    enabled: !!selectedAgreementId,
    queryFn: async () => {
      let q = supabase
        .from('partner_sale_log')
        .select('*, products(name, image_url)')
        .eq('agreement_id', selectedAgreementId)
        .eq('cancelled', false)
        .order('created_at', { ascending: false });

      if (startDate) q = q.gte('created_at', startDate);
      if (endDate) q = q.lte('created_at', endDate + 'T23:59:59');
      if (statusFilter === 'pending') q = q.eq('settled', false);
      if (statusFilter === 'settled') q = q.eq('settled', true);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar histórico de acertos
  const { data: settlements = [] } = useQuery({
    queryKey: ['partner-settlements-history', selectedAgreementId],
    enabled: !!selectedAgreementId,
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_settlements')
        .select('*')
        .eq('agreement_id', selectedAgreementId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  // Separar logs por quem vendeu
  const myLogs = logs.filter((l: any) => l.seller_id === user?.id);
  const partnerLogs = logs.filter((l: any) => l.seller_id !== user?.id);

  // Totais
  const calcTotals = (logList: any[]) => {
    const saleTotal = logList.reduce((a, l) => a + Number(l.sale_price), 0);
    const costTotal = logList.reduce((a, l) => a + Number(l.cost_price), 0);
    const feesTotal = logList.reduce((a, l) => a + Number(l.fees), 0);
    const grossProfit = saleTotal - costTotal;
    const netProfit = grossProfit - feesTotal;
    return { saleTotal, costTotal, feesTotal, grossProfit, netProfit };
  };

  const myTotals = useMemo(() => calcTotals(myLogs), [myLogs]);
  const partnerTotals = useMemo(() => calcTotals(partnerLogs), [partnerLogs]);

  const costP = parseFloat(costPct) || 0;
  const profitP = parseFloat(profitPct) || 0;

  // Eu vendi → devo para a parceira
  const iOwe = (myTotals.costTotal * costP / 100) + (myTotals.netProfit * profitP / 100);
  // Parceira vendeu → ela deve para mim
  const partnerOwes = (partnerTotals.costTotal * costP / 100) + (partnerTotals.netProfit * profitP / 100);
  const netBalance = iOwe - partnerOwes;
  const netPayer = netBalance > 0 ? 'Você' : partnerLabel;
  const netReceiver = netBalance > 0 ? partnerLabel : 'Você';
  const netAmount = Math.abs(netBalance);

  // Registrar acerto
  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedAgreementId) throw new Error('Dados inválidos');
      const pendingIds = logs.filter((l: any) => !l.settled).map((l: any) => l.id);
      const ag = selectedAgreement!;
      const isA = ag.user_a_id === user.id;

      // Inserir settlement
      const { error: se } = await supabase.from('partner_settlements').insert({
        agreement_id: selectedAgreementId,
        registered_by_id: user.id,
        period_start: startDate || null,
        period_end: endDate || null,
        total_logs: logs.length,
        a_sale_total: isA ? myTotals.saleTotal : partnerTotals.saleTotal,
        a_cost_total: isA ? myTotals.costTotal : partnerTotals.costTotal,
        a_fees_total: isA ? myTotals.feesTotal : partnerTotals.feesTotal,
        a_gross_profit: isA ? myTotals.grossProfit : partnerTotals.grossProfit,
        a_net_profit: isA ? myTotals.netProfit : partnerTotals.netProfit,
        a_owes: isA ? iOwe : partnerOwes,
        b_sale_total: isA ? partnerTotals.saleTotal : myTotals.saleTotal,
        b_cost_total: isA ? partnerTotals.costTotal : myTotals.costTotal,
        b_fees_total: isA ? partnerTotals.feesTotal : myTotals.feesTotal,
        b_gross_profit: isA ? partnerTotals.grossProfit : myTotals.grossProfit,
        b_net_profit: isA ? partnerTotals.netProfit : myTotals.netProfit,
        b_owes: isA ? partnerOwes : iOwe,
        net_payer_id: netBalance > 0 ? user.id : ag.partner_id,
        net_receiver_id: netBalance > 0 ? ag.partner_id : user.id,
        net_amount: netAmount,
        cost_pct: costP,
        profit_pct: profitP,
      });
      if (se) throw se;

      // Marcar logs como liquidados
      if (pendingIds.length > 0) {
        await supabase.from('partner_sale_log').update({ settled: true }).in('id', pendingIds);
      }
    },
    onSuccess: () => {
      toast.success('Acerto registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['partner-sale-logs'] });
      queryClient.invalidateQueries({ queryKey: ['partner-settlements-history'] });
      setCostPct('');
      setProfitPct('');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message)
  });

  const LogTable = ({ items, emptyMsg }: { items: any[], emptyMsg: string }) => (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="px-3 py-2 text-left">Data</th>
            <th className="px-3 py-2 text-left">Produto</th>
            <th className="px-3 py-2 text-right">Venda</th>
            <th className="px-3 py-2 text-right">Custo</th>
            <th className="px-3 py-2 text-right">Taxas</th>
            <th className="px-3 py-2 text-right">L.Bruto</th>
            <th className="px-3 py-2 text-right">L.Líquido</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-6 text-slate-400">{emptyMsg}</td></tr>
          ) : items.map((l: any) => {
            const gross = Number(l.sale_price) - Number(l.cost_price);
            const net = gross - Number(l.fees);
            return (
              <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{l.products?.name || 'Produto'}</td>
                <td className="px-3 py-2 text-right text-slate-700">{fmt(Number(l.sale_price))}</td>
                <td className="px-3 py-2 text-right text-red-600">-{fmt(Number(l.cost_price))}</td>
                <td className="px-3 py-2 text-right text-orange-500">-{fmt(Number(l.fees))}</td>
                <td className="px-3 py-2 text-right text-blue-600">{fmt(gross)}</td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(net)}</td>
              </tr>
            );
          })}
        </tbody>
        {items.length > 0 && (() => {
          const t = calcTotals(items);
          return (
            <tfoot className="bg-slate-50 font-semibold text-slate-700 text-xs border-t border-slate-200">
              <tr>
                <td colSpan={2} className="px-3 py-2">Total ({items.length} vendas)</td>
                <td className="px-3 py-2 text-right">{fmt(t.saleTotal)}</td>
                <td className="px-3 py-2 text-right text-red-600">-{fmt(t.costTotal)}</td>
                <td className="px-3 py-2 text-right text-orange-500">-{fmt(t.feesTotal)}</td>
                <td className="px-3 py-2 text-right text-blue-600">{fmt(t.grossProfit)}</td>
                <td className="px-3 py-2 text-right text-green-700">{fmt(t.netProfit)}</td>
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" /> Acerto de Contas — Parcerias
        </h1>
        <p className="text-slate-500 text-sm mt-1">Visualize todas as vendas da parceria e calcule o acerto bidirecional</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Parceria</label>
            <select
              value={selectedAgreementId}
              onChange={(e) => setSelectedAgreementId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Selecione uma parceria...</option>
              {agreements.map((ag: any) => (
                <option key={ag.id} value={ag.id}>{ag.partner_email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Data Início</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Data Fim</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="pending">Pendentes</option>
              <option value="settled">Liquidados</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedAgreementId ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione uma parceria para ver as vendas</p>
        </div>
      ) : logsLoading ? (
        <div className="text-center py-8 text-slate-400">Carregando vendas...</div>
      ) : (
        <>
          {/* Tabelas de vendas */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Minhas Vendas — produtos da parceria
              </h2>
              <LogTable items={myLogs} emptyMsg="Você não realizou vendas da parceria neste período" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Vendas de {partnerLabel} — produtos da parceria
              </h2>
              <LogTable items={partnerLogs} emptyMsg={`${partnerLabel} não realizou vendas da parceria neste período`} />
            </div>
          </div>

          {/* Calculadora */}
          {(myLogs.length > 0 || partnerLogs.length > 0) && statusFilter !== 'settled' && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" /> Calculadora do Acerto
              </h2>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <label className="text-xs text-slate-300 font-medium mb-2 block">% do Custo a devolver</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={costPct}
                      onChange={(e) => setCostPct(e.target.value)}
                      className="bg-white/20 border-white/20 text-white placeholder:text-white/40 h-10 text-lg font-bold"
                    />
                    <span className="text-white/60 text-lg">%</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <label className="text-xs text-slate-300 font-medium mb-2 block">% do Lucro Líquido a repassar</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={profitPct}
                      onChange={(e) => setProfitPct(e.target.value)}
                      className="bg-white/20 border-white/20 text-white placeholder:text-white/40 h-10 text-lg font-bold"
                    />
                    <span className="text-white/60 text-lg">%</span>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Eu devo */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-slate-300 mb-3 font-medium">Você deve para {partnerLabel}:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Custo: {fmt(myTotals.costTotal)} × {costP}%</span>
                      <span>{fmt(myTotals.costTotal * costP / 100)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Lucro Líq.: {fmt(myTotals.netProfit)} × {profitP}%</span>
                      <span>{fmt(myTotals.netProfit * profitP / 100)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white border-t border-white/20 pt-2 mt-2">
                      <span>Subtotal</span>
                      <span className="text-red-300">{fmt(iOwe)}</span>
                    </div>
                  </div>
                </div>

                {/* Parceira deve */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-slate-300 mb-3 font-medium">{partnerLabel} deve para você:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Custo: {fmt(partnerTotals.costTotal)} × {costP}%</span>
                      <span>{fmt(partnerTotals.costTotal * costP / 100)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Lucro Líq.: {fmt(partnerTotals.netProfit)} × {profitP}%</span>
                      <span>{fmt(partnerTotals.netProfit * profitP / 100)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white border-t border-white/20 pt-2 mt-2">
                      <span>Subtotal</span>
                      <span className="text-green-300">{fmt(partnerOwes)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saldo líquido */}
              <div className="bg-primary/20 border border-primary/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">SALDO LÍQUIDO</p>
                  <p className="text-lg font-bold text-white mt-1">
                    <span className="text-primary">{netPayer}</span> paga <span className="text-primary">{netReceiver}</span>:
                  </p>
                </div>
                <p className="text-3xl font-black text-white">{fmt(netAmount)}</p>
              </div>

              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3"
                onClick={() => settleMutation.mutate()}
                disabled={settleMutation.isPending || (!costPct && !profitPct) || logs.filter((l:any)=>!l.settled).length === 0}
              >
                {settleMutation.isPending ? 'Registrando...' : `Registrar Acerto e Marcar ${logs.filter((l:any)=>!l.settled).length} Vendas como Liquidadas`}
              </Button>
            </div>
          )}

          {/* Histórico de acertos */}
          {settlements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Histórico de Acertos
              </h2>
              <div className="space-y-2">
                {settlements.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {s.period_start && s.period_end
                          ? `${new Date(s.period_start).toLocaleDateString('pt-BR')} → ${new Date(s.period_end).toLocaleDateString('pt-BR')}`
                          : new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-500">{s.total_logs} vendas · Custo {s.cost_pct}% · Lucro {s.profit_pct}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{fmt(s.net_amount)}</p>
                      <p className="text-xs text-green-600">✅ Liquidado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
