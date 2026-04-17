import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, ArrowRightLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  partnershipId: string;
  partnerEmail: string;
}

export default function PartnershipSettlementsSheet({ partnershipId, partnerEmail }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user-settlements'],
    queryFn: async () => (await supabase.auth.getUser()).data.user
  });

  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['partnership-settlements', partnershipId],
    enabled: !!user && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partnership_settlements')
        .select(`
          *,
          partnership_orders(
             quantity, sale_price,
             products(name),
             product_variants(size, color)
          )
        `)
        .eq('partnership_id', partnershipId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      // Zerar todos os abertos onde eu sou o devedor
      const { error } = await supabase
        .from('partnership_settlements')
        .update({ status: 'settled', settled_at: new Date().toISOString() })
        .eq('partnership_id', partnershipId)
        .eq('debtor_id', user?.id)
        .eq('status', 'open');
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dívidas zeradas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['partnership-settlements'] });
    },
    onError: (e: any) => toast.error(e.message)
  });

  // Cálculos financeiros
  const myDebt = settlements.filter(s => s.debtor_id === user?.id).reduce((acc, s) => acc + Number(s.amount_owed), 0);
  const myCredit = settlements.filter(s => s.creditor_id === user?.id).reduce((acc, s) => acc + Number(s.amount_owed), 0);
  
  const balance = myCredit - myDebt;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <Wallet className="w-4 h-4 mr-2" />
          Acerto de Contas
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Acerto Financeiro
          </SheetTitle>
          <SheetDescription>
            Balanço de vendas mútuas com <strong className="text-foreground">{partnerEmail}</strong>.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="text-center py-6 text-muted-foreground">Carregando livro caixa...</p>
        ) : (
          <div className="space-y-6">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Eu Devo a Ela</p>
                  <p className="text-xl font-black text-red-700">R$ {myDebt.toFixed(2)}</p>
               </div>
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Ela Me Deve</p>
                  <p className="text-xl font-black text-emerald-700">R$ {myCredit.toFixed(2)}</p>
               </div>
               <div className={`col-span-2 md:col-span-1 p-4 rounded-xl border ${balance > 0 ? 'bg-indigo-50 border-indigo-200' : (balance < 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200')}`}>
                  <p className="text-xs font-bold uppercase mb-1 text-slate-500">Saldo Final (Encontro)</p>
                  <p className={`text-xl font-black ${balance > 0 ? 'text-indigo-700' : (balance < 0 ? 'text-orange-700' : 'text-slate-700')}`}>
                    {balance > 0 ? `+ R$ ${Math.abs(balance).toFixed(2)}` : (balance < 0 ? `- R$ ${Math.abs(balance).toFixed(2)}` : 'R$ 0.00')}
                  </p>
               </div>
            </div>

            {myDebt > 0 && (
               <div className="bg-indigo-600 p-4 rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                  <div>
                    <p className="font-bold">Liquidar Minhas Dívidas</p>
                    <p className="text-xs text-indigo-200">Faça o PIX para sua parceira e marque como pago aqui.</p>
                  </div>
                  <Button onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending} className="bg-white text-indigo-700 hover:bg-gray-100 font-bold w-full md:w-auto">
                    {settleMutation.isPending ? 'Zerando...' : `Zerar - R$ ${myDebt.toFixed(2)}`}
                  </Button>
               </div>
            )}

            <div className="space-y-4 pt-4 border-t">
               <h3 className="font-bold text-sm text-slate-500 uppercase">Extrato Aberto</h3>
               {settlements.length === 0 ? (
                 <p className="text-center py-6 text-muted-foreground text-sm">Nenhuma venda pendente de acerto.</p>
               ) : (
                 <div className="space-y-3">
                   {settlements.map((s: any) => {
                      const isMyDebt = s.debtor_id === user?.id;
                      const order = s.partnership_orders;
                      const product = order?.products;
                      const variant = order?.product_variants;

                      return (
                         <div key={s.id} className={`p-4 rounded-lg flex items-center justify-between border ${isMyDebt ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isMyDebt ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isMyDebt ? 'Você Vendeu (A pagar)' : 'Parceira Vendeu (A receber)'}
                                 </span>
                                 <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                               </div>
                               <p className="font-bold text-sm text-slate-800">{product?.name || 'Produto Desconhecido'}</p>
                               <p className="text-[11px] text-slate-500">{order?.quantity}x Peça • {variant?.size} {variant?.color ? `- ${variant?.color}` : ''}</p>
                            </div>
                            <div className="text-right">
                               <p className={`font-black text-lg ${isMyDebt ? 'text-red-600' : 'text-emerald-600'}`}>
                                 {isMyDebt ? '-' : '+'} R$ {Number(s.amount_owed).toFixed(2)}
                               </p>
                               <p className="text-[10px] text-slate-500">
                                 (Custo: R$ {Number(s.cost_slice).toFixed(2)} / Lucro sócia: R$ {Number(s.profit_slice).toFixed(2)})
                               </p>
                            </div>
                         </div>
                      );
                   })}
                 </div>
               )}
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
