import { getRuntimeOptimizationProfile, planAdaptiveImageSize } from '@/lib/invisibleOptimizationV3820';

export type ImageEnhancement = 'original' | 'color' | 'contrast' | 'sharp' | 'binary' | 'inverted';
type PixelBuffer = Uint8ClampedArray<ArrayBufferLike>;
type DecodedBitmap = ImageBitmap | (HTMLImageElement & { close?: () => void });
const safeOcrSourceCache=new WeakMap<Blob,Promise<Blob|File>>();
const isAndroidRuntime=()=>typeof navigator!=='undefined'&&/Android/i.test(navigator.userAgent);

function normalizeLine(line: string) { return line.replace(/\s+/g, ' ').trim(); }
export function mergeOcrTexts(...texts: string[]) {
  const lines = new Map<string, string>();
  for (const text of texts) for (const line of text.split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
    const key = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
    if (key && !lines.has(key)) lines.set(key, line);
  }
  return Array.from(lines.values()).join('\n');
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

async function imageToBitmap(file: File | Blob): Promise<DecodedBitmap | null> {
  if (typeof document === 'undefined') return null;
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await new Promise<ImageBitmap | null>((resolve) => {
      let settled = false;
      const timer = globalThis.setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 8_000);
      createImageBitmap(file).then((value) => {
        if (settled) { value.close?.(); return; }
        settled = true; globalThis.clearTimeout(timer); resolve(value);
      }, () => { if (!settled) { settled = true; globalThis.clearTimeout(timer); resolve(null); } });
    });
    if (bitmap) return bitmap;
  }
  return htmlImageFallback(file);
}

function clampByte(value: number) { return Math.max(0, Math.min(255, Math.round(value))); }
function luminance(red: number, green: number, blue: number) { return red * 0.299 + green * 0.587 + blue * 0.114; }
function grayscale(data: PixelBuffer): PixelBuffer {
  const result = new Uint8ClampedArray(data.length);
  for (let index = 0; index < data.length; index += 4) {
    const gray = clampByte(luminance(data[index], data[index + 1], data[index + 2]));
    result[index] = gray; result[index + 1] = gray; result[index + 2] = gray; result[index + 3] = data[index + 3];
  }
  return result;
}

function darkUiSignal(data: PixelBuffer): { buffer: PixelBuffer; darkRatio: number } {
  const result = new Uint8ClampedArray(data.length);
  let sampled = 0, dark = 0;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index], green = data[index + 1], blue = data[index + 2], gray = luminance(red, green, blue);
    if ((index / 4) % 8 === 0) { sampled += 1; if (gray < 82) dark += 1; }
    const signal = Math.max(red, green, blue);
    result[index] = signal; result[index + 1] = signal; result[index + 2] = signal; result[index + 3] = data[index + 3];
  }
  return { buffer: result, darkRatio: sampled ? dark / sampled : 0 };
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

function sharpenGrayscale(data: PixelBuffer, width: number, height: number): PixelBuffer {
  if (width < 3 || height < 3) return data;
  const source = new Uint8ClampedArray(data), output = new Uint8ClampedArray(data), kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    let value = 0, kernelIndex = 0;
    for (let ky = -1; ky <= 1; ky += 1) for (let kx = -1; kx <= 1; kx += 1) {
      const sourceIndex = ((y + ky) * width + (x + kx)) * 4;
      value += source[sourceIndex] * kernel[kernelIndex]; kernelIndex += 1;
    }
    const index = (y * width + x) * 4, next = clampByte(value);
    output[index] = next; output[index + 1] = next; output[index + 2] = next; output[index + 3] = source[index + 3];
  }
  return output;
}

function enhancePixels(imageData: ImageData, mode: ImageEnhancement) {
  const { width, height } = imageData;
  if (mode === 'original') return;
  if (mode === 'color') {
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const gray = luminance(data[index], data[index + 1], data[index + 2]);
      data[index] = clampByte((data[index] - gray) * 0.72 + gray * 1.06 + 5);
      data[index + 1] = clampByte((data[index + 1] - gray) * 0.72 + gray * 1.06 + 5);
      data[index + 2] = clampByte((data[index + 2] - gray) * 0.72 + gray * 1.06 + 5);
    }
    return;
  }
  let processed: PixelBuffer = grayscale(imageData.data);
  if (mode === 'contrast' || mode === 'sharp') {
    applyContrast(processed, mode === 'sharp' ? 2.08 : 1.72, mode === 'sharp' ? 20 : 15);
    if (mode === 'sharp') processed = sharpenGrayscale(processed, width, height);
  } else {
    const darkUi = darkUiSignal(imageData.data), useBrightForeground = darkUi.darkRatio >= 0.58;
    if (useBrightForeground) processed = darkUi.buffer;
    const threshold = otsuThreshold(processed);
    for (let index = 0; index < processed.length; index += 4) {
      const foreground = useBrightForeground ? processed[index] > threshold : processed[index] <= threshold;
      const value = mode === 'inverted' ? (foreground ? 0 : 255) : (foreground ? 255 : 0);
      processed[index] = value; processed[index + 1] = value; processed[index + 2] = value;
    }
  }
  imageData.data.set(processed);
}

