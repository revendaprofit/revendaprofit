import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Handshake, AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import PartnershipWizardDialog from '@/components/partnerships/PartnershipWizardDialog';
import PartnershipCatalogSheet from '@/components/partnerships/PartnershipCatalogSheet';
import PartnershipSettlementsSheet from '@/components/partnerships/PartnershipSettlementsSheet';
import PartnershipLoanRequestSheet from '@/components/partnerships/PartnershipLoanRequestSheet';
import PartnershipOrdersSheet from '@/components/partnerships/PartnershipOrdersSheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Partnerships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('partnerships').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Parceria ${newStatus === 'active' ? 'aceita' : 'recusada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta parceria definitivamente? Os registros de vendas P2P associados podem perder a referência.')) return;
    try {
      const { error } = await supabase.from('partnerships').delete().eq('id', id);
      if (error) throw error;
      toast.success('Parceria excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const { data: partnerships = [], isLoading } = useQuery({
    queryKey: ['partnerships'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('partnerships')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Fallback manual profile mapping to avoid Supabase FK ambiguity
      if (data && data.length > 0) {
         const { data: profs } = await supabase.from('profiles').select('id, email');
         if (profs) {
            data.forEach(p => {
               p.requester = profs.find(pr => pr.id === p.requester_id);
               p.receiver = profs.find(pr => pr.id === p.receiver_id);
            });
         }
      }
        
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sócias & Parcerias</h1>
          <p className="text-muted-foreground text-sm">Gerencie o seu grupo B2B fechado e rateio de comissões P2P.</p>
        </div>
        <div>
           <PartnershipWizardDialog />
        </div>
      </div>
 
      {/* Painel de Objetivos, Instruções e Testes */}
      <div className="rounded-xl border bg-gradient-to-r from-fuchsia-50/50 to-pink-50/50 p-6 shadow-sm">
        <h2 className="font-bold text-lg text-fuchsia-950 mb-2 flex items-center gap-2">
          🎯 Objetivos e Guia de Uso: Sócias & Parcerias (P2P)
        </h2>
        <p className="text-sm text-fuchsia-900/80 mb-4">
          Este módulo gerencia a integração de estoques mútuos e rateio de comissões/custos P2P (Partner-to-Partner) de forma estruturada.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 text-fuchsia-950">
            <p className="font-bold uppercase tracking-wider text-[10px] text-fuchsia-800">📖 Instruções de Uso</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Conexão:</strong> Clique em "Novo Acordo" e digite o e-mail cadastrado da sua parceira para enviar o convite.</li>
              <li><strong>Compartilhar Catálogo:</strong> Após a ativação, vá em "Ver Catálogo" para selecionar quais peças deseja disponibilizar para ela vender.</li>
              <li><strong>Empréstimos (Loans):</strong> Use a opção "Solicitar Peça" para transferir fisicamente peças para sua loja.</li>
              <li><strong>Acerto Financeiro:</strong> As vendas de peças compartilhadas geram ordens automáticas de repasse de custos e divisão de lucros.</li>
            </ul>
          </div>
          
          <div className="space-y-2 text-fuchsia-950 border-t md:border-t-0 md:border-l border-fuchsia-200/50 md:pl-4">
            <p className="font-bold uppercase tracking-wider text-[10px] text-fuchsia-800">🧪 Como Testar esta Funcionalidade</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Passo 1:</strong> Crie uma parceria de teste ativa entre duas contas no sistema.</li>
              <li><strong>Passo 2:</strong> Acesse o catálogo de compartilhamento e marque pelo menos um produto com estoque para ser compartilhado.</li>
              <li><strong>Passo 3:</strong> Abra a tela do PDV (POS) da conta vendedora, busque pelo produto compartilhado (indicado com o ícone 🤝) e registre a venda.</li>
              <li><strong>Passo 4:</strong> Na conta da dona do produto, confirme a ordem de liberação P2P na listagem e verifique se o acerto de contas gerou o repasse financeiro correto.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Handshake className="h-5 w-5 text-primary" /> Meus Contratos Ativos
          </h2>
          
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando acordos...</p>
          ) : partnerships.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border-dashed border-2">
              <Handshake className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium text-lg">Nenhuma parceria formada</p>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">Conecte-se com outra lojista usando o e-mail de cadastro dela para formar um estoque mútuo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {partnerships.map((p: any) => {
                const isRequester = p.requester_id === user?.id;
                const otherEmail = isRequester ? p.receiver?.email : p.requester?.email;
                const costLabel = p.cost_recovery_type === 'owner_100' ? 'Custo para quem forneceu' : (p.cost_recovery_type === 'shared_50_50' ? 'Rateio Custos 50/50' : 'Vendedora engole custo');
                const isPendingReceiver = p.status === 'pending' && !isRequester;

                return (
                  <div key={p.id} className={`p-4 rounded-lg border ${isPendingReceiver ? 'bg-fuchsia-50/20 border-fuchsia-200' : 'bg-card'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{otherEmail}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : (p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{costLabel} • Lucros: Venda {p.profit_split_seller_percent}% / Sócia {p.profit_split_partner_percent}%</p>
                        {isRequester && p.status === 'pending' && <p className="text-xs text-amber-600 mt-1 italic">Aguardando a parceira aceitar o convite...</p>}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {isPendingReceiver && (
                          <>
                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus(p.id, 'rejected')}>
                              <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus(p.id, 'active')}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Aceitar Acordo
                            </Button>
                          </>
                        )}
                        {!isPendingReceiver && p.status === 'active' && (
                          <div className="flex flex-wrap items-center gap-2">
                             <PartnershipOrdersSheet partnershipId={p.id} partnerEmail={otherEmail || ''} />
                             <PartnershipLoanRequestSheet partnershipId={p.id} partnerEmail={otherEmail || ''} />
                             <PartnershipSettlementsSheet partnershipId={p.id} partnerEmail={otherEmail || ''} />
                             <PartnershipCatalogSheet partnershipId={p.id} partnerEmail={otherEmail || ''} />
                          </div>
                        )}
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-red-50 hover:text-red-600 ml-2" onClick={() => handleDelete(p.id)} title="Excluir Parceria">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
