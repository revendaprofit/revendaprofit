import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Package, Search, ShoppingBag, Check, X, ChevronDown, Filter, ArrowRight, Truck, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function HubMarketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [retailPrice, setRetailPrice] = useState('');

  // Fetch all active hub products with their variants
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['hub-marketplace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_products')
        .select('*, hub_product_variants (*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch supplier names
  const { data: supplierProfiles = [] } = useQuery({
    queryKey: ['hub-supplier-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'supplier');
      return data || [];
    },
    enabled: !!user
  });

  // Fetch supplier trade rules
  const { data: allTradeRules = [] } = useQuery({
    queryKey: ['hub-all-trade-rules'],
    queryFn: async () => {
      const { data } = await supabase.from('hub_trade_rules').select('*');
      return data || [];
    },
    enabled: !!user
  });

  // Fetch already imported products
  const { data: myImports = [] } = useQuery({
    queryKey: ['hub-my-imports', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hub_imports')
        .select('hub_product_id, retail_price, is_active')
        .eq('tenant_id', user!.id);
      return data || [];
    },
    enabled: !!user
  });

  const importMutation = useMutation({
    mutationFn: async ({ hubProductId, supplierId, price }: { hubProductId: string; supplierId: string; price: number }) => {
      if (!user) throw new Error('Nao autenticado');
      const { error } = await supabase.from('hub_imports').insert({
        tenant_id: user.id,
        hub_product_id: hubProductId,
        supplier_id: supplierId,
        retail_price: price
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-my-imports'] });
      toast.success('Produto importado para sua loja!');
      setSelectedProduct(null);
      setRetailPrice('');
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Voce ja importou este produto!');
      } else {
        toast.error('Erro: ' + err.message);
      }
    }
  });

  const toggleImportMutation = useMutation({
    mutationFn: async ({ hubProductId, isActive }: { hubProductId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('hub_imports')
        .update({ is_active: !isActive })
        .eq('tenant_id', user!.id)
        .eq('hub_product_id', hubProductId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-my-imports'] });
      toast.success('Status atualizado!');
    }
  });

  const getSupplierName = (supplierId: string) => {
    const profile = supplierProfiles.find((p: any) => p.id === supplierId);
    return profile?.full_name || profile?.email || 'Fornecedor';
  };

  // Unique suppliers
  const suppliers = React.useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p: any) => {
      map.set(p.supplier_id, getSupplierName(p.supplier_id));
    });
    return Array.from(map.entries());
  }, [products, supplierProfiles]);

  // Filter products
  const filtered = products.filter((p: any) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase());
    const matchSupplier = selectedSupplier === 'all' || p.supplier_id === selectedSupplier;
    return matchSearch && matchSupplier;
  });

  const getTotalStock = (p: any) => (p.hub_product_variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0);
  const isImported = (productId: string) => myImports.find((i: any) => i.hub_product_id === productId);
  const getTradeRules = (supplierId: string) => allTradeRules.find((r: any) => r.supplier_id === supplierId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px]"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 backdrop-blur-sm">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Hub de Fornecedores</h1>
            <p className="text-purple-200/80 font-medium mt-1">Importe produtos atacadistas direto para sua loja</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <Input className="pl-11 h-11 bg-white border-slate-200 rounded-xl" placeholder="Buscar produto por nome ou marca..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
          className="h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 min-w-[200px]">
          <option value="all">Todos os Fornecedores</option>
          {suppliers.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Carregando catalogo...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500 mt-2">Quando fornecedores publicarem produtos no Hub, eles aparecerao aqui para voce importar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => {
            const stock = getTotalStock(p);
            const imported = isImported(p.id);
            const rules = getTradeRules(p.supplier_id);
            const supplierName = getSupplierName(p.supplier_id);

            return (
              <div key={p.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg group ${stock === 0 ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  {/* Supplier badge */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                    <Store className="w-3 h-3" /> {supplierName}
                  </div>
                  {/* Stock badge */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${stock > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {stock > 0 ? `${stock} em estoque` : 'Esgotado'}
                  </div>
                  {/* Imported overlay */}
                  {imported && (
                    <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.brand || ''} {p.category ? `| ${p.category}` : ''}</p>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-indigo-50 rounded-lg p-2">
                      <p className="text-[9px] text-indigo-400 font-bold uppercase">Seu Custo</p>
                      <p className="font-black text-indigo-700 text-sm">R$ {Number(p.wholesale_price).toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-[9px] text-emerald-400 font-bold uppercase">Sugerido</p>
                      <p className="font-bold text-emerald-700 text-sm">{p.suggested_retail_price ? `R$ ${Number(p.suggested_retail_price).toFixed(2)}` : '-'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-[9px] text-amber-400 font-bold uppercase">Margem</p>
                      <p className="font-bold text-amber-700 text-sm">
                        {p.suggested_retail_price && p.wholesale_price ? 
                          `${((p.suggested_retail_price - p.wholesale_price) / p.wholesale_price * 100).toFixed(0)}%` : 
                          (rules ? `${rules.default_margin_pct}%` : '-')
                        }
                      </p>
                    </div>
                  </div>

                  {/* Variants preview */}
                  {(p.hub_product_variants || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.hub_product_variants.slice(0, 6).map((v: any) => (
                        <span key={v.id} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${v.stock > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-400 line-through'}`}>
                          {v.color || ''}{v.color && v.size ? '/' : ''}{v.size || ''} ({v.stock})
                        </span>
                      ))}
                      {p.hub_product_variants.length > 6 && (
                        <span className="text-[9px] text-slate-400">+{p.hub_product_variants.length - 6}</span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  {imported ? (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">Importado</p>
                        <p className="text-sm font-bold text-emerald-700">R$ {Number(imported.retail_price).toFixed(2)}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-auto text-xs"
                        onClick={() => toggleImportMutation.mutate({ hubProductId: p.id, isActive: imported.is_active })}>
                        {imported.is_active ? 'Pausar' : 'Ativar'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-bold text-xs shadow-lg shadow-indigo-200" 
                      disabled={stock === 0}
                      onClick={() => {
                        setSelectedProduct(p);
                        const suggested = p.suggested_retail_price || (p.wholesale_price * (1 + (rules?.default_margin_pct || 30) / 100));
                        setRetailPrice(String(suggested.toFixed(2)));
                      }}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" /> 
                      {stock === 0 ? 'Sem Estoque' : 'Importar para Minha Loja'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======= IMPORT MODAL ======= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Package className="w-6 h-6 text-slate-300" /></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h2>
                    <p className="text-xs text-slate-500">{getSupplierName(selectedProduct.supplier_id)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Trade info */}
              {(() => {
                const rules = getTradeRules(selectedProduct.supplier_id);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <DollarSign className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Custo Atacado</p>
                      <p className="font-black text-indigo-700">R$ {Number(selectedProduct.wholesale_price).toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Truck className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Prazo Entrega</p>
                      <p className="font-bold text-slate-800">{rules?.delivery_days || 7} dias</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Info className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ped. Minimo</p>
                      <p className="font-bold text-slate-800">{selectedProduct.min_order_qty || 1} un.</p>
                    </div>
                  </div>
                );
              })()}

              {/* Variants */}
              {(selectedProduct.hub_product_variants || []).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Variantes Disponiveis:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.hub_product_variants.map((v: any) => (
                      <span key={v.id} className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${v.stock > 0 ? 'bg-white border-slate-200 text-slate-700' : 'bg-red-50 border-red-200 text-red-400 line-through'}`}>
                        {v.color || ''}{v.color && v.size ? ' / ' : ''}{v.size || ''} — {v.stock} un.
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Set retail price */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                <label className="text-sm font-bold text-indigo-800">Defina seu preco de venda (R$):</label>
                <Input 
                  type="number" step="0.01" 
                  value={retailPrice} 
                  onChange={e => setRetailPrice(e.target.value)}
                  className="h-12 text-lg font-bold text-center border-indigo-300 bg-white"
                />
                {(() => {
                  const rp = parseFloat(retailPrice) || 0;
                  const wp = selectedProduct.wholesale_price;
                  const margin = rp > 0 ? ((rp - wp) / wp * 100).toFixed(1) : '0';
                  const profit = rp > 0 ? (rp - wp).toFixed(2) : '0.00';
                  const minPrice = selectedProduct.min_retail_price;
                  const belowMin = minPrice && rp < minPrice;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Sua margem:</span>
                        <span className={`font-bold ${Number(margin) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>{margin}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Lucro por unidade:</span>
                        <span className="font-bold text-emerald-600">R$ {profit}</span>
                      </div>
                      {belowMin && (
                        <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg mt-1">
                          ⚠️ Preco abaixo do minimo do fornecedor (R$ {Number(minPrice).toFixed(2)})
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setSelectedProduct(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                  disabled={importMutation.isPending || !retailPrice}
                  onClick={() => {
                    importMutation.mutate({
                      hubProductId: selectedProduct.id,
                      supplierId: selectedProduct.supplier_id,
                      price: parseFloat(retailPrice)
                    });
                  }}
                >
                  {importMutation.isPending ? 'Importando...' : 'Confirmar Importacao'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
