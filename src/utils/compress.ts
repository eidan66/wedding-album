export interface CompressOptions {
  maxDimension?: number; // max width or height
  quality?: number; // 0..1
}

const supportsCreateImageBitmap = typeof createImageBitmap === 'function';

async function imageBitmapFromFile(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (supportsCreateImageBitmap) {
    try {
      return await createImageBitmap(file);
    } catch {}
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<Blob> {
  const { maxDimension = 2048, quality = 0.72 } = opts;
  const bitmap = await imageBitmapFromFile(file);

  const srcW = 'width' in bitmap ? (bitmap as ImageBitmap).width : (bitmap as HTMLImageElement).naturalWidth;
  const srcH = 'height' in bitmap ? (bitmap as ImageBitmap).height : (bitmap as HTMLImageElement).naturalHeight;

  if (!srcW || !srcH) throw new Error('Invalid image dimensions');

  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  // Use OffscreenCanvas if available
  const offscreenAvailable = typeof OffscreenCanvas !== 'undefined';
  if (offscreenAvailable) {
    const canvas = new OffscreenCanvas(dstW, dstH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not available');
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, dstW, dstH);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    try {
      const maybeBitmap = bitmap as ImageBitmap;
      if (typeof (maybeBitmap as { close?: () => void }).close === 'function') maybeBitmap.close();
    } catch {}
    return blob;
  }

  // Fallback to HTMLCanvasElement
  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, dstW, dstH);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(b => resolve(b), 'image/jpeg', quality));
  if (!blob) throw new Error('Compression failed');
  return blob;
}

export function replaceExtension(name: string, newExt: string): string {
  const idx = name.lastIndexOf('.');
  return (idx >= 0 ? name.slice(0, idx) : name) + newExt;
}
