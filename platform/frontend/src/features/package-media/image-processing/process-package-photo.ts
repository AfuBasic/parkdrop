export interface ProcessImageOptions {
  maxLongEdge?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/webp';
}

/**
 * Reads a File/Blob, draws it to a canvas to strip EXIF, resizes it if needed,
 * and outputs a new Blob.
 */
export async function processPackagePhoto(
  file: Blob,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const maxLongEdge = options.maxLongEdge || 1600;
  const quality = options.quality || 0.8;
  const outputFormat = options.outputFormat || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      
      if (width > maxLongEdge || height > maxLongEdge) {
        if (width > height) {
          height = Math.round((height * maxLongEdge) / width);
          width = maxLongEdge;
        } else {
          width = Math.round((width * maxLongEdge) / height);
          height = maxLongEdge;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      // Drawing to canvas intrinsically strips EXIF data
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing'));
    };

    img.src = url;
  });
}
