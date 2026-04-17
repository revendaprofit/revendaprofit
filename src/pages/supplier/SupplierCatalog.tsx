import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, X, Wand2, Upload, Film, Image as ImgIcon } from 'lucide-react';
import { toast } from 'sonner';
import { compressImageToWebp } from '@/lib/utils';

type HubProduct = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  image_url_2: string;
  image_url_3: string;
  video_url: string;
  category: string;
  brand: string;
  sku: string;
  wholesale_price: number;
  suggested_retail_price: number;
  min_retail_price: number;
  min_order_qty: number;
  status: string;
  created_at: string;
  variants?: HubVariant[];
};

type HubVariant = {
  id: string;
  hub_product_id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  wholesale_price_override: number | null;
};

export default function SupplierCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<HubProduct | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', brand: '', sku: '',
    wholesale_price: '', suggested_retail_price: '', min_retail_price: '', min_order_qty: '1',
    image_urls: [] as string[], video_url: ''
  });
  const [variants, setVariants] = useState<{ size: string; color: string; sku: string; stock: string; }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Magic Import
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['hub-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_products')
        .select('*')
        .eq('supplier_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const productIds = data.map((p: any) => p.id);
      const { data: allVariants } = await supabase
        .from('hub_product_variants')
        .select('*')
        .in('hub_product_id', productIds.length > 0 ? productIds : ['none']);

      return data.map((p: any) => ({
        ...p,
        variants: (allVariants || []).filter((v: any) => v.hub_product_id === p.id)
      })) as HubProduct[];
    },
    enabled: !!user
  });

  // ===== Upload de Imagem com compressao =====
  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (form.image_urls.length >= 3) {
        toast.error("Maximo de 3 fotos atingido");
        return;
      }
      const file = event.target.files[0];
      const compressedBlob = await compressImageToWebp(file);
      const filePath = `hub_${Math.random()}.webp`;
      const { error } = await supabase.storage.from('product-images').upload(filePath, compressedBlob);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, data.publicUrl] }));
      toast.success('Imagem compactada e carregada!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleUploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      if (file.size > 20 * 1024 * 1024) throw new Error("Video deve ter menos de 20MB");
      const fileExt = file.name.split('.').pop();
      const filePath = `hub_${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage.from('product-images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setForm(prev => ({ ...prev, video_url: data.publicUrl }));
      toast.success('Video carregado!');
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== index) }));
  };

  // ===== Processar midia externa (download + compress + upload) =====
  const processExternalMedia = async (url: string, isVideo: boolean): Promise<string> => {
    if (!url || url.includes('supabase.co')) return url;
    try {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      if (!res.ok) return url;
      const blob = await res.blob();
      let fileToUpload: Blob = blob;
      let ext = isVideo ? 'mp4' : 'webp';
      if (!isVideo) {
        fileToUpload = await compressImageToWebp(blob);
      }
      const filePath = `hub_${Math.random()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(filePath, fileToUpload);
      if (error) return url;
      return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
    } catch (e) { return url; }
  };

  // ===== Importacao Magica por URL =====
  const handleImportUrl = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    try {
      let htmlContent = "";
      try {
        const res1 = await fetch(`https://corsproxy.io/?${encodeURIComponent(importUrl)}`);
        if (!res1.ok) throw new Error("Proxy falhou");
        htmlContent = await res1.text();
      } catch {
        const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(importUrl)}`);
        const data2 = await res2.json();
        htmlContent = data2.contents;
      }

      if (!htmlContent) throw new Error("HTML vazio");

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content');

      const cleanTitle = (raw: string) => raw.replace(/\s*[\|–—]\s*[^|–—]+$/g, '').trim();
      let finalName = ogTitle ? cleanTitle(ogTitle) : (doc.title ? cleanTitle(doc.title) : '');
      let finalPrice = ogPrice ? parseFloat(ogPrice) : 0;
      let finalDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                              doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      let allImgs = new Set<string>();
      if (ogImage) allImgs.add(ogImage);

      // LD-JSON
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          let candidates: any[] = [];
          if (Array.isArray(data)) candidates = data.filter(d => d['@type'] === 'Product');
          else if (data['@type'] === 'Product') candidates = [data];
          else if (data['@graph']) candidates = data['@graph'].filter((d: any) => d['@type'] === 'Product');

          candidates.forEach(product => {
            if (!ogTitle && product.name) finalName = product.name;
            if (product.description && !finalDescription) finalDescription = product.description;
            if (product.image) {
              if (Array.isArray(product.image)) product.image.forEach((i: any) => allImgs.add(typeof i === 'string' ? i : i?.url || ''));
              else if (typeof product.image === 'string') allImgs.add(product.image);
              else if (product.image?.url) allImgs.add(product.image.url);
            }
            if (product.offers) {
              const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
              if (offer && offer.price && !finalPrice) finalPrice = parseFloat(offer.price);
            }
          });
        } catch {}
      });

      // DOM imgs
      doc.querySelectorAll('img').forEach(img => {
        let src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (src && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(src)) {
          if (!src.startsWith('http')) {
            try { src = new URL(src, importUrl).toString(); } catch {}
          }
          allImgs.add(src);
        }
      });

      const imgArray = Array.from(allImgs).filter(i => i.startsWith('http') && !i.includes('data:image'));
      setScrapedImages(imgArray);

      // Process first 3 images through compression
      const processedUrls: string[] = [];
      for (const imgUrl of imgArray.slice(0, 3)) {
        toast.loading(`Compactando imagem ${processedUrls.length + 1}...`);
        const processed = await processExternalMedia(imgUrl, false);
        processedUrls.push(processed);
        toast.dismiss();
      }

      setForm(prev => ({
        ...prev,
        name: finalName || prev.name,
        description: finalDescription || prev.description,
        wholesale_price: finalPrice ? String(finalPrice) : prev.wholesale_price,
        image_urls: processedUrls
      }));

      toast.success("Dados importados! Revise e ajuste as informacoes.");
    } catch (err: any) {
      toast.error("Nao foi possivel importar dessa URL.");
    } finally {
      setIsImporting(false);
    }
  };

  // ===== CRUD =====
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nao autenticado');

      const payload: any = {
        supplier_id: user.id,
        name: form.name,
        description: form.description,
        category: form.category,
        brand: form.brand,
        sku: form.sku,
        wholesale_price: parseFloat(form.wholesale_price) || 0,
        suggested_retail_price: parseFloat(form.suggested_retail_price) || null,
        min_retail_price: parseFloat(form.min_retail_price) || null,
        min_order_qty: parseInt(form.min_order_qty) || 1,
        image_url: form.image_urls[0] || null,
        image_url_2: form.image_urls[1] || null,
        image_url_3: form.image_urls[2] || null,
        video_url: form.video_url || null
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase.from('hub_products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
        await supabase.from('hub_product_variants').delete().eq('hub_product_id', productId);
      } else {
        const { data, error } = await supabase.from('hub_products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      if (variants.length > 0) {
        const variantPayloads = variants.map(v => ({
          hub_product_id: productId,
          supplier_id: user.id,
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          stock: parseInt(v.stock) || 0
        }));
        const { error: vErr } = await supabase.from('hub_product_variants').insert(variantPayloads);
        if (vErr) throw vErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-products'] });
      toast.success(editingProduct ? 'Produto atualizado!' : 'Produto cadastrado no Hub!');
      closeForm();
    },
    onError: (err: any) => toast.error('Erro: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hub_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-products'] });
      toast.success('Produto removido do Hub!');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active';
      const { error } = await supabase.from('hub_products').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['hub-products'] });
      toast.success(newStatus === 'active' ? 'Produto ativado!' : 'Produto pausado!');
    }
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setForm({ name: '', description: '', category: '', brand: '', sku: '', wholesale_price: '', suggested_retail_price: '', min_retail_price: '', min_order_qty: '1', image_urls: [], video_url: '' });
    setVariants([]);
    setImportUrl('');
    setScrapedImages([]);
  };

  const openEdit = (p: HubProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      brand: p.brand || '',
      sku: p.sku || '',
      wholesale_price: String(p.wholesale_price),
      suggested_retail_price: String(p.suggested_retail_price || ''),
      min_retail_price: String(p.min_retail_price || ''),
      min_order_qty: String(p.min_order_qty),
      image_urls: [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean),
      video_url: p.video_url || ''
    });
    setVariants((p.variants || []).map(v => ({
      size: v.size || '', color: v.color || '', sku: v.sku || '', stock: String(v.stock)
    })));
    setIsFormOpen(true);
  };

  const addVariant = () => setVariants([...variants, { size: '', color: '', sku: '', stock: '0' }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, field: string, value: string) => {
    const updated = [...variants];
    (updated[i] as any)[field] = value;
    setVariants(updated);
  };

  const totalStock = (p: HubProduct) => (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-3.5 rounded-2xl border border-amber-500/30">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Meu Catalogo Hub</h1>
            <p className="text-slate-400 font-medium mt-1">Gerencie seus produtos disponiveis para revenda</p>
          </div>
        </div>
        <Button onClick={() => { closeForm(); setIsFormOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 px-6 font-bold shadow-lg">
          <Plus className="w-5 h-5 mr-2" /> Novo Produto Hub
        </Button>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Carregando catalogo...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Catalogo vazio</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Cadastre seus produtos atacadistas aqui. Lojistas poderao importa-los para suas vitrines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${p.status === 'paused' ? 'opacity-60' : ''}`}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.brand || 'Sem marca'} {p.category ? `| ${p.category}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status === 'active' ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Atacado</p>
                    <p className="font-bold text-slate-900 text-sm">R$ {Number(p.wholesale_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sugerido</p>
                    <p className="font-bold text-slate-900 text-sm">{p.suggested_retail_price ? `R$ ${Number(p.suggested_retail_price).toFixed(2)}` : '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Estoque</p>
                    <p className={`font-bold text-sm ${totalStock(p) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{totalStock(p)}</p>
                  </div>
                </div>

                {(p.variants || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.variants!.map(v => (
                      <span key={v.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {v.color || ''}{v.color && v.size ? ' / ' : ''}{v.size || ''} ({v.stock})
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(p)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => toggleStatusMutation.mutate({ id: p.id, status: p.status })}>
                    {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-red-500 hover:bg-red-50" onClick={() => {
                    if (confirm('Remover este produto do Hub?')) deleteMutation.mutate(p.id);
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ FORM MODAL ============ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingProduct ? 'Editar Produto' : 'Novo Produto Hub'}</h2>
                <p className="text-xs text-slate-500">Produto disponivel no Hub para lojistas importarem.</p>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-5">
              
              {/* Magic Import */}
              {!editingProduct && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2 text-amber-700">
                    <Wand2 className="h-4 w-4" /> Importacao Magica (URL)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 bg-white border-amber-300"
                      placeholder="Cole o link do produto na loja do fornecedor..."
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                    />
                    <Button type="button" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleImportUrl} disabled={isImporting || !importUrl}>
                      {isImporting ? 'Extraindo...' : 'Importar'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-amber-600">Extrai titulo, preco e fotos automaticamente. As imagens sao compactadas antes de salvar.</p>
                </div>
              )}

              {/* Scraped images tray */}
              {scrapedImages.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-dashed">
                  <h4 className="text-xs font-bold text-slate-600 mb-2">Imagens encontradas (clique para add/remover):</h4>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {scrapedImages.map((img, i) => (
                      <div key={i} onClick={async () => {
                        if (form.image_urls.includes(img)) {
                          setForm(p => ({ ...p, image_urls: p.image_urls.filter(x => x !== img) }));
                        } else {
                          if (form.image_urls.length >= 3) { toast.error("Maximo 3 fotos"); return; }
                          toast.loading('Compactando...');
                          const processed = await processExternalMedia(img, false);
                          toast.dismiss();
                          setForm(p => ({ ...p, image_urls: [...p.image_urls, processed] }));
                        }
                      }} className={`h-16 w-16 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${form.image_urls.includes(img) ? 'border-amber-500 opacity-50' : 'border-transparent hover:border-amber-300'}`}>
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nome do Produto *</label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Camiseta Dry Fit Premium" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Descricao</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalhes do produto..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-20" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Marca</label>
                  <Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Ex: Nike" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Categoria</label>
                  <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Vestuario" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">SKU</label>
                  <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Codigo interno" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Pedido Minimo</label>
                  <Input type="number" min="1" value={form.min_order_qty} onChange={e => setForm({...form, min_order_qty: e.target.value})} />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">Preco Atacado (R$) *</label>
                  <Input required type="number" step="0.01" value={form.wholesale_price} onChange={e => setForm({...form, wholesale_price: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">Preco Sugerido (R$)</label>
                  <Input type="number" step="0.01" value={form.suggested_retail_price} onChange={e => setForm({...form, suggested_retail_price: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">Preco Minimo (R$)</label>
                  <Input type="number" step="0.01" value={form.min_retail_price} onChange={e => setForm({...form, min_retail_price: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              {/* ===== MEDIA SECTION ===== */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><ImgIcon className="w-4 h-4" /> Multimidia (Fotos e Video)</h3>
                
                {/* Photos */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Fotos (Ate 3) — Compactadas automaticamente</label>
                  <div className="flex gap-3">
                    {form.image_urls.map((img, i) => (
                      <div key={i} className="relative group h-24 w-24 rounded-xl border-2 border-slate-200 overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">{i + 1}/3</span>
                      </div>
                    ))}
                    {form.image_urls.length < 3 && (
                      <div className="h-24 w-24 border-2 border-dashed border-amber-300 rounded-xl flex flex-col items-center justify-center relative hover:bg-amber-50 transition-colors cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[9px] text-amber-600 font-bold text-center">{uploading ? 'Enviando...' : 'Add Foto'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Video Destaque (1 max, ate 20MB)</label>
                  <div className="flex items-center gap-3">
                    {form.video_url ? (
                      <div className="relative group h-20 w-32 rounded-xl border overflow-hidden bg-black flex items-center justify-center">
                        <video src={form.video_url} className="w-full h-full object-cover opacity-50" />
                        <Film className="w-6 h-6 text-white absolute" />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, video_url: '' }))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="h-16 w-full max-w-[200px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors cursor-pointer">
                        <input type="file" accept="video/*" onChange={handleUploadVideo} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Film className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[9px] text-slate-500 font-bold">{uploading ? 'Enviando...' : 'Add Video'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">Variantes (Cor / Tamanho / Estoque)</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Variante
                  </Button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma variante. Adicione tamanhos/cores com estoque.</p>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} placeholder="Cor" className="h-8 text-xs flex-1" />
                        <Input value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} placeholder="Tam" className="h-8 text-xs w-20" />
                        <Input value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} placeholder="SKU" className="h-8 text-xs w-24" />
                        <Input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} placeholder="Qtd" className="h-8 text-xs w-20" />
                        <button type="button" onClick={() => removeVariant(i)} className="p-1 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={closeForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1 h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white">
                  {saveMutation.isPending ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Cadastrar no Hub'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
