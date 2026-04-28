import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import ImportReviewStep, { ImportReviewItem, ExistingProductOption, normalizeForComparison } from './ImportReviewStep';

// ── Size detection ──────────────────────────────────────────────────────────
const KNOWN_SIZES = new Set([
  'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'EG', 'EGG', 'EGGG',
  'XS', 'S', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL',
  '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50',
  'UN', 'UNICO', 'ÚNICO', 'U',
]);

function extractSizeFromName(name: string): { productName: string; size: string | null } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { productName: name, size: null };

  const lastPart = parts[parts.length - 1]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (KNOWN_SIZES.has(lastPart)) {
    return {
      productName: parts.slice(0, -1).join(' '),
      size: lastPart,
    };
  }
  return { productName: name, size: null };
}

// ───────────────────────────────────────────────────────────────────────────

export default function NfeImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [reviewItems, setReviewItems] = useState<ImportReviewItem[]>([]);
  const [allExistingProducts, setAllExistingProducts] = useState<ExistingProductOption[]>([]);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setReviewItems([]);
      setStatus('');
      setAllExistingProducts([]);
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus('Lendo XML...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlString = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        const prods = Array.from(xmlDoc.getElementsByTagName('prod'));
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Não autenticado');
        if (prods.length === 0) throw new Error('Nenhuma tag <prod> encontrada. O XML é realmente uma NFe?');

        setStatus('Verificando produtos existentes...');

        const { data: existingProducts } = await supabase
          .from('products')
          .select('id, name, total_stock, cost_price, sale_price, category_id, supplier_id, subcategory_id')
          .eq('owner_id', user.id)
          .neq('marketing_status', 'archived');

        const { data: existingVariants } = await supabase
          .from('product_variants')
          .select('id, product_id, size, color, stock, sku')
          .eq('owner_id', user.id);

        // Build lookup maps
        const exactMap = new Map<string, { product: any; variants: any[] }>();
        const skuMap = new Map<string, { product: any; variants: any[] }>();
        const smartMap = new Map<string, { product: any; variants: any[] }>();
        const allProdsForReview: ExistingProductOption[] = [];

        (existingProducts || []).forEach(p => {
          const productVariants = (existingVariants || []).filter(v => v.product_id === p.id);
          const entry = { product: p, variants: productVariants };

          exactMap.set(normalizeForComparison(p.name), entry);

          productVariants.forEach(v => {
            if (v.sku) skuMap.set(normalizeForComparison(v.sku), entry);
          });

          // Also index by name-without-size for smart matching
          const { productName: nameWithoutSize } = extractSizeFromName(p.name);
          if (nameWithoutSize !== p.name) {
            smartMap.set(normalizeForComparison(nameWithoutSize), entry);
          }

          allProdsForReview.push({
            id: p.id,
            name: p.name,
            variants: productVariants.map(v => ({
              id: v.id,
              size: v.size || 'Único',
              color: v.color || 'Padrão',
              stock: v.stock || 0,
              sku: v.sku || null,
            })),
          });
        });

        setAllExistingProducts(allProdsForReview);
        setStatus('Analisando produtos e tamanhos...');

        // Group NFe products by XML name
        const nfeGrouped: Record<string, { name: string; cost: number; quantity: number; sku: string }[]> = {};
        prods.forEach(prod => {
          const name = prod.getElementsByTagName('xProd')[0]?.textContent || 'Produto Desconhecido';
          const cost = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');
          const qty = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '1');
          const sku = prod.getElementsByTagName('cProd')[0]?.textContent || '';
          if (!nfeGrouped[name]) nfeGrouped[name] = [];
          nfeGrouped[name].push({ name, cost, quantity: Math.round(qty), sku });
        });

        const items: ImportReviewItem[] = [];

        for (const [name, entries] of Object.entries(nfeGrouped)) {
          const firstEntry = entries[0];
          const totalQty = entries.reduce((sum, e) => sum + e.quantity, 0);
          const avgCost = entries.reduce((sum, e) => sum + e.cost, 0) / entries.length;

          // Extract size from name
          const { productName: detectedProductName, size: detectedSize } = extractSizeFromName(name);

          const normalizedExact = normalizeForComparison(name);
          const normalizedDetected = normalizeForComparison(detectedProductName);

          // Determine match source
          let existingEntry = exactMap.get(normalizedExact);
          let matchSource: ImportReviewItem['matchSource'] = 'none';

          if (existingEntry) {
            matchSource = 'exact';
          } else if (firstEntry.sku && skuMap.get(normalizeForComparison(firstEntry.sku))) {
            existingEntry = skuMap.get(normalizeForComparison(firstEntry.sku));
            matchSource = 'sku';
          } else if (detectedSize) {
            // Try smart match: detected name vs exact map
            existingEntry = exactMap.get(normalizedDetected);
            if (!existingEntry) existingEntry = smartMap.get(normalizedDetected);
            if (existingEntry) matchSource = 'smart';
          }

          const variantSize = detectedSize || 'Único';

          items.push({
            fileName: name,
            detectedProductName,
            detectedSize,
            matchSource,
            fileCostPrice: avgCost,
            fileSalePrice: avgCost * 2,
            fileVariants: [{
              size: variantSize,
              color: 'Padrão',
              stock: totalQty,
              sku: firstEntry.sku || null,
            }],
            fileTotalStock: totalQty,
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
            action: 'add',
            categoryId: null,
            supplierId: null,
            subcategoryId: null,
            description: null,
            imageUrl: null,
            imageUrl2: null,
            imageUrl3: null,
          });
        }

        setReviewItems(items);
        setStep(2);
      } catch (err: any) {
        toast.error('Erro na NFe: ' + err.message);
      } finally {
        setLoading(false);
        setStatus('');
      }
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    setLoading(true);
    setStatus('Iniciando importação...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      // Items to create as new: no match OR user chose 'new'
      const newItems = reviewItems.filter(i => !i.existingMatch || i.action === 'new');
      // Items to update existing stock
      const existingItems = reviewItems.filter(i => !!i.existingMatch && i.action !== 'new');

      // 1. Create new products
      if (newItems.length > 0) {
        setStatus(`Criando ${newItems.length} produtos novos...`);
        for (const item of newItems) {
          const productId = crypto.randomUUID();
          const productName = item.detectedProductName || item.fileName;

          const { error: pErr } = await supabase.from('products').insert({
            id: productId,
            owner_id: user.id,
            name: productName,
            cost_price: item.fileCostPrice,
            sale_price: item.fileSalePrice,
            marketing_status: 'active',
          });
          if (pErr) throw pErr;

          for (const v of item.fileVariants) {
            await supabase.from('product_variants').insert({
              id: crypto.randomUUID(),
              product_id: productId,
              owner_id: user.id,
              size: v.size,
              color: v.color,
              sku: v.sku || null,
              stock: v.stock,
            });
          }
        }
      }

      // 2. Update existing products
      if (existingItems.length > 0) {
        setStatus(`Atualizando ${existingItems.length} produtos existentes...`);
        for (let idx = 0; idx < existingItems.length; idx++) {
          const item = existingItems[idx];
          const existing = item.existingMatch!;
          setStatus(`Atualizando (${idx + 1}/${existingItems.length}): ${item.fileName.substring(0, 30)}...`);

          for (const fv of item.fileVariants) {
            const normalizedSize = normalizeForComparison(fv.size);
            const normalizedColor = normalizeForComparison(fv.color);

            const matchingVariant = existing.variants.find(ev =>
              normalizeForComparison(ev.size) === normalizedSize &&
              normalizeForComparison(ev.color) === normalizedColor
            );

            if (matchingVariant) {
              const newStock = item.action === 'replace' ? fv.stock : matchingVariant.stock + fv.stock;
              await supabase.from('product_variants').update({ stock: newStock }).eq('id', matchingVariant.id);
            } else {
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

      toast.success(
        `${reviewItems.length} produtos processados! (${newItems.length} novos, ${existingItems.length} atualizados)`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:text-orange-700">
          <FileText className="mr-2 h-4 w-4" /> Ler NFe (XML)
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 2 ? 'sm:max-w-[660px]' : ''}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Importar da Nota Fiscal (NFe)' : 'Revisão de Importação NFe'}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Selecione o arquivo .xml da NFe. Os produtos serão analisados e tamanhos detectados automaticamente antes da importação.'
              : 'Confirme os vínculos sugeridos, ajuste se necessário, e importe.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-6 space-y-4">
            <div className="border-2 border-dashed border-orange-200 p-12 rounded-xl text-center bg-orange-50/50 relative w-full h-[200px] flex flex-col items-center justify-center transition hover:bg-orange-50">
              <input type="file" accept=".xml" onChange={handleFileUpload} disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <FileText className="h-10 w-10 text-orange-600 mb-3 opacity-90" />
              <h3 className="font-semibold text-sm text-orange-950">Selecione o Arquivo XML</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">Arquivo .xml da NFe do fornecedor. O sistema detecta tamanhos automaticamente.</p>
            </div>
            {loading && (
              <p className="text-sm font-medium text-orange-600 text-center animate-pulse flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {status || 'Processando a nota, aguarde...'}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <ImportReviewStep
            items={reviewItems}
            onItemsChange={setReviewItems}
            onConfirm={executeImport}
            onBack={() => setStep(1)}
            loading={loading}
            status={status}
            allExistingProducts={allExistingProducts}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
