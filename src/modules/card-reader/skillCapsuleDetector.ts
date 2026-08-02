import type { OcrZone } from '@/lib/ocr';
import { EFHUB_CANONICAL_HEIGHT, EFHUB_CANONICAL_WIDTH } from './efhubLayoutGeometry';

export const SKILL_CAPSULE_DETECTOR_VERSION = '32.00-skill-capsules-strict-1';

export type SkillCapsuleDetection = {
  zones: OcrZone[];
  detectedCount: number;
  usedFallback: boolean;
  diagnostics: string[];
};

type Interval = { start: number; end: number };
type RowBand = { y1: number; y2: number; label: string };

const SKILL_X1 = 18;
const SKILL_X2 = 1265; // ignora o logotipo eFHUB no canto direito
const ROWS: RowBand[] = [
  { y1: 1434, y2: 1495, label: 'linha 1' },
  { y1: 1486, y2: 1549, label: 'linha 2' },
  { y1: 1538, y2: 1594, label: 'linha 3' }
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function closeShortGaps(mask: boolean[], maxGap: number) {
  const output = [...mask];
  let index = 0;
  while (index < output.length) {
    if (output[index]) { index += 1; continue; }
    const start = index;
    while (index < output.length && !output[index]) index += 1;
    const end = index - 1;
    const bounded = start > 0 && index < output.length && output[start - 1] && output[index];
    if (bounded && end - start + 1 <= maxGap) {
      for (let cursor = start; cursor <= end; cursor += 1) output[cursor] = true;
    }
  }
  return output;
}

function intervals(mask: boolean[]) {
  const result: Interval[] = [];
  let index = 0;
  while (index < mask.length) {
    if (!mask[index]) { index += 1; continue; }
    const start = index;
    while (index < mask.length && mask[index]) index += 1;
    result.push({ start, end: index - 1 });
  }
  return result;
}

function mergeNearby(items: Interval[], maxGap: number) {
  if (!items.length) return [];
  const result: Interval[] = [{ ...items[0] }];
  for (const item of items.slice(1)) {
    const current = result[result.length - 1];
    if (item.start - current.end - 1 <= maxGap) current.end = Math.max(current.end, item.end);
    else result.push({ ...item });
  }
  return result;
}

function rowIntervals(image: ImageData, row: RowBand) {
  const width = image.width;
  const x1 = clamp(SKILL_X1, 0, width - 1);
  const x2 = clamp(SKILL_X2, x1 + 1, width);
  const y1 = clamp(row.y1, 0, image.height - 1);
  const y2 = clamp(row.y2, y1 + 1, image.height);
  const activity = new Array<boolean>(x2 - x1).fill(false);

  for (let x = x1; x < x2; x += 1) {
    let strongPixels = 0;
    let edgePixels = 0;
    for (let y = y1 + 2; y < y2 - 2; y += 1) {
      const offset = (y * width + x) * 4;
      const r = image.data[offset];
      const g = image.data[offset + 1];
      const b = image.data[offset + 2];
      const lum = luminance(r, g, b);
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      const leftOffset = (y * width + Math.max(x1, x - 2)) * 4;
      const leftLum = luminance(image.data[leftOffset], image.data[leftOffset + 1], image.data[leftOffset + 2]);
      if (lum >= 102 || (saturation >= 42 && lum >= 62)) strongPixels += 1;
      if (Math.abs(lum - leftLum) >= 30) edgePixels += 1;
    }
    activity[x - x1] = strongPixels >= 2 || edgePixels >= 5;
  }

  const closedLetters = closeShortGaps(activity, 5);
  const wordGroups = mergeNearby(intervals(closedLetters), 11);
  return wordGroups
    .map((item) => ({ start: item.start + x1 - 7, end: item.end + x1 + 7 }))
    .map((item) => ({ start: clamp(item.start, x1, x2 - 1), end: clamp(item.end, x1 + 1, x2) }))
    .filter((item) => item.end - item.start >= 38 && item.end - item.start <= 430);
}

function overlapRatio(left: OcrZone, right: OcrZone) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const smaller = Math.min(left.w * left.h, right.w * right.h);
  return smaller > 0 ? intersection / smaller : 0;
}

function deduplicate(zones: OcrZone[]) {
  const result: OcrZone[] = [];
  for (const zone of zones) {
    const existing = result.find((item) => overlapRatio(item, zone) >= 0.72);
    if (!existing) result.push(zone);
    else if (zone.w < existing.w) Object.assign(existing, zone);
  }
  return result;
}

function fallbackZones(): OcrZone[] {
  const windows = [
    [18, 370], [320, 690], [640, 1015], [965, 1265]
  ] as const;
  return ROWS.flatMap((row, rowIndex) => windows.map(([x1, x2], windowIndex) => ({
    key: 'skills' as const,
    label: `Habilidades • fallback L${rowIndex + 1}.${windowIndex + 1}`,
    x: x1 / EFHUB_CANONICAL_WIDTH,
    y: row.y1 / EFHUB_CANONICAL_HEIGHT,
    w: (x2 - x1) / EFHUB_CANONICAL_WIDTH,
    h: (row.y2 - row.y1) / EFHUB_CANONICAL_HEIGHT,
    enabled: true
  })));
}

export async function detectEfhubSkillCapsuleZones(file: File | Blob): Promise<SkillCapsuleDetection> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    return {
      zones: fallbackZones(),
      detectedCount: 0,
      usedFallback: true,
      diagnostics: ['Detecção visual de cápsulas indisponível; aplicadas janelas internas seguras.']
    };
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const canvas = document.createElement('canvas');
    canvas.width = EFHUB_CANONICAL_WIDTH;
    canvas.height = EFHUB_CANONICAL_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas indisponível para detectar cápsulas de habilidades.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const zones = deduplicate(ROWS.flatMap((row, rowIndex) =>
      rowIntervals(image, row).map((item, itemIndex) => ({
        key: 'skills' as const,
        label: `Habilidade ${rowIndex + 1}.${itemIndex + 1}`,
        x: item.start / EFHUB_CANONICAL_WIDTH,
        y: row.y1 / EFHUB_CANONICAL_HEIGHT,
        w: (item.end - item.start) / EFHUB_CANONICAL_WIDTH,
        h: (row.y2 - row.y1) / EFHUB_CANONICAL_HEIGHT,
        enabled: true
      }))
    ));

    const plausible = zones.length >= 2 && zones.length <= 18;
    if (!plausible) {
      return {
        zones: fallbackZones(),
        detectedCount: zones.length,
        usedFallback: true,
        diagnostics: [`A segmentação encontrou ${zones.length} bloco(s), fora da faixa segura; aplicadas janelas de contingência.`]
      };
    }

    return {
      zones,
      detectedCount: zones.length,
      usedFallback: false,
      diagnostics: [`${zones.length} cápsula(s) de habilidade localizada(s) individualmente antes do OCR.`]
    };
  } finally {
    bitmap.close?.();
  }
}