function canvasBlob(canvas: HTMLCanvasElement, fallback: File | Blob): Promise<Blob | File> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => { if (!settled) { settled = true; resolve(fallback); } }, 6_000);
    canvas.toBlob((blob) => { if (settled) return; settled = true; globalThis.clearTimeout(timer); resolve(blob ?? fallback); }, 'image/png', 0.96);
  });
}

export async function prepareRepeatedOcrSource(file:File|Blob):Promise<Blob|File>{
  if(!isAndroidRuntime()||typeof document==='undefined')return file;
  const cached=safeOcrSourceCache.get(file);if(cached)return cached;
  const task=(async()=>{const bitmap=await imageToBitmap(file);if(!bitmap)return file;const longest=Math.max(bitmap.width,bitmap.height);if(longest<=2100){bitmap.close?.();return file;}const profile={...getRuntimeOptimizationProfile(),maxFullOcrMegapixels:3.4};const plan=planAdaptiveImageSize(bitmap.width,bitmap.height,{workload:'ocr-full',preferredLongestSide:1900,minScale:.1,maxScale:1,profile});const canvas=document.createElement('canvas');try{canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d');if(!ctx)return file;ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return await canvasBlob(canvas,file);}finally{bitmap.close?.();canvas.width=1;canvas.height=1;}})();
  safeOcrSourceCache.set(file,task);return task;
}

export function expandOcrRegion(region: { x: number; y: number; w: number; h: number }, horizontal = 0.04, vertical = 0.025) {
  const x = Math.max(0, region.x - horizontal), y = Math.max(0, region.y - vertical);
  const right = Math.min(1, region.x + region.w + horizontal), bottom = Math.min(1, region.y + region.h + vertical);
  return { x, y, w: Math.max(0.01, right - x), h: Math.max(0.01, bottom - y) };
}

export async function preprocessImage(file: File | Blob, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  const source=await prepareRepeatedOcrSource(file),bitmap = await imageToBitmap(source);
  if (!bitmap) return file;
  const plan = planAdaptiveImageSize(bitmap.width, bitmap.height, { workload: 'ocr-full', preferredLongestSide: 1800, minScale: 0.1, maxScale: 1 });
  const canvas = document.createElement('canvas');
  try {
    canvas.width = plan.width; canvas.height = plan.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return file;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); enhancePixels(imageData, mode); ctx.putImageData(imageData, 0, 0);
    return await canvasBlob(canvas, file);
  } finally {
    bitmap.close?.(); canvas.width = 1; canvas.height = 1;
  }
}

export async function cropImage(file: File | Blob, region: { x: number; y: number; w: number; h: number }, widthTarget = 1900, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  if (typeof document === 'undefined') return file;
  const source=await prepareRepeatedOcrSource(file),bitmap = await imageToBitmap(source); if (!bitmap) return file;
  const cropX = Math.max(0, Math.round(bitmap.width * region.x)), cropY = Math.max(0, Math.round(bitmap.height * region.y));
  const cropW = Math.max(1, Math.min(bitmap.width - cropX, Math.round(bitmap.width * region.w)));
  const cropH = Math.max(1, Math.min(bitmap.height - cropY, Math.round(bitmap.height * region.h)));
  const android=isAndroidRuntime(),safeTarget=Math.min(Math.max(720,widthTarget),android?1750:3200),baseProfile=getRuntimeOptimizationProfile();
  const profile=android?{...baseProfile,maxCropOcrMegapixels:2.2}:baseProfile;
  const plan = planAdaptiveImageSize(cropW, cropH, { workload: 'ocr-crop', preferredLongestSide: safeTarget, minScale: android?.35:1, maxScale: android?2.2:4.2, profile });
  const canvas = document.createElement('canvas');
  try {
    canvas.width = plan.width; canvas.height = plan.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return file;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); enhancePixels(imageData, mode); ctx.putImageData(imageData, 0, 0);
    return await canvasBlob(canvas, file);
  } finally {
    bitmap.close?.(); canvas.width = 1; canvas.height = 1;
  }
}
