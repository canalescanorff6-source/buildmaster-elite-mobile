import type { ReaderV2Zone } from './readerV2Types';

export type ReaderV2ImageSessionOptions = {
  maxSourceDimension?: number;
  maxCropMegapixels?: number;
};

export type ReaderV2ImageSessionSnapshot = {
  width: number;
  height: number;
  previewUrl: string | null;
  closed: boolean;
  cropActive: boolean;
};

export type ReaderV2ImageSession = {
  readonly previewUrl: string;
  withCrop<T>(zone: ReaderV2Zone, callback: (canvas: HTMLCanvasElement) => Promise<T> | T): Promise<T>;
  close(): Promise<void>;
  snapshot(): ReaderV2ImageSessionSnapshot;
};

export async function openReaderV2ImageSession(
  file: File | Blob,
  options: ReaderV2ImageSessionOptions = {},
): Promise<ReaderV2ImageSession> {
  if (!file.type?.startsWith('image/')) throw new Error('Reader V2 aceita apenas arquivos de imagem.');
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('Reader V2 requer runtime gráfico do navegador.');

  const maxSourceDimension = options.maxSourceDimension ?? 1800;
  const maxCropMegapixels = options.maxCropMegapixels ?? 1.2;
  const previewUrl = URL.createObjectURL(file);
  let original: ImageBitmap | null = null;
  let bitmap: ImageBitmap | null = null;
  let closed = false;
  let cropActive = false;

  try {
    original = await createImageBitmap(file);
    const sourceScale = Math.min(1, maxSourceDimension / Math.max(1, original.width, original.height));
    if (sourceScale < 1) {
      bitmap = await createImageBitmap(original, {
        resizeWidth: Math.max(1, Math.round(original.width * sourceScale)),
        resizeHeight: Math.max(1, Math.round(original.height * sourceScale)),
        resizeQuality: 'high',
      });
      original.close?.();
      original = null;
    } else {
      bitmap = original;
      original = null;
    }
  } catch (cause) {
    original?.close?.();
    bitmap?.close?.();
    URL.revokeObjectURL(previewUrl);
    throw cause;
  }

  async function withCrop<T>(zone: ReaderV2Zone, callback: (canvas: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
    if (closed || !bitmap) throw new Error('Reader V2 image session already closed');
    if (cropActive) throw new Error('Reader V2 permite apenas um crop ativo por vez');
    cropActive = true;
    const canvas = document.createElement('canvas');
    try {
      const sx = Math.max(0, Math.min(bitmap.width - 1, Math.round(bitmap.width * zone.x)));
      const sy = Math.max(0, Math.min(bitmap.height - 1, Math.round(bitmap.height * zone.y)));
      const sw = Math.max(1, Math.min(bitmap.width - sx, Math.round(bitmap.width * zone.w)));
      const sh = Math.max(1, Math.min(bitmap.height - sy, Math.round(bitmap.height * zone.h)));
      const cropScale = Math.min(1, Math.sqrt((maxCropMegapixels * 1_000_000) / Math.max(1, sw * sh)));
      canvas.width = Math.max(1, Math.round(sw * cropScale));
      canvas.height = Math.max(1, Math.round(sh * cropScale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Não foi possível criar canvas OCR do Reader V2.');
      context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return await callback(canvas);
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      cropActive = false;
    }
  }

  async function close() {
    if (closed) return;
    closed = true;
    bitmap?.close?.();
    bitmap = null;
    URL.revokeObjectURL(previewUrl);
  }

  return {
    previewUrl,
    withCrop,
    close,
    snapshot: () => ({ width: bitmap?.width ?? 0, height: bitmap?.height ?? 0, previewUrl: closed ? null : previewUrl, closed, cropActive }),
  };
}
