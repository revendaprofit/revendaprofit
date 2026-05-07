import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, PackagePlus, PackageCheck, ArrowLeft, CheckCircle2, AlertTriangle, Wand2, X, Link2 } from 'lucide-react';

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

export type ExistingProductOption = {
  id: string;
  name: string;
  variants: Array<{ id: string; size: string; color: string; stock: number; sku: string | null }>;
};

export type ImportReviewItem = {
  fileName: string;           // original name from XML
  detectedProductName: string; // name without size suffix
  detectedSize: string | null; // extracted size
  matchSource: 'exact' | 'smart' | 'sku' | 'none';
  fileCostPrice: number;
  fileSalePrice: number | null;
  fileVariants: ImportVariant[];
  fileTotalStock: number;
  existingMatch: ExistingMatch | null;
  action: 'replace' | 'add' | 'new' | 'ignore_stock'; // 'new' = reject match, treat as new product
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
  allExistingProducts: ExistingProductOption[];
};

export default function ImportReviewStep({ items, onItemsChange, onConfirm, onBack, loading, status, allExistingProducts }: Props) {
  const [openSelectorIdx, setOpenSelectorIdx] = useState<number | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');

  const smartItems = items.filter(i => i.matchSource === 'smart');
  const exactItems = items.filter(i => i.matchSource === 'exact' || i.matchSource === 'sku');
  const newItems = items.filter(i => i.matchSource === 'none' || i.action === 'new');

  const pendingSmartConfirm = smartItems.filter(i => i.action !== 'new').length;
  const totalNew = newItems.length + smartItems.filter(i => i.action === 'new').length;
  const totalExisting = exactItems.length + smartItems.filter(i => i.action !== 'new').length;

  const updateItem = (originalItem: ImportReviewItem, updates: Partial<ImportReviewItem>) => {
    onItemsChange(items.map(i => i === originalItem ? { ...i, ...updates } : i));
  };

  const linkToProduct = (item: ImportReviewItem, prod: ExistingProductOption) => {
    updateItem(item, {
      existingMatch: {
        id: prod.id,
        name: prod.name,
        currentTotalStock: prod.variants.reduce((s, v) => s + v.stock, 0),
        variants: prod.variants,
      },
      action: 'add',
      matchSource: 'smart',
    });
    setOpenSelectorIdx(null);
    setSelectorSearch('');
  };

  const filteredProds = allExistingProducts.filter(p =>
    p.name.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center shadow-sm">
          <Wand2 className="h-5 w-5 mx-auto text-purple-600 mb-1" />
          <p className="text-xl font-bold text-purple-700">{smartItems.length}</p>
          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Sugestões Auto</p>
        </div>
        <div className={`border rounded-xl p-3 text-center shadow-sm ${totalExisting > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <PackageCheck className={`h-5 w-5 mx-auto mb-1 ${totalExisting > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          <p className={`text-xl font-bold ${totalExisting > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{totalExisting}</p>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${totalExisting > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Já Cadastrados</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-sm">
          <PackagePlus className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
          <p className="text-xl font-bold text-emerald-700">{totalNew}</p>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Produtos Novos</p>
        </div>
      </div>

      {/* ── SMART SUGGESTIONS ── */}
      {smartItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5 text-purple-600" />
            <h4 className="text-xs font-bold text-purple-700 uppercase">Sugestões Automáticas — confirme o vínculo</h4>
            {pendingSmartConfirm > 0 && (
              <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{pendingSmartConfirm} para confirmar</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground px-0.5">
            O sistema detectou um tamanho no final do nome. Verifique se a sugestão de produto está correta antes de importar.
          </p>

          <div className="border rounded-lg overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
            {smartItems.map((item, idx) => {
              const globalIdx = items.indexOf(item);
              const isOpen = openSelectorIdx === globalIdx;
              const rejected = item.action === 'new';
              const currentStock = item.existingMatch?.currentTotalStock ?? 0;
              const resultStock = item.action === 'replace' ? item.fileTotalStock : item.action === 'ignore_stock' ? currentStock : currentStock + item.fileTotalStock;

              return (
                <div key={idx} className={`p-3 space-y-2 ${rejected ? 'opacity-60 bg-slate-50' : ''}`}>
                  {/* Row: detected name + variant badges */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Produto Detectado</p>
                      <p className="text-xs font-semibold text-purple-700 truncate">{item.detectedProductName}</p>
                      {item.fileVariants.length > 1 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={item.fileName}>
                          Agrupado de {item.fileVariants.length} linhas XML
                        </p>
                      )}
                    </div>
                    {item.fileVariants.length > 0 && item.detectedSize && (
                      <div className="flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Variantes</p>
                        <div className="flex flex-wrap gap-1">
                          {item.fileVariants.map((v, vIdx) => (
                            <span key={vIdx} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {v.size} <span className="text-purple-500 font-normal">×{v.stock}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match result */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {item.existingMatch && !rejected ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-amber-800 truncate" title={item.existingMatch.name}>{item.existingMatch.name}</span>
                          <span className="text-[10px] text-amber-600 ml-auto flex-shrink-0">
                            {currentStock} → {resultStock} un
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                          <PackagePlus className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-emerald-700">Será cadastrado como novo produto</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      {item.existingMatch && !rejected && (
                        <select
                          value={item.action}
                          onChange={e => updateItem(item, { action: e.target.value as 'replace' | 'add' })}
                          className="text-[10px] rounded-md border border-slate-200 bg-white px-1.5 py-1 font-medium outline-none shadow-sm cursor-pointer"
                        >
                          <option value="add">➕ Acrescentar</option>
                          <option value="replace">🔄 Substituir</option>
                          <option value="ignore_stock">⏭️ Só Dados/Fotos (Ignorar Estoque)</option>
                        </select>
                      )}
                      <button
                        onClick={() => { setOpenSelectorIdx(isOpen ? null : globalIdx); setSelectorSearch(''); }}
                        className="text-[10px] px-2 py-1 rounded-md border font-semibold transition bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" /> Outro
                      </button>
                      <button
                        onClick={() => updateItem(item, { action: rejected ? 'add' : 'new' })}
                        className={`text-[10px] px-2 py-1 rounded-md border font-semibold transition flex items-center gap-1 ${rejected ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'}`}
                      >
                        {rejected ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {rejected ? 'Restaurar' : 'Ignorar'}
                      </button>
                    </div>
                  </div>

                  {/* Inline product selector */}
                  {isOpen && (
                    <div className="border border-indigo-200 rounded-lg bg-white shadow-lg p-2 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Buscar produto cadastrado..."
                        value={selectorSearch}
                        onChange={e => setSelectorSearch(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-400"
                        autoFocus
                      />
                      <div className="max-h-[140px] overflow-y-auto space-y-0.5">
                        {filteredProds.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum produto encontrado</p>
                        ) : filteredProds.map(prod => (
                          <button
                            key={prod.id}
                            onClick={() => linkToProduct(item, prod)}
                            className="w-full text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-indigo-50 transition font-medium text-slate-700"
                          >
                            {prod.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXACT MATCHES ── */}
      {exactItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Já Cadastrados — match exato ({exactItems.length})
            </h4>
            <div className="flex gap-1">
              <button onClick={() => onItemsChange(items.map(i => (i.matchSource === 'exact' || i.matchSource === 'sku') ? { ...i, action: 'add' } : i))}
                className="text-[10px] px-2 py-1 rounded-md font-semibold border transition bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">➕ Todos: Acrescentar</button>
              <button onClick={() => onItemsChange(items.map(i => (i.matchSource === 'exact' || i.matchSource === 'sku') ? { ...i, action: 'replace' } : i))}
                className="text-[10px] px-2 py-1 rounded-md font-semibold border transition bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">🔄 Todos: Substituir</button>
              <button onClick={() => onItemsChange(items.map(i => (i.matchSource === 'exact' || i.matchSource === 'sku') ? { ...i, action: 'ignore_stock' } : i))}
                className="text-[10px] px-2 py-1 rounded-md font-semibold border transition bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100">⏭️ Todos: Só Dados</button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50/80 border-b border-amber-100">
                  <th className="text-left px-3 py-2 font-bold text-amber-800">Produto</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800">Atual</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800">XML</th>
                  <th className="text-center px-2 py-2 font-bold text-amber-800">Resultado</th>
                  <th className="text-right px-3 py-2 font-bold text-amber-800">Ação</th>
                </tr>
              </thead>
              <tbody>
                {exactItems.map((item, idx) => {
                  const current = item.existingMatch!.currentTotalStock;
                  const result = item.action === 'replace' ? item.fileTotalStock : item.action === 'ignore_stock' ? current : current + item.fileTotalStock;
                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[140px] truncate" title={item.fileName}>{item.fileName}</td>
                      <td className="text-center px-2 py-2.5"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[11px]">{current}</span></td>
                      <td className="text-center px-2 py-2.5"><span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[11px]">{item.fileTotalStock}</span></td>
                      <td className="text-center px-2 py-2.5"><span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${item.action === 'replace' ? 'bg-orange-100 text-orange-700' : item.action === 'ignore_stock' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.action === 'replace' ? '→' : item.action === 'ignore_stock' ? '=' : '+'} {result}</span></td>
                      <td className="text-right px-3 py-2.5">
                        <select value={item.action} onChange={e => updateItem(item, { action: e.target.value as 'replace' | 'add' })}
                          className="text-[11px] rounded-md border border-slate-200 bg-white px-1.5 py-1 font-medium focus:ring-1 focus:ring-indigo-400 outline-none shadow-sm cursor-pointer">
                          <option value="add">➕ Acrescentar</option>
                          <option value="replace">🔄 Substituir</option>
                          <option value="ignore_stock">⏭️ Só Dados/Fotos (Ignorar Estoque)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NEW PRODUCTS ── */}
      {totalNew > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Produtos Novos ({totalNew})
          </h4>
          <div className="border rounded-lg bg-emerald-50/30 p-3 max-h-[120px] overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {[...newItems, ...smartItems.filter(i => i.action === 'new')].map((item, idx) => (
                <span key={idx} className="bg-white border border-emerald-200 text-emerald-800 text-[10px] px-2 py-1 rounded-md font-medium shadow-sm inline-flex items-center gap-1 flex-wrap">
                  {item.detectedProductName || item.fileName}
                  {item.fileVariants.length > 1 ? (
                    item.fileVariants.map((v, vIdx) => (
                      <span key={vIdx} className="ml-0.5 font-bold text-purple-600">
                        {v.size}×{v.stock}
                      </span>
                    ))
                  ) : item.detectedSize ? (
                    <span className="ml-1 font-bold text-purple-600">({item.detectedSize})</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground italic px-1">
        <strong>Acrescentar</strong>: soma a quantidade ao estoque atual. <strong>Substituir</strong>: define o estoque para o valor da nota. Preços não são alterados para produtos existentes.
      </p>

      {/* Action Bar */}
      <div className="pt-4 mt-2 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-10 flex gap-2 pb-1">
        <Button variant="outline" className="flex-1 border-slate-300" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" disabled={loading} onClick={onConfirm}>
          {loading ? (
            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />{status || 'Processando'}</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" />Confirmar Importação</>
          )}
        </Button>
      </div>
    </div>
  );
}

export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
