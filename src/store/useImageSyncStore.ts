import { create } from 'zustand';

export type QueueItem = {
  id: string; // product id
  url: string; // external url
  column: string; // 'image_url', 'image_url_2', etc
};

interface ImageSyncState {
  queue: QueueItem[];
  isProcessing: boolean;
  totalProcessed: number;
  totalToProcess: number;
  hasError: boolean;
  addToQueue: (items: QueueItem[]) => void;
  startProcessing: (sessionToken: string) => void;
  clearQueue: () => void;
}

export const useImageSyncStore = create<ImageSyncState>((set, get) => ({
  queue: [],
  isProcessing: false,
  totalProcessed: 0,
  totalToProcess: 0,
  hasError: false,
  
  addToQueue: (items) => {
    // Only add items that actually have an external URL
    const validItems = items.filter(i => i.url && !i.url.includes('supabase.co'));
    if (validItems.length === 0) return;
    
    set((state) => ({ 
        queue: [...state.queue, ...validItems],
        totalToProcess: state.totalToProcess + validItems.length 
    }));
  },
  
  clearQueue: () => set({ queue: [], isProcessing: false, totalProcessed: 0, totalToProcess: 0, hasError: false }),
  
  startProcessing: async (sessionToken: string) => {
    const state = get();
    if (state.isProcessing || state.queue.length === 0) return;
    
    set({ isProcessing: true, hasError: false });
    
    while (get().queue.length > 0 && get().isProcessing) {
      // Pega um lote de 5 imagens
      const currentBatch = get().queue.slice(0, 5);
      
      try {
        const response = await fetch('/api/sync-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ products: currentBatch })
        });
        
        if (!response.ok) {
           console.error("Erro na API do Vercel", await response.text());
        }
      } catch (err) {
        console.error("Falha ao chamar API de sync:", err);
      }
      
      // Remove the processed batch and update counters
      set(s => {
        const nextQueue = s.queue.slice(currentBatch.length);
        const doneCount = s.totalProcessed + currentBatch.length;
        
        // If everything is done, wait 5 seconds and clear
        if (nextQueue.length === 0) {
            setTimeout(() => {
                get().clearQueue();
            }, 5000);
        }
        
        return { 
          queue: nextQueue,
          totalProcessed: doneCount
        };
      });
      
      // Delay de 500ms para respeitar limites do Vercel
      await new Promise(r => setTimeout(r, 500));
    }
    
    set({ isProcessing: false });
  }
}));
