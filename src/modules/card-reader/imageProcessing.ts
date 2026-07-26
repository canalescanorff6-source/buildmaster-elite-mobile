export type ImageEnhancement = 'original' | 'color' | 'contrast' | 'sharp' | 'binary' | 'inverted';

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

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function luminance(red: number, green: number, blue: number) {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function grayscale(data: Uint8ClampedArray) {
  const result = new Uint8ClampedArray(data.length);
  for (let index = 0; index < data.length; index += 4) {
    const gray = clampByte(luminance(data[index], data[index + 1], data[index + 2]));
    result[index] = gray;
    result[index + 1] = gray;
    result[index + 2] = gray;
    result[index + 3] = data[index + 3];
  }
  return result;
}

function otsuThreshold(data: Uint8ClampedArray) {
  const histogram = new Uint32Array(256);
  let pixels = 0;
  for (let index = 0; index < data.length; index += 4) {
    histogram[data[index]] += 1;
    pixels += 1;
  }
  if (!pixels) return 128;
  let total = 0;
  for (let value = 0; value < 256; value += 1) total += value * histogram[value];
  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let bestThreshold = 128;
  for (let threshold = 0; threshold < 256; threshold += 1) {
    backgroundWeight += histogram[threshold];
    if (!backgroundWeight) continue;
    const foregroundWeight = pixels - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += threshold * histogram[threshold];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (total - backgroundSum) / foregroundWeight;
    const between = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (between > bestVariance) {
      bestVariance = between;
      bestThreshold = threshold;
    }
  }
  return bestThreshold;
}

function applyContrast(data: Uint8ClampedArray, factor: number, lift: number) {
  for (let index = 0; index < data.length; index += 4) {
    const value = clampByte((data[index] - 128) * factor + 128 + lift);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
}

function sharpenGrayscale(data: Uint8ClampedArray, width: number, height: number) {
  if (width < 3 || height < 3) return data;
  const source = new Uint8ClampedArray(data);
  const output = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let value = 0;
      let kernelIndex = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const sourceIndex = ((y + ky) * width + (x + kx)) * 4;
          value += source[sourceIndex] * kernel[kernelIndex];
          kernelIndex += 1;
        }
      }
      const index = (y * width + x) * 4;
      const next = clampByte(value);
      output[index] = next;
      output[index + 1] = next;
      output[index + 2] = next;
      output[index + 3] = source[index + 3];
    }
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

  let processed = grayscale(imageData.data);
  if (mode === 'contrast' || mode === 'sharp') {
    applyContrast(processed, mode === 'sharp' ? 2.08 : 1.72, mode === 'sharp' ? 20 : 15);
    if (mode === 'sharp') processed = sharpenGrayscale(processed, width, height);
  } else {
    const threshold = otsuThreshold(processed);
    for (let index = 0; index < processed.length; index += 4) {
      const darkText = processed[index] <= threshold;
      const value = mode === 'inverted'
        ? (darkText ? 255 : 0)
        : (darkText ? 0 : 255);
      processed[index] = value;
      processed[index + 1] = value;
      processed[index + 2] = value;
    }
  }
  imageData.data.set(processed);
}

function canvasBlob(canvas: HTMLCanvasElement, fallback: File | Blob): Promise<Blob | File> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? fallback), 'image/png', 0.98));
}

export function expandOcrRegion(
  region: { x: number; y: number; w: number; h: number },
  horizontal = 0.04,
  vertical = 0.025
) {
  const x = Math.max(0, region.x - horizontal);
  const y = Math.max(0, region.y - vertical);
  const right = Math.min(1, region.x + region.w + horizontal);
  const bottom = Math.min(1, region.y + region.h + vertical);
  return { x, y, w: Math.max(0.01, right - x), h: Math.max(0.01, bottom - y) };
}

export async function preprocessImage(file: File | Blob, mode: ImageEnhancement = 'contrast'): Promise<Blob | File> {
  const setup = await imageToCanvas(file).catch(() => null);
  if (!setup) return file;
  const { bitmap, canvas } = setup;
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.max(0.7, Math.min(2.5, 2800 / Math.max(1, longestSide)));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhancePixels(imageData, mode);
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
  const safeTarget = Math.min(Math.max(720, widthTarget), 3200);
  const scale = Math.max(1, Math.min(4.2, safeTarget / cropW));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropW * scale));
  canvas.height = Math.max(1, Math.round(cropH * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhancePixels(imageData, mode);
  ctx.putImageData(imageData, 0, 0);
  bitmap.close?.();
  return canvasBlob(canvas, file);
}
