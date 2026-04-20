import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, FileText, CheckCircle, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PartnerContract() {
  const { id } = useParams();
  const [point, setPoint] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const { data: pt, error: ptError } = await supabase
          .from('partner_points')
          .select('*')
          .eq('id', id)
          .single();

        if (ptError) throw ptError;
        setPoint(pt);

        try {
          const { data: storeProfile } = await supabase
            .from('profiles')
            .select('company_name, document_cpf_cnpj')
            .eq('id', pt.owner_id)
            .single();
            
          if (storeProfile) {
            setStore(storeProfile);
          }
        } catch(e) {
          console.warn('Não foi possível ler o perfil da loja devido a restrições.');
        }
      } catch (err: any) {
        console.error('Fetch Contract Error:', err);
        toast.error(`Erro ao carregar contrato: ${err.message || 'Ponto não encontrado'}`);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchContract();
    }
  }, [id]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      // Pega IP publico simples
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      
      const { error } = await supabase.rpc('accept_partner_contract', {
        p_point_id: point.id,
        p_ip: ipData.ip || '0.0.0.0'
      });

      if (error) throw error;
      
      setPoint({ ...point, contract_accepted_at: new Date().toISOString() });
      toast.success('Contrato assinado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Houve um erro ao assinar o contrato. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Carregando termos...</div>;
  if (!point) return <div className="p-12 text-center text-red-500 font-bold">Ponto Parceiro não localizado.</div>;

  return (
    <div className="min-h-screen bg-rose-50/30 py-8 px-4 flex justify-center">
      <div className="max-w-3xl w-full">
        
        {/* Header */}
        <div className="text-center mb-6">
           <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
           <h1 className="text-2xl font-black text-gray-900 tracking-tight">Termo de Parceria Comercial</h1>
           <p className="text-sm text-gray-500 mt-1">Leia com atenção antes de assinar</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-sm text-gray-700 leading-relaxed">
           
           {/* Section 1: As Partes */}
           <div className="p-6 md:p-8 bg-gray-50/50 border-b">
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-4">AS PARTES</h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Parceiro Fornecedor (Vendedora)</p>
                    <p className="font-bold text-gray-900">{store?.company_name || 'Loja Revendedora'}</p>
                    <p className="text-xs mt-1 text-gray-500">CPF/CNPJ: {store?.document_cpf_cnpj || 'Não cadastrado'}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Ponto Parceiro (Local)</p>
                    <p className="font-bold text-gray-900">{point.name}</p>
                    <p className="text-xs mt-1 text-gray-500">CPF/CNPJ: {point.document || 'Não cadastrado'}</p>
                    <p className="text-xs mt-0.5 text-gray-500">Responsável: {point.contact_name || 'Não informado'}</p>
                 </div>
              </div>
           </div>

           <div className="p-6 md:p-8 space-y-8">
              {/* Cláusula 1 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 1: O Objeto da Parceria</h3>
                 <p>O Ponto Parceiro cede espaço em suas instalações para a exposição de produtos da Fornecedora (consignação física), bem como atua como Ponto de Retirada (Pick-up Point) para vendas online. Toda a gestão de estoque e auditoria será feita pelo sistema VENDA PROFIT.</p>
              </section>

              {/* Cláusula 2 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 2: Comissionamento Básico</h3>
                 <p className="mb-3">As taxas de comissão acordadas para este Ponto Parceiro são:</p>
                 <div className="divide-y border rounded-xl overflow-hidden">
                    <div className="flex justify-between items-center p-3 bg-white">
                       <span className="font-medium text-gray-600">Venda na Arara Física</span>
                       <span className="font-black text-rose-600">{Number(point.commission_arara).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white">
                       <span className="font-medium text-gray-600">Ponto de Retirada (Encomendas)</span>
                       <span className="font-black text-rose-600">{Number(point.commission_retirada).toFixed(1)}%</span>
                    </div>
                 </div>
              </section>

              {/* Cláusula 3 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 3: Fluxo de Pagamento e Taxas</h3>
                 <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                    {point.payment_method === 'partner' ? (
                      <>
                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-2">Pagamento ao Ponto Parceiro</h4>
                        <p className="mb-3 font-medium text-gray-800">As vendas realizadas neste local serão recebidas diretamente pelo Ponto Parceiro (em seu próprio caixa/maquininha).</p>
                        <ul className="space-y-2 text-rose-900/80 list-disc pl-4 text-xs font-medium">
                           <li><strong>Regras de Cobrança:</strong> O Ponto Parceiro tem total liberdade para definir quais métodos de pagamento aceitará do cliente final.</li>
                           <li><strong>Taxas de Transação:</strong> Quaisquer custos com taxas de maquininha, antecipação ou operadoras de cartão são de inteira responsabilidade do Ponto Parceiro.</li>
                           <li><strong>Acerto Final:</strong> O Ponto Parceiro reterá sua comissão e repassará à Fornecedora o valor restante. As taxas financeiras pagas pelo Ponto Parceiro não serão abatidas do montante devido à Fornecedora.</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-2">Pagamento à Fornecedora (Loja)</h4>
                        <p className="mb-3 font-medium text-gray-800">As vendas realizadas neste local serão pagas pelo cliente digitalmente e recebidas de forma direta pela Fornecedora (Loja).</p>
                        <ul className="space-y-2 text-rose-900/80 list-disc pl-4 text-xs font-medium">
                           <li><strong>Taxas de Transação:</strong> O Ponto parceiro está isento de taxas financeiras referentes à cobrança digital do cliente final.</li>
                           <li><strong>Acerto Final:</strong> A Fornecedora repassará periodicamente as comissões devidas ao Ponto Parceiro via PIX/Transferência, baseando-se no volume de vendas atreladas a este local.</li>
                        </ul>
                      </>
                    )}
                 </div>
              </section>

              {/* Cláusula 4 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 4: Liberação de Peças e Segurança</h3>
                 <p>
                    Para não gerar desvio de função na equipe do local, o aluno fará a leitura do QR Code na arara. A liberação da sacola ou do produto 
                    escolhido pelo cliente deverá ocorrer somente após a visualização da tela de <strong>"Pagamento Confirmado / Finalizado"</strong> diretamente no 
                    celular do cliente ou confirmação de recebimento. O Ponto Parceiro concorda em não liberar ou entregar peças antes desta 
                    validação.
                 </p>
              </section>

              {/* Cláusula 5 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 5: Ciclo de Acerto de Contas</h3>
                 <p>
                    A apuração dos resultados, reposição de estoque e o repasse financeiro ocorrerão a cada <strong>{point.replenishment_cycle_days || 30} dias</strong>. O sistema emitirá um extrato transparente de todas as vendas, separando valores brutos, taxas abatidas (se aplicável) e o lucro de cada parte.
                 </p>
              </section>

              {/* Cláusula 6 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 6: Responsabilidade sobre o Estoque Físico</h3>
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
                    <p className="font-bold text-sm mb-2 flex items-center gap-2">
                      ⚠️ O Ponto Parceiro {point.loss_risk_active ? 'ASSUME' : 'NÃO ASSUME'} a responsabilidade por furtos ou perdas.
                    </p>
                    {point.loss_risk_active ? (
                      <p className="text-xs">Se houver falta de peças no inventário, o Parceiro deverá ressarcir exclusivamente o <strong>Preço de Custo</strong> da peça (não o preço de venda), sendo abatido no acerto financeiro do ciclo.</p>
                    ) : (
                      <p className="text-xs">Eventuais furtos ou perdas no estoque físico da arara serão de responsabilidade e risco exclusivos da Fornecedora da peça.</p>
                    )}
                 </div>
              </section>

              {/* Cláusula 7 */}
              <section>
                 <h3 className="font-bold text-gray-900 text-base mb-2">Cláusula 7: Encerramento</h3>
                 <p>
                    A parceria tem caráter comercial (sem vínculo societário) e pode ser encerrada por qualquer parte a qualquer momento. Em caso de rescisão, o acerto final e a devolução do estoque ocorrerão em até 5 dias úteis.
                 </p>
              </section>
           </div>

           {/* Aceite */}
           <div className="bg-gray-100 p-6 md:p-8 mt-4 border-t">
              {point.contract_accepted_at ? (
                 <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-emerald-900 font-bold text-lg">Contrato Digital Assinado</h3>
                    <p className="text-emerald-700 font-medium text-sm mt-1">Assinado em {new Date(point.contract_accepted_at).toLocaleString('pt-BR')} (IP: {point.contract_accepted_ip})</p>
                    <p className="text-emerald-600/70 text-xs mt-3">Você já pode fechar esta página.</p>
                 </div>
              ) : (
                 <div className="max-w-md mx-auto text-center">
                    <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-4">Finalize sua parceria</h3>
                    <Button 
                      size="lg" 
                      className="w-full text-base font-bold shadow-lg shadow-primary/20"
                      onClick={handleAccept}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registrando...' : 'Li e Concordo com os Termos'}
                    </Button>
                    <p className="text-[10px] text-gray-500 mt-4 flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3" /> Ao concordar, registraremos seu IP e horário.
                    </p>
                 </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-[10px] text-gray-500 leading-relaxed text-justify">
                  <strong>Validade Legal:</strong> O registro eletrônico de aceite (data/hora + IP) tem validade conforme a Lei nº 14.063/2020 sobre assinaturas eletrônicas. Não é necessário certificado ICP-Brasil para contratos comerciais de pequeno porte entre pessoas físicas e jurídicas.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
