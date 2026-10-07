/**
 * Abstraction native / Capacitor pour Carnet Auto slah
 * Gère la détection de plateforme, la capture photo/fichier avec compression,
 * le partage natif et les notifications locales.
 */

export interface NativePlatformInfo {
  isNative: boolean;
  platform: 'web' | 'android' | 'ios';
}

export function getPlatformInfo(): NativePlatformInfo {
  if (typeof window === 'undefined') {
    return { isNative: false, platform: 'web' };
  }

  const cap = (window as unknown as { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } }).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    const p = cap.getPlatform();
    return {
      isNative: true,
      platform: p === 'ios' ? 'ios' : 'android',
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return { isNative: false, platform: 'ios' };
  if (/android/.test(ua)) return { isNative: false, platform: 'android' };

  return { isNative: false, platform: 'web' };
}

/**
 * Compression client d'une image pour préserver le stockage local et la réactivité
 */
export async function compressImageFile(file: File, maxDimension: number = 1400, quality: number = 0.8): Promise<{
  dataUrl: string;
  thumbnailUrl: string;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format d'image non reconnu"));
      img.onload = () => {
        // 1. Image principale redimensionnée
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            thumbnailUrl: e.target?.result as string,
            size: file.size,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // 2. Miniature (120x120)
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 120;
        thumbCanvas.height = 120;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          thumbCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 120, 120);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

        // Estimation de la taille en octets
        const estimatedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          thumbnailUrl,
          size: estimatedSize,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Partage natif avec repli Web Share API ou presse-papier
 */
export async function shareContent(options: {
  title: string;
  text?: string;
  url?: string;
  file?: File;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
        url: options.url,
      };
      if (options.file && navigator.canShare && navigator.canShare({ files: [options.file] })) {
        shareData.files = [options.file];
      }
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Partage annulé ou échoué:', err);
      }
      return false;
    }
  }

  // Fallback presse-papier
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    const textToCopy = [options.title, options.text, options.url].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(textToCopy);
    return true;
  }

  return false;
}
