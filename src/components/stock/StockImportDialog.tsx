import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useImageSyncStore, QueueItem } from '@/store/useImageSyncStore';
import ImportReviewStep, { ImportReviewItem, normalizeForComparison } from './ImportReviewStep';

export default function StockImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Mapping, 3 = Review
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [reviewItems, setReviewItems] = useState<ImportReviewItem[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [mapping, setMapping] = useState({
    name: '',
    cost_price: '',
    sale_price: '',
    category_text: '',
    supplier_text: '',
    image_url: '',
    variant_size: '',
    variant_color: '',
    variant_stock: '',
    variant_sku: '',
    description: '',
    subcategory_text: '',
    image_url_2: '',
    image_url_3: '',
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setParsedData([]);
      setFileKeys([]);
      setStatus('');
      setReviewItems([]);
    }
  }, [open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        
        if (rows.length === 0) {
           toast.error('Planilha está vazia.');
           setLoading(false);
           return;
        }

        const keys = Object.keys(rows[0] as object);
        setParsedData(rows);
        setFileKeys(keys);

        // Auto Mapping Magic
        const getMatch = (terms: string[]) => keys.find(k => terms.some(t => k.toLowerCase().includes(t))) || '';
        setMapping({
          name: getMatch(['nome', 'produto', 'titulo', 'descrição']),
          cost_price: getMatch(['custo', 'compra']),
          sale_price: getMatch(['venda', 'preço', 'valor']),
          category_text: getMatch(['categoria', 'grupo']),
          supplier_text: getMatch(['fornecedor', 'marca']),
          image_url: getMatch(['imagem', 'foto principal', 'link principal', 'url', 'foto 1']),
          image_url_2: getMatch(['imagem 2', 'foto 2', 'link 2']),
          image_url_3: getMatch(['imagem 3', 'foto 3', 'link 3']),
          description: getMatch(['descrição', 'detalhes', 'sinopse', 'resumo']),
          subcategory_text: getMatch(['subcategoria', 'linha', 'tipo', 'coleção']),
          variant_size: getMatch(['tamanho', 'size']),
          variant_color: getMatch(['cor', 'color']),
          variant_stock: getMatch(['estoque', 'quantidade', 'qtd']),
          variant_sku: getMatch(['sku', 'codigo', 'ref']),
        });

        setStep(2);
      } catch (err) {
        toast.error('Erro ao ler arquivo. Verifique se é um arquivo Excel ou CSV válido.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Step 2 → Step 3: Analyze duplicates and build review list
  const analyzeAndReview = async () => {
    if (!mapping.name) return toast.error('É obrigatório mapear a coluna "Nome do Produto".');
    setLoading(true);
    setStatus('Verificando produtos existentes...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      // Fetch all existing products with their variants
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, name, total_stock, cost_price, sale_price, category_id, supplier_id, subcategory_id')
        .eq('owner_id', user.id)
        .neq('marketing_status', 'archived');

      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id, product_id, size, color, stock, sku')
        .eq('owner_id', user.id);

      if (existingProducts) setAllProducts(existingProducts);

      // Build lookup map: normalized name → product + variants
      const existingMap = new Map<string, { product: any; variants: any[] }>();
      const skuMap = new Map<string, { product: any; variants: any[] }>();

      (existingProducts || []).forEach(p => {
        const normalized = normalizeForComparison(p.name);
        const productVariants = (existingVariants || []).filter(v => v.product_id === p.id);
        const entry = { product: p, variants: productVariants };
        existingMap.set(normalized, entry);
        // Also build SKU map
        productVariants.forEach(v => {
          if (v.sku) skuMap.set(normalizeForComparison(v.sku), entry);
        });
      });

      // Resolve categories, suppliers, subcategories
      const { data: existingCategories } = await supabase.from('categories').select('id, name');
      const { data: existingSuppliers } = await supabase.from('suppliers').select('id, name');
      const { data: existingSubcategories } = await supabase.from('subcategories').select('id, name');

      const categoryMap: Record<string, string> = {};
      const supplierMap: Record<string, string> = {};
      const subcategoryMap: Record<string, string> = {};

      // Map categories (no auto-create)
      const newCats = new Set<string>();
      const newSups = new Set<string>();
      const newSubs = new Set<string>();

      parsedData.forEach(row => {
        if (mapping.category_text && row[mapping.category_text]) newCats.add(String(row[mapping.category_text]).trim());
        if (mapping.supplier_text && row[mapping.supplier_text]) newSups.add(String(row[mapping.supplier_text]).trim());
        if (mapping.subcategory_text && row[mapping.subcategory_text]) newSubs.add(String(row[mapping.subcategory_text]).trim());
      });

      for (const cat of Array.from(newCats)) {
        const found = existingCategories?.find(c => c.name.toLowerCase() === cat.toLowerCase());
        if (found) categoryMap[cat] = found.id;
        // Não cria categorias novas - usuário deve cadastrar manualmente
      }

      for (const sup of Array.from(newSups)) {
        const found = existingSuppliers?.find(s => s.name.toLowerCase() === sup.toLowerCase());
        if (found) supplierMap[sup] = found.id;
        else {
           const { data: newS } = await supabase.from('suppliers').insert({ name: sup, owner_id: user.id }).select('id').single();
           if (newS) supplierMap[sup] = newS.id;
        }
      }

      for (const sub of Array.from(newSubs)) {
        const found = existingSubcategories?.find(s => s.name.toLowerCase() === sub.toLowerCase());
        if (found) subcategoryMap[sub] = found.id;
        // Não cria subcategorias novas
      }

      // Group parsed data by product name
      const productsGrouped: Record<string, any[]> = {};
      parsedData.forEach(row => {
         const name = row[mapping.name];
         if (!name) return;
         if (!productsGrouped[name]) productsGrouped[name] = [];
         productsGrouped[name].push(row);
      });

      // Build review items
      setStatus('Analisando duplicatas...');
      const items: ImportReviewItem[] = [];

      for (const [name, rows] of Object.entries(productsGrouped)) {
        const normalizedName = normalizeForComparison(name);
        const firstRow = rows[0];
        
        // Check for existing match by name first, then by SKU
        let existingEntry = existingMap.get(normalizedName);
        if (!existingEntry && mapping.variant_sku) {
          const sku = String(firstRow[mapping.variant_sku] || '').trim();
          if (sku) existingEntry = skuMap.get(normalizeForComparison(sku));
        }

        // Build file variants
        const fileVariants = rows.map(row => {
          const stockStr = mapping.variant_stock ? String(row[mapping.variant_stock]).trim() : '0';
          const stockCount = parseInt(stockStr.replace(/\D/g, '')) || 0;
          return {
            size: mapping.variant_size ? String(row[mapping.variant_size] || 'Único') : 'Único',
            color: mapping.variant_color ? String(row[mapping.variant_color] || 'Padrão') : 'Padrão',
            stock: stockCount,
            sku: mapping.variant_sku ? String(row[mapping.variant_sku] || '') : null,
          };
        });

        const cost = parseFloat((firstRow[mapping.cost_price] || '0').toString().replace(',','.')) || 0;
        const sale = parseFloat((firstRow[mapping.sale_price] || '0').toString().replace(',','.')) || 0;

        const catText = mapping.category_text && firstRow[mapping.category_text] ? String(firstRow[mapping.category_text]).trim() : null;
        const supText = mapping.supplier_text && firstRow[mapping.supplier_text] ? String(firstRow[mapping.supplier_text]).trim() : null;
        const subText = mapping.subcategory_text && firstRow[mapping.subcategory_text] ? String(firstRow[mapping.subcategory_text]).trim() : null;

        items.push({
          fileName: name,
          fileCostPrice: cost,
          fileSalePrice: sale,
          fileVariants,
          fileTotalStock: fileVariants.reduce((sum, v) => sum + v.stock, 0),
          existingMatch: existingEntry ? {
            id: existingEntry.product.id,
            name: existingEntry.product.name,
            currentTotalStock: existingEntry.product.total_stock || 0,
            variants: existingEntry.variants.map(v => ({
              id: v.id,
              size: v.size || 'Único',
              color: v.color || 'Padrão',
              stock: v.stock || 0,
              sku: v.sku || null,
            })),
          } : null,
          action: 'add', // Default: acrescentar (mais seguro)
          categoryId: catText ? (categoryMap[catText] || null) : null,
          supplierId: supText ? (supplierMap[supText] || null) : null,
          subcategoryId: subText ? (subcategoryMap[subText] || null) : null,
          description: mapping.description ? firstRow[mapping.description] : null,
          imageUrl: mapping.image_url ? firstRow[mapping.image_url] : null,
          imageUrl2: mapping.image_url_2 ? firstRow[mapping.image_url_2] : null,
          imageUrl3: mapping.image_url_3 ? firstRow[mapping.image_url_3] : null,
          detectedProductName: name,
          detectedSize: null,
          matchSource: existingEntry ? 'exact' : 'none',
        });
      }

      setReviewItems(items);
      setStep(3);
    } catch (e: any) {
      toast.error('Erro na análise: ' + e.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // Step 3 → Execute final import with differentiated actions
  const executeImport = async () => {
    setLoading(true);
    setStatus('Iniciando importação...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      const newItems = reviewItems.filter(i => !i.existingMatch);
      const existingItems = reviewItems.filter(i => !!i.existingMatch);

      const productNameToId: Record<string, string> = {};

      // 1. INSERT new products
      if (newItems.length > 0) {
        setStatus(`Criando ${newItems.length} produtos novos...`);
        const productsToInsert: any[] = [];

        for (const item of newItems) {
          const id = crypto.randomUUID();
          productNameToId[item.fileName] = id;
          productsToInsert.push({
            id,
            owner_id: user.id,
            name: item.fileName,
            cost_price: item.fileCostPrice,
            sale_price: item.fileSalePrice,
            description: item.description,
            image_url: item.imageUrl,
            image_url_2: item.imageUrl2,
            image_url_3: item.imageUrl3,
            category_id: item.categoryId,
            subcategory_id: item.subcategoryId,
            supplier_id: item.supplierId,
            marketing_status: 'active',
          });
        }

        for (let i = 0; i < productsToInsert.length; i += 1000) {
          setStatus(`Enviando Lote de Produtos (${i}/${productsToInsert.length})...`);
          await supabase.from('products').insert(productsToInsert.slice(i, i + 1000));
          await new Promise(r => setTimeout(r, 50));
        }

        // Insert variants for new products
        const variantsToInsert: any[] = [];
        for (const item of newItems) {
          const pId = productNameToId[item.fileName];
          for (const v of item.fileVariants) {
            variantsToInsert.push({
              id: crypto.randomUUID(),
              product_id: pId,
              owner_id: user.id,
              size: v.size,
              color: v.color,
              sku: v.sku || null,
              stock: v.stock,
            });
          }
        }

        for (let i = 0; i < variantsToInsert.length; i += 1000) {
          setStatus(`Registrando Estoque Novos (${i}/${variantsToInsert.length})...`);
          await supabase.from('product_variants').insert(variantsToInsert.slice(i, i + 1000));
          await new Promise(r => setTimeout(r, 50));
        }
      }

      // 2. Process existing products
      if (existingItems.length > 0) {
        setStatus(`Atualizando ${existingItems.length} produtos existentes...`);
        
        for (let idx = 0; idx < existingItems.length; idx++) {
          const item = existingItems[idx];
          const existing = item.existingMatch!;
          setStatus(`Atualizando (${idx + 1}/${existingItems.length}): ${item.fileName.substring(0, 30)}...`);

          // Update product-level data (like images) if we are replacing or if the image is missing
          const updatePayload: any = {};
          if (item.action === 'replace') {
             if (item.fileCostPrice) updatePayload.cost_price = item.fileCostPrice;
             if (item.fileSalePrice) updatePayload.sale_price = item.fileSalePrice;
             if (item.categoryId) updatePayload.category_id = item.categoryId;
             if (item.supplierId) updatePayload.supplier_id = item.supplierId;
             if (item.subcategoryId) updatePayload.subcategory_id = item.subcategoryId;
             if (item.description) updatePayload.description = item.description;
          }
          // Always try to restore image URLs if they are provided in the spreadsheet
          if (item.imageUrl) updatePayload.image_url = item.imageUrl;
          if (item.imageUrl2) updatePayload.image_url_2 = item.imageUrl2;
          if (item.imageUrl3) updatePayload.image_url_3 = item.imageUrl3;

          if (Object.keys(updatePayload).length > 0) {
             await supabase.from('products').update(updatePayload).eq('id', existing.id);
          }

          for (const fv of item.fileVariants) {
            // Find matching existing variant by size+color
            const normalizedSize = normalizeForComparison(fv.size);
            const normalizedColor = normalizeForComparison(fv.color);
            
            const matchingVariant = existing.variants.find(ev =>
              normalizeForComparison(ev.size) === normalizedSize &&
              normalizeForComparison(ev.color) === normalizedColor
            );

            if (matchingVariant) {
              // Update existing variant
              const newStock = item.action === 'replace' ? fv.stock : matchingVariant.stock + fv.stock;
              await supabase
                .from('product_variants')
                .update({ stock: newStock })
                .eq('id', matchingVariant.id);
            } else {
              // Insert new variant for existing product
              await supabase.from('product_variants').insert({
                id: crypto.randomUUID(),
                product_id: existing.id,
                owner_id: user.id,
                size: fv.size,
                color: fv.color,
                sku: fv.sku || null,
                stock: fv.stock,
              });
            }
          }
        }
      }

      // 3. Initiate background image download for new items AND existing items with external URLs
      const imagesToDownload: QueueItem[] = [];
      const allProcessedItems = [...newItems, ...existingItems];
      for (const item of allProcessedItems) {
         const pId = item.existingMatch ? item.existingMatch.id : productNameToId[item.fileName];
         if (pId) {
             if (item.imageUrl && !item.imageUrl.includes('supabase.co')) {
                imagesToDownload.push({ id: pId, url: item.imageUrl, column: 'image_url' });
             }
             if (item.imageUrl2 && !item.imageUrl2.includes('supabase.co')) {
                imagesToDownload.push({ id: pId, url: item.imageUrl2, column: 'image_url_2' });
             }
             if (item.imageUrl3 && !item.imageUrl3.includes('supabase.co')) {
                imagesToDownload.push({ id: pId, url: item.imageUrl3, column: 'image_url_3' });
             }
         }
      }

      if (imagesToDownload.length > 0) {
         const { data: sessionData } = await supabase.auth.getSession();
         const token = sessionData.session?.access_token;
         
         if (token) {
             const { addToQueue, startProcessing } = useImageSyncStore.getState();
             addToQueue(imagesToDownload);
             startProcessing(token);
         }
      }

      const totalProcessed = reviewItems.length;
      toast.success(`${totalProcessed} produtos processados! (${newItems.length} novos, ${existingItems.length} atualizados)`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);

    } catch (e: any) {
      toast.error('Erro na importação: ' + e.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar Planilha (XLS/CSV)
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 3 ? "sm:max-w-[600px]" : "sm:max-w-[480px]"}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Sistema Inteligente de Planilhas' : step === 2 ? 'Mapeamento de Colunas' : 'Revisão de Importação'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Envie as suas faturas (Excel .xls, .xlsx ou CSV). Nosso motor identificará os dados para que você defina como cadastrá-los.' 
            : step === 2 ? `Detectamos ${parsedData.length} registros. Diga onde o sistema deve catalogar cada dado:` 
            : 'Verifique os produtos abaixo e escolha como tratar os já cadastrados.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="py-6 space-y-4">
            <div className="border-2 border-dashed border-indigo-200 p-12 rounded-xl text-center bg-indigo-50/50 relative w-full h-[200px] flex flex-col items-center justify-center transition hover:bg-indigo-50">
              <input type="file" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <FileSpreadsheet className="h-10 w-10 text-indigo-600 mb-3 opacity-90" />
              <h3 className="font-semibold text-sm text-indigo-950">Selecione o Arquivo Excel</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">Suporta extensões do Excel Brasileiro e CSV Internacional.</p>
            </div>
            {loading && <p className="text-sm font-medium text-indigo-600 text-center animate-pulse">Lendo fragmentos...</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
             <div className="bg-emerald-50 text-emerald-800 p-3 rounded text-xs border border-emerald-200 flex gap-2 items-start mt-2 shadow-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Análises concluídas! Nossa IA fez um pré-mapeamento das melhores escolhas. Altere o que julgar necessário para cada caixa:</span>
             </div>

             <div className="space-y-4 pt-2">
                <LabelSelect label="Nome do Produto (Crucial)" value={mapping.name} options={fileKeys} onChange={(v: string) => setMapping({...mapping, name: v})} required />
                <LabelSelect label="Descrição / Detalhes" value={mapping.description} options={fileKeys} onChange={(v: string) => setMapping({...mapping, description: v})} />
                <div className="grid grid-cols-2 gap-3">
                   <LabelSelect label="Preço de Custo (R$)" value={mapping.cost_price} options={fileKeys} onChange={(v: string) => setMapping({...mapping, cost_price: v})} />
                   <LabelSelect label="Preço de Venda (R$)" value={mapping.sale_price} options={fileKeys} onChange={(v: string) => setMapping({...mapping, sale_price: v})} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                   <LabelSelect label="Categoria Base" value={mapping.category_text} options={fileKeys} onChange={(v: string) => setMapping({...mapping, category_text: v})} />
                   <LabelSelect label="Subcategoria" value={mapping.subcategory_text} options={fileKeys} onChange={(v: string) => setMapping({...mapping, subcategory_text: v})} />
                   <LabelSelect label="Marca" value={mapping.supplier_text} options={fileKeys} onChange={(v: string) => setMapping({...mapping, supplier_text: v})} />
                </div>
                
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground border-b pb-1 mt-6 mb-2 text-indigo-700">Tabela de Controle: Variações</h4>
                <div className="grid grid-cols-2 gap-3">
                   <LabelSelect label="Estoque Físico / Quantidade" value={mapping.variant_stock} options={fileKeys} onChange={(v: string) => setMapping({...mapping, variant_stock: v})} />
                   <LabelSelect label="Código SKU" value={mapping.variant_sku} options={fileKeys} onChange={(v: string) => setMapping({...mapping, variant_sku: v})} />
                   <LabelSelect label="Variante de Tamanho" value={mapping.variant_size} options={fileKeys} onChange={(v: string) => setMapping({...mapping, variant_size: v})} />
                   <LabelSelect label="Variante de Cor" value={mapping.variant_color} options={fileKeys} onChange={(v: string) => setMapping({...mapping, variant_color: v})} />
                </div>

                <h4 className="text-[10px] uppercase font-bold text-muted-foreground border-b pb-1 mt-6 mb-2 text-indigo-700">Recursos de Mídia</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <LabelSelect label="Imagem 1 (Capa)" value={mapping.image_url} options={fileKeys} onChange={(v: string) => setMapping({...mapping, image_url: v})} />
                   <LabelSelect label="Imagem Adicional 2" value={mapping.image_url_2} options={fileKeys} onChange={(v: string) => setMapping({...mapping, image_url_2: v})} />
                   <LabelSelect label="Imagem Adicional 3" value={mapping.image_url_3} options={fileKeys} onChange={(v: string) => setMapping({...mapping, image_url_3: v})} />
                </div>
             </div>

             <div className="pt-4 mt-6 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-10 flex gap-2 pb-1">
                <Button variant="outline" className="flex-1 border-slate-300" onClick={() => setStep(1)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" disabled={loading} onClick={analyzeAndReview}>
                   {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {status || 'Analisando'}</> : 'Analisar e Revisar'}
                </Button>
             </div>
          </div>
        )}

        {step === 3 && (
          <ImportReviewStep
            items={reviewItems}
            onItemsChange={setReviewItems}
            onConfirm={executeImport}
            onBack={() => setStep(2)}
            loading={loading}
            status={status}
            allExistingProducts={allProducts}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LabelSelect({ label, value, options, onChange, required = false }: any) {
   return (
      <div className="space-y-1">
         <label className={`text-[10px] font-bold tracking-tight uppercase ${required ? 'text-indigo-600' : 'text-slate-500'}`}>{label}</label>
         <select className="flex h-9 w-full rounded-md border border-input bg-background/50 px-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm" value={value} onChange={e => onChange(e.target.value)}>
            <option value="">-- Deixar em Branco / Ignorar --</option>
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
         </select>
      </div>
   )
}
