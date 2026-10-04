import { planAdaptiveImageSize } from '@/lib/invisibleOptimizationV3820';

export type ImageEnhancement = 'original' | 'color' | 'contrast' | 'sharp' | 'binary' | 'inverted';
type PixelBuffer = Uint8ClampedArray<ArrayBufferLike>;
type DecodedBitmap = ImageBitmap | (HTMLImageElement & { close?: () => void });
type ImageDimensions = { width: number; height: number };

const DIMENSION_HEADER_BYTES = 128 * 1024;

function normalizeLine(line: string) { return line.replace(/\s+/g, ' ').trim(); }
export function mergeOcrTexts(...texts: string[]) {
  const lines = new Map<string, string>();
  for (const text of texts) for (const line of text.split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
    const key = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
    if (key && !lines.has(key)) lines.set(key, line);
  }
  return Array.from(lines.values()).join('\n');
}

function validDimensions(width: number, height: number): ImageDimensions | null {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width <= 20_000 && height <= 20_000
    ? { width, height }
    : null;
}

export async function readImageDimensions(file: File | Blob): Promise<ImageDimensions | null> {
  try {
    const header = new Uint8Array(await file.slice(0, Math.min(file.size, DIMENSION_HEADER_BYTES)).arrayBuffer());
    if (header.length >= 24 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
      const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
      return validDimensions(view.getUint32(16, false), view.getUint32(20, false));
    }
    if (header.length >= 12 && header[0] === 0xff && header[1] === 0xd8) {
      const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
      let offset = 2;
      while (offset + 8 < header.length) {
        if (header[offset] !== 0xff) { offset += 1; continue; }
        while (offset < header.length && header[offset] === 0xff) offset += 1;
        const marker = header[offset]; offset += 1;
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        if (offset + 1 >= header.length) break;
        const length = (header[offset] << 8) | header[offset + 1];
        if (length < 2 || offset + length > header.length) break;
        if (sofMarkers.has(marker) && length >= 7) {
          const height = (header[offset + 3] << 8) | header[offset + 4];
          const width = (header[offset + 5] << 8) | header[offset + 6];
          return validDimensions(width, height);
        }
        offset += length;
      }
    }
    if (header.length >= 30 && String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP' && String.fromCharCode(...header.slice(12, 16)) === 'VP8X') {
      const width = 1 + header[24] + (header[25] << 8) + (header[26] << 16);
      const height = 1 + header[27] + (header[28] << 8) + (header[29] << 16);
      return validDimensions(width, height);
    }
  } catch {
    return null;
  }
  return null;
}

async function htmlImageFallback(file: File | Blob): Promise<DecodedBitmap | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file), image = new Image();
    let settled = false;
    const finish = (value: DecodedBitmap | null) => { if (settled) return; settled = true; globalThis.clearTimeout(timer); if (!value) URL.revokeObjectURL(url); resolve(value); };
    const timer = globalThis.setTimeout(() => finish(null), 8_000);
    image.onload = () => { const decoded = image as DecodedBitmap; decoded.close = () => { image.src = ''; URL.revokeObjectURL(url); }; finish(decoded); };
    image.onerror = () => finish(null);
    image.src = url;
  });
}

async function bitmapWithTimeout(factory: () => Promise<ImageBitmap>): Promise<ImageBitmap | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 8_000);
    factory().then((value) => {
      if (settled) { value.close?.(); return; }
      settled = true; globalThis.clearTimeout(timer); resolve(value);
    }, () => { if (!settled) { settled = true; globalThis.clearTimeout(timer); resolve(null); } });
  });
}

async function imageToBitmap(file: File | Blob): Promise<DecodedBitmap | null> {
  if (typeof document === 'undefined') return null;
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await bitmapWithTimeout(() => createImageBitmap(file));
    if (bitmap) return bitmap;
  }
  return htmlImageFallback(file);
}

async function resizedBitmap(file: File | Blob, plan: { width: number; height: number }): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  return bitmapWithTimeout(() => createImageBitmap(file, {
    resizeWidth: plan.width,
    resizeHeight: plan.height,
    resizeQuality: 'high'
  }));
}

async function croppedBitmap(file: File | Blob, cropX: number, cropY: number, cropW: number, cropH: number, plan: { width: number; height: number }): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  return bitmapWithTimeout(() => createImageBitmap(file, cropX, cropY, cropW, cropH, {
    resizeWidth: plan.width,
    resizeHeight: plan.height,
    resizeQuality: 'high'
  }));
}

