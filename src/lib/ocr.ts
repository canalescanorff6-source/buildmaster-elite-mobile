import type { PrintQualityReport } from './validation';

export type OcrZoneKey = 'name' | 'overall' | 'mainPosition' | 'playstyle' | 'attributes' | 'autoTraining' | 'positionGrid' | 'skills';

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
  { key: 'name', label: 'Nome do jogador', x: 0.01, y: 0.00, w: 0.33, h: 0.07, enabled: true },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.01, y: 0.04, w: 0.32, h: 0.06, enabled: true },
  { key: 'overall', label: 'GER da carta', x: 0.06, y: 0.07, w: 0.13, h: 0.12, enabled: true },
  { key: 'mainPosition', label: 'Posição da carta', x: 0.06, y: 0.08, w: 0.19, h: 0.22, enabled: true },
  { key: 'positionGrid', label: 'Posições jogáveis', x: 0.67, y: 0.05, w: 0.31, h: 0.24, enabled: true },
  { key: 'attributes', label: 'Atributos principais', x: 0.01, y: 0.34, w: 0.98, h: 0.32, enabled: true },
  { key: 'autoTraining', label: 'Ficha automática', x: 0.01, y: 0.34, w: 0.98, h: 0.32, enabled: true },
  { key: 'skills', label: 'Habilidades', x: 0.01, y: 0.91, w: 0.86, h: 0.08, enabled: true }
];

export async function inspectPrintQuality(file: File | Blob): Promise<PrintQualityReport | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const canvas = document.createElement('canvas');
  const sampleWidth = 360;
  const scale = sampleWidth / Math.max(1, bitmap.width);
  canvas.width = sampleWidth;
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
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
      const gx = Math.abs(gray[p + 1] - gray[p - 1]);
      const gy = Math.abs(gray[p + canvas.width] - gray[p - canvas.width]);
      edgeSum += gx + gy;
      edgeCount += 1;
    }
  }

  const total = Math.max(1, canvas.width * canvas.height);
  const brightness = sum / total;
  const variance = Math.max(0, sumSq / total - brightness * brightness);
  const contrast = Math.sqrt(variance);
  const sharpness = edgeSum / Math.max(1, edgeCount);
  const issues = [];

  if (bitmap.width < 900 || bitmap.height < 1100) issues.push({ code: 'LOW_RESOLUTION', severity: 'review' as const, message: 'Resolução baixa: envie print direto da tela, sem compressão.' });
  if (sharpness < 10) issues.push({ code: 'LOW_SHARPNESS', severity: 'review' as const, message: 'Print pouco nítido: o OCR pode confundir posição, estilo e números.' });
  if (brightness < 45 || brightness > 215) issues.push({ code: 'BAD_BRIGHTNESS', severity: 'review' as const, message: 'Brilho fora do ideal: use print normal, sem filtro e sem tela escura demais.' });
  if (contrast < 25) issues.push({ code: 'LOW_CONTRAST', severity: 'review' as const, message: 'Contraste baixo: texto pequeno pode ser lido errado.' });

  return {
    width: bitmap.width,
    height: bitmap.height,
    sharpness: Number(sharpness.toFixed(1)),
    brightness: Number(brightness.toFixed(1)),
    contrast: Number(contrast.toFixed(1)),
    issues
  };
}
