import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '@/pages/StockControl';

export default function StockExportDialog({ products }: { products: Product[] }) {
  const handleExport = () => {
    const data: object[] = [];

    for (const p of products) {
      const variants = (p as any).product_variants ?? [];
      if (variants.length === 0) {
        data.push({
          Nome: p.name,
          Tamanho: 'Único',
          Cor: '-',
          Estoque: p.total_stock ?? 0,
          'Preço Custo (R$)': p.cost_price,
          'Preço Venda (R$)': p.sale_price,
          Status: p.marketing_status,
        });
      } else {
        for (const v of variants) {
          data.push({
            Nome: p.name,
            Tamanho: v.size || '-',
            Cor: v.color || '-',
            Estoque: v.stock ?? 0,
            'Preço Custo (R$)': p.cost_price,
            'Preço Venda (R$)': p.sale_price,
            Status: p.marketing_status,
          });
        }
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");
    XLSX.writeFile(workbook, `Estoque_Revenda_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={products.length === 0}>
      <Download className="mr-2 h-4 w-4" /> Exportar XLSX
    </Button>
  );
}
