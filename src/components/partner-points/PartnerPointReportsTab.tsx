import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer, FileBarChart, Package, Tag, History, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type ReportType = 'stock' | 'sales' | 'settlements' | 'consolidated';

const REPORT_TYPES: { id: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'stock', label: 'Estoque', icon: Package, description: 'Peças em campo no parceiro' },
  { id: 'sales', label: 'Vendas', icon: Tag, description: 'Histórico de vendas por período' },
  { id: 'settlements', label: 'Acertos', icon: History, description: 'Fechamentos financeiros' },
  { id: 'consolidated', label: 'Consolidado', icon: BarChart3, description: 'Resumo completo do ponto' },
];

function downloadCSV(rows: (string | number)[][], filename: string) {
  const content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printHTML(html: string, title: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin: 20px 0 8px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
      tr.total td { font-weight: bold; background: #f8fafc; }
      .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .card-label { font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
      .card-value { font-size: 20px; font-weight: bold; }
      .green { color: #16a34a; }
      .red { color: #dc2626; }
      .full { grid-column: 1 / -1; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export default function PartnerPointReportsTab({ pointId, point }: { pointId: string; point: any }) {
  const [reportType, setReportType] = useState<ReportType>('stock');

  const today = format(new Date(), 'yyyy-MM-dd');
  const firstOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const needsStock = reportType === 'stock' || reportType === 'consolidated';
  const needsSales = reportType === 'sales' || reportType === 'consolidated';
  const needsSettlements = reportType === 'settlements' || reportType === 'consolidated';

  const { data: stockItems = [], isLoading: loadingStock } = useQuery({
    queryKey: ['report-stock', pointId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_point_stock')
        .select('id, quantity, products(name, cost_price, sale_price), product_variants(size, color, sku)')
        .eq('partner_point_id', pointId)
        .gt('quantity', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: needsStock,
  });

  const { data: salesItems = [], isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', pointId, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('id, created_at, customers(name), total_amount, payment_method, partner_settlement_id')
        .eq('partner_point_id', pointId)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .in('status', ['completed', 'approved'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: needsSales,
  });

  const { data: settlements = [], isLoading: loadingSettlements } = useQuery({
    queryKey: ['report-settlements', pointId, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_point_settlements')
        .select('*')
        .eq('partner_point_id', pointId)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: needsSettlements,
  });

  const isLoading = (needsStock && loadingStock) || (needsSales && loadingSales) || (needsSettlements && loadingSettlements);

  const hasData =
    (reportType === 'stock' && stockItems.length > 0) ||
    (reportType === 'sales' && salesItems.length > 0) ||
    (reportType === 'settlements' && settlements.length > 0) ||
    (reportType === 'consolidated' && (stockItems.length > 0 || salesItems.length > 0 || settlements.length > 0));

  // ─── CSV ───────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (reportType === 'stock') {
      downloadCSV(
        [
          ['Produto', 'Variante', 'SKU', 'Quantidade', 'Preço Custo', 'Preço Venda', 'Total em Campo (R$)'],
          ...stockItems.map((i: any) => [
            i.products?.name || '',
            [i.product_variants?.size, i.product_variants?.color].filter(Boolean).join(' / ') || 'Único',
            i.product_variants?.sku || '',
            i.quantity,
            Number(i.products?.cost_price || 0).toFixed(2),
            Number(i.products?.sale_price || 0).toFixed(2),
            (i.quantity * (i.products?.sale_price || 0)).toFixed(2),
          ]),
        ],
        `estoque-${point.name}-${today}.csv`
      );
    } else if (reportType === 'sales') {
      downloadCSV(
        [
          ['Data', 'Cliente', 'Pagamento', 'Valor Total (R$)', 'Status Acerto'],
          ...salesItems.map((s: any) => [
            format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
            s.customers?.name || 'Avulso',
            s.payment_method,
            Number(s.total_amount).toFixed(2),
            s.partner_settlement_id ? 'Acertado' : 'Pendente',
          ]),
        ],
        `vendas-${point.name}-${dateFrom}-${dateTo}.csv`
      );
    } else if (reportType === 'settlements') {
      downloadCSV(
        [
          ['Data do Acerto', 'Período Início', 'Período Fim', 'Vendas Brutas (R$)', 'Comissão Parceiro (R$)', 'Líquido Loja (R$)'],
          ...settlements.map((s: any) => [
            format(new Date(s.created_at), 'dd/MM/yyyy'),
            s.period_start,
            s.period_end,
            Number(s.total_sales).toFixed(2),
            Number(s.partner_commission).toFixed(2),
            Number(s.net_store).toFixed(2),
          ]),
        ],
        `acertos-${point.name}-${dateFrom}-${dateTo}.csv`
      );
    } else {
      const totalStock = stockItems.reduce((acc: number, i: any) => acc + i.quantity, 0);
      const totalStockVal = stockItems.reduce((acc: number, i: any) => acc + i.quantity * (i.products?.sale_price || 0), 0);
      const totalSales = salesItems.reduce((acc: number, s: any) => acc + s.total_amount, 0);
      const totalComm = settlements.reduce((acc: number, s: any) => acc + s.partner_commission, 0);
      const totalNet = settlements.reduce((acc: number, s: any) => acc + s.net_store, 0);
      downloadCSV(
        [
          [`RELATÓRIO CONSOLIDADO — ${point.name}`],
          ['Período:', `${dateFrom} a ${dateTo}`],
          [],
          ['RESUMO'],
          ['Peças em Campo', totalStock],
          ['Valor em Campo (Preço Venda) R$', totalStockVal.toFixed(2)],
          ['Faturamento Bruto R$', totalSales.toFixed(2)],
          ['Total Comissões Pagas R$', totalComm.toFixed(2)],
          ['Lucro Líquido Loja R$', totalNet.toFixed(2)],
        ],
        `consolidado-${point.name}-${dateFrom}-${dateTo}.csv`
      );
    }
  };

  // ─── PRINT ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    const periodInfo =
      reportType !== 'stock'
        ? `Período: ${format(parseISO(dateFrom), 'dd/MM/yyyy')} a ${format(parseISO(dateTo), 'dd/MM/yyyy')}`
        : 'Estoque atual';
    const reportLabel = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';

    let html = `
      <h1>${point.name}</h1>
      <p class="meta">Relatório: <b>${reportLabel}</b> &nbsp;|&nbsp; ${periodInfo} &nbsp;|&nbsp; Gerado em: ${generatedAt}</p>
    `;

    if (needsStock) {
      const totalQty = stockItems.reduce((acc: number, i: any) => acc + i.quantity, 0);
      const totalVal = stockItems.reduce((acc: number, i: any) => acc + i.quantity * (i.products?.sale_price || 0), 0);
      html += `
        <h2>Estoque em Campo</h2>
        <div class="summary">
          <div class="card"><div class="card-label">Peças em Campo</div><div class="card-value">${totalQty}</div></div>
          <div class="card"><div class="card-label">Valor Total (Preço Venda)</div><div class="card-value green">R$ ${totalVal.toFixed(2)}</div></div>
        </div>
        <table>
          <tr><th>Produto</th><th>Variante</th><th>Qtd</th><th>Preço Venda</th><th>Total</th></tr>
          ${stockItems.map((i: any) => `
            <tr>
              <td>${i.products?.name || '-'}</td>
              <td>${[i.product_variants?.size, i.product_variants?.color].filter(Boolean).join(' / ') || 'Único'}</td>
              <td>${i.quantity}</td>
              <td>R$ ${Number(i.products?.sale_price || 0).toFixed(2)}</td>
              <td>R$ ${(i.quantity * (i.products?.sale_price || 0)).toFixed(2)}</td>
            </tr>`).join('')}
          <tr class="total"><td colspan="2">TOTAL</td><td>${totalQty}</td><td></td><td class="green">R$ ${totalVal.toFixed(2)}</td></tr>
        </table>`;
    }

    if (needsSales) {
      const totalRev = salesItems.reduce((acc: number, s: any) => acc + s.total_amount, 0);
      const pending = salesItems.filter((s: any) => !s.partner_settlement_id).length;
      html += `
        <h2>Vendas</h2>
        <div class="summary">
          <div class="card"><div class="card-label">Total de Vendas</div><div class="card-value">${salesItems.length}</div></div>
          <div class="card"><div class="card-label">Faturamento Bruto</div><div class="card-value green">R$ ${totalRev.toFixed(2)}</div></div>
          <div class="card"><div class="card-label">Pendentes de Acerto</div><div class="card-value red">${pending}</div></div>
        </div>
        <table>
          <tr><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Valor Total</th><th>Status</th></tr>
          ${salesItems.map((s: any) => `
            <tr>
              <td>${format(new Date(s.created_at), 'dd/MM/yyyy HH:mm')}</td>
              <td>${s.customers?.name || 'Avulso'}</td>
              <td>${s.payment_method}</td>
              <td>R$ ${Number(s.total_amount).toFixed(2)}</td>
              <td>${s.partner_settlement_id ? 'Acertado' : 'Pendente'}</td>
            </tr>`).join('')}
          <tr class="total"><td colspan="3">TOTAL (${salesItems.length} vendas)</td><td class="green">R$ ${totalRev.toFixed(2)}</td><td></td></tr>
        </table>`;
    }

    if (needsSettlements) {
      const totalComm = settlements.reduce((acc: number, s: any) => acc + s.partner_commission, 0);
      const totalNet = settlements.reduce((acc: number, s: any) => acc + s.net_store, 0);
      const totalGross = settlements.reduce((acc: number, s: any) => acc + s.total_sales, 0);
      html += `
        <h2>Acertos Financeiros</h2>
        <div class="summary">
          <div class="card"><div class="card-label">Acertos Realizados</div><div class="card-value">${settlements.length}</div></div>
          <div class="card"><div class="card-label">Comissões Pagas</div><div class="card-value red">R$ ${totalComm.toFixed(2)}</div></div>
          <div class="card"><div class="card-label">Líquido Total Loja</div><div class="card-value green">R$ ${totalNet.toFixed(2)}</div></div>
        </div>
        <table>
          <tr><th>Data Acerto</th><th>Período</th><th>Vendas Brutas</th><th>Comissão</th><th>Líquido Loja</th></tr>
          ${settlements.map((s: any) => `
            <tr>
              <td>${format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
              <td>${s.period_start} a ${s.period_end}</td>
              <td>R$ ${Number(s.total_sales).toFixed(2)}</td>
              <td class="red">R$ ${Number(s.partner_commission).toFixed(2)}</td>
              <td class="green">R$ ${Number(s.net_store).toFixed(2)}</td>
            </tr>`).join('')}
          <tr class="total"><td colspan="2">TOTAL (${settlements.length} acertos)</td><td>R$ ${totalGross.toFixed(2)}</td><td class="red">R$ ${totalComm.toFixed(2)}</td><td class="green">R$ ${totalNet.toFixed(2)}</td></tr>
        </table>`;
    }

    printHTML(html, `Relatório — ${point.name}`);
  };

  const showDateRange = reportType !== 'stock';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" /> Relatórios
          </h2>
          <p className="text-sm text-muted-foreground">Gere e exporte relatórios deste ponto parceiro.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={!hasData || isLoading}>
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={handlePrint} disabled={!hasData || isLoading}>
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const active = reportType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="font-bold text-sm">{rt.label}</span>
              <span className={`text-[11px] leading-tight ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {rt.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date Range */}
      {showDateRange && (
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-4 rounded-xl border">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-auto bg-background"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-auto bg-background"
          />
        </div>
      )}

      {/* Preview */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando dados...</div>
      ) : !hasData ? (
        <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum dado encontrado para este período.</p>
          {showDateRange && <p className="text-sm mt-1">Tente ajustar o intervalo de datas.</p>}
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto shadow-sm">
          {/* ESTOQUE */}
          {reportType === 'stock' && (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Total em Campo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {[item.product_variants?.size, item.product_variants?.color].filter(Boolean).join(' / ') || 'Único'}
                    </TableCell>
                    <TableCell className="font-bold">{item.quantity}</TableCell>
                    <TableCell>R$ {Number(item.products?.cost_price || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(item.products?.sale_price || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-emerald-700">
                      R$ {(item.quantity * (item.products?.sale_price || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                  <TableCell className="font-bold">{stockItems.reduce((a: number, i: any) => a + i.quantity, 0)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="font-black text-emerald-700">
                    R$ {stockItems.reduce((a: number, i: any) => a + i.quantity * (i.products?.sale_price || 0), 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* VENDAS */}
          {reportType === 'sales' && (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesItems.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-medium">{s.customers?.name || 'Avulso'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.payment_method}</TableCell>
                    <TableCell className="font-bold">R$ {Number(s.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                        s.partner_settlement_id
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.partner_settlement_id ? 'Acertado' : 'Pendente'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-bold">TOTAL ({salesItems.length} vendas)</TableCell>
                  <TableCell className="font-black text-emerald-700">
                    R$ {salesItems.reduce((a: number, s: any) => a + s.total_amount, 0).toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* ACERTOS */}
          {reportType === 'settlements' && (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data do Acerto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Vendas Brutas</TableHead>
                  <TableHead>Comissão Paga</TableHead>
                  <TableHead>Líquido Loja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{format(new Date(s.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {s.period_start} a {s.period_end}
                    </TableCell>
                    <TableCell>R$ {Number(s.total_sales).toFixed(2)}</TableCell>
                    <TableCell className="text-rose-600">R$ {Number(s.partner_commission).toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-emerald-700">R$ {Number(s.net_store).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-bold">TOTAL ({settlements.length} acertos)</TableCell>
                  <TableCell className="font-bold">
                    R$ {settlements.reduce((a: number, s: any) => a + s.total_sales, 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-bold text-rose-600">
                    R$ {settlements.reduce((a: number, s: any) => a + s.partner_commission, 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-black text-emerald-700">
                    R$ {settlements.reduce((a: number, s: any) => a + s.net_store, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* CONSOLIDADO */}
          {reportType === 'consolidated' && (() => {
            const totalStockQty = stockItems.reduce((a: number, i: any) => a + i.quantity, 0);
            const totalStockVal = stockItems.reduce((a: number, i: any) => a + i.quantity * (i.products?.sale_price || 0), 0);
            const totalRevenue = salesItems.reduce((a: number, s: any) => a + s.total_amount, 0);
            const pendingSales = salesItems.filter((s: any) => !s.partner_settlement_id).length;
            const totalComm = settlements.reduce((a: number, s: any) => a + s.partner_commission, 0);
            const totalNet = settlements.reduce((a: number, s: any) => a + s.net_store, 0);
            return (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border rounded-xl p-4 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Peças em Campo</p>
                    <p className="text-2xl font-black">{totalStockQty}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Valor: R$ {totalStockVal.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-blue-50">
                    <p className="text-[10px] font-bold uppercase text-blue-800 mb-1">Faturamento Bruto</p>
                    <p className="text-2xl font-black text-blue-700">R$ {totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{salesItems.length} venda(s) no período</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-amber-50">
                    <p className="text-[10px] font-bold uppercase text-amber-800 mb-1">Vendas Pendentes de Acerto</p>
                    <p className="text-2xl font-black text-amber-700">{pendingSales}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{settlements.length} fechamento(s) realizado(s)</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-rose-50">
                    <p className="text-[10px] font-bold uppercase text-rose-800 mb-1">Total Comissões Pagas</p>
                    <p className="text-2xl font-black text-rose-700">R$ {totalComm.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-emerald-50 md:col-span-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-800 mb-1">Lucro Líquido Total (Loja)</p>
                    <p className="text-3xl font-black text-emerald-700">R$ {totalNet.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Soma dos acertos realizados no período</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
