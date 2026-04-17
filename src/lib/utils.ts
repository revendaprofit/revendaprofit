import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const compressImageToWebp = async (fileOrBlob: File | Blob): Promise<Blob> => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
         const img = new Image();
         img.onload = () => {
             const canvas = document.createElement('canvas');
             let width = img.width;
             let height = img.height;
             const MAX_SIZE = 1080;
             if (width > height) {
                 if (width > MAX_SIZE) {
                     height *= MAX_SIZE / width;
                     width = MAX_SIZE;
                 }
             } else {
                 if (height > MAX_SIZE) {
                     width *= MAX_SIZE / height;
                     height = MAX_SIZE;
                 }
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0, width, height);
             canvas.toBlob((blob) => {
                 if (blob) resolve(blob);
                 else reject(new Error('Canvas conversion failed'));
             }, 'image/webp', 0.65); // 65% quality WebP is excellent for web catalogs
         };
         img.onerror = reject;
         img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
   });
};
