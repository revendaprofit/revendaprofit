import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link as LinkIcon, Wand2 } from 'lucide-react';
import ProductVariantsSection from './ProductVariantsSection';
import ProductMediaSection from './ProductMediaSection';

export default function ProductFormDialog({ open, onOpenChange, initialData }: { open: boolean, onOpenChange: (o: boolean) => void, initialData: any }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '', description: '', cost_price: 0, sale_price: 0, 
    min_stock: 0, category_id: '', subcategory_id: '', supplier_id: '',
    filter_model: '', filter_color: '', filter_detail: '',
    ncm: '', cest: '', ean: '', origin_code: '0',
    image_urls: [] as string[], video_url: '',
    is_new_arrival: false
  });
  
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [scrapedVideos, setScrapedVideos] = useState<string[]>([]);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => (await supabase.from('categories').select('*')).data || [] });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await supabase.from('suppliers').select('*')).data || [] });
  
  const { data: subcategories = [] } = useQuery({ 
    queryKey: ['subcategories', formData.category_id], 
    queryFn: async () => {
      if (!formData.category_id) return [];
      const { data } = await supabase.from('subcategories').select('*').eq('category_id', formData.category_id).order('name');
      return data || [];
    },
    enabled: !!formData.category_id
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name, description: initialData.description || '', 
        cost_price: initialData.cost_price, sale_price: initialData.sale_price, min_stock: initialData.min_stock || 0,
        category_id: initialData.category_id || '', subcategory_id: initialData.subcategory_id || '', supplier_id: initialData.supplier_id || '',
        filter_model: initialData.filter_model || '', filter_color: initialData.filter_color || '', filter_detail: initialData.filter_detail || '',
        ncm: initialData.ncm || '', cest: initialData.cest || '', ean: initialData.ean || '', origin_code: initialData.origin_code || '0',
        image_urls: [initialData.image_url, initialData.image_url_2, initialData.image_url_3].filter(Boolean),
        video_url: initialData.video_url || '',
        is_new_arrival: initialData.is_new_arrival || false
      });
    } else {
      setFormData({ 
         name: '', description: '', cost_price: 0, sale_price: 0, min_stock: 0,
         category_id: '', subcategory_id: '', supplier_id: '',
         filter_model: '', filter_color: '', filter_detail: '',
         ncm: '', cest: '', ean: '', origin_code: '0',
         image_urls: [], video_url: '',
         is_new_arrival: false
      });
      setScrapedImages([]);
      setScrapedVideos([]);
    }
    setImportUrl('');
  }, [initialData, open]);

  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportUrl = async () => {
     if (!importUrl) return;
     setIsImporting(true);
     try {
       // --- Multiplexer Tracker de Proxy CORS ---
       let htmlContent = "";
       let formattedUrl = importUrl.trim();
       if (!/^https?:\/\//i.test(formattedUrl)) {
           formattedUrl = 'https://' + formattedUrl;
       }

       try {
           const res1 = await fetch(`https://corsproxy.io/?${encodeURIComponent(formattedUrl)}`);
           if (!res1.ok) throw new Error("CorsProxy.io falhou");
           htmlContent = await res1.text();
           if (!htmlContent || htmlContent.trim() === '') throw new Error("CorsProxy.io vazio");
       } catch (err1) {
           console.warn("Primeiro proxy falhou, tentando fallback...", err1);
           try {
               const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(formattedUrl)}`);
               if (!res2.ok) throw new Error("AllOrigins falhou");
               const data2 = await res2.json();
               htmlContent = data2.contents;
               if (!htmlContent || htmlContent.trim() === '') throw new Error("AllOrigins vazio");
           } catch (err2) {
               console.warn("Segundo proxy falhou, tentando fallback 2...", err2);
               const res3 = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(formattedUrl)}`);
               if (!res3.ok) throw new Error("CodeTabs falhou");
               htmlContent = await res3.text();
           }
       }

       if (!htmlContent) throw new Error("ConteúdoHTML vazio retornado.");

       const parser = new DOMParser();
       const doc = parser.parseFromString(htmlContent, "text/html");

       // --- Extrair slug da URL para validação cruzada ---
       const urlSlug = formattedUrl.split('/').filter(Boolean).pop()?.toLowerCase() || '';
       const slugWords = urlSlug.replace(/[-_]/g, ' ').split(' ').filter(w => w.length > 2);

       // --- Função de relevância: verifica se o nome combina com o slug da URL ---
       const matchesSlug = (name: string) => {
          if (!slugWords.length) return true; // sem slug, aceita qualquer nome
          const nameLower = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const matches = slugWords.filter(w => nameLower.includes(w));
          return matches.length >= Math.min(2, slugWords.length); // pelo menos 2 palavras do slug devem bater
       };

       // --- 1) OpenGraph Meta Extraction (FONTE DEFINITIVA do nome — sempre sobre o produto da página) ---
       const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
       const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
       const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content');
       const ogVideo = doc.querySelector('meta[property="og:video"]')?.getAttribute('content');

       // Limpar sufixos de loja do título (ex: "Produto | Loja X" ou "Produto - Loja X")
       const cleanTitle = (raw: string) => raw.replace(/\s*[\|–—]\s*[^|–—]+$/g, '').trim();

       const ogNameCleaned = ogTitle ? cleanTitle(ogTitle) : '';
       let finalName = ogNameCleaned || (doc.title ? cleanTitle(doc.title) : '');
       let finalPrice = ogPrice ? parseFloat(ogPrice) : 0;
       let finalDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                               doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
       
       let allImgs = new Set<string>();
       let allVids = new Set<string>();
       if(ogImage) allImgs.add(ogImage);
       if(ogVideo) allVids.add(ogVideo);

       // --- 2) LD-JSON Extraction: NUNCA sobrescreve o nome se já temos OG title ---
       const ldJsons = doc.querySelectorAll('script[type="application/ld+json"]');
       let foundMainProduct = false;
       
       ldJsons.forEach(script => {
           try {
             const data = JSON.parse(script.textContent || '{}');
             let candidates: any[] = [];
             if (Array.isArray(data)) candidates = data.filter(d => d['@type'] === 'Product');
             else if (data['@type'] === 'Product') candidates = [data];
             else if (data['@graph']) candidates = data['@graph'].filter((d:any) => d['@type'] === 'Product');
             
             candidates.forEach(product => {
                if (foundMainProduct) return;
                
                foundMainProduct = true;
                // Só usa nome do LD-JSON se NÃO temos OG title
                if (!ogNameCleaned && product.name) finalName = product.name;
                if (product.description && !finalDescription) finalDescription = product.description;
                if (product.image) {
                   if (Array.isArray(product.image)) product.image.forEach((i:any) => allImgs.add(typeof i === 'string' ? i : i?.url || ''));
                   else if (typeof product.image === 'string') allImgs.add(product.image);
                   else if (product.image?.url) allImgs.add(product.image.url);
                }
                if (product.offers) {
                   const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                   if (offer && offer.price) finalPrice = parseFloat(offer.price);
                }
             });
           } catch(e) {}
       });

       // --- 3) DOM images extraction (fallback para fotos do produto) ---
       const imgs = doc.querySelectorAll('img');
       imgs.forEach(img => {
          let src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-zoom-image') || '';
          if (src && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(src)) {
             if(!src.startsWith('http')) {
                try { src = new URL(src, formattedUrl).toString(); } catch(e){}
             }
             allImgs.add(src);
          }
       });

       // --- 4) Vídeos embarcados (iframe youtube/vimeo + tags video) ---
       doc.querySelectorAll('video source, video[src]').forEach(v => {
          const src = v.getAttribute('src') || '';
          if (src && src.startsWith('http')) allVids.add(src);
       });

       const imgArray = Array.from(allImgs).filter(i => i.startsWith('http') && !i.includes('data:image'));
       const vidArray = Array.from(allVids).filter(v => v.startsWith('http'));

       setScrapedImages(imgArray);
       setScrapedVideos(vidArray);

       setFormData(prev => ({
          ...prev,
          name: finalName || prev.name,
          description: finalDescription || prev.description,
          cost_price: finalPrice || prev.cost_price,
          sale_price: finalPrice ? finalPrice * 2 : prev.sale_price,
          image_urls: imgArray.slice(0, 3)
       }));

       toast.success("Dados importados com sucesso! Revise e ajuste as informações.");
     } catch (err: any) {
       console.error("Erro na importação:", err);
       toast.error("Não foi possível importar dessa URL. O site parceiro pode estar bloqueando a extração.");
     } finally {
       setIsImporting(false);
     }
  };

  const handleScrapeImagesOnly = async (url: string) => {
     if (!url) return;
     setIsImporting(true);
     try {
       let htmlContent = "";
       let formattedUrl = url.trim();
       if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl;

       try {
           const res1 = await fetch(`https://corsproxy.io/?${encodeURIComponent(formattedUrl)}`);
           if (!res1.ok) throw new Error("CorsProxy.io falhou");
           htmlContent = await res1.text();
           if (!htmlContent || htmlContent.trim() === '') throw new Error("CorsProxy.io vazio");
       } catch (err1) {
           try {
               const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(formattedUrl)}`);
               if (!res2.ok) throw new Error("AllOrigins falhou");
               const data2 = await res2.json();
               htmlContent = data2.contents;
               if (!htmlContent || htmlContent.trim() === '') throw new Error("AllOrigins vazio");
           } catch (err2) {
               const res3 = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(formattedUrl)}`);
               if (!res3.ok) throw new Error("CodeTabs falhou");
               htmlContent = await res3.text();
           }
       }

       if (!htmlContent) throw new Error("ConteúdoHTML vazio retornado.");

       const parser = new DOMParser();
       const doc = parser.parseFromString(htmlContent, "text/html");

       let allImgs = new Set<string>();
       let allVids = new Set<string>();

       const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
       const ogVideo = doc.querySelector('meta[property="og:video"]')?.getAttribute('content');
       if(ogImage) allImgs.add(ogImage);
       if(ogVideo) allVids.add(ogVideo);

       const ldJsons = doc.querySelectorAll('script[type="application/ld+json"]');
       ldJsons.forEach(script => {
           try {
             const data = JSON.parse(script.textContent || '{}');
             let candidates: any[] = [];
             if (Array.isArray(data)) candidates = data.filter(d => d['@type'] === 'Product');
             else if (data['@type'] === 'Product') candidates = [data];
             else if (data['@graph']) candidates = data['@graph'].filter((d:any) => d['@type'] === 'Product');
             
             candidates.forEach(product => {
                if (product.image) {
                   if (Array.isArray(product.image)) product.image.forEach((i:any) => allImgs.add(typeof i === 'string' ? i : i?.url || ''));
                   else if (typeof product.image === 'string') allImgs.add(product.image);
                   else if (product.image?.url) allImgs.add(product.image.url);
                }
             });
           } catch(e) {}
       });

       doc.querySelectorAll('img').forEach(img => {
          let src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-zoom-image') || '';
          if (src && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(src)) {
             if(!src.startsWith('http')) {
                try { src = new URL(src, formattedUrl).toString(); } catch(e){}
             }
             allImgs.add(src);
          }
       });

       doc.querySelectorAll('video source, video[src]').forEach(v => {
          const src = v.getAttribute('src') || '';
          if (src && src.startsWith('http')) allVids.add(src);
       });

       const imgArray = Array.from(allImgs).filter(i => i.startsWith('http') && !i.includes('data:image'));
       const vidArray = Array.from(allVids).filter(v => v.startsWith('http'));

       setScrapedImages(imgArray);
       setScrapedVideos(vidArray);

       if (imgArray.length > 0 || vidArray.length > 0) {
          toast.success(`${imgArray.length} fotos encontradas! Selecione as que deseja adicionar.`);
       } else {
          toast.error("Nenhuma foto encontrada nesse link.");
       }
     } catch (err: any) {
       toast.error("Não foi possível puxar as fotos dessa URL.");
     } finally {
       setIsImporting(false);
     }
  };

  const processExternalMedia = async (url: string, isVideo: boolean) => {
      if(!url || url.includes('supabase.co')) return url;
      try {
         // ─── Check shared image cache first ───
         if (!isVideo) {
            const { data: cached } = await supabase
              .from('image_cache')
              .select('stored_url')
              .eq('source_url', url)
              .maybeSingle();
            if (cached?.stored_url) return cached.stored_url;
         }

         let res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
         if (!res.ok) {
             res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
         }
         if (!res.ok) {
             res = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`);
         }
         if (!res.ok) return url;
         const blob = await res.blob();
         
         let fileToUpload = blob;
         let ext = isVideo ? 'mp4' : 'webp';
         if (!isVideo) {
            const { compressImageToWebp } = await import('@/lib/utils');
            fileToUpload = await compressImageToWebp(blob);
         }
         const filePath = `${Math.random()}.${ext}`;
         const { error } = await supabase.storage.from('product-images').upload(filePath, fileToUpload);
         if (error) return url;
         const finalUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;

         // ─── Save to shared cache for future users ───
         if (!isVideo) {
            await supabase
              .from('image_cache')
              .upsert({ source_url: url, stored_url: finalUrl }, { onConflict: 'source_url' });
         }

         return finalUrl;
      } catch(e) { return url; }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Unauthenticated');
      
      // Map external urls to internal compressed blobs
      const finalImage1 = formData.image_urls[0] ? await processExternalMedia(formData.image_urls[0], false) : null;
      const finalImage2 = formData.image_urls[1] ? await processExternalMedia(formData.image_urls[1], false) : null;
      const finalImage3 = formData.image_urls[2] ? await processExternalMedia(formData.image_urls[2], false) : null;
      const finalVideo = formData.video_url ? await processExternalMedia(formData.video_url, true) : null;

      const payload = { 
         name: formData.name, 
         description: formData.description,
         cost_price: formData.cost_price, 
         sale_price: formData.sale_price,
         min_stock: formData.min_stock,
         category_id: formData.category_id || null, 
         subcategory_id: formData.subcategory_id || null,
         supplier_id: formData.supplier_id || null,
         filter_model: formData.filter_model,
         filter_color: formData.filter_color,
         filter_detail: formData.filter_detail,
         ncm: formData.ncm,
         cest: formData.cest,
         ean: formData.ean,
         origin_code: formData.origin_code,
         is_new_arrival: formData.is_new_arrival,
         owner_id: user.id,
         image_url: finalImage1,
         image_url_2: finalImage2,
         image_url_3: finalImage3,
         video_url: finalVideo
      };

      if (initialData?.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', initialData.id);
        if (error) throw error;
        return initialData.id;
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto salvo!');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4 w-full overflow-x-hidden">
          
          {!initialData?.id && (
             <div className="bg-primary/5 p-4 rounded-lg flex flex-col gap-2 border border-primary/20 shadow-inner">
               <label className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Wand2 className="h-4 w-4"/> Importação Mágica (URL do Fornecedor)
               </label>
               <div className="flex gap-2">
                 <Input 
                   className="flex-1 bg-background" 
                   placeholder="Cole o link do produto na loja do fornecedor..." 
                   value={importUrl} 
                   onChange={e => setImportUrl(e.target.value)} 
                 />
                 <Button variant="default" onClick={handleImportUrl} disabled={isImporting || !importUrl}>
                   {isImporting ? 'Extraindo...' : 'Importar'}
                 </Button>
               </div>
               <p className="text-[11px] text-muted-foreground mt-1 font-medium">Extraímos título, preço de custo e fotos automaticamente da maioria das lojas virtuais.</p>
             </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
             {/* LEFT COLUMN */}
             <div className="flex-1 space-y-6">
             {/* Bloco 1: Identificação */}
             <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                <div>
                   <label className="text-sm font-medium">Fornecedor</label>
                   <select className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                     <option value="">Selecione...</option>
                     {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-sm font-medium">Nome do Produto</label>
                   <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="col-span-2">
                   <label className="text-sm font-medium">Descrição</label>
                   <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Breve descrição do produto..." />
                </div>
                <div>
                   <label className="text-sm font-medium">Categoria Princ.</label>
                   <select className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                     <option value="">Selecione...</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-sm font-medium">Subcategoria</label>
                   <select className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.subcategory_id} onChange={e => setFormData({...formData, subcategory_id: e.target.value})} disabled={!formData.category_id}>
                     <option value="">Selecione...</option>
                     {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="col-span-2 flex items-center mt-2">
                   <label className="text-[13px] font-bold flex items-center gap-2 cursor-pointer bg-primary/10 text-primary w-full py-2 px-3 rounded-md border border-primary/20 hover:bg-primary/20 transition-colors">
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 rounded text-primary border-primary focus:ring-primary accent-primary cursor-pointer" 
                       checked={formData.is_new_arrival} 
                       onChange={e => setFormData({...formData, is_new_arrival: e.target.checked})} 
                     />
                     Lançamento
                   </label>
                </div>
             </div>

             {/* Bloco 3: Filtros Opcionais */}
             <div className="grid grid-cols-3 gap-4 border-l-2 pl-4 py-2 border-primary/30">
                <div className="col-span-3"><label className="text-xs font-bold uppercase text-muted-foreground">Filtros (Opcionais)</label></div>
                <div>
                   <label className="text-xs font-medium">Modelo</label>
                   <Input value={formData.filter_model} onChange={e => setFormData({ ...formData, filter_model: e.target.value })} className="h-9" />
                </div>
                <div>
                   <label className="text-xs font-medium">Cor</label>
                   <Input value={formData.filter_color} onChange={e => setFormData({ ...formData, filter_color: e.target.value })} className="h-9" />
                </div>
                <div>
                   <label className="text-xs font-medium">Detalhe</label>
                   <Input value={formData.filter_detail} onChange={e => setFormData({ ...formData, filter_detail: e.target.value })} className="h-9" />
                </div>
             </div>
             
             {/* Variantes de Tamanho no final da coluna esquerda */}
             {initialData?.id ? (
                <ProductVariantsSection productId={initialData.id} productSalePrice={Number(formData.sale_price) || 0} />
             ) : (
                <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded mt-4 border border-amber-200 shadow-sm">
                   <span className="font-semibold">⚠️ Atenção:</span> Salve o produto principal (esta janela) primeiro para liberar o preenchimento da tabela de Medidas e Estoques variados.
                </div>
             )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-6">
             {/* Bloco 2: Financeiro e Estoque */}
             <div className="grid grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg border">
                <div>
                  <label className="text-sm font-medium">Preço Custo (R$)</label>
                  <Input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Preço Venda (R$)</label>
                  <Input type="number" step="0.01" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Estoque Mínimo</label>
                  <Input type="number" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })} />
                </div>
             </div>

             {/* Bloco 4: Emissão NF-e */}
             <div className="grid grid-cols-4 gap-4 bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                <div className="col-span-4"><label className="text-xs font-bold uppercase text-amber-700">Dados Fiscais (NF-e)</label></div>
                <div className="col-span-4 lg:col-span-2">
                   <label className="text-xs font-medium text-amber-900">EAN/GTIN (Cód. Barras)</label>
                   <Input value={formData.ean} onChange={e => setFormData({ ...formData, ean: e.target.value })} className="h-9" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                   <label className="text-xs font-medium text-amber-900">NCM (8 dígitos)</label>
                   <Input value={formData.ncm} onChange={e => setFormData({ ...formData, ncm: e.target.value })} className="h-9" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                   <label className="text-xs font-medium text-amber-900">CEST</label>
                   <Input value={formData.cest} onChange={e => setFormData({ ...formData, cest: e.target.value })} className="h-9" />
                </div>
                <div className="col-span-4">
                   <label className="text-xs font-medium text-amber-900">Origem da Mercadoria</label>
                   <select className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-1 text-sm" value={formData.origin_code} onChange={e => setFormData({...formData, origin_code: e.target.value})}>
                     <option value="0">0 - Nacional (Dentro do Brasil)</option>
                     <option value="1">1 - Estrangeira (Importação Direta)</option>
                     <option value="2">2 - Estrangeira (Adquirida no Mercado Interno)</option>
                   </select>
                </div>
             </div>
             

          </div>
        </div>
          
          {/* SCRAPED MEDIA TRAY */}
          {(scrapedImages.length > 0 || scrapedVideos.length > 0) && (
             <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                <h4 className="text-sm font-semibold mb-2">Mídias Encontradas (Clique para Adicionar)</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                   {scrapedImages.map((img, i) => (
                      <div key={i} onClick={() => {
                         if (formData.image_urls.includes(img)) {
                             setFormData(p => ({...p, image_urls: p.image_urls.filter(x => x !== img)}));
                         } else {
                             if(formData.image_urls.length >= 3) { toast.error("Máximo de 3 fotos atingido"); return; }
                             setFormData(p => ({...p, image_urls: [...p.image_urls, img]}));
                         }
                      }} className={`h-20 w-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden relative border-2 transition-all ${formData.image_urls.includes(img) ? 'border-primary opacity-50' : 'border-transparent hover:border-primary/50'}`}>
                         <img src={img} className="w-full h-full object-cover" />
                      </div>
                   ))}
                   {scrapedVideos.map((vid, i) => (
                      <div key={i} onClick={() => {
                         if (formData.video_url === vid) {
                             setFormData(p => ({...p, video_url: ''}));
                         } else {
                             setFormData(p => ({...p, video_url: vid}));
                         }
                      }} className={`h-20 w-28 bg-black flex-shrink-0 cursor-pointer rounded-md overflow-hidden flex items-center justify-center relative border-2 transition-all ${formData.video_url === vid ? 'border-primary opacity-50' : 'border-transparent hover:border-primary/50'}`}>
                         <video src={vid} className="w-full h-full object-cover opacity-50 pointer-events-none" />
                         <span className="absolute text-xs text-white bg-black/60 px-1 rounded">Vídeo</span>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <ProductMediaSection 
             images={formData.image_urls} 
             video={formData.video_url}
             onChangeImages={(urls) => setFormData({...formData, image_urls: urls})}
             onChangeVideo={(url) => setFormData({...formData, video_url: url})}
             onScrapeUrl={handleScrapeImagesOnly}
             isScraping={isImporting}
          />
          


          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
