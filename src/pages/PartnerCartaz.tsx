import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, ShoppingBag, Smartphone, QrCode as QrCodeIcon, CheckCircle } from 'lucide-react';

export default function PartnerCartaz() {
  const { id } = useParams();
  const [point, setPoint] = useState<any>(null);

  useEffect(() => {
    const fetchPoint = async () => {
      const { data, error } = await supabase
        .from('partner_points')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setPoint(data);
        setTimeout(() => {
           window.print();
        }, 800);
      }
    };
    if (id) fetchPoint();
  }, [id]);

  if (!point) return <div className="p-10 text-center">Gerando cartaz...</div>;

  const catalogUrl = `${window.location.origin}/parceiro/${point.slug}`;

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans print:m-0 print:p-0">
      {/* Hide on screen, only show to inform user */}
      <div className="bg-slate-100 p-4 text-center print:hidden border-b mb-8 flex justify-between items-center px-8">
         <p className="text-sm font-semibold">Modo de Impressão (Pressione Ctrl+P se não abrir automaticamente)</p>
         <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded font-bold">Imprimir Novamente</button>
      </div>

      {/* Cartaz Container - A4 format approximately */}
      <div className="max-w-[800px] mx-auto p-12 border-2 border-dashed border-slate-200 print:border-none print:p-2 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-10 w-full bg-primary/5 p-8 rounded-3xl print:bg-transparent print:p-4 print:mb-4">
           <p className="text-primary font-black tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2 print:text-xs print:mb-1">
              <MapPin className="w-5 h-5 print:w-4 print:h-4" /> Arara Exclusiva
           </p>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight print:text-4xl">
              {point.name}
           </h1>
           <p className="text-slate-500 mt-2 text-lg print:text-base print:mt-1">Compre suas peças favoritas sem sair daqui!</p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl mb-12 flex flex-col items-center print:shadow-none print:border-2 print:border-slate-800 print:p-4 print:mb-6">
           <QRCodeSVG 
              value={catalogUrl} 
              size={240}  
              level="H" 
              includeMargin={true} 
           />
           <p className="font-mono text-xs mt-4 text-slate-400 print:mt-2">{catalogUrl}</p>
        </div>

        {/* Instructions */}
        <div className="w-full">
           <h2 className="text-2xl font-black mb-8 text-center uppercase tracking-wide text-slate-800 border-b-2 border-slate-100 pb-4 print:text-xl print:mb-4 print:pb-2">
             Como comprar:
           </h2>

           <div className="grid gap-6 text-lg font-medium print:gap-4 print:text-base">
              
              <div className="flex gap-4 items-start print:gap-3">
                 <div className="bg-primary/20 text-primary w-10 h-10 print:w-8 print:h-8 rounded-full flex items-center justify-center font-black shrink-0 text-xl print:text-lg">1</div>
                 <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 print:text-base"><ShoppingBag className="w-5 h-5 text-primary print:w-4 print:h-4"/> Escolha Suas Peças</h3>
                    <p className="text-slate-500 text-base mt-1 print:text-sm print:leading-tight">Veja as opções disponíveis na nossa arara física e experimente o que gostar.</p>
                 </div>
              </div>

              <div className="flex gap-4 items-start print:gap-3">
                 <div className="bg-primary/20 text-primary w-10 h-10 print:w-8 print:h-8 rounded-full flex items-center justify-center font-black shrink-0 text-xl print:text-lg">2</div>
                 <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 print:text-base"><QrCodeIcon className="w-5 h-5 text-primary print:w-4 print:h-4"/> Escaneie o QR Code</h3>
                    <p className="text-slate-500 text-base mt-1 print:text-sm print:leading-tight">Aponte a câmera para o QR Code acima, acesse o catálogo e adicione as peças no "Carrinho".</p>
                 </div>
              </div>

              <div className="flex gap-4 items-start print:gap-3">
                 <div className="bg-primary/20 text-primary w-10 h-10 print:w-8 print:h-8 rounded-full flex items-center justify-center font-black shrink-0 text-xl print:text-lg">3</div>
                 <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 print:text-base"><Smartphone className="w-5 h-5 text-primary print:w-4 print:h-4"/> Finalize pelo WhatsApp</h3>
                    <p className="text-slate-500 text-base mt-1 print:text-sm print:leading-tight">Clique em "Finalizar Pedido". Seus itens serão enviados direto para o nosso WhatsApp de vendas.</p>
                 </div>
              </div>

              <div className="flex gap-4 items-start print:gap-3">
                 <div className="bg-primary/20 text-primary w-10 h-10 print:w-8 print:h-8 rounded-full flex items-center justify-center font-black shrink-0 text-xl print:text-lg">4</div>
                 <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 print:text-base"><CheckCircle className="w-5 h-5 text-primary print:w-4 print:h-4"/> Pague e Leve!</h3>
                    <p className="text-slate-500 text-base mt-2 print:text-sm print:leading-relaxed">
                      {point.payment_method === 'partner' 
                        ? 'Dirija-se à recepção, realize o pagamento diretamente no local e leve suas peças liberadas na hora!'
                        : <>Aguarde a resposta da loja via WhatsApp para efetuar o pagamento. Em seguida, mostra a tela <strong>"Passe de Liberação"</strong> recebida para a recepcionista e leve suas peças!</>}
                    </p>
                 </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}