function clampByte(value: number) { return Math.max(0, Math.min(255, Math.round(value))); }
function luminance(red: number, green: number, blue: number) { return red * 0.299 + green * 0.587 + blue * 0.114; }
function grayscaleInPlace(data: PixelBuffer) {
  for (let index = 0; index < data.length; index += 4) {
    const gray = clampByte(luminance(data[index], data[index + 1], data[index + 2]));
    data[index] = gray; data[index + 1] = gray; data[index + 2] = gray;
  }
}
function darkRatio(data: PixelBuffer) {
  let sampled = 0, dark = 0;
  for (let index = 0; index < data.length; index += 32) {
    sampled += 1;
    if (luminance(data[index], data[index + 1], data[index + 2]) < 82) dark += 1;
  }
  return sampled ? dark / sampled : 0;
}
function brightSignalInPlace(data: PixelBuffer) {
  for (let index = 0; index < data.length; index += 4) {
    const signal = Math.max(data[index], data[index + 1], data[index + 2]);
    data[index] = signal; data[index + 1] = signal; data[index + 2] = signal;
  }
}

function otsuThreshold(data: PixelBuffer) {
  const histogram = new Uint32Array(256); let pixels = 0;
  for (let index = 0; index < data.length; index += 4) { histogram[data[index]] += 1; pixels += 1; }
  if (!pixels) return 128;
  let total = 0; for (let value = 0; value < 256; value += 1) total += value * histogram[value];
  let backgroundWeight = 0, backgroundSum = 0, bestVariance = -1, bestThreshold = 128;
  for (let threshold = 0; threshold < 256; threshold += 1) {
    backgroundWeight += histogram[threshold]; if (!backgroundWeight) continue;
    const foregroundWeight = pixels - backgroundWeight; if (!foregroundWeight) break;
    backgroundSum += threshold * histogram[threshold];
    const backgroundMean = backgroundSum / backgroundWeight, foregroundMean = (total - backgroundSum) / foregroundWeight;
    const between = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (between > bestVariance) { bestVariance = between; bestThreshold = threshold; }
  }
  return bestThreshold;
}

function applyContrast(data: PixelBuffer, factor: number, lift: number) {
  for (let index = 0; index < data.length; index += 4) {
    const value = clampByte((data[index] - 128) * factor + 128 + lift);
    data[index] = value; data[index + 1] = value; data[index + 2] = value;
  }
}

function sharpenGrayscaleInPlace(data: PixelBuffer, width: number, height: number) {
  if (width < 3 || height < 3) return;
  const source = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    const center = (y * width + x) * 4;
    const value = source[center] * 5 - source[center - 4] - source[center + 4] - source[center - width * 4] - source[center + width * 4];
    const next = clampByte(value);
    data[center] = next; data[center + 1] = next; data[center + 2] = next;
  }
}

function enhancePixels(imageData: ImageData, mode: ImageEnhancement) {
  const { width, height, data } = imageData;
  if (mode === 'original') return;
  if (mode === 'color') {
    for (let index = 0; index < data.length; index += 4) {
      const gray = luminance(data[index], data[index + 1], data[index + 2]);
      data[index] = clampByte((data[index] - gray) * 0.72 + gray * 1.06 + 5);
      data[index + 1] = clampByte((data[index + 1] - gray) * 0.72 + gray * 1.06 + 5);
      data[index + 2] = clampByte((data[index + 2] - gray) * 0.72 + gray * 1.06 + 5);
    }
    return;
  }
  if (mode === 'contrast' || mode === 'sharp') {
    grayscaleInPlace(data);
    applyContrast(data, mode === 'sharp' ? 2.08 : 1.72, mode === 'sharp' ? 20 : 15);
    if (mode === 'sharp') sharpenGrayscaleInPlace(data, width, height);
    return;
  }
  const useBrightForeground = darkRatio(data) >= 0.58;
  if (useBrightForeground) brightSignalInPlace(data); else grayscaleInPlace(data);
  const threshold = otsuThreshold(data);
  for (let index = 0; index < data.length; index += 4) {
    const foreground = useBrightForeground ? data[index] > threshold : data[index] <= threshold;
    const value = mode === 'inverted' ? (foreground ? 0 : 255) : (foreground ? 255 : 0);
    data[index] = value; data[index + 1] = value; data[index + 2] = value;
  }
}

