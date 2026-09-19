import type { OcrZone } from '@/lib/ocr';
import type { CardCropBox } from '@/modules/card-reader/cardArtCrop';

export const CARD_VISUAL_IDENTITY_R440_VERSION = '40.80-r440-card-visual-identity-v1' as const;
export const CARD_VISUAL_HASH_ALGORITHM_R440 = 'dhash64-v1' as const;

export type CardVisualFingerprintR440 = {
  algorithm: typeof CARD_VISUAL_HASH_ALGORITHM_R440;
  hash: string;
  variants?: string[];
  quality: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nibblePopcount(value: number) {
  return value === 0 ? 0 : value === 1 || value === 2 || value === 4 || value === 8 ? 1 : value === 3 || value === 5 || value === 6 || value === 9 || value === 10 || value === 12 ? 2 : value === 7 || value === 11 || value === 13 || value === 14 ? 3 : 4;
}

function normalizeHex64(value: unknown) {
  const hex = String(value ?? '').trim().toLowerCase().replace(/^0x/, '');
  return /^[0-9a-f]{16}$/.test(hex) ? hex : null;
}

export function differenceHash64FromLumaR440(values: ArrayLike<number>, width: number, height: number) {
  if (width !== 9 || height !== 8 || values.length < width * height) throw new Error('R440: dHash requer amostra luminosa 9x8.');
  let bits = '';
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits += Number(values[y * width + x]) > Number(values[y * width + x + 1]) ? '1' : '0';
    }
  }
  let hex = '';
  for (let offset = 0; offset < bits.length; offset += 4) hex += Number.parseInt(bits.slice(offset, offset + 4), 2).toString(16);
  return hex.padStart(16, '0');
}

export function hammingDistanceHexR440(left: unknown, right: unknown) {
  const a = normalizeHex64(left);
  const b = normalizeHex64(right);
  if (!a || !b) return 64;
  let distance = 0;
  for (let index = 0; index < 16; index += 1) distance += nibblePopcount(Number.parseInt(a[index], 16) ^ Number.parseInt(b[index], 16));
  return distance;
}

export function visualHashSimilarityR440(left: unknown, right: unknown) {
  return Math.max(0, Math.round((1 - hammingDistanceHexR440(left, right) / 64) * 100));
}

export function visualFingerprintSimilarityR440(left: CardVisualFingerprintR440 | null | undefined, right: { visualHash?: string | null; visualHashVariants?: string[] | null } | null | undefined) {
  if (!left?.hash || !right?.visualHash) return 0;
  const observed = Array.from(new Set([left.hash, ...(left.variants ?? [])].map((item) => normalizeHex64(item)).filter((item): item is string => Boolean(item))));
  const stored = Array.from(new Set([right.visualHash, ...(right.visualHashVariants ?? [])].map((item) => normalizeHex64(item)).filter((item): item is string => Boolean(item))));
  let best = 0;
  for (const a of observed) for (const b of stored) best = Math.max(best, visualHashSimilarityR440(a, b));
  return best;
}

function shiftedBoxesR440(zone: OcrZone | CardCropBox) {
  const base = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
  const dx = Math.min(.008, base.w * .025);
  const dy = Math.min(.008, base.h * .025);
  return [
    base,
    { ...base, x: base.x - dx },
    { ...base, x: base.x + dx },
    { ...base, y: base.y - dy },
    { ...base, y: base.y + dy }
  ].map((box) => ({
    x: clamp(box.x, 0, Math.max(0, 1 - box.w)),
    y: clamp(box.y, 0, Math.max(0, 1 - box.h)),
    w: clamp(box.w, .04, 1),
    h: clamp(box.h, .04, 1)
  }));
}

function lumaFromPixelsR440(data: Uint8ClampedArray) {
  const values = new Float64Array(72);
  for (let index = 0; index < 72; index += 1) {
    const offset = index * 4;
    values[index] = data[offset] * .299 + data[offset + 1] * .587 + data[offset + 2] * .114;
  }
  return values;
}

function qualityFromLumaR440(values: ArrayLike<number>) {
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) sum += Number(values[index]);
  const mean = sum / Math.max(1, values.length);
  let variance = 0;
  for (let index = 0; index < values.length; index += 1) variance += (Number(values[index]) - mean) ** 2;
  const deviation = Math.sqrt(variance / Math.max(1, values.length));
  return clamp(Math.round(55 + deviation * .8), 55, 98);
}

export async function extractCardVisualFingerprintR440(file: File | Blob, zone: OcrZone | CardCropBox): Promise<CardVisualFingerprintR440 | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const variants: string[] = [];
  let quality = 0;
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (const box of shiftedBoxesR440(zone)) {
      const cropX = Math.max(0, Math.round(box.x * bitmap.width));
      const cropY = Math.max(0, Math.round(box.y * bitmap.height));
      const cropW = Math.max(1, Math.round(box.w * bitmap.width));
      const cropH = Math.max(1, Math.round(box.h * bitmap.height));
      ctx.clearRect(0, 0, 9, 8);
      ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, 9, 8);
      const luma = lumaFromPixelsR440(ctx.getImageData(0, 0, 9, 8).data);
      variants.push(differenceHash64FromLumaR440(luma, 9, 8));
      quality = Math.max(quality, qualityFromLumaR440(luma));
    }
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
  const unique = Array.from(new Set(variants));
  if (!unique.length) return null;
  return { algorithm: CARD_VISUAL_HASH_ALGORITHM_R440, hash: unique[0], variants: unique.slice(1), quality };
}
