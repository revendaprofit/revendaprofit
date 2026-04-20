import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Store, Navigation2, Link2, ExternalLink, QrCode, Download, FileText } from 'lucide-react';
import PartnerPointWizardDialog from '@/components/partner-points/PartnerPointWizardDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

export default function PartnerPoints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [qrCodeSlug, setQrCodeSlug] = useState<string | null>(null);
  const [qrCodeName, setQrCodeName] = useState<string>('');

  const { data: partnerPoints = [], isLoading } = useQuery({
    queryKey: ['partner-points', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_points')
        .select(`
          *,
          partner_point_stock ( quantity )
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const generateStoreLink = (slug: string) => {
    return `${window.location.origin}/parceiro/${slug}`;
  };

  const activePoints = partnerPoints.filter(p => p.status === 'active').length;
  const totalItemsField = partnerPoints.reduce((acc, point) => {
    return acc + (point.partner_point_stock?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0);
  }, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Pontos Parceiros
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas araras consignadas em locais parceiros.</p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Ponto Parceiro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="bg-primary/10 p-4 rounded-xl"><MapPin className="h-8 w-8 text-primary" /></div>
          <div>
            <div className="text-3xl font-black">{activePoints}</div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Locais Ativos</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
           <div className="bg-emerald-500/10 p-4 rounded-xl"><Store className="h-8 w-8 text-emerald-600" /></div>
           <div>
             <div className="text-3xl font-black">{totalItemsField}</div>
             <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Peças em Campo</p>
           </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
           <div className="bg-slate-500/10 p-4 rounded-xl"><Navigation2 className="h-8 w-8 text-slate-600" /></div>
           <div>
             <div className="text-3xl font-black">{partnerPoints.length}</div>
             <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Parceiros</p>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando seus pontos parceiros...</div>
      ) : partnerPoints.length === 0 ? (
        <div className="text-center bg-card rounded-xl border border-dashed py-16 px-4">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Nenhum Ponto Parceiro</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Você ainda não cadastrou nenhum ponto físico ou arara consignada. Clique no botão acima para adicionar seu primeiro parceiro.
          </p>
          <Button onClick={() => setIsWizardOpen(true)}>Criar Meu Primeiro Ponto</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerPoints.map((point: any) => {
            const stockCount = point.partner_point_stock?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
            const link = generateStoreLink(point.slug);

            return (
              <div key={point.id} className="group bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{point.name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${point.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {point.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> <span className="truncate">{point.address || 'Sem endereço'}</span></p>
                    <p className="text-muted-foreground flex justify-between">
                       <span>Comissão: <strong>{Number(point.commission_arara).toFixed(1)}%</strong></span>
                       <span>Peças lá: <strong className="text-primary">{stockCount}</strong></span>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                       onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(link);
                          toast.success("Link do catálogo copiado!");
                       }}
                     >
                       <Link2 className="w-3.5 h-3.5" /> Link
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       className="gap-1.5 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                       onClick={(e) => {
                          e.stopPropagation();
                          setQrCodeSlug(point.slug);
                          setQrCodeName(point.name);
                       }}
                       title="QR Code do Catálogo"
                     >
                        <QrCode className="w-3.5 h-3.5" /> QR
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                       onClick={(e) => {
                          e.stopPropagation();
                          const contractLink = `${window.location.origin}/contrato/${point.id}`;
                          navigator.clipboard.writeText(contractLink);
                          toast.success("Link do Contrato copiado para ser enviado!");
                       }}
                       title="Gerar Link do Contrato"
                     >
                        <FileText className="w-3.5 h-3.5" /> Contrato
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       className="gap-1.5 text-xs"
                       onClick={(e) => {
                          e.stopPropagation();
                          window.open(link, '_blank');
                       }}
                       title="Abrir Catálogo Online"
                     >
                        <ExternalLink className="w-3.5 h-3.5" />
                     </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-3 border-t flex">
                  <Button className="w-full" variant="secondary" onClick={() => navigate(`/partner-points/${point.id}`)}>
                    Gerenciar Ponto
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isWizardOpen && (
        <PartnerPointWizardDialog 
          open={isWizardOpen} 
          onOpenChange={setIsWizardOpen} 
        />
      )}

      {/* Modal do QR Code */}
      <Dialog open={!!qrCodeSlug} onOpenChange={(open) => !open && setQrCodeSlug(null)}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>QR Code da Arara</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-bold text-primary mt-2">{qrCodeName}</p>
          
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed shadow-inner my-4" id="qr-code-wrapper">
             <QRCodeSVG 
                value={generateStoreLink(qrCodeSlug || '')} 
                size={256} 
                level="Q" 
                includeMargin={false} 
                id="qrcode-svg"
             />
          </div>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
             Os clientes podem escanear este código para abrir o catálogo digital desta arara. Salve-o para colocar nas suas artes impressas!
          </p>
          <Button 
            onClick={() => {
              const svg = document.getElementById('qrcode-svg');
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
                    downloadLink.download = `qrcode-${qrCodeSlug}.png`;
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
    </div>
  );
}
