import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit2, Plus, Download, Upload, Search, Archive, ArchiveRestore, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import ProductFormDialog from '@/components/stock/ProductFormDialog';
import StockImportDialog from '@/components/stock/StockImportDialog';
import NfeImportDialog from '@/components/stock/NfeImportDialog';
import StockExportDialog from '@/components/stock/StockExportDialog';
import PhotoImportDialog from '@/components/stock/PhotoImportDialog';
import { useImageSyncStore, QueueItem } from '@/store/useImageSyncStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type Product = {
  id: string; owner_id: string; name: string; cost_price: number; sale_price: number; image_url: string; category_id: string; supplier_id: string; marketing_status: string; total_stock: number;
};

export default function StockControl() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<'local' | 'p2p' | 'archived'>('local');
  const [filters, setFilters] = useState({
    categoryId: 'all',
    supplierId: 'all',
    subcategoryId: 'all',
    stockStatus: 'all',
    minPrice: '',
    maxPrice: '',
    filterModel: '',
    filterColor: '',
    ncm: '',
    ean: '',
    mediaStatus: 'all'
  });

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  const { data: partnerships = [] } = useQuery({
    queryKey: ['active-partnerships-stock'],
    queryFn: async () => {
       const userLocal = (await supabase.auth.getUser()).data.user;
       if (!userLocal) return [];
       const { data, error } = await supabase.from('partnerships')
          .select('*')
          .or(`requester_id.eq.${userLocal.id},receiver_id.eq.${userLocal.id}`)
          .eq('status', 'active');
       
       if (data && data.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, email, name');
          if (profs) {
             data.forEach(p => {
                p.requester = profs.find(pr => pr.id === p.requester_id);
                p.receiver = profs.find(pr => pr.id === p.receiver_id);
             });
          }
       }
       return data || [];
    }
  });

  const { data: products = [], isLoading, isError, error: productsError } = useQuery({
    queryKey: ['products', activeTab, filters],
    queryFn: async () => {
      const userLocal = (await supabase.auth.getUser()).data.user;
      
      if (activeTab === 'p2p') {
          const { data, error } = await supabase.rpc('get_my_p2p_shared_products', { p_tenant_id: userLocal?.id });
          if (error) throw error;
          
          let result = (data || []).map((p:any) => ({
             ...p,
             _p2p_partnership_id: p.p2p_partnership_id,
             _p2p_owner_id: p.p2p_owner_id,
             _p2p_price: p.sale_price,
             total_stock: (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0),
             product_variants: (p.variants || []),
             categories: { name: p.category_name || 'Compartilhado' }
          }));
          
          if (filters.stockStatus === 'out_of_stock') result = result.filter((r:any) => r.total_stock === 0);
          else if (filters.stockStatus === 'in_stock') result = result.filter((r:any) => r.total_stock > 0);
          if (filters.minPrice) result = result.filter((r:any) => r.sale_price >= parseFloat(filters.minPrice));
          if (filters.maxPrice) result = result.filter((r:any) => r.sale_price <= parseFloat(filters.maxPrice));
          if (filters.mediaStatus === 'has_media') result = result.filter((r:any) => !!r.image_url);
          if (filters.mediaStatus === 'no_photo') result = result.filter((r:any) => !r.image_url);
          return result;
      }

      let query = supabase.from('products').select(`*, categories(name), suppliers(name), product_variants(id, size, color, stock)`).eq('owner_id', userLocal?.id).order('created_at', { ascending: false });
      
      if (activeTab === 'archived') {
        query = query.eq('marketing_status', 'archived');
      } else {
        query = query.neq('marketing_status', 'archived');
      }
      
      if (filters.categoryId === 'none') {
        query = query.is('category_id', null);
      } else if (filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId);
      }
      
      if (filters.supplierId === 'none') {
        query = query.is('supplier_id', null);
      } else if (filters.supplierId && filters.supplierId !== 'all') {
        query = query.eq('supplier_id', filters.supplierId);
      }
      
      if (filters.subcategoryId === 'none') {
        query = query.is('subcategory_id', null);
      } else if (filters.subcategoryId && filters.subcategoryId !== 'all') {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }
      
      if (filters.stockStatus === 'out_of_stock') query = query.eq('total_stock', 0);
      else if (filters.stockStatus === 'in_stock') query = query.gt('total_stock', 0);
      
      if (filters.minPrice) query = query.gte('sale_price', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('sale_price', parseFloat(filters.maxPrice));

      if (filters.filterModel) query = query.ilike('filter_model', `%${filters.filterModel}%`);
      if (filters.filterColor) query = query.ilike('filter_color', `%${filters.filterColor}%`);
      if (filters.ncm) query = query.eq('ncm', filters.ncm);
      if (filters.ean) query = query.eq('ean', filters.ean);
      
      if (filters.mediaStatus === 'no_photo') query = query.is('image_url', null);
      if (filters.mediaStatus === 'no_video') query = query.is('video_url', null);
      if (filters.mediaStatus === 'has_media') query = query.not('image_url', 'is', null);

      const { data, error } = await query.limit(1000); // Prevent frontend freeze with limit
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => (await supabase.from('categories').select('*')).data || [] });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await supabase.from('suppliers').select('*')).data || [] });
  const { data: subcategories = [] } = useQuery({ queryKey: ['subcategories'], queryFn: async () => (await supabase.from('subcategories').select('*')).data || [] });

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Auto-sync external images in background
  useEffect(() => {
     if (products.length > 0 && activeTab === 'local') {
        const imagesToDownload: QueueItem[] = [];
        
        for (const p of products) {
            if (p.image_url && !p.image_url.includes('supabase.co')) {
               imagesToDownload.push({ id: p.id, url: p.image_url, column: 'image_url' });
            }
            if (p.image_url_2 && !p.image_url_2.includes('supabase.co')) {
               imagesToDownload.push({ id: p.id, url: p.image_url_2, column: 'image_url_2' });
            }
            if (p.image_url_3 && !p.image_url_3.includes('supabase.co')) {
               imagesToDownload.push({ id: p.id, url: p.image_url_3, column: 'image_url_3' });
            }
        }
        
        if (imagesToDownload.length > 0) {
           supabase.auth.getSession().then(({ data }) => {
              const token = data?.session?.access_token;
              if (token) {
                 const { addToQueue, startProcessing, isProcessing } = useImageSyncStore.getState();
                 if (!isProcessing) {
                    addToQueue(imagesToDownload);
                    startProcessing(token);
                 }
              }
           });
        }
     }
  }, [products, activeTab]);

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Chunk arrays to avoid "400 Bad Request: URI Too Long" in Supabase URL parameters
      const chunkSize = 100;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { error } = await supabase.from('products').delete().in('id', chunk);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produtos removidos com sucesso!');
      setSelectedIds([]);
    },
    onError: (error: any) => {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao excluir: ' + (error.message || 'Erro desconhecido. Verifique restrições do banco.'));
    }
  });

  const updateBulkMutation = useMutation({
    mutationFn: async ({ ids, field, value }: { ids: string[], field: string, value: any }) => {
      const chunkSize = 100;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { error } = await supabase.from('products').update({ [field]: value }).in('id', chunk);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produtos atualizados em lote!');
      setSelectedIds([]);
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 relative pb-24">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <div className="col-span-1"><StockExportDialog products={filtered} /></div>
          <div className="col-span-1"><StockImportDialog /></div>
          <div className="col-span-2 sm:col-span-1"><NfeImportDialog /></div>
          <div className="col-span-2 sm:col-span-1"><PhotoImportDialog /></div>
          <Button onClick={() => { setEditingProduct(null); setFormOpen(true); }} className="col-span-2 sm:col-span-1">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-muted/30 p-4 rounded-lg items-center">
        <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setSelectedIds([]); setSearch(''); setFilters({ categoryId: 'all', supplierId: 'all', subcategoryId: 'all', stockStatus: 'all', minPrice: '', maxPrice: '', filterModel: '', filterColor: '', ncm: '', ean: '', mediaStatus: 'all' }); }}>
          <TabsList>
            <TabsTrigger value="local">Meu Estoque</TabsTrigger>
            <TabsTrigger value="p2p">Estoque Parceiro</TabsTrigger>
            <TabsTrigger value="archived">Arquivados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-full" />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant={activeFiltersCount > 0 ? 'default' : 'outline'} className="shrink-0 relative border-dashed">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">{activeFiltersCount}</span>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros Avançados</SheetTitle>
                <SheetDescription>Encontre produtos rapidamente cruzando dados.</SheetDescription>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value})}>
                      <option value="all">Todas as Categorias</option>
                      <option value="none" className="text-destructive font-medium">Sem Categoria</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Fornecedor</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={filters.supplierId} onChange={e => setFilters({...filters, supplierId: e.target.value})}>
                      <option value="all">Todos os Fornecedores</option>
                      <option value="none" className="text-destructive font-medium">Sem Fornecedor</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Subcategoria</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={filters.subcategoryId} onChange={e => setFilters({...filters, subcategoryId: e.target.value})}>
                      <option value="all">Todas as Subcategorias</option>
                      <option value="none" className="text-destructive font-medium">Sem Subcategoria</option>
                      {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Status do Estoque</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={filters.stockStatus} onChange={e => setFilters({...filters, stockStatus: e.target.value})}>
                      <option value="all">Qualquer Status</option>
                      <option value="in_stock">Em Estoque (Positivo)</option>
                      <option value="out_of_stock">Esgotado (Zero)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Preço Mínimo (R$)</label>
                    <Input type="number" placeholder="Ex: 50" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Preço Máximo (R$)</label>
                    <Input type="number" placeholder="Ex: 150" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} className="h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Modelo</label>
                    <Input placeholder="Palavra chave..." value={filters.filterModel} onChange={e => setFilters({...filters, filterModel: e.target.value})} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Cor / Tonalidade</label>
                    <Input placeholder="Palavra chave..." value={filters.filterColor} onChange={e => setFilters({...filters, filterColor: e.target.value})} className="h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Status de Mídia</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={filters.mediaStatus} onChange={e => setFilters({...filters, mediaStatus: e.target.value})}>
                      <option value="all">Todas as Mídias</option>
                      <option value="has_media">Com Foto Principal</option>
                      <option value="no_photo">Sem Foto</option>
                      <option value="no_video">Sem Vídeo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">NCM (Fiscal)</label>
                    <Input placeholder="Pesquisa exata..." value={filters.ncm} onChange={e => setFilters({...filters, ncm: e.target.value})} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Código EAN</label>
                    <Input placeholder="Pesquisa exata..." value={filters.ean} onChange={e => setFilters({...filters, ean: e.target.value})} className="h-9" />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-8 flex-col sm:flex-col gap-2">
                <SheetClose asChild>
                  <Button className="w-full">Aplicar Filtros</Button>
                </SheetClose>
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground" 
                  onClick={() => setFilters({ categoryId: 'all', supplierId: 'all', subcategoryId: '', stockStatus: 'all', minPrice: '', maxPrice: '', filterModel: '', filterColor: '', ncm: '', ean: '', mediaStatus: 'all' })}
                >
                  <X className="mr-2 h-4 w-4" /> Limpar Filtros
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-xs">
              <TableHead className="w-[30px] px-2"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map((f: any) => f.id) : [])} checked={filtered.length > 0 && selectedIds.length === filtered.length} className="w-4 h-4" /></TableHead>
              <TableHead className="w-[50px] px-2">Img</TableHead>
              <TableHead className="px-2">Produto</TableHead>
              <TableHead className="px-2">Categoria</TableHead>
              <TableHead className="px-2">Fornecedor</TableHead>
              <TableHead className="px-2">Preço</TableHead>
              <TableHead className="px-2 text-center">Estoque</TableHead>
              <TableHead className="px-2 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
              isError ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-red-500">Erro ao carregar produtos: {(productsError as any)?.message || String(productsError)}</TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum produto.</TableCell></TableRow> :
                filtered.map((p: any) => {
                  const isP2p = activeTab === 'p2p';
                  const p2pPartnerEmail = isP2p ? (() => {
                     const match = partnerships.find((pt:any) => pt.id === p._p2p_partnership_id);
                     if (!match) return 'Parceira desconhecida';
                     if (match.requester_id === p._p2p_owner_id) return match.requester?.name || match.requester?.email || 'Parceira';
                     return match.receiver?.name || match.receiver?.email || 'Parceira';
                  })() : null;

                  return (
                  <TableRow key={p.id} className={selectedIds.includes(p.id) ? "bg-muted/50" : ""}>
                    <TableCell className="px-2 py-2">
                      {!isP2p && <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />}
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="w-10 h-10 object-cover rounded shadow border min-w-[40px]" /> : <div className="w-10 h-10 bg-muted/30 rounded flex items-center justify-center border text-xs text-muted-foreground min-w-[40px]">-</div>}
                    </TableCell>
                    <TableCell className="font-medium px-2 py-2 text-xs sm:text-sm leading-tight max-w-[150px] sm:max-w-none break-words">
                       {p.name}
                       {isP2p && <span className="ml-1 bg-emerald-100 text-emerald-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">{p2pPartnerEmail}</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs px-2 py-2">{(p as any).categories?.name || '---'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs px-2 py-2">{(p as any).suppliers?.name || '---'}</TableCell>
                    <TableCell className="font-semibold whitespace-nowrap px-2 py-2 text-xs sm:text-sm">R$ {Number(isP2p ? p._p2p_price : p.sale_price).toFixed(2)}</TableCell>
                    <TableCell className="px-2 py-2">
                      {(() => {
                        const variants = (p.product_variants || []).filter((v: any) => v.stock > 0);
                        if (variants.length === 0) {
                          return <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap bg-red-100 text-red-800">Esgotado</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {variants.map((v: any) => (
                              <span key={v.id} className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${isP2p ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                {v.size || 'Un'}<span className="opacity-60 ml-0.5">({v.stock})</span>
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      {!isP2p ? (
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                            setSelectedIds([p.id]);
                            setShowDeleteConfirm(true);
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Parceria</span>
                      )}
                    </TableCell>
                  </TableRow>
                )})}
          </TableBody>
        </Table>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[95vw] max-w-2xl sm:w-auto">
          <div className="bg-primary text-primary-foreground p-4 sm:px-6 sm:py-3 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border border-primary-foreground/20">
            <div className="flex justify-between w-full sm:w-auto items-center">
              <span className="font-bold text-sm whitespace-nowrap">
                {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'itens'}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary-foreground/20 sm:hidden" onClick={() => setSelectedIds([])}>
                <span className="text-xs">X</span>
              </Button>
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center w-full sm:w-auto gap-2 sm:border-l border-primary-foreground/20 sm:pl-6">
              <select 
                className="bg-primary-foreground/10 border-none text-[10px] rounded px-1 min-w-[70px] max-w-[120px] py-1 focus:ring-1 focus:ring-white outline-none cursor-pointer flex-1 sm:flex-none"
                onChange={(e) => {
                  if(e.target.value) {
                    updateBulkMutation.mutate({ ids: selectedIds, field: 'category_id', value: e.target.value === 'null' ? null : e.target.value });
                    e.target.value = '';
                  }
                }}
              >
                <option value="" className="text-black">Categoria...</option>
                <option value="null" className="text-black">Limpar</option>
                {categories.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
              </select>

              <select 
                className="bg-primary-foreground/10 border-none text-[10px] rounded px-1 min-w-[70px] max-w-[120px] py-1 focus:ring-1 focus:ring-white outline-none cursor-pointer flex-1 sm:flex-none"
                onChange={(e) => {
                  if(e.target.value) {
                    updateBulkMutation.mutate({ ids: selectedIds, field: 'subcategory_id', value: e.target.value === 'null' ? null : e.target.value });
                    e.target.value = '';
                  }
                }}
              >
                <option value="" className="text-black">Subcategoria...</option>
                <option value="null" className="text-black">Limpar</option>
                {subcategories.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
              </select>

              <select 
                className="bg-primary-foreground/10 border-none text-[10px] rounded px-1 min-w-[70px] max-w-[120px] py-1 focus:ring-1 focus:ring-white outline-none cursor-pointer flex-1 sm:flex-none"
                onChange={(e) => {
                  if(e.target.value) {
                    updateBulkMutation.mutate({ ids: selectedIds, field: 'supplier_id', value: e.target.value === 'null' ? null : e.target.value });
                    e.target.value = '';
                  }
                }}
              >
                <option value="" className="text-black">Fornecedor...</option>
                <option value="null" className="text-black">Limpar</option>
                {suppliers.map(s => <option key={s.id} value={s.id} className="text-black">{s.name}</option>)}
              </select>

              <div className="flex bg-primary-foreground/10 rounded overflow-hidden flex-1 sm:flex-none items-center">
                <span className="text-[9px] px-1 font-bold">R$ Venda:</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="bg-transparent text-[10px] w-12 text-white px-1 py-1 outline-none placeholder:text-white/50 border-r border-white/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      updateBulkMutation.mutate({ ids: selectedIds, field: 'sale_price', value: parseFloat(e.currentTarget.value) });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              <div className="flex bg-primary-foreground/10 rounded overflow-hidden flex-1 sm:flex-none items-center">
                <span className="text-[9px] px-1 font-bold">R$ Custo:</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="bg-transparent text-[10px] w-12 text-white px-1 py-1 outline-none placeholder:text-white/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      updateBulkMutation.mutate({ ids: selectedIds, field: 'cost_price', value: parseFloat(e.currentTarget.value) });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              <Button 
                variant="secondary" 
                size="sm" 
                className="h-7 px-2 shadow-sm flex items-center justify-center gap-1 w-full sm:w-auto hover:bg-secondary/90 text-[10px]"
                onClick={() => {
                  const newStatus = activeTab === 'archived' ? 'active' : 'archived';
                  updateBulkMutation.mutate({ ids: selectedIds, field: 'marketing_status', value: newStatus });
                }}
              >
                {activeTab === 'archived' ? <><ArchiveRestore className="h-3 w-3" /> Desarq.</> : <><Archive className="h-3 w-3" /> Arq.</>}
              </Button>

              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 px-2 shadow-sm flex items-center justify-center gap-1 w-full sm:w-auto hover:bg-destructive/90 text-[10px]"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary-foreground/20 hidden sm:flex" onClick={() => setSelectedIds([])}>
              <span className="text-xs">X</span>
            </Button>
          </div>
        </div>
      )}
      
      {formOpen && <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editingProduct} />}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja DELETAR {selectedIds.length} {selectedIds.length === 1 ? 'produto' : 'produtos'}? Essa ação apagará as variantes relacionadas e é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                deleteMutation.mutate(selectedIds, {
                  onSettled: () => setShowDeleteConfirm(false)
                });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
