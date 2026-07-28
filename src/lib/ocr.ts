import { buildPrintQualityReport, type PrintQualityReport } from './validation';

export type OcrZoneKey = 'name' | 'overall' | 'mainPosition' | 'playstyle' | 'level' | 'points' | 'cardType' | 'attributes' | 'progression' | 'autoTraining' | 'positionGrid' | 'skills' | 'specialSkill' | 'identityMeta' | 'condition' | 'manager' | 'impetos' | 'physicalModel';

export type OcrZone = {
  key: OcrZoneKey;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
};

export const DEFAULT_OCR_ZONES: OcrZone[] = [
  { key: 'name', label: 'Nome do jogador', x: 0.01, y: 0.00, w: 0.40, h: 0.075, enabled: true },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.01, y: 0.045, w: 0.44, h: 0.075, enabled: true },
  { key: 'overall', label: 'GER da carta', x: 0.045, y: 0.07, w: 0.16, h: 0.15, enabled: true },
  { key: 'mainPosition', label: 'Posição da carta', x: 0.04, y: 0.16, w: 0.22, h: 0.10, enabled: true },
  { key: 'cardType', label: 'Tipo da carta', x: 0.22, y: 0.075, w: 0.30, h: 0.11, enabled: true },
  { key: 'level', label: 'Nível máximo', x: 0.69, y: 0.00, w: 0.30, h: 0.12, enabled: true },
  { key: 'points', label: 'Pontos de progresso', x: 0.67, y: 0.105, w: 0.32, h: 0.13, enabled: true },
  { key: 'specialSkill', label: 'Habilidade especial', x: 0.43, y: 0.16, w: 0.55, h: 0.12, enabled: true },
  { key: 'positionGrid', label: 'Posições jogáveis', x: 0.66, y: 0.05, w: 0.33, h: 0.27, enabled: true },
  { key: 'attributes', label: 'Atributos principais', x: 0.01, y: 0.31, w: 0.98, h: 0.40, enabled: true },
  { key: 'progression', label: 'Progressão visível', x: 0.01, y: 0.68, w: 0.98, h: 0.19, enabled: true },
  { key: 'autoTraining', label: 'Ficha automática', x: 0.01, y: 0.54, w: 0.98, h: 0.33, enabled: true },
  { key: 'skills', label: 'Habilidades', x: 0.01, y: 0.87, w: 0.98, h: 0.12, enabled: true }
];

