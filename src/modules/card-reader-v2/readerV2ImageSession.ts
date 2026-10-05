import type { ReaderV2Zone } from './readerV2Types';

export const DEFAULT_MAX_SOURCE_DIMENSION = 1800;
export const DEFAULT_MAX_CROP_MEGAPIXELS = 1.2;

export type ReaderV2ImageSessionOptions = {
  maxSourceDimension?: number;
  maxCropMegapixels?: number;
};

export type ReaderV2ImageSessionSnapshot = {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  preview: string;
  cropActive: boolean;
  closed: boolean;
};

export interface ReaderV2ImageSession {
  readonly preview: string;
  readonly width: number;
  readonly height: number;
  withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T>;
  close(): void;
  snapshot(): ReaderV2ImageSessionSnapshot;
}

function validateImageInput(file: File | Blob) {
  if (!file.type || !file.type.toLowerCase().startsWith('image/')) {
    throw new Error('O Reader V2 aceita somente arquivos de imagem.');
  }
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') {
    throw new Error('O runtime atual não oferece decodificação de imagem compatível com o Reader V2.');
  }
}

function normalizeZoneCoordinate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export async function openReaderV2ImageSession(
  file: File | Blob,
  options: ReaderV2ImageSessionOptions = {},
): Promise<ReaderV2ImageSession> {
  validateImageInput(file);

  const maxSourceDimension = Math.max(320, Math.floor(options.maxSourceDimension ?? DEFAULT_MAX_SOURCE_DIMENSION));
  const maxCropMegapixels = Math.max(0.2, options.maxCropMegapixels ?? DEFAULT_MAX_CROP_MEGAPIXELS);
  const preview = URL.createObjectURL(file);
  let sourceBitmap: ImageBitmap | null = null;
  let originalWidth = 0;
  let originalHeight = 0;
  let cropActive = false;
  let closed = false;

  try {
    const decoded = await createImageBitmap(file);
    originalWidth = decoded.width;
    originalHeight = decoded.height;
    const scale = Math.min(1, maxSourceDimension / Math.max(1, Math.max(decoded.width, decoded.height)));

    if (scale < 1) {
      const canvas = document.createElement('canvas');
      try {
        canvas.width = Math.max(1, Math.round(decoded.width * scale));
        canvas.height = Math.max(1, Math.round(decoded.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível preparar a fonte reduzida do Reader V2.');
        context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
        sourceBitmap = await createImageBitmap(canvas);
      } finally {
        decoded.close?.();
        canvas.width = 1;
        canvas.height = 1;
      }
    } else {
      sourceBitmap = decoded;
    }
  } catch (cause) {
    sourceBitmap?.close?.();
    URL.revokeObjectURL(preview);
    throw cause;
  }

  if (!sourceBitmap) {
    URL.revokeObjectURL(preview);
    throw new Error('Não foi possível abrir a imagem no Reader V2.');
  }

  const width = sourceBitmap.width;
  const height = sourceBitmap.height;

  function assertOpen() {
    if (closed || !sourceBitmap) throw new Error('Sessão de imagem do Reader V2 encerrada.');
  }

  async function withCrop<T>(
    zone: ReaderV2Zone,
    operation: (crop: HTMLCanvasElement) => Promise<T> | T,
  ): Promise<T> {
    assertOpen();
    if (cropActive) throw new Error('O Reader V2 permite somente um crop ativo por vez.');
    cropActive = true;

    const canvas = document.createElement('canvas');
    try {
      const x = normalizeZoneCoordinate(zone.x);
      const y = normalizeZoneCoordinate(zone.y);
      const w = Math.max(0.001, normalizeZoneCoordinate(zone.w));
      const h = Math.max(0.001, normalizeZoneCoordinate(zone.h));
      const sourceX = Math.max(0, Math.min(width - 1, Math.floor(width * x)));
      const sourceY = Math.max(0, Math.min(height - 1, Math.floor(height * y)));
      const sourceWidth = Math.max(1, Math.min(width - sourceX, Math.round(width * w)));
      const sourceHeight = Math.max(1, Math.min(height - sourceY, Math.round(height * h)));
      const maxCropPixels = maxCropMegapixels * 1_000_000;
      const cropScale = Math.min(1, Math.sqrt(maxCropPixels / Math.max(1, sourceWidth * sourceHeight)));

      canvas.width = Math.max(1, Math.round(sourceWidth * cropScale));
      canvas.height = Math.max(1, Math.round(sourceHeight * cropScale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível criar o crop temporário do Reader V2.');
      context.drawImage(
        sourceBitmap as ImageBitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      return await operation(canvas);
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      cropActive = false;
    }
  }

  function close() {
    if (closed) return;
    closed = true;
    cropActive = false;
    sourceBitmap?.close?.();
    sourceBitmap = null;
    URL.revokeObjectURL(preview);
  }

  function snapshot(): ReaderV2ImageSessionSnapshot {
    return { width, height, originalWidth, originalHeight, preview, cropActive, closed };
  }

  return { preview, width, height, withCrop, close, snapshot };
}
