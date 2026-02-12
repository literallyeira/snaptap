/** Vercel 4.5MB limitinden kacmak icin istemcide resmi ~3.5MB altina sikistirir */
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_DIM = 1920;
const DEFAULT_QUALITY = 0.88;

export function compressImage(file: File): Promise<File | Blob> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  if (file.size <= MAX_BYTES) return Promise.resolve(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const tryQuality = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size <= MAX_BYTES || q <= 0.4) {
              const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
              resolve(new File([blob], name, { type: 'image/jpeg' }));
              return;
            }
            tryQuality(Math.max(0.4, q - 0.15));
          },
          'image/jpeg',
          q
        );
      };
      tryQuality(DEFAULT_QUALITY);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
