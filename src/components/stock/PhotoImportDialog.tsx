import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImagePlus, Sparkles, RefreshCw, CheckCircle2, XCircle, Camera } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useImageSyncStore, QueueItem } from '@/store/useImageSyncStore';

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

type LabelSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
};

function LabelSelect({ label, value, options, onChange, required }: LabelSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full text-xs rounded-lg border px-3 py-2 outline-none transition shadow-sm cursor-pointer ${
          value ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <option value="">— Não mapear —</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

type MatchResult = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  currentImage: string | null;
  willUpdate: boolean;
};

export default function PhotoImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Mapping, 3 = Preview/Confirm
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const [mapping, setMapping] = useState({
    name: '',
    image_url: '',
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
      setMatches([]);
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

        // Auto-mapping
        const getMatch = (terms: string[]) => keys.find(k => terms.some(t => k.toLowerCase().includes(t))) || '';
        setMapping({
          name: getMatch(['nome', 'produto', 'titulo']),
          image_url: getMatch(['imagem', 'foto principal', 'link principal', 'url', 'foto 1', 'foto']),
          image_url_2: getMatch(['imagem 2', 'foto 2', 'link 2']),
          image_url_3: getMatch(['imagem 3', 'foto 3', 'link 3']),
        });

        setStep(2);
      } catch (err) {
        toast.error('Erro ao ler arquivo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const analyzeMatches = async () => {
    if (!mapping.name) {
      toast.error('Mapeie pelo menos a coluna de Nome do Produto.');
      return;
    }
    if (!mapping.image_url && !mapping.image_url_2 && !mapping.image_url_3) {
      toast.error('Mapeie pelo menos uma coluna de imagem.');
      return;
    }

    setLoading(true);
    setStatus('Buscando produtos cadastrados...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      const { data: products } = await supabase
        .from('products')
        .select('id, name, image_url, image_url_2, image_url_3')
        .eq('owner_id', user.id);

      if (!products || products.length === 0) {
        toast.error('Nenhum produto cadastrado.');
        setLoading(false);
        return;
      }

      // Build a map of normalized names to products
      const productMap = new Map<string, typeof products[0]>();
      products.forEach(p => {
        const norm = normalizeForComparison(p.name);
        if (!productMap.has(norm)) productMap.set(norm, p);
      });

      // Group spreadsheet rows by name to get unique products
      const uniqueNames = new Map<string, any>();
      parsedData.forEach(row => {
        const name = row[mapping.name];
        if (!name) return;
        const norm = normalizeForComparison(String(name));
        if (!uniqueNames.has(norm)) uniqueNames.set(norm, row);
      });

      setStatus('Comparando nomes...');

      const results: MatchResult[] = [];
      for (const [normName, row] of uniqueNames.entries()) {
        const product = productMap.get(normName);
        if (!product) continue; // No match, skip

        const img1 = mapping.image_url ? String(row[mapping.image_url] || '').trim() : null;
        const img2 = mapping.image_url_2 ? String(row[mapping.image_url_2] || '').trim() : null;
        const img3 = mapping.image_url_3 ? String(row[mapping.image_url_3] || '').trim() : null;

        // Only include if at least one image URL is provided
        const hasAnyImage = (img1 && img1.startsWith('http')) || (img2 && img2.startsWith('http')) || (img3 && img3.startsWith('http'));
        if (!hasAnyImage) continue;

        results.push({
          productId: product.id,
          productName: product.name,
          imageUrl: img1 && img1.startsWith('http') ? img1 : null,
          imageUrl2: img2 && img2.startsWith('http') ? img2 : null,
          imageUrl3: img3 && img3.startsWith('http') ? img3 : null,
          currentImage: product.image_url,
          willUpdate: true,
        });
      }

      if (results.length === 0) {
        toast.error('Nenhum produto encontrado com foto para atualizar.');
        setLoading(false);
        return;
      }

      setMatches(results);
      setStep(3);
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const executeImport = async () => {
    const toProcess = matches.filter(m => m.willUpdate);
    if (toProcess.length === 0) {
      toast.error('Nenhum produto selecionado.');
      return;
    }

    setLoading(true);
    setStatus('Atualizando URLs de imagem...');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');

      let updated = 0;

      // Step 1: Update all products with the external URLs immediately
      for (let i = 0; i < toProcess.length; i++) {
        const m = toProcess[i];
        setStatus(`Atualizando (${i + 1}/${toProcess.length}): ${m.productName.substring(0, 30)}...`);

        const updatePayload: any = {};
        if (m.imageUrl) updatePayload.image_url = m.imageUrl;
        if (m.imageUrl2) updatePayload.image_url_2 = m.imageUrl2;
        if (m.imageUrl3) updatePayload.image_url_3 = m.imageUrl3;

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase.from('products').update(updatePayload).eq('id', m.productId);
          if (!error) updated++;
        }
      }

      // Step 2: Queue background image downloads for external URLs
      setStatus('Iniciando download de imagens em segundo plano...');
      const imagesToDownload: QueueItem[] = [];
      for (const m of toProcess) {
        if (m.imageUrl && !m.imageUrl.includes('supabase.co')) {
          imagesToDownload.push({ id: m.productId, url: m.imageUrl, column: 'image_url' });
        }
        if (m.imageUrl2 && !m.imageUrl2.includes('supabase.co')) {
          imagesToDownload.push({ id: m.productId, url: m.imageUrl2, column: 'image_url_2' });
        }
        if (m.imageUrl3 && !m.imageUrl3.includes('supabase.co')) {
          imagesToDownload.push({ id: m.productId, url: m.imageUrl3, column: 'image_url_3' });
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

      toast.success(`${updated} produtos atualizados! ${imagesToDownload.length} imagens sendo baixadas em segundo plano.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const toggleItem = (idx: number) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, willUpdate: !m.willUpdate } : m));
  };

  const selectedCount = matches.filter(m => m.willUpdate).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 hover:text-fuchsia-800">
          <Camera className="mr-2 h-4 w-4" /> Importar Fotos
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 3 ? "sm:max-w-[550px]" : "sm:max-w-[420px]"}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? '📸 Importar Apenas Fotos' : step === 2 ? 'Mapeamento de Colunas' : 'Confirmar Atualização de Fotos'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Envie uma planilha com os nomes dos produtos e as URLs das fotos. O sistema vai encontrar os produtos já cadastrados e atualizar SOMENTE as imagens.'
              : step === 2
              ? 'Indique qual coluna contém o nome e quais contêm as fotos.'
              : `${selectedCount} produto(s) encontrado(s) para atualizar.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-6 space-y-4">
            <div className="border-2 border-dashed border-fuchsia-200 p-12 rounded-xl text-center bg-fuchsia-50/50 relative w-full h-[200px] flex flex-col items-center justify-center transition hover:bg-fuchsia-50">
              <input type="file" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <ImagePlus className="h-10 w-10 text-fuchsia-600 mb-3 opacity-90" />
              <h3 className="font-semibold text-sm text-fuchsia-950">Selecione a Planilha com as Fotos</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">O sistema vai buscar produtos pelo nome e atualizar apenas as fotos. Nenhum outro dado será alterado.</p>
            </div>
            {loading && <p className="text-sm font-medium text-fuchsia-600 text-center animate-pulse">Lendo planilha...</p>}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Modo Seguro</p>
              <p>Este modo <strong>não mexe</strong> em estoque, preços, categorias ou variantes. Ele atualiza <strong>exclusivamente</strong> as imagens dos produtos encontrados.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="bg-fuchsia-50 text-fuchsia-800 p-3 rounded text-xs border border-fuchsia-200 flex gap-2 items-start mt-2 shadow-sm">
              <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-600" />
              <span>Mapeie a coluna com o <strong>Nome do Produto</strong> e pelo menos uma coluna de <strong>Imagem (URL)</strong>.</span>
            </div>

            <div className="space-y-4 pt-2">
              <LabelSelect label="Nome do Produto" value={mapping.name} options={fileKeys} onChange={(v) => setMapping({ ...mapping, name: v })} required />
              
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground border-b pb-1 mt-4 mb-2 text-fuchsia-700">URLs das Fotos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LabelSelect label="Foto Principal" value={mapping.image_url} options={fileKeys} onChange={(v) => setMapping({ ...mapping, image_url: v })} />
                <LabelSelect label="Foto 2" value={mapping.image_url_2} options={fileKeys} onChange={(v) => setMapping({ ...mapping, image_url_2: v })} />
                <LabelSelect label="Foto 3" value={mapping.image_url_3} options={fileKeys} onChange={(v) => setMapping({ ...mapping, image_url_3: v })} />
              </div>
            </div>

            <div className="pt-4 mt-6 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-10 flex gap-2 pb-1">
              <Button variant="outline" className="flex-1 border-slate-300" onClick={() => setStep(1)} disabled={loading}>Cancelar</Button>
              <Button className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-md shadow-fuchsia-600/20" disabled={loading} onClick={analyzeMatches}>
                {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {status || 'Analisando'}</> : 'Buscar Correspondências'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3 text-center shadow-sm">
                <CheckCircle2 className="h-5 w-5 mx-auto text-fuchsia-600 mb-1" />
                <p className="text-xl font-bold text-fuchsia-700">{selectedCount}</p>
                <p className="text-[10px] font-semibold text-fuchsia-600 uppercase tracking-wide">Serão Atualizados</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <XCircle className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                <p className="text-xl font-bold text-slate-500">{matches.length - selectedCount}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Ignorados</p>
              </div>
            </div>

            {/* Toggle all */}
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-fuchsia-700 uppercase flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Produtos Encontrados ({matches.length})
              </h4>
              <div className="flex gap-1">
                <button onClick={() => setMatches(prev => prev.map(m => ({ ...m, willUpdate: true })))}
                  className="text-[10px] px-2 py-1 rounded-md font-semibold border transition bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100">
                  ✅ Todos
                </button>
                <button onClick={() => setMatches(prev => prev.map(m => ({ ...m, willUpdate: false })))}
                  className="text-[10px] px-2 py-1 rounded-md font-semibold border transition bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100">
                  ❌ Nenhum
                </button>
              </div>
            </div>

            {/* List */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {matches.map((m, idx) => (
                <div
                  key={m.productId}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${m.willUpdate ? 'bg-white hover:bg-fuchsia-50/50' : 'bg-slate-50 opacity-60'}`}
                  onClick={() => toggleItem(idx)}
                >
                  <input type="checkbox" checked={m.willUpdate} readOnly className="w-4 h-4 rounded border-fuchsia-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{m.productName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {m.currentImage ? (m.currentImage.includes('supabase.co') ? '✅ Já tem foto Supabase' : '⚠️ Foto externa') : '❌ Sem foto'}
                      {m.imageUrl && <span className="ml-2 text-fuchsia-600">→ Nova foto</span>}
                    </p>
                  </div>
                  {m.imageUrl && (
                    <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src={m.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground italic px-1">
              As fotos serão baixadas em segundo plano e salvas permanentemente no servidor. Nenhum dado de estoque, preço ou categoria será alterado.
            </p>

            {/* Action Bar */}
            <div className="pt-4 mt-2 border-t sticky bottom-0 bg-background/95 backdrop-blur-md z-10 flex gap-2 pb-1">
              <Button variant="outline" className="flex-1 border-slate-300" onClick={() => setStep(2)} disabled={loading}>
                Voltar
              </Button>
              <Button
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-md shadow-fuchsia-600/20"
                disabled={loading || selectedCount === 0}
                onClick={executeImport}
              >
                {loading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />{status || 'Processando'}</>
                ) : (
                  <><Camera className="mr-2 h-4 w-4" />Atualizar {selectedCount} Fotos</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
