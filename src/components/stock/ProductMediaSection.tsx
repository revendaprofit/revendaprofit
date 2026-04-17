import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Film, Image as ImgIcon } from 'lucide-react';
import { toast } from 'sonner';
import { compressImageToWebp } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface MediaProps {
   images: string[];
   video: string;
   onChangeImages: (urls: string[]) => void;
   onChangeVideo: (url: string) => void;
}

export default function ProductMediaSection({ images, video, onChangeImages, onChangeVideo }: MediaProps) {
  const [uploading, setUploading] = useState(false);

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (images.length >= 3) {
         toast.error("Máximo de 3 fotos atingido");
         return;
      }
      
      const file = event.target.files[0];
      const compressedBlob = await compressImageToWebp(file);
      const filePath = `${Math.random()}.webp`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, compressedBlob);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      onChangeImages([...images, data.publicUrl]);
      toast.success('Imagem super-compactada carregada!');
    } catch (error: any) {
      toast.error('Erro ao subir imagem: ' + error.message);
    } finally {
      setUploading(false);
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
      toast.success('Vídeo carregado (compressão manual)');
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

  return (
    <div className="space-y-4 col-span-2 border rounded-lg p-4 bg-muted/10">
      <h3 className="text-sm font-semibold flex items-center gap-2"><ImgIcon className="w-4 h-4" /> Multimídia (Fotos e Vídeo)</h3>
      
      {/* Photos */}
      <div className="space-y-2">
         <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fotos (Até 3)</label>
         <div className="flex gap-4">
            {images.map((img, i) => (
               <div key={i} className="relative group h-24 w-24 rounded-md border overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
               </div>
            ))}
            
            {images.length < 3 && (
               <div className="h-24 w-24 border border-dashed rounded-md flex flex-col items-center justify-center relative hover:bg-muted/30 transition-colors">
                  <Input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground font-medium text-center">Add Foto<br/>{images.length}/3</span>
               </div>
            )}
         </div>
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
