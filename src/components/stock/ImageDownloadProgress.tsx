import React from 'react';
import { useImageSyncStore } from '@/store/useImageSyncStore';
import { CloudDownload, CheckCircle, Loader2 } from 'lucide-react';

export default function ImageDownloadProgress() {
  const { isProcessing, totalProcessed, totalToProcess, queue } = useImageSyncStore();
  
  if (totalToProcess === 0 && !isProcessing) return null;
  
  const isDone = totalToProcess > 0 && queue.length === 0;
  const progressPercent = Math.min(100, Math.round((totalProcessed / totalToProcess) * 100));

  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 w-80 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
          {isDone ? <CheckCircle className="h-5 w-5" /> : <CloudDownload className="h-5 w-5 animate-pulse" />}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900">
             {isDone ? 'Imagens Baixadas!' : 'Sincronizando Imagens...'}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
             {isDone ? 'Todas as imagens externas agora estão seguras no seu Supabase.' : 'Transferindo imagens do fornecedor para a sua nuvem...'}
          </p>
          
          <div className="mt-3">
             <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>{totalProcessed} de {totalToProcess}</span>
                <span>{progressPercent}%</span>
             </div>
             <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-indigo-600 relative'}`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
             </div>
          </div>
          
          {!isDone && (
             <div className="mt-2 flex items-center text-[10px] text-indigo-600 gap-1 font-semibold">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Processando 5 imagens por vez...</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
