import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, Save, MapPin, Truck, DollarSign, Clock, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierTradeRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['hub-trade-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_trade_rules')
        .select('*')
        .eq('supplier_id', user!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    },
    enabled: !!user
  });

  const [form, setForm] = useState<any>(null);

  // Sync form with data
  React.useEffect(() => {
    if (rules) {
      setForm(rules);
    } else if (!isLoading && !rules) {
      setForm({
        default_margin_pct: 30,
        min_margin_pct: 10,
        delivery_days: 7,
        payment_terms: 'a_vista',
        shipping_policy: 'supplier',
        sender_name: '',
        sender_address: '',
        sender_city: '',
        sender_state: '',
        sender_zip: '',
        sender_phone: '',
        notes: '',
        pix_key: '',
        pix_key_type: 'cpf'
      });
    }
  }, [rules, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !form) throw new Error('Dados incompletos');
      const payload = { ...form, supplier_id: user.id };
      delete payload.id;
      delete payload.created_at;

      if (rules?.id) {
        const { error } = await supabase.from('hub_trade_rules').update(payload).eq('id', rules.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hub_trade_rules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-trade-rules'] });
      toast.success('Regras comerciais salvas!');
    },
    onError: (err: any) => toast.error('Erro: ' + err.message)
  });

  if (isLoading || !form) {
    return <div className="text-center py-16 text-slate-400">Carregando regras...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-3.5 rounded-2xl border border-blue-500/30">
            <Settings2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Regras Comerciais</h1>
            <p className="text-slate-400 font-medium mt-1">Margens, prazos e endereco de despacho</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6 font-bold shadow-lg">
          <Save className="w-5 h-5 mr-2" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar Regras'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margens e Condicoes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-900">Margens e Condicoes</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Margem Sugerida (%)</label>
              <Input type="number" step="0.01" value={form.default_margin_pct} onChange={e => setForm({...form, default_margin_pct: e.target.value})} />
              <p className="text-[10px] text-slate-400 mt-1">Margem que voce recomenda ao lojista</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Margem Minima (%)</label>
              <Input type="number" step="0.01" value={form.min_margin_pct} onChange={e => setForm({...form, min_margin_pct: e.target.value})} />
              <p className="text-[10px] text-slate-400 mt-1">Minimo para proteger sua marca</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Condicao de Pagamento</label>
            <select value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="a_vista">A Vista</option>
              <option value="30_dias">30 Dias</option>
              <option value="60_dias">60 Dias</option>
              <option value="consignado">Consignado</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Observacoes Comerciais</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-20" placeholder="Informacoes adicionais para os lojistas..." />
          </div>

          {/* PIX Key */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-700 uppercase">Chave PIX para Recebimentos</h3>
            </div>
            <p className="text-[10px] text-emerald-600">Esta chave sera exibida aos lojistas para pagamento dos pedidos.</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Tipo da Chave</label>
                <select value={form.pix_key_type || 'cpf'} onChange={e => setForm({...form, pix_key_type: e.target.value})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white">
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatoria</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Chave PIX</label>
                <Input value={form.pix_key || ''} onChange={e => setForm({...form, pix_key: e.target.value})} 
                  placeholder="Digite sua chave PIX..." className="h-9 text-sm border-emerald-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Envio e Logistica */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-slate-900">Envio e Logistica</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1 block flex items-center gap-1"><Clock className="w-3 h-3" /> Prazo de Entrega (dias)</label>
              <Input type="number" value={form.delivery_days} onChange={e => setForm({...form, delivery_days: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Quem Envia?</label>
              <select value={form.shipping_policy} onChange={e => setForm({...form, shipping_policy: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="supplier">Fornecedor envia (Dropshipping)</option>
                <option value="tenant">Lojista retira/envia</option>
              </select>
            </div>
          </div>

          {/* Sender Address */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-blue-700 uppercase">Endereco Remetente (para etiquetas)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input value={form.sender_name || ''} onChange={e => setForm({...form, sender_name: e.target.value})} placeholder="Nome / Razao Social" className="h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <Input value={form.sender_address || ''} onChange={e => setForm({...form, sender_address: e.target.value})} placeholder="Endereco completo" className="h-9 text-sm" />
              </div>
              <Input value={form.sender_city || ''} onChange={e => setForm({...form, sender_city: e.target.value})} placeholder="Cidade" className="h-9 text-sm" />
              <Input value={form.sender_state || ''} onChange={e => setForm({...form, sender_state: e.target.value})} placeholder="Estado (UF)" className="h-9 text-sm" />
              <Input value={form.sender_zip || ''} onChange={e => setForm({...form, sender_zip: e.target.value})} placeholder="CEP" className="h-9 text-sm" />
              <Input value={form.sender_phone || ''} onChange={e => setForm({...form, sender_phone: e.target.value})} placeholder="Telefone" className="h-9 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
