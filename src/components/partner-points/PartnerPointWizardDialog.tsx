import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { HelpCircle, Sparkles } from 'lucide-react';


export default function PartnerPointWizardDialog({ open, onOpenChange, initialData }: { open: boolean, onOpenChange: (open: boolean) => void, initialData?: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    document: '',
    address: '',
    commission_arara: '10',
    commission_retirada: '5',
    payment_method: 'partner',
    partner_machine_fee: '2',
    replenishment_cycle_days: '30',
    min_stock_alert: '5',
    loss_risk_active: true
  });

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          contact_name: initialData.contact_name || '',
          phone: initialData.phone || '',
          document: initialData.document || '',
          address: initialData.address || '',
          commission_arara: initialData.commission_arara?.toString() || '10',
          commission_retirada: initialData.commission_retirada?.toString() || '5',
          payment_method: initialData.payment_method || 'partner',
          accepted_payment_methods: initialData.accepted_payment_methods || [],
          replenishment_cycle_days: initialData.replenishment_cycle_days?.toString() || '30',
          min_stock_alert: initialData.min_stock_alert?.toString() || '5',
          loss_risk_active: initialData.loss_risk_active ?? true
        });
        setStep(1);
      } else {
        setFormData({
          name: '',
          contact_name: '',
          phone: '',
          document: '',
          address: '',
          commission_arara: '10',
          commission_retirada: '5',
          payment_method: 'partner',
          accepted_payment_methods: [],
          replenishment_cycle_days: '30',
          min_stock_alert: '5',
          loss_risk_active: true
        });
        setStep(1);
      }
    }
  }, [open, initialData]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);
  };

  const { data: storePaymentMethods = [] } = useQuery({
    queryKey: ['store-payment-methods'],
    queryFn: async () => {
       const { data, error } = await supabase.from('payment_methods').select('*').eq('owner_id', user?.id).order('created_at');
       if (error) throw error;
       return data || [];
    },
    enabled: !!user?.id
  });

  const handleSave = async () => {
    if (!formData.name) return toast.error("Preencha o nome do local.");
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        document: formData.document,
        address: formData.address,
        commission_arara: Number(formData.commission_arara),
        commission_retirada: Number(formData.commission_retirada),
        payment_method: formData.payment_method,
        accepted_payment_methods: formData.accepted_payment_methods,
        replenishment_cycle_days: Number(formData.replenishment_cycle_days),
        min_stock_alert: Number(formData.min_stock_alert),
        loss_risk_active: formData.loss_risk_active
      };

      if (initialData?.id) {
         const { error } = await supabase.from('partner_points').update(payload).eq('id', initialData.id);
         if (error) throw error;
         toast.success("Parceiro atualizado com sucesso!");
      } else {
         const { error } = await supabase.from('partner_points').insert({
           owner_id: user?.id,
           slug: generateSlug(formData.name),
           ...payload
         });
         if (error) throw error;
         toast.success("Ponto Parceiro criado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ['partner-points'] });
      queryClient.invalidateQueries({ queryKey: ['partner-point-detail'] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Erro ao criar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {initialData ? 'Configurações da Parceria' : 'Novo Ponto Parceiro'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Altere as comissões e as tratativas da parceria firmada.' : 'Configure um novo local ou academia para exibir sua arara consignada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="font-bold border-b pb-2">1. Dados do Local</h3>
               <div>
                 <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do Local *</label>
                 <Input placeholder="Ex: Academia Gym Fit / Salão da Maria" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-semibold text-muted-foreground uppercase">CPF/CNPJ do Local ou Responsável</label>
                 <Input placeholder="Ex: 00.000.000/0001-00" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do Contato</label>
                   <Input value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase">Telefone do Contato</label>
                   <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço Completo</label>
                 <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="font-bold border-b pb-2">2. Regras Financeiras</h3>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                     Comissão Arara (%) 
                     <HelpCircle className="w-3 h-3 cursor-help text-muted-foreground" title="Venda realizada para produtos que já estão fisicamente na arara do local." />
                   </label>
                   <Input type="number" value={formData.commission_arara} onChange={e => setFormData({...formData, commission_arara: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                     Comissão Retirada (%)
                     <HelpCircle className="w-3 h-3 cursor-help text-muted-foreground" title="Venda realizada online onde o parceiro age apenas como ponto de coleta." />
                   </label>
                   <Input type="number" value={formData.commission_retirada} onChange={e => setFormData({...formData, commission_retirada: e.target.value})} />
                 </div>
               </div>

               <div className="pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Como o cliente paga no local?</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       className={`p-3 rounded-lg border text-sm text-center transition-all ${formData.payment_method === 'partner' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'hover:bg-muted'}`}
                       onClick={() => setFormData({...formData, payment_method: 'partner'})}
                     >
                        🏪 Parceiro Recebe<br/><span className="text-[10px] text-muted-foreground font-normal">Soma na maquininha dele. Acerto depois.</span>
                     </button>
                     <button 
                       className={`p-3 rounded-lg border text-sm text-center transition-all ${formData.payment_method === 'store' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'hover:bg-muted'}`}
                       onClick={() => setFormData({...formData, payment_method: 'store'})}
                     >
                        📱 Cliente paga para Loja<br/><span className="text-[10px] text-muted-foreground font-normal">Pix/Link direto pra você no momento da compra.</span>
                     </button>
                  </div>
               </div>

               {formData.payment_method === 'store' && (
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
                    <label className="text-xs font-bold text-purple-900 uppercase">Formas de Pagamento Aceitas pela Loja</label>
                    <p className="text-[10px] text-purple-700 leading-tight">Esta informação aparecerá para o cliente no Catálogo Online da Arara, orientando como ele deve efetuar o pagamento para aprovação.</p>
                    
                    <div className="flex flex-col gap-3">
                      {storePaymentMethods.map((pm: any) => {
                         const isSelected = formData.accepted_payment_methods.some((m: any) => m.id === pm.id);
                         const selectedData = formData.accepted_payment_methods.find((m: any) => m.id === pm.id);
                         
                         return (
                           <div key={pm.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                             <div className="flex items-center gap-2 flex-1">
                               <input 
                                 type="checkbox" 
                                 className="w-4 h-4 cursor-pointer" 
                                 id={`chk-${pm.id}`} 
                                 checked={isSelected} 
                                 onChange={(e) => {
                                    if (e.target.checked) {
                                       setFormData({
                                         ...formData, 
                                         accepted_payment_methods: [...formData.accepted_payment_methods, { id: pm.id, name: pm.name, min_amount: 0 }]
                                       });
                                    } else {
                                       setFormData({
                                         ...formData,
                                         accepted_payment_methods: formData.accepted_payment_methods.filter((m: any) => m.id !== pm.id)
                                       });
                                    }
                                 }} 
                               />
                               <label htmlFor={`chk-${pm.id}`} className="text-sm font-semibold cursor-pointer whitespace-nowrap">{pm.name}</label>
                             </div>
                             {isSelected && (
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-muted-foreground uppercase font-bold">Mínimo:</span>
                                 <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">R$</span>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      className="w-20 h-7 text-xs pl-6" 
                                      value={selectedData.min_amount || ''} 
                                      onChange={e => {
                                         const val = Number(e.target.value) || 0;
                                         setFormData({
                                           ...formData,
                                           accepted_payment_methods: formData.accepted_payment_methods.map((m: any) => m.id === pm.id ? { ...m, min_amount: val } : m)
                                         });
                                      }} 
                                    />
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                      })}
                      {storePaymentMethods.length === 0 && (
                        <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                          Nenhuma forma de pagamento configurada na Minha Loja.
                        </div>
                      )}
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                     Ciclo de Acerto (Dias)
                   </label>
                   <Input type="number" value={formData.replenishment_cycle_days} onChange={e => setFormData({...formData, replenishment_cycle_days: e.target.value})} />
                   <p className="text-[10px] text-muted-foreground mt-1">A cada quantos dias o contrato fecha?</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                     Regra de Furtos/Perdas
                   </label>
                   <div 
                     className={`flex items-center gap-2 h-10 border rounded-md px-3 cursor-pointer transition-colors ${formData.loss_risk_active ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'}`}
                     onClick={() => setFormData({...formData, loss_risk_active: !formData.loss_risk_active})}
                   >
                     <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={formData.loss_risk_active} readOnly />
                     <span className={`text-xs font-semibold ${formData.loss_risk_active ? 'text-amber-900' : 'text-gray-500'}`}>
                       Parceiro assume o Risco
                     </span>
                   </div>
                   <p className="text-[10px] text-muted-foreground mt-1">
                     Paga preço de custo no acerto se a peça sumir.
                   </p>
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button onClick={() => step === 1 ? setStep(2) : handleSave()} disabled={loading}>
            {loading ? 'Salvando...' : step === 1 ? 'Avançar para Financeiro' : (initialData ? 'Salvar Configurações' : 'Concluir e Criar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
