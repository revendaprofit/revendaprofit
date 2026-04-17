import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function StockImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Mapping
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  
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

  const executeImport = async () => {
    if (!mapping.name) return toast.error('É obrigatório mapear a coluna "Nome do Produto".');
    setLoading(true);
    setStatus('Iniciando importação...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      const { data: existingCategories } = await supabase.from('categories').select('id, name');
      const { data: existingSuppliers } = await supabase.from('suppliers').select('id, name');
      const { data: existingSubcategories } = await supabase.from('subcategories').select('id, name');

      const categoryMap: Record<string, string> = {};
      const supplierMap: Record<string, string> = {};
      const subcategoryMap: Record<string, string> = {};

      setStatus('Mapeando Categorias, Subcategorias e Fornecedores...');
      
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
        // Se a categoria não existir, o sistema ignorará e atribuirá nulidade.
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
        // Se a subcategoria não existir, o sistema ignorará e atribuirá nulidade.
      }

      const productsGrouped: Record<string, any[]> = {};
      parsedData.forEach(row => {
         const name = row[mapping.name];
         if (!name) return;
         if (!productsGrouped[name]) productsGrouped[name] = [];
         productsGrouped[name].push(row);
      });

      const productsToInsert = [];
      const productNameToIds: Record<string, string> = {};

      setStatus('Compilando Estrutura de Produtos...');
      for (const [name, rows] of Object.entries(productsGrouped)) {
         const generatedId = crypto.randomUUID();
         productNameToIds[name] = generatedId;
         
         const firstRow = rows[0];
         const cost = parseFloat((firstRow[mapping.cost_price] || '0').toString().replace(',','.')) || 0;
         const sale = parseFloat((firstRow[mapping.sale_price] || '0').toString().replace(',','.')) || 0;

         productsToInsert.push({
            id: generatedId,
            owner_id: user.id,
            name: name,
            cost_price: cost,
            sale_price: sale,
            description: mapping.description ? firstRow[mapping.description] : null,
            image_url: mapping.image_url ? firstRow[mapping.image_url] : null,
            image_url_2: mapping.image_url_2 ? firstRow[mapping.image_url_2] : null,
            image_url_3: mapping.image_url_3 ? firstRow[mapping.image_url_3] : null,
            category_id: mapping.category_text && firstRow[mapping.category_text] ? categoryMap[firstRow[mapping.category_text]] : null,
            subcategory_id: mapping.subcategory_text && firstRow[mapping.subcategory_text] ? subcategoryMap[firstRow[mapping.subcategory_text]] : null,
            supplier_id: mapping.supplier_text && firstRow[mapping.supplier_text] ? supplierMap[firstRow[mapping.supplier_text]] : null,
            marketing_status: 'active'
         });
      }

      for(let i=0; i<productsToInsert.length; i+=1000) {
         setStatus(`Enviando Lote de Produtos Base (${i}/${productsToInsert.length})...`);
         await supabase.from('products').insert(productsToInsert.slice(i, i+1000));
         await new Promise(r => setTimeout(r, 50));
      }

      const variantsToInsert: any[] = [];
      setStatus('Montando Malha de Variações e Estoque...');
      for (const [name, rows] of Object.entries(productsGrouped)) {
         const pId = productNameToIds[name];
         rows.forEach(row => {
            const stockStr = mapping.variant_stock ? String(row[mapping.variant_stock]).trim() : '0';
            const stockCount = parseInt(stockStr.replace(/\D/g, '')) || 0;
            
            variantsToInsert.push({
               id: crypto.randomUUID(),
               product_id: pId,
               owner_id: user.id,
               size: mapping.variant_size ? String(row[mapping.variant_size] || 'Único') : 'Único',
               color: mapping.variant_color ? String(row[mapping.variant_color] || 'Padrão') : 'Padrão',
               sku: mapping.variant_sku ? String(row[mapping.variant_sku] || '') : null,
               stock: stockCount
            });
         });
      }

      for(let i=0; i<variantsToInsert.length; i+=1000) {
         setStatus(`Descarregando Estoque (${i}/${variantsToInsert.length})...`);
         await supabase.from('product_variants').insert(variantsToInsert.slice(i, i+1000));
         await new Promise(r => setTimeout(r, 50));
      }

      toast.success(`${productsToInsert.length} Produtos processados a partir da planilha!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);

    } catch (e: any) {
      toast.error('O erro final ocorreu: ' + e.message);
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Sistema Inteligente de Planilhas' : 'Mapeamento de Colunas'}</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Envie as suas faturas (Excel .xls, .xlsx ou CSV). Nosso motor identificará os dados para que você defina como cadastrá-los.' : `Detectamos ${parsedData.length} registros. Diga onde o sistema deve catalogar cada dado:`}
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
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" disabled={loading} onClick={executeImport}>
                   {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {status || 'Processando'}</> : 'Importar Base'}
                </Button>
             </div>
          </div>
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