export async function inspectPrintQuality(file: File | Blob): Promise<PrintQualityReport | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement('canvas');
  try {
    const sampleWidth = Math.min(420, Math.max(240, width));
    const scale = sampleWidth / Math.max(1, width);
    canvas.width = sampleWidth;
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const total = Math.max(1, canvas.width * canvas.height);
    const gray = new Float32Array(total);
    let sum = 0;
    let sumSq = 0;
    let darkPixels = 0;
    let lightPixels = 0;
    let glarePixels = 0;
    for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const value = r * 0.299 + g * 0.587 + b * 0.114;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      gray[pixel] = value;
      sum += value;
      sumSq += value * value;
      if (value <= 10) darkPixels += 1;
      if (value >= 245) lightPixels += 1;
      if (value >= 238 && saturation <= 18) glarePixels += 1;
    }

    let edgeSum = 0;
    let edgeCount = 0;
    let lapSum = 0;
    let lapSumSq = 0;
    let fineEdges = 0;
    let horizontalBoundary = 0;
    let horizontalInterior = 0;
    let horizontalBoundaryCount = 0;
    let horizontalInteriorCount = 0;
    let verticalBoundary = 0;
    let verticalInterior = 0;
    let verticalBoundaryCount = 0;
    let verticalInteriorCount = 0;
    for (let y = 1; y < canvas.height - 1; y += 1) {
      for (let x = 1; x < canvas.width - 1; x += 1) {
        const pixel = y * canvas.width + x;
        const gx = Math.abs(gray[pixel + 1] - gray[pixel - 1]);
        const gy = Math.abs(gray[pixel + canvas.width] - gray[pixel - canvas.width]);
        const edge = gx + gy;
        edgeSum += edge;
        edgeCount += 1;
        if (edge > 28) fineEdges += 1;
        const laplacian = gray[pixel - 1] + gray[pixel + 1] + gray[pixel - canvas.width] + gray[pixel + canvas.width] - gray[pixel] * 4;
        lapSum += laplacian;
        lapSumSq += laplacian * laplacian;

        const dx = Math.abs(gray[pixel] - gray[pixel - 1]);
        if (x % 8 === 0) { verticalBoundary += dx; verticalBoundaryCount += 1; }
        else { verticalInterior += dx; verticalInteriorCount += 1; }
        const dy = Math.abs(gray[pixel] - gray[pixel - canvas.width]);
        if (y % 8 === 0) { horizontalBoundary += dy; horizontalBoundaryCount += 1; }
        else { horizontalInterior += dy; horizontalInteriorCount += 1; }
      }
    }
    const brightness = sum / total;
    const contrast = Math.sqrt(Math.max(0, sumSq / total - brightness * brightness));
    const sharpness = edgeSum / Math.max(1, edgeCount);
    const lapMean = lapSum / Math.max(1, edgeCount);
    const laplacianVariance = Math.max(0, lapSumSq / Math.max(1, edgeCount) - lapMean * lapMean);
    const verticalBlock = verticalBoundary / Math.max(1, verticalBoundaryCount) - verticalInterior / Math.max(1, verticalInteriorCount);
    const horizontalBlock = horizontalBoundary / Math.max(1, horizontalBoundaryCount) - horizontalInterior / Math.max(1, horizontalInteriorCount);
    const blockiness = Math.max(0, (verticalBlock + horizontalBlock) / 2);

    return buildPrintQualityReport({
      width,
      height,
      sharpness: Number(sharpness.toFixed(1)),
      brightness: Number(brightness.toFixed(1)),
      contrast: Number(contrast.toFixed(1)),
      laplacianVariance: Number(laplacianVariance.toFixed(1)),
      darkClipRatio: Number((darkPixels / total).toFixed(4)),
      lightClipRatio: Number((lightPixels / total).toFixed(4)),
      glareRatio: Number((glarePixels / total).toFixed(4)),
      blockiness: Number(blockiness.toFixed(1)),
      textEdgeDensity: Number((fineEdges / Math.max(1, edgeCount)).toFixed(4))
    });
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function createZoneOriginPreview(file: File | Blob, zone: OcrZone): Promise<string | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const canvas = document.createElement('canvas');
  try {
    const cropX = Math.max(0, Math.round(bitmap.width * zone.x));
    const cropY = Math.max(0, Math.round(bitmap.height * zone.y));
    const cropW = Math.max(1, Math.round(bitmap.width * zone.w));
    const cropH = Math.max(1, Math.round(bitmap.height * zone.h));
    const targetWidth = Math.min(900, Math.max(320, cropW));
    const scale = targetWidth / cropW;
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export type LocalEnhancementMode = 'adaptive' | 'contrast' | 'sharp' | 'color' | 'binary' | 'inverted';

export async function enhanceImageLocally(file: File | Blob, mode: LocalEnhancementMode = 'adaptive'): Promise<Blob | File> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const canvas = document.createElement('canvas');
  try {
    const maxWidth = 1800;
    const scale = Math.min(2.2, Math.max(1, maxWidth / Math.max(1, bitmap.width)));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const mean = sum / Math.max(1, data.length / 4);
    const contrast = mode === 'contrast' ? 1.7 : mode === 'sharp' ? 1.45 : mode === 'color' ? 1.22 : 1.35;
    const brightnessLift = Math.max(-22, Math.min(28, 132 - mean));

    if (mode === 'binary' || mode === 'inverted') {
      const grayValues = new Uint8Array(data.length / 4);
      let graySum = 0;
      for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        grayValues[pixel] = gray;
        graySum += gray;
      }
      const threshold = Math.max(72, Math.min(190, Math.round(graySum / Math.max(1, grayValues.length))));
      for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
        const dark = grayValues[pixel] <= threshold;
        const value = mode === 'inverted' ? (dark ? 255 : 0) : (dark ? 0 : 255);
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
    } else {
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        for (let channel = 0; channel < 3; channel += 1) {
          const saturation = mode === 'color' ? 1.18 : 1;
          const saturated = gray + (data[i + channel] - gray) * saturation;
          const value = (saturated - 128) * contrast + 128 + brightnessLift;
          data[i + channel] = Math.max(0, Math.min(255, value));
        }
      }
    }

    ctx.putImageData(image, 0, 0);
    if (mode === 'sharp' || mode === 'adaptive') {
      ctx.globalAlpha = mode === 'sharp' ? 0.42 : 0.22;
      ctx.filter = 'contrast(1.25) saturate(0.88)';
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    }
    return await new Promise<Blob | File>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/png', 0.96));
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}
