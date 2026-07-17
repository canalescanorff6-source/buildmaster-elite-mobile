export type ImageEnhancement = 'contrast' | 'sharp';

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

export function mergeOcrTexts(...texts: string[]) {
  const lines = new Map<string, string>();
  for (const text of texts) {
    for (const line of text.split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
      const key = line
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
      if (key && !lines.has(key)) lines.set(key, line);
    }
  }
  return Array.from(lines.values()).join('\n');
}

async function imageToCanvas(file: File | Blob) {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0);
  return { bitmap, canvas, ctx };
}

function enhancePixels(data: Uint8ClampedArray, mode: ImageEnhancement) {
  const boost = mode === 'sharp' ? 2.25 : 1.9;
  const offset = mode === 'sharp' ? 166 : 158;
  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 108) * boost + offset));
    data[index] = contrasted;
    data[index + 1] = contrasted;
    data[index + 2] = contrasted;
  }
}

function canvasBlob(canvas: HTMLCanvasElement, fallback: File | Blob): Promise<Blob | File> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? fallback), 'image/png', 0.94));
}

export async function preprocessImage(file: File | Blob, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  const setup = await imageToCanvas(file).catch(() => null);
  if (!setup) return file;
  const { bitmap, canvas } = setup;
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.max(0.55, Math.min(2.05, 2200 / Math.max(1, longestSide)));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhancePixels(imageData.data, mode);
  ctx.putImageData(imageData, 0, 0);
  bitmap.close?.();
  return canvasBlob(canvas, file);
}

export async function cropImage(
  file: File | Blob,
  region: { x: number; y: number; w: number; h: number },
  widthTarget = 1900,
  mode: ImageEnhancement = 'contrast'
): Promise<Blob | File> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const cropX = Math.max(0, Math.round(bitmap.width * region.x));
  const cropY = Math.max(0, Math.round(bitmap.height * region.y));
  const cropW = Math.max(1, Math.min(bitmap.width - cropX, Math.round(bitmap.width * region.w)));
  const cropH = Math.max(1, Math.min(bitmap.height - cropY, Math.round(bitmap.height * region.h)));
  const safeTarget = Math.min(Math.max(720, widthTarget), 1900);
  const scale = Math.max(1, Math.min(3.1, safeTarget / cropW));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropW * scale));
  canvas.height = Math.max(1, Math.round(cropH * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhancePixels(imageData.data, mode);
  ctx.putImageData(imageData, 0, 0);
  bitmap.close?.();
  return canvasBlob(canvas, file);
}
