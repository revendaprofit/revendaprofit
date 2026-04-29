import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Film, Image as ImgIcon, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { compressImageToWebp } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface MediaProps {
   images: string[];
   video: string;
   onChangeImages: (urls: string[]) => void;
   onChangeVideo: (url: string) => void;
   onScrapeUrl?: (url: string) => void;
   isScraping?: boolean;
}

export default function ProductMediaSection({ images, video, onChangeImages, onChangeVideo, onScrapeUrl, isScraping }: MediaProps) {
  const [uploading, setUploading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const files = Array.from(event.target.files);
      const availableSlots = 3 - images.length;

      if (availableSlots <= 0) {
        toast.error("Máximo de 3 fotos atingido");
        return;
      }

      const filesToProcess = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        toast.info(`Apenas ${availableSlots} foto(s) serão adicionadas (limite de 3).`);
      }

      const newUrls: string[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        toast.loading(`Processando foto ${i + 1} de ${filesToProcess.length}...`, { id: 'upload-progress' });

        const compressedBlob = await compressImageToWebp(file);
        const filePath = `${Math.random()}.webp`;

        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, compressedBlob);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      toast.dismiss('upload-progress');
      onChangeImages([...images, ...newUrls]);
      toast.success(`${newUrls.length} foto(s) carregada(s)!`);
    } catch (error: any) {
      toast.dismiss('upload-progress');
      toast.error('Erro ao subir imagem: ' + error.message);
    } finally {
      setUploading(false);
      // Reset the input so the same file(s) can be selected again
      event.target.value = '';
    }
  };

  const handleUploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      if(file.size > 20 * 1024 * 1024) throw new Error("Video deve ter menos de 20MB");
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      onChangeVideo(data.publicUrl);
      toast.success('Vídeo carregado!');
    } catch (error: any) {
      toast.error('Erro ao subir vídeo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
     const newImgs = [...images];
     newImgs.splice(index, 1);
     onChangeImages(newImgs);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImgs = [...images];
    const [moved] = newImgs.splice(from, 1);
    newImgs.splice(to, 0, moved);
    onChangeImages(newImgs);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      moveImage(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const positionLabels = ['Capa', '2ª', '3ª'];

  return (
    <div className="space-y-4 col-span-2 border rounded-lg p-4 bg-muted/10">
      <h3 className="text-sm font-semibold flex items-center gap-2"><ImgIcon className="w-4 h-4" /> Multimídia (Fotos e Vídeo)</h3>
      
      {/* Photos */}
      <div className="space-y-2">
         <div className="flex items-center justify-between">
             <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fotos (Até 3)</label>
             {onScrapeUrl && (
                <div className="flex items-center gap-2 max-w-sm w-full ml-auto">
                   <Input 
                      placeholder="Colar link de um site/fornecedor..." 
                      className="h-8 text-xs flex-1" 
                      value={importUrl} 
                      onChange={e => setImportUrl(e.target.value)}
                   />
                   <Button size="sm" className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20" disabled={isScraping || !importUrl} onClick={() => { onScrapeUrl(importUrl); setImportUrl(''); }}>
                      {isScraping ? 'Buscando...' : 'Buscar Fotos'}
                   </Button>
                </div>
             )}
         </div>
         <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
               <div 
                 key={`${img}-${i}`} 
                 draggable
                 onDragStart={() => handleDragStart(i)}
                 onDragOver={(e) => handleDragOver(e, i)}
                 onDragEnd={handleDragEnd}
                 className={`relative group rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                   dragOverIndex === i ? 'border-primary scale-105 shadow-lg' : 
                   dragIndex === i ? 'border-primary/50 opacity-50' : 
                   'border-transparent hover:border-primary/30'
                 }`}
                 style={{ width: 96, height: 96 }}
               >
                  {/* Position label */}
                  <div className={`absolute top-0 left-0 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-br-md ${
                    i === 0 ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white'
                  }`}>
                    {positionLabels[i] || `${i + 1}ª`}
                  </div>

                  {/* Drag handle */}
                  <div className="absolute top-0 right-0 z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3.5 h-3.5 text-white drop-shadow-md" />
                  </div>

                  <img src={img} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center gap-1 pb-1.5 opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}
                      disabled={i === 0}
                      className="bg-white/90 text-slate-700 rounded-full p-1 shadow-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Mover para esquerda"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="bg-red-500/90 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-all"
                      title="Remover"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}
                      disabled={i === images.length - 1}
                      className="bg-white/90 text-slate-700 rounded-full p-1 shadow-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Mover para direita"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>
            ))}
            
            {images.length < 3 && (
               <div className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group">
                  <Input type="file" accept="image/*" multiple onChange={handleUploadImages} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="w-5 h-5 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] text-muted-foreground font-medium text-center group-hover:text-primary/80 transition-colors">
                    {uploading ? 'Subindo...' : <>Adicionar<br/>{images.length}/3</>}
                  </span>
               </div>
            )}
         </div>
         {images.length > 1 && (
           <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
             <GripVertical className="w-3 h-3" /> Arraste as fotos para mudar a ordem, ou use as setas. A primeira foto é a capa do produto.
           </p>
         )}
      </div>

      {/* Video */}
      <div className="space-y-2 pt-2 border-t">
         <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vídeo Destaque (1 max)</label>
         <div className="flex items-center gap-4">
            {video ? (
               <div className="relative group h-24 w-32 rounded-md border overflow-hidden bg-black flex items-center justify-center">
                  <video src={video} className="w-full h-full object-cover opacity-50" />
                  <Film className="w-6 h-6 text-white absolute" />
                  <button onClick={() => onChangeVideo('')} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
               </div>
            ) : (
               <div className="h-16 w-full max-w-[200px] border border-dashed rounded-md flex flex-col items-center justify-center relative hover:bg-muted/30 transition-colors px-4">
                  <Input type="file" accept="video/*" onChange={handleUploadVideo} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Film className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground font-medium">Add Vídeo Showcase</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
