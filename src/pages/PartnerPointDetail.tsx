import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Box, DollarSign, Store, Tag, MoreHorizontal, Settings, ScanLine, QrCode, Download, FileText, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import PartnerPointStockTab from '@/components/partner-points/PartnerPointStockTab';
import PartnerPointSalesTab from '@/components/partner-points/PartnerPointSalesTab';
import PartnerPointSettlementsTab from '@/components/partner-points/PartnerPointSettlementsTab';
import PartnerPointWizardDialog from '@/components/partner-points/PartnerPointWizardDialog';

export default function PartnerPointDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock');
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load configuration
  const { data: point, isLoading, error } = useQuery({
    queryKey: ['partner-point-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_points')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando painel do parceiro...</div>;
  if (error || !point) return <div className="p-8 text-center text-red-500">Erro ao carregar ou ponto não encontrado.</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner-points')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{point.name}</h1>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${point.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              {point.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Gestão de Arara e Acertos Financeiros</p>
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             className="gap-2 text-rose-700 border-rose-200 hover:bg-rose-50" 
             onClick={() => {
               const contractLink = `${window.location.origin}/contrato/${point.id}`;
               navigator.clipboard.writeText(contractLink);
               toast.success("Link do Contrato copiado para ser enviado!");
             }}
             title="Copiar Link do Contrato"
           >
              <FileText className="h-4 w-4" /> Enviar Contrato
           </Button>
           <Button variant="outline" size="sm" className="gap-2 text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => setIsQROpen(true)}>
              <QrCode className="h-4 w-4" /> QR Code
           </Button>
           <Button variant="outline" size="sm" className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => window.open(`/parceiro/${point.id}/cartaz`, '_blank')}>
              <Printer className="h-4 w-4" /> Imprimir Cartaz
           </Button>
           <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`${window.location.origin}/parceiro/${point.slug}`, '_blank')}>
              <ScanLine className="h-4 w-4" /> Ver Catálogo Online
           </Button>
           <Button variant="ghost" size="icon" className="text-muted-foreground" title="Editar Configurações" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-5 h-5"/>
           </Button>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contato</p>
            <p className="font-semibold text-sm truncate">{point.contact_name || 'Não informado'}</p>
            <p className="text-xs text-muted-foreground truncate">{point.phone || 'S/ telefone'}</p>
         </div>
         <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Endereço</p>
            <p className="font-semibold text-sm line-clamp-2">{point.address || 'Não informado'}</p>
         </div>
         <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Comissões</p>
            <div className="flex justify-between items-center mt-1">
               <span className="text-xs text-muted-foreground">Arara:</span>
               <span className="font-bold text-primary">{Number(point.commission_arara).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center mt-0.5">
               <span className="text-xs text-muted-foreground">Retirada:</span>
               <span className="font-bold text-primary">{Number(point.commission_retirada).toFixed(1)}%</span>
            </div>
         </div>
         <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-amber-900 mb-1">Fluxo Financeiro</p>
            <p className="font-bold text-sm text-amber-900">{point.payment_method === 'partner' ? 'Parceiro Recebe' : 'Loja Recebe Direto'}</p>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="stock" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Store className="h-4 w-4" /> <span className="hidden sm:inline">Estoque da </span> Arara
          </TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4" /> Vendas
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4" /> Acertos Financeiros
          </TabsTrigger>
        </TabsList>

        <div className="bg-card border rounded-2xl shadow-sm min-h-[400px]">
          <TabsContent value="stock" className="m-0 border-none outline-none">
            <PartnerPointStockTab pointId={point.id} isContractSigned={!!point.contract_accepted_at} />
          </TabsContent>

          <TabsContent value="sales" className="m-0 border-none outline-none">
            {activeTab === 'sales' && <PartnerPointSalesTab pointId={point.id} />}
          </TabsContent>

          <TabsContent value="finance" className="m-0 border-none outline-none">
            {activeTab === 'finance' && <PartnerPointSettlementsTab point={point} />}
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal do QR Code */}
      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>QR Code da Arara</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-bold text-primary mt-2">{point.name}</p>
          
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed shadow-inner my-4" id="qr-code-wrapper-detail">
             <QRCodeSVG 
                value={`${window.location.origin}/parceiro/${point.slug}`} 
                size={256} 
                level="Q" 
                includeMargin={false} 
                id="qrcode-svg-detail"
             />
          </div>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
             Os clientes podem escanear este código para abrir o catálogo digital desta arara. Salve-o para colocar nas suas artes impressas!
          </p>
          <Button 
            onClick={() => {
              const svg = document.getElementById('qrcode-svg-detail');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const img = new Image();
                img.onload = () => {
                  canvas.width = 1024;
                  canvas.height = 1024;
                  // Fundo Branco
                  if(ctx) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 64, 64, 896, 896); // Da margem pra ficar bonitinho
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `qrcode-${point.slug}.png`;
                    downloadLink.href = `${pngFile}`;
                    downloadLink.click();
                  }
                };
                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
              }
            }} 
            className="w-full font-bold gap-2"
          >
            <Download className="w-4 h-4" /> Baixar Imagem (PNG Alta Resol.)
          </Button>
        </DialogContent>
      </Dialog>

      <PartnerPointWizardDialog 
         open={isSettingsOpen} 
         onOpenChange={setIsSettingsOpen} 
         initialData={point} 
      />
    </div>
  );
}