function canvasBlob(canvas: HTMLCanvasElement, fallback: File | Blob): Promise<Blob | File> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => { if (!settled) { settled = true; resolve(fallback); } }, 6_000);
    canvas.toBlob((blob) => { if (settled) return; settled = true; globalThis.clearTimeout(timer); resolve(blob ?? fallback); }, 'image/png', 0.98);
  });
}

export function expandOcrRegion(region: { x: number; y: number; w: number; h: number }, horizontal = 0.04, vertical = 0.025) {
  const x = Math.max(0, region.x - horizontal), y = Math.max(0, region.y - vertical);
  const right = Math.min(1, region.x + region.w + horizontal), bottom = Math.min(1, region.y + region.h + vertical);
  return { x, y, w: Math.max(0.01, right - x), h: Math.max(0.01, bottom - y) };
}

export async function preprocessImage(file: File | Blob, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  const dimensions = await readImageDimensions(file);
  const planned = dimensions ? planAdaptiveImageSize(dimensions.width, dimensions.height, { workload: 'ocr-full', preferredLongestSide: 1400, minScale: 0.1, maxScale: 1 }) : null;
  let bitmap: DecodedBitmap | null = planned ? await resizedBitmap(file, planned) : null;
  if (!bitmap) bitmap = await imageToBitmap(file);
  if (!bitmap) return file;
  const plan = planned ?? planAdaptiveImageSize(bitmap.width, bitmap.height, { workload: 'ocr-full', preferredLongestSide: 1400, minScale: 0.1, maxScale: 1 });
  const canvas = document.createElement('canvas');
  try {
    canvas.width = plan.width; canvas.height = plan.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return file;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); enhancePixels(imageData, mode); ctx.putImageData(imageData, 0, 0);
    return await canvasBlob(canvas, file);
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function cropImage(file: File | Blob, region: { x: number; y: number; w: number; h: number }, widthTarget = 1900, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  if (typeof document === 'undefined') return file;
  const dimensions = await readImageDimensions(file);
  const safeTarget = Math.min(Math.max(720, widthTarget), 1900);
  let bitmap: DecodedBitmap | null = null;
  let plan: { width: number; height: number } | null = null;
  let fallbackCrop: { x: number; y: number; w: number; h: number } | null = null;
  if (dimensions) {
    const cropX = Math.max(0, Math.round(dimensions.width * region.x)), cropY = Math.max(0, Math.round(dimensions.height * region.y));
    const cropW = Math.max(1, Math.min(dimensions.width - cropX, Math.round(dimensions.width * region.w)));
    const cropH = Math.max(1, Math.min(dimensions.height - cropY, Math.round(dimensions.height * region.h)));
    plan = planAdaptiveImageSize(cropW, cropH, { workload: 'ocr-crop', preferredLongestSide: safeTarget, minScale: 0.25, maxScale: 4.2 });
    bitmap = await croppedBitmap(file, cropX, cropY, cropW, cropH, plan);
  }
  if (!bitmap) {
    bitmap = await imageToBitmap(file); if (!bitmap) return file;
    const cropX = Math.max(0, Math.round(bitmap.width * region.x)), cropY = Math.max(0, Math.round(bitmap.height * region.y));
    const cropW = Math.max(1, Math.min(bitmap.width - cropX, Math.round(bitmap.width * region.w)));
    const cropH = Math.max(1, Math.min(bitmap.height - cropY, Math.round(bitmap.height * region.h)));
    plan = planAdaptiveImageSize(cropW, cropH, { workload: 'ocr-crop', preferredLongestSide: safeTarget, minScale: 0.25, maxScale: 4.2 });
    fallbackCrop = { x: cropX, y: cropY, w: cropW, h: cropH };
  }
  const canvas = document.createElement('canvas');
  try {
    canvas.width = plan!.width; canvas.height = plan!.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return file;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (fallbackCrop) ctx.drawImage(bitmap, fallbackCrop.x, fallbackCrop.y, fallbackCrop.w, fallbackCrop.h, 0, 0, canvas.width, canvas.height);
    else ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); enhancePixels(imageData, mode); ctx.putImageData(imageData, 0, 0);
    return await canvasBlob(canvas, file);
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}