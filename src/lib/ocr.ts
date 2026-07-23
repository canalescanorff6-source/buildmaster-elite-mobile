import type { PrintQualityIssue, PrintQualityReport } from './validation';

export type OcrZoneKey = 'name' | 'overall' | 'mainPosition' | 'playstyle' | 'level' | 'points' | 'cardType' | 'attributes' | 'progression' | 'autoTraining' | 'positionGrid' | 'skills' | 'specialSkill';

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
    const sampleWidth = 360;
    const scale = sampleWidth / Math.max(1, width);
    canvas.width = sampleWidth;
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    let sum = 0;
    let sumSq = 0;
    let edgeSum = 0;
    let edgeCount = 0;
    const gray = new Float32Array(canvas.width * canvas.height);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      gray[p] = value;
      sum += value;
      sumSq += value * value;
    }
    for (let y = 1; y < canvas.height - 1; y += 1) {
      for (let x = 1; x < canvas.width - 1; x += 1) {
        const p = y * canvas.width + x;
        edgeSum += Math.abs(gray[p + 1] - gray[p - 1]) + Math.abs(gray[p + canvas.width] - gray[p - canvas.width]);
        edgeCount += 1;
      }
    }
    const total = Math.max(1, canvas.width * canvas.height);
    const brightness = sum / total;
    const contrast = Math.sqrt(Math.max(0, sumSq / total - brightness * brightness));
    const sharpness = edgeSum / Math.max(1, edgeCount);
    const issues: PrintQualityIssue[] = [];
    if (width < 900 || height < 1100) issues.push({ code: 'LOW_RESOLUTION', severity: 'review' as const, message: 'Resolução baixa: envie print direto da tela, sem compressão.' });
    if (sharpness < 10) issues.push({ code: 'LOW_SHARPNESS', severity: 'review' as const, message: 'Print pouco nítido: o OCR pode confundir posição, estilo e números.' });
    if (brightness < 45 || brightness > 215) issues.push({ code: 'BAD_BRIGHTNESS', severity: 'review' as const, message: 'Brilho fora do ideal: use print normal, sem filtro e sem tela escura demais.' });
    if (contrast < 25) issues.push({ code: 'LOW_CONTRAST', severity: 'review' as const, message: 'Contraste baixo: texto pequeno pode ser lido errado.' });
    return { width, height, sharpness: Number(sharpness.toFixed(1)), brightness: Number(brightness.toFixed(1)), contrast: Number(contrast.toFixed(1)), issues };
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

export async function enhanceImageLocally(file: File | Blob, mode: 'adaptive' | 'contrast' | 'sharp' = 'adaptive'): Promise<Blob | File> {
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
    const contrast = mode === 'contrast' ? 1.7 : mode === 'sharp' ? 1.45 : 1.35;
    const brightnessLift = Math.max(-22, Math.min(28, 132 - mean));
    for (let i = 0; i < data.length; i += 4) {
      for (let channel = 0; channel < 3; channel += 1) {
        const value = (data[i + channel] - 128) * contrast + 128 + brightnessLift;
        data[i + channel] = Math.max(0, Math.min(255, value));
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
