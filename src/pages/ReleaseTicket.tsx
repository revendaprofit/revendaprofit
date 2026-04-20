import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function ReleaseTicket() {
  const { id } = useParams();
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['release-ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_release_ticket', { p_sale_id: id });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (error) {
    console.error("Erro no passe de liberação:", error);
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Ticket não encontrado</h1>
        <p className="text-slate-400 mb-4">Verifique se o link está correto ou peça para o lojista enviar novamente.</p>
        <p className="text-xs text-rose-500 font-mono bg-rose-950/30 p-2 rounded max-w-sm">
           Developer Log: {(error as any)?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Buscando liberação segura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-950 -z-10" />

      {/* Ticking Clock (Anti-Print) */}
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-sm z-10 sticky top-0">
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-5 h-5 text-emerald-400" />
           <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Passe Seguro</span>
        </div>
        <div className="bg-black/50 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
           <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
           <span className="font-mono text-sm tracking-wider font-bold text-white">
              {time.toLocaleTimeString('pt-BR')}
           </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="rounded-full bg-emerald-500/20 p-6 mb-6 mt-4 relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <CheckCircle2 className="w-20 h-20 text-emerald-400 relative z-10 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
        </div>
        
        <h1 className="text-3xl font-black text-center mb-2 tracking-tight">PEDIDO LIBERADO!</h1>
        <p className="text-emerald-400 font-semibold uppercase tracking-widest text-sm mb-10 text-center">
           Apresente esta tela na recepção
        </p>

        <div className="w-full max-w-sm bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-2xl">
           <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
           
           <div className="mb-5 flex flex-col items-start gap-1">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Loja / Parceiro</span>
             <p className="font-bold text-lg leading-tight">{ticket.partner_name || 'Venda Direta'}</p>
           </div>

           <div className="mb-5 flex flex-col items-start gap-1">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Cliente Autorizado</span>
             <p className="font-bold text-lg leading-tight">{ticket.customer_name || 'Cliente'}</p>
           </div>

           <div className="mt-6 pt-6 border-t border-dashed border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 block">Relação de Itens Liberados</span>
              <ul className="space-y-3">
                 {ticket.items?.map((item: any, i: number) => (
                    <li key={i} className="flex gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                          {item.quantity}x
                       </div>
                       <div>
                          <p className="font-bold text-sm leading-tight text-slate-100">{item.product_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.size} {item.color ? `/ ${item.color}` : ''}</p>
                       </div>
                    </li>
                 ))}
                 {(!ticket.items || ticket.items.length === 0) && (
                    <li className="text-sm text-slate-400 italic">Sem itens listados.</li>
                 )}
              </ul>
           </div>
        </div>
      </main>

      <footer className="text-center p-6 z-10">
         <p className="text-[10px] text-slate-500 font-medium">Validado eletronicamente e protegido contra capturas de tela.</p>
      </footer>
    </div>
  );
}
