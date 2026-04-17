import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, UserPlus, FileText, Activity, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function PartnershipWizardDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [searchEmail, setSearchEmail] = useState('');
  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  
  const [costRecoveryType, setCostRecoveryType] = useState('owner_100'); // owner_100, shared_50_50, seller_100, custom
  const [customCostPercent, setCustomCostPercent] = useState(100);

  const [sellerProfitPercent, setSellerProfitPercent] = useState(85);
  const [passiveProfitPercent, setPassiveProfitPercent] = useState(15);

  const handleSearch = async () => {
    if (!searchEmail) return toast.error('Digite o email da parceira');
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', searchEmail.toLowerCase()).single();
      if (error || !data) throw new Error('Usuário não encontrado.');
      if (data.id === user?.id) throw new Error('Você não pode fazer parceria com você mesma!');
      setPartnerDetails(data);
    } catch (err: any) {
      toast.error(err.message);
      setPartnerDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProfitChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'seller' | 'passive') => {
    const val = parseInt(e.target.value) || 0;
    if (val > 100) return;
    if (field === 'seller') {
      setSellerProfitPercent(val);
      setPassiveProfitPercent(100 - val);
    } else {
      setPassiveProfitPercent(val);
      setSellerProfitPercent(100 - val);
    }
  };

  const submitPartnership = async () => {
    if (!partnerDetails || !user) return;
    setLoading(true);
    try {
      const payload = {
        requester_id: user.id,
        receiver_id: partnerDetails.id,
        status: 'pending',
        cost_recovery_type: costRecoveryType,
        cost_recovery_owner_percent: costRecoveryType === 'custom' ? customCostPercent : (costRecoveryType === 'shared_50_50' ? 50 : (costRecoveryType === 'seller_100' ? 0 : 100)),
        profit_split_seller_percent: sellerProfitPercent,
        profit_split_partner_percent: passiveProfitPercent
      };

      const { error } = await supabase.from('partnerships').insert(payload);
      if (error) throw error;
      
      toast.success('Convite de parceria enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
      setOpen(false);
      
      // Reset
      reset();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSearchEmail('');
    setPartnerDetails(null);
    setCostRecoveryType('owner_100');
    setSellerProfitPercent(85);
    setPassiveProfitPercent(15);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 font-bold">
          <UserPlus className="mr-2 h-4 w-4" /> Nova Sociedade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Contrato de Parceria</DialogTitle>
          <DialogDescription>
            Conecte-se com outra lojista e defina as regras para o Fundo de Estoque Mútuo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-fuchsia-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-fuchsia-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-fuchsia-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 4 ? 'bg-fuchsia-600' : 'bg-slate-200'}`} />
          </div>

          {/* STEP 1: Find Partner */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-0 duration-300">
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><UserPlus className="h-5 w-5 text-fuchsia-600"/> 1. Encontrar Parceira</h3>
                <p className="text-sm text-muted-foreground">O convite só pode ser enviado para usuárias ativas na plataforma.</p>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="E-mail de Cadastro da parceira..." 
                  type="email" 
                  value={searchEmail} 
                  onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="secondary" onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {partnerDetails && (
                <div className="mt-4 p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-700 font-bold text-xl border-2 border-fuchsia-200">
                    {partnerDetails.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{partnerDetails.email}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{partnerDetails.role === 'supplier' ? 'Hub Fornecedor' : 'Lojista B2C'}</p>
                  </div>
                  <Button className="mt-2 w-full" onClick={() => setStep(2)}>Avançar Formulário <ArrowRight className="h-4 w-4 ml-2"/></Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Cost Recovery */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600"/> 2. Grupo A: Rateio dos Custos</h3>
                <p className="text-sm text-muted-foreground leading-snug">Se uma peça da sociedade for vendida, como a plataforma reembolsa o investimento inicial da fábrica?</p>
              </div>

              <div className="space-y-3 mt-4">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${costRecoveryType === 'owner_100' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                  <input type="radio" name="cost" className="mt-1 accent-indigo-600" checked={costRecoveryType === 'owner_100'} onChange={() => setCostRecoveryType('owner_100')} />
                  <div>
                    <p className="font-semibold text-sm">100% para a Dona Física da Peça</p>
                    <p className="text-xs text-muted-foreground">Padrão Consignação: Quem forneceu a peça pagou tudo e recebe o custo 100% de volta.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${costRecoveryType === 'shared_50_50' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                  <input type="radio" name="cost" className="mt-1 accent-indigo-600" checked={costRecoveryType === 'shared_50_50'} onChange={() => setCostRecoveryType('shared_50_50')} />
                  <div>
                    <p className="font-semibold text-sm">Devolvo 50% / 50%</p>
                    <p className="text-xs text-muted-foreground">Sociedade em conjunta: Nós dividimos a compra lá atrás, logo ambas recebem 50% do valor do custo.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${costRecoveryType === 'seller_100' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                  <input type="radio" name="cost" className="mt-1 accent-indigo-600" checked={costRecoveryType === 'seller_100'} onChange={() => setCostRecoveryType('seller_100')} />
                  <div>
                    <p className="font-semibold text-sm">100% Retido com quem Vendeu</p>
                    <p className="text-xs text-muted-foreground">Quem botou a mão na massa e vendeu mantém o custo na integralidade.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/> Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Avançar Regras <ArrowRight className="ml-2 h-4 w-4"/></Button>
              </div>
            </div>
          )}

          {/* STEP 3: Profit Split */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-600"/> 3. Grupo B: Fatiamento de Lucros</h3>
                <p className="text-sm text-muted-foreground leading-snug">Pegando apenas o valor que sobrou livre da venda (Lucro Bruto = Venda - Custo), qual será a taxa percentual de comissões da sociedade?</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border space-y-6 mt-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-800 text-sm">Tabela 1: Esforço de Venda</p>
                    <p className="text-xs text-muted-foreground w-40">Quem puxou no Caixa e vendeu ganha:</p>
                  </div>
                  <div className="flex items-center">
                    <Input type="number" min="0" max="100" className="w-20 text-center font-bold text-lg border-emerald-300" value={sellerProfitPercent} onChange={e => handleProfitChange(e, 'seller')} />
                    <span className="ml-2 text-lg font-bold text-emerald-600">%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-orange-800 text-sm">Tabela 2: Passivo / Sócia</p>
                    <p className="text-xs text-muted-foreground w-40">A parceira que forneceu o estoque ganha:</p>
                  </div>
                  <div className="flex items-center">
                    <Input type="number" min="0" max="100" className="w-20 text-center font-bold text-lg border-orange-300" value={passiveProfitPercent} onChange={e => handleProfitChange(e, 'passive')} />
                    <span className="ml-2 text-lg font-bold text-orange-600">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4"/> Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>Revisar Acordo <ArrowRight className="ml-2 h-4 w-4"/></Button>
              </div>
            </div>
          )}

          {/* STEP 4: Revision */}
          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
               <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-fuchsia-600"/> 4. Confirmar e Enviar Contrato</h3>
                <p className="text-sm text-muted-foreground">O convite ficará pendente. Sua parceira precisará aceitá-lo na tela dela para iniciar o espelhamento de estoque.</p>
              </div>

              <div className="bg-fuchsia-50/50 p-4 rounded-xl border border-fuchsia-200 space-y-4 text-sm mt-4">
                <div className="flex justify-between border-b border-fuchsia-200/50 pb-2">
                  <span className="text-muted-foreground">Parceira (Alvo):</span>
                  <span className="font-bold">{partnerDetails?.email}</span>
                </div>
                <div className="flex justify-between border-b border-fuchsia-200/50 pb-2">
                  <span className="text-muted-foreground">Recuperação do Custo:</span>
                  <span className="font-bold text-indigo-700">
                    {costRecoveryType === 'owner_100' && 'Dona original absorve 100%'}
                    {costRecoveryType === 'shared_50_50' && 'Abatimento de 50/50'}
                    {costRecoveryType === 'seller_100' && 'Vendedora absorve 100%'}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-muted-foreground">Lucro Ativa (Vendedora):</span>
                  <span className="font-bold text-emerald-600">{sellerProfitPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Passiva (Sócia):</span>
                  <span className="font-bold text-orange-600">{passiveProfitPercent}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={loading}><ArrowLeft className="mr-2 h-4 w-4"/> Voltar</Button>
                <Button className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 font-bold" onClick={submitPartnership} disabled={loading}>
                  {loading ? 'Processando Contrato...' : 'Enviar Convite Formal'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
