import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, PackagePlus, PackageCheck, ArrowLeft, CheckCircle2, AlertTriangle, Replace, Plus } from 'lucide-react';

export type ImportVariant = {
  size: string;
  color: string;
  stock: number;
  sku: string | null;
};

export type ExistingMatch = {
  id: string;
  name: string;
  currentTotalStock: number;
  variants: Array<{ id: string; size: string; color: string; stock: number; sku: string | null }>;
};

export type ImportReviewItem = {
  fileName: string;
  fileCostPrice: number;
  fileSalePrice: number;
  fileVariants: ImportVariant[];
  fileTotalStock: number;
  existingMatch: ExistingMatch | null;
  action: 'replace' | 'add';
  categoryId: string | null;
  supplierId: string | null;
  subcategoryId: string | null;
  description: string | null;
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
};

type Props = {
  items: ImportReviewItem[];
  onItemsChange: (items: ImportReviewItem[]) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  status: string;
};

export default function ImportReviewStep({ items, onItemsChange, onConfirm, onBack, loading, status }: Props) {
  const newItems = items.filter(i => !i.existingMatch);
  const existingItems = items.filter(i => !!i.existingMatch);

  const setGlobalAction = (action: 'replace' | 'add') => {
    onItemsChange(items.map(item => item.existingMatch ? { ...item, action } : item));
  };

  const setItemAction = (index: number, action: 'replace' | 'add') => {
    const realIndex = items.findIndex(it => it === existingItems[index]);
    if (realIndex === -1) return;
    const updated = [...items];
    updated[realIndex] = { ...updated[realIndex], action };
    onItemsChange(updated);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
          <PackagePlus className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
          <p className="text-2xl font-bold text-emerald-700">{newItems.length}</p>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Produtos Novos</p>
        </div>
        <div className={`border rounded-xl p-4 text-center shadow-sm ${existingItems.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <PackageCheck className={`h-6 w-6 mx-auto mb-1 ${existingItems.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          <p className={`text-2xl font-bold ${existingItems.length > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{existingItems.length}</p>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${existingItems.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Já Cadastrados</p>
        </div>
      </div>

      {/* Existing Products Section */}
      {existingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Produtos Já Cadastrados
            </h4>
            <div className="flex gap-1">
              <button
                onClick={() => setGlobalAction('add')}
                className="text-[10px] px-2 py-1 rounded-md font-semibold border transition hover:shadow-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                ➕ Todos: Acrescentar
              </button>
              <button
                onClick={() => setGlobalAction('replace')}
                className="text-[10px] px-2 py-1 rounded-md font-semibold border transition hover:shadow-sm bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                🔄 Todos: Substituir
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50/80 border-b border-amber-100">
                  <th className="text-left px-3 py-2 font-bold text-amber-800">Produto</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800 whitespace-nowrap">Est. Atual</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800 whitespace-nowrap">Planilha</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800 whitespace-nowrap">Resultado</th>
                  <th className="text-right px-3 py-2 font-bold text-amber-800">Ação</th>
                </tr>
              </thead>
              <tbody>
                {existingItems.map((item, idx) => {
                  const currentStock = item.existingMatch!.currentTotalStock;
                  const fileStock = item.fileTotalStock;
                  const resultStock = item.action === 'replace' ? fileStock : currentStock + fileStock;

                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[140px] truncate" title={item.fileName}>
                        {item.fileName}
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[11px]">{currentStock}</span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[11px]">{fileStock}</span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${item.action === 'replace' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.action === 'replace' ? '→' : '+'} {resultStock}
                        </span>
                      </td>
                      <td className="text-right px-3 py-2.5">
                        <select
                          value={item.action}
                          onChange={e => setItemAction(idx, e.target.value as 'replace' | 'add')}
                          className="text-[11px] rounded-md border border-slate-200 bg-white px-1.5 py-1 font-medium focus:ring-1 focus:ring-indigo-400 outline-none shadow-sm cursor-pointer"
                        >
                          <option value="add">➕ Acrescentar</option>
                          <option value="replace">🔄 Substituir</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-muted-foreground italic px-1">
            <strong>Acrescentar</strong>: soma a quantidade da planilha ao estoque atual. <strong>Substituir</strong>: define o estoque para o valor da planilha. Preços não são alterados para produtos existentes.
          </p>
        </div>
      )}

      {/* New Products Section */}
      {newItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Produtos Novos ({newItems.length})
          </h4>
          <div className="border rounded-lg bg-emerald-50/30 p-3 max-h-[120px] overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {newItems.map((item, idx) => (
                <span key={idx} className="bg-white border border-emerald-200 text-emerald-800 text-[10px] px-2 py-1 rounded-md font-medium shadow-sm">
                  {item.fileName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="pt-4 mt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-10 flex gap-2 pb-1">
        <Button variant="outline" className="flex-1 border-slate-300" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {status || 'Processando'}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Importação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Utility function for normalizing product names for comparison
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
