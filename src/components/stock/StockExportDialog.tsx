import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '@/pages/StockControl';

export default function StockExportDialog({ products }: { products: Product[] }) {
  const handleExport = () => {
    const data = products.map(p => ({
      ID: p.id,
      Nome: p.name,
      'Preço Custo': p.cost_price,
      'Preço Venda': p.sale_price,
      Estoque: p.total_stock,
      Status: p.marketing_status
    }));

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
