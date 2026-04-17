import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function NfeImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:text-orange-700">
          <FileText className="mr-2 h-4 w-4" /> Ler NFe (XML)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar da Nota Fiscal (NFe)</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Arquivo XML da Nota</label>
            <p className="text-xs text-muted-foreground mb-4">Selecione o arquivo .xml da NFe enviado pelo seu fornecedor. Nomes e custos serão extraídos automaticamente.</p>
            <Input type="file" accept=".xml" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLoading(true);

              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const xmlString = event.target?.result as string;
                  const parser = new DOMParser();
                  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                  
                  const prods = Array.from(xmlDoc.getElementsByTagName("prod"));
                  const user = (await supabase.auth.getUser()).data.user;
                  if (!user) throw new Error('Não autenticado');

                  if (prods.length === 0) {
                    throw new Error("Nenhuma tag de produto (<prod>) encontrada. O XML é realmente uma NFe?");
                  }

                  const dataToInsert = prods.map(prod => {
                    const name = prod.getElementsByTagName("xProd")[0]?.textContent || 'Produto Desconhecido';
                    const costValue = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || '0');
                    
                    return {
                      owner_id: user.id,
                      name: name,
                      cost_price: costValue,
                      sale_price: costValue * 2, // Sugestão simples de 100% de markup inicial
                      marketing_status: 'active'
                    };
                  });

                  const { error } = await supabase.from('products').insert(dataToInsert);
                  if (error) throw error;

                  toast.success(`Sucesso! ${dataToInsert.length} produtos lidos e importados da NFe!`);
                  queryClient.invalidateQueries({ queryKey: ['products'] });
                  setOpen(false);
                } catch (err: any) {
                  toast.error('Erro na NFe: ' + err.message);
                } finally {
                  setLoading(false);
                }
              };
              reader.readAsText(file);
            }} disabled={loading} className="cursor-pointer" />
          </div>
          
          {loading && <p className="text-sm font-medium text-orange-600 text-center">Processando a nota, aguarde...</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
}
