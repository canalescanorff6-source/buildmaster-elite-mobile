import type { OcrZone } from '@/lib/ocr';
import {
  EFHUB_CANONICAL_HEIGHT,
  EFHUB_CANONICAL_WIDTH,
  canonicalEfhubMacroZones,
  canonicalEfhubOcrZones,
  type EfhubLayoutPlan
} from './efhubLayoutGeometry';

export const EFHUB_CANONICAL_NORMALIZER_VERSION = '31.80-canonical-profile-final-1';

export type CanonicalEfhubImage = {
  blob: Blob;
  preview: string;
  width: typeof EFHUB_CANONICAL_WIDTH;
  height: typeof EFHUB_CANONICAL_HEIGHT;
  complete: boolean;
  visibleFraction: number;
  ocrZones: OcrZone[];
  macroZones: OcrZone[];
};

type Rect = { x: number; y: number; w: number; h: number };

function intersection(left: Rect, right: Rect): Rect {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível criar a imagem EFHub padronizada.')), 'image/png', 1);
  });
}

/**
 * Converte o painel EFHub detectado para o quadro canônico 1400 × 1600.
 * O OCR passa a trabalhar sempre na mesma geometria, independentemente da
 * resolução do arquivo original. Áreas ausentes permanecem vazias e a leitura
 * completa continua bloqueada pelo audit do layout.
 */
export async function normalizeEfhubProfileImage(file: File | Blob, plan: EfhubLayoutPlan): Promise<CanonicalEfhubImage> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    throw new Error('Normalização do perfil EFHub indisponível neste dispositivo.');
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const canvas = document.createElement('canvas');
    canvas.width = EFHUB_CANONICAL_WIDTH;
    canvas.height = EFHUB_CANONICAL_HEIGHT;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas indisponível para padronizar o perfil EFHub.');

    context.fillStyle = '#090d14';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const frame = plan.framePixels;
    const visible = intersection(frame, plan.visiblePixels);
    if (visible.w <= 1 || visible.h <= 1 || frame.w <= 1 || frame.h <= 1) {
      throw new Error('O painel EFHub não possui área visível suficiente para normalização.');
    }

    const destination = {
      x: ((visible.x - frame.x) / frame.w) * EFHUB_CANONICAL_WIDTH,
      y: ((visible.y - frame.y) / frame.h) * EFHUB_CANONICAL_HEIGHT,
      w: (visible.w / frame.w) * EFHUB_CANONICAL_WIDTH,
      h: (visible.h / frame.h) * EFHUB_CANONICAL_HEIGHT
    };

    context.drawImage(
      bitmap,
      visible.x,
      visible.y,
      visible.w,
      visible.h,
      destination.x,
      destination.y,
      destination.w,
      destination.h
    );

    const blob = await canvasToBlob(canvas);
    return {
      blob,
      preview: canvas.toDataURL('image/jpeg', 0.94),
      width: EFHUB_CANONICAL_WIDTH,
      height: EFHUB_CANONICAL_HEIGHT,
      complete: plan.audit.complete,
      visibleFraction: plan.audit.visibleFraction,
      ocrZones: canonicalEfhubOcrZones(),
      macroZones: canonicalEfhubMacroZones()
    };
  } finally {
    bitmap.close?.();
  }
}
