import type { OcrZone } from '@/lib/ocr';

export type CardCropBox = { x: number; y: number; w: number; h: number };
export type CardCropMethod = 'smart-detection' | 'template-fallback' | 'manual-adjustment';

export type CardCropResult = {
  preview: string;
  portraitPreview?: string | null;
  portraitBox?: CardCropBox;
  box: CardCropBox;
  confidence: number;
  method: CardCropMethod;
  aspectRatio: number;
};

const CARD_ASPECT = 0.70;
const MIN_SIZE = 0.04;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampCardCropBox(box: CardCropBox): CardCropBox {
  const w = clamp(box.w, MIN_SIZE, 1);
  const h = clamp(box.h, MIN_SIZE, 1);
  return {
    x: clamp(box.x, 0, Math.max(0, 1 - w)),
    y: clamp(box.y, 0, Math.max(0, 1 - h)),
    w,
    h
  };
}

export function cardCropAspect(box: CardCropBox, imageWidth: number, imageHeight: number) {
  return (box.w * imageWidth) / Math.max(1, box.h * imageHeight);
}

export function fitPortraitCardInsideZone(zone: CardCropBox, imageWidth: number, imageHeight: number): CardCropBox {
  const safe = clampCardCropBox(zone);
  const zoneWidthPx = safe.w * imageWidth;
  const zoneHeightPx = safe.h * imageHeight;
  let widthPx = zoneWidthPx;
  let heightPx = widthPx / CARD_ASPECT;
  if (heightPx > zoneHeightPx) {
    heightPx = zoneHeightPx;
    widthPx = heightPx * CARD_ASPECT;
  }
  const w = widthPx / imageWidth;
  const h = heightPx / imageHeight;
  return clampCardCropBox({
    x: safe.x,
    y: safe.y,
    w,
    h
  });
}

export function adjustCardCropBox(
  box: CardCropBox,
  action: 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out'
): CardCropBox {
  const stepX = Math.max(0.006, box.w * 0.055);
  const stepY = Math.max(0.006, box.h * 0.045);
  if (action === 'left') return clampCardCropBox({ ...box, x: box.x - stepX });
  if (action === 'right') return clampCardCropBox({ ...box, x: box.x + stepX });
  if (action === 'up') return clampCardCropBox({ ...box, y: box.y - stepY });
  if (action === 'down') return clampCardCropBox({ ...box, y: box.y + stepY });
  const scale = action === 'zoom-in' ? 0.91 : 1.10;
  const nextW = box.w * scale;
  const nextH = box.h * scale;
  return clampCardCropBox({
    x: box.x + (box.w - nextW) / 2,
    y: box.y + (box.h - nextH) / 2,
    w: nextW,
    h: nextH
  });
}

type IntegralGrid = {
  width: number;
  height: number;
  values: Float64Array;
};

function buildIntegral(values: Float32Array, width: number, height: number): IntegralGrid {
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += values[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }
  return { width: width + 1, height: height + 1, values: integral };
}

function rectMean(grid: IntegralGrid, x: number, y: number, w: number, h: number) {
  const maxX = grid.width - 1;
  const maxY = grid.height - 1;
  const left = clamp(Math.floor(x), 0, Math.max(0, maxX - 1));
  const top = clamp(Math.floor(y), 0, Math.max(0, maxY - 1));
  const right = clamp(Math.ceil(x + w), left + 1, maxX);
  const bottom = clamp(Math.ceil(y + h), top + 1, maxY);
  const stride = grid.width;
  const sum = grid.values[bottom * stride + right]
    - grid.values[top * stride + right]
    - grid.values[bottom * stride + left]
    + grid.values[top * stride + left];
  return sum / Math.max(1, (right - left) * (bottom - top));
}

function intersectionOverUnion(a: CardCropBox, b: CardCropBox) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  const area = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.w * a.h + b.w * b.h - area;
  return union > 0 ? area / union : 0;
}

function candidateScore(
  box: CardCropBox,
  sampleWidth: number,
  sampleHeight: number,
  saturation: IntegralGrid,
  edge: IntegralGrid,
  brightness: IntegralGrid,
  seed: CardCropBox
) {
  const x = box.x * sampleWidth;
  const y = box.y * sampleHeight;
  const w = box.w * sampleWidth;
  const h = box.h * sampleHeight;
  const band = Math.max(1, Math.round(Math.min(w, h) * 0.025));
  const insideSat = rectMean(saturation, x + band, y + band, Math.max(1, w - band * 2), Math.max(1, h - band * 2));
  const insideEdge = rectMean(edge, x + band, y + band, Math.max(1, w - band * 2), Math.max(1, h - band * 2));
  const borderEdge = (
    rectMean(edge, x, y, w, band * 2)
    + rectMean(edge, x, y + h - band * 2, w, band * 2)
    + rectMean(edge, x, y, band * 2, h)
    + rectMean(edge, x + w - band * 2, y, band * 2, h)
  ) / 4;
  const innerBrightness = rectMean(brightness, x + band, y + band, Math.max(1, w - band * 2), Math.max(1, h - band * 2));
  const outerBrightness = (
    rectMean(brightness, x - band * 2, y, band * 2, h)
    + rectMean(brightness, x + w, y, band * 2, h)
    + rectMean(brightness, x, y - band * 2, w, band * 2)
    + rectMean(brightness, x, y + h, w, band * 2)
  ) / 4;
  const aspect = cardCropAspect(box, sampleWidth, sampleHeight);
  const aspectScore = Math.max(0, 1 - Math.abs(aspect - CARD_ASPECT) / 0.22);
  const seedScore = Math.max(intersectionOverUnion(box, seed), intersectionOverUnion(box, fitPortraitCardInsideZone(seed, sampleWidth, sampleHeight)));
  const leftPrior = Math.max(0, 1 - box.x / 0.72);
  const topPrior = Math.max(0, 1 - box.y / 0.72);
  const contrastScore = Math.min(1, Math.abs(innerBrightness - outerBrightness) / 58);
  const sizePx = w * h;
  const imagePx = sampleWidth * sampleHeight;
  const areaRatio = sizePx / Math.max(1, imagePx);
  const sizeScore = areaRatio < 0.018 || areaRatio > 0.46 ? 0 : Math.min(1, areaRatio / 0.08);

  return insideSat * 0.30
    + insideEdge * 0.19
    + borderEdge * 0.29
    + contrastScore * 42
    + aspectScore * 38
    + seedScore * 30
    + leftPrior * 9
    + topPrior * 7
    + sizeScore * 11;
}

function generateCandidates(imageWidth: number, imageHeight: number, seed: CardCropBox) {
  const candidates: CardCropBox[] = [];
  const aspects = [0.62, 0.66, 0.70, 0.74, 0.78];
  const widthFractions = [0.13, 0.16, 0.19, 0.22, 0.26, 0.30, 0.35];
  const ratio = imageWidth / Math.max(1, imageHeight);
  const push = (box: CardCropBox) => {
    const safe = clampCardCropBox(box);
    if (safe.w * imageWidth < 72 || safe.h * imageHeight < 105) return;
    candidates.push(safe);
  };

  push(seed);
  push(fitPortraitCardInsideZone(seed, imageWidth, imageHeight));
  for (const scale of [0.84, 0.94, 1.06, 1.16]) {
    const w = seed.w * scale;
    const h = seed.h * scale;
    push({ x: seed.x + (seed.w - w) / 2, y: seed.y + (seed.h - h) / 2, w, h });
  }

  for (const widthFraction of widthFractions) {
    for (const aspect of aspects) {
      const heightFraction = (widthFraction * ratio) / aspect;
      if (heightFraction < 0.12 || heightFraction > 0.82) continue;
      const xMax = Math.min(0.62, 1 - widthFraction);
      const yMax = Math.min(0.64, 1 - heightFraction);
      const xStep = Math.max(0.018, widthFraction * 0.16);
      const yStep = Math.max(0.016, heightFraction * 0.12);
      for (let x = 0; x <= xMax + 0.0001; x += xStep) {
        for (let y = 0; y <= yMax + 0.0001; y += yStep) push({ x, y, w: widthFraction, h: heightFraction });
      }
    }
  }
  return candidates;
}


function generateLocalRefinementCandidates(base: CardCropBox, imageWidth: number, imageHeight: number) {
  const candidates: CardCropBox[] = [base];
  const pxX = 1 / Math.max(1, imageWidth);
  const pxY = 1 / Math.max(1, imageHeight);
  const stepsX = [pxX * 2, pxX * 5, base.w * 0.006, base.w * 0.012];
  const stepsY = [pxY * 2, pxY * 5, base.h * 0.005, base.h * 0.010];
  for (const dx of stepsX) {
    candidates.push(clampCardCropBox({ ...base, x: base.x - dx }));
    candidates.push(clampCardCropBox({ ...base, x: base.x + dx }));
    candidates.push(clampCardCropBox({ ...base, x: base.x - dx, w: base.w + dx }));
    candidates.push(clampCardCropBox({ ...base, w: base.w + dx }));
    candidates.push(clampCardCropBox({ ...base, x: base.x + dx, w: Math.max(MIN_SIZE, base.w - dx) }));
    candidates.push(clampCardCropBox({ ...base, w: Math.max(MIN_SIZE, base.w - dx) }));
  }
  for (const dy of stepsY) {
    candidates.push(clampCardCropBox({ ...base, y: base.y - dy }));
    candidates.push(clampCardCropBox({ ...base, y: base.y + dy }));
    candidates.push(clampCardCropBox({ ...base, y: base.y - dy, h: base.h + dy }));
    candidates.push(clampCardCropBox({ ...base, h: base.h + dy }));
    candidates.push(clampCardCropBox({ ...base, y: base.y + dy, h: Math.max(MIN_SIZE, base.h - dy) }));
    candidates.push(clampCardCropBox({ ...base, h: Math.max(MIN_SIZE, base.h - dy) }));
  }
  for (const scale of [0.974, 0.986, 0.994, 1.006, 1.014, 1.026]) {
    const w = base.w * scale;
    const h = base.h * scale;
    candidates.push(clampCardCropBox({ x: base.x + (base.w - w) / 2, y: base.y + (base.h - h) / 2, w, h }));
  }
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [candidate.x, candidate.y, candidate.w, candidate.h].map((value) => value.toFixed(5)).join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function expandCardBox(box: CardCropBox, imageWidth: number, imageHeight: number) {
  const marginX = Math.max(2 / imageWidth, box.w * 0.012);
  const marginY = Math.max(2 / imageHeight, box.h * 0.009);
  return clampCardCropBox({
    x: box.x - marginX,
    y: box.y - marginY,
    w: box.w + marginX * 2,
    h: box.h + marginY * 2
  });
}

export function derivePlayerPortraitBox(cardBox: CardCropBox, imageWidth: number, imageHeight: number): CardCropBox {
  const card = clampCardCropBox(cardBox);
  let width = card.w * 0.78;
  let height = (width * imageWidth) / Math.max(1, imageHeight);
  const maxHeight = card.h * 0.58;
  if (height > maxHeight) {
    height = maxHeight;
    width = (height * imageHeight) / Math.max(1, imageWidth);
  }
  return clampCardCropBox({
    x: card.x + (card.w - width) / 2,
    y: card.y + card.h * 0.105,
    w: width,
    h: height
  });
}

type RenderCropOptions = { expandBorder: boolean; squareOutput: boolean };

async function renderCropPreview(file: File | Blob, box: CardCropBox, options: RenderCropOptions): Promise<string | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const canvas = document.createElement('canvas');
  try {
    const normalizedBox = clampCardCropBox(box);
    const safe = options.expandBorder ? expandCardBox(normalizedBox, bitmap.width, bitmap.height) : normalizedBox;
    const cropX = Math.round(safe.x * bitmap.width);
    const cropY = Math.round(safe.y * bitmap.height);
    const cropW = Math.max(1, Math.min(bitmap.width - cropX, Math.round(safe.w * bitmap.width)));
    const cropH = Math.max(1, Math.min(bitmap.height - cropY, Math.round(safe.h * bitmap.height)));
    const targetWidth = Math.max(240, Math.min(560, cropW * 2));
    canvas.width = targetWidth;
    canvas.height = options.squareOutput ? targetWidth : Math.max(1, Math.round(cropH * (targetWidth / cropW)));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function renderPlayerPortraitPreview(file: File | Blob, cardBox: CardCropBox): Promise<{ preview: string; box: CardCropBox } | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const portraitBox = derivePlayerPortraitBox(cardBox, bitmap.width, bitmap.height);
  bitmap.close?.();
  const preview = await renderCropPreview(file, portraitBox, { expandBorder: false, squareOutput: true }).catch(() => null);
  return preview ? { preview, box: portraitBox } : null;
}

export async function renderCardCropPreview(file: File | Blob, box: CardCropBox): Promise<string | null> {
  return renderCropPreview(file, box, { expandBorder: true, squareOutput: false });
}

export async function createSmartCardPreview(file: File | Blob, preferredZone?: OcrZone | CardCropBox): Promise<CardCropResult | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const imageWidth = bitmap.width;
  const imageHeight = bitmap.height;
  const seed = clampCardCropBox(preferredZone
    ? { x: preferredZone.x, y: preferredZone.y, w: preferredZone.w, h: preferredZone.h }
    : imageWidth > imageHeight
      ? { x: 0.015, y: 0.08, w: 0.32, h: 0.72 }
      : { x: 0.02, y: 0.06, w: 0.42, h: 0.34 });
  const sampleWidth = Math.min(360, Math.max(180, imageWidth));
  const sampleHeight = Math.max(120, Math.round(imageHeight * (sampleWidth / Math.max(1, imageWidth))));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
    const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const brightnessValues = new Float32Array(sampleWidth * sampleHeight);
    const saturationValues = new Float32Array(sampleWidth * sampleHeight);
    const edgeValues = new Float32Array(sampleWidth * sampleHeight);
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const index = (y * sampleWidth + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        brightnessValues[y * sampleWidth + x] = r * 0.299 + g * 0.587 + b * 0.114;
        saturationValues[y * sampleWidth + x] = max - min;
      }
    }
    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const p = y * sampleWidth + x;
        const gx = Math.abs(brightnessValues[p + 1] - brightnessValues[p - 1]);
        const gy = Math.abs(brightnessValues[p + sampleWidth] - brightnessValues[p - sampleWidth]);
        edgeValues[p] = gx + gy;
      }
    }
    const saturation = buildIntegral(saturationValues, sampleWidth, sampleHeight);
    const edge = buildIntegral(edgeValues, sampleWidth, sampleHeight);
    const brightness = buildIntegral(brightnessValues, sampleWidth, sampleHeight);
    const candidates = generateCandidates(imageWidth, imageHeight, seed);
    let best = fitPortraitCardInsideZone(seed, imageWidth, imageHeight);
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      const score = candidateScore(candidate, sampleWidth, sampleHeight, saturation, edge, brightness, seed);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    // Segunda etapa: ajuste fino de bordas em passos equivalentes a poucos pixels.
    // Isso evita que o recorte preserve pedaços do menu ao redor ou corte a moldura da carta.
    for (const candidate of generateLocalRefinementCandidates(best, imageWidth, imageHeight)) {
      const score = candidateScore(candidate, sampleWidth, sampleHeight, saturation, edge, brightness, seed);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    best = fitPortraitCardInsideZone(best, imageWidth, imageHeight);
    const preview = await renderCardCropPreview(file, best);
    if (!preview) return null;
    const portrait = await renderPlayerPortraitPreview(file, best).catch(() => null);
    const seedOverlap = intersectionOverUnion(best, fitPortraitCardInsideZone(seed, imageWidth, imageHeight));
    const confidence = clamp(Math.round(52 + Math.min(30, Math.max(0, bestScore - 105) * 0.18) + seedOverlap * 18), 55, 97);
    return {
      preview,
      portraitPreview: portrait?.preview ?? null,
      portraitBox: portrait?.box,
      box: best,
      confidence,
      method: bestScore > 121 ? 'smart-detection' : 'template-fallback',
      aspectRatio: Number(cardCropAspect(best, imageWidth, imageHeight).toFixed(3))
    };
  } finally {
    bitmap.close?.();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export function deriveEfhubPlayerPortraitBox(cardBox: CardCropBox, imageWidth: number, imageHeight: number): CardCropBox {
  const card = clampCardCropBox(cardBox);
  let width = card.w * 0.84;
  let height = (width * imageWidth) / Math.max(1, imageHeight);
  const maxHeight = card.h * 0.60;
  if (height > maxHeight) {
    height = maxHeight;
    width = (height * imageHeight) / Math.max(1, imageWidth);
  }
  return clampCardCropBox({
    x: card.x + (card.w - width) / 2,
    y: card.y + card.h * 0.075,
    w: width,
    h: height
  });
}

export async function renderEfhubPlayerPortraitPreview(file: File | Blob, cardBox: CardCropBox): Promise<{ preview: string; box: CardCropBox } | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const portraitBox = deriveEfhubPlayerPortraitBox(cardBox, bitmap.width, bitmap.height);
  bitmap.close?.();
  const preview = await renderCropPreview(file, portraitBox, { expandBorder: false, squareOutput: true }).catch(() => null);
  return preview ? { preview, box: portraitBox } : null;
}

export async function createManualEfhubCardPreview(file: File | Blob, preferredZone: OcrZone | CardCropBox): Promise<CardCropResult | null> {
  const box = clampCardCropBox({ x: preferredZone.x, y: preferredZone.y, w: preferredZone.w, h: preferredZone.h });
  const preview = await renderCardCropPreview(file, box);
  if (!preview) return null;
  const portrait = await renderEfhubPlayerPortraitPreview(file, box).catch(() => null);
  let aspectRatio = CARD_ASPECT;
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (bitmap) {
      aspectRatio = cardCropAspect(box, bitmap.width, bitmap.height);
      bitmap.close?.();
    }
  }
  return {
    preview,
    portraitPreview: portrait?.preview ?? null,
    portraitBox: portrait?.box,
    box,
    confidence: 99,
    method: 'manual-adjustment',
    aspectRatio: Number(aspectRatio.toFixed(3))
  };
}

export async function createEfhubCardPreview(file: File | Blob, preferredZone?: OcrZone | CardCropBox): Promise<CardCropResult | null> {
  const result = await createSmartCardPreview(file, preferredZone);
  if (!result) return null;
  const portrait = await renderEfhubPlayerPortraitPreview(file, result.box).catch(() => null);
  return {
    ...result,
    portraitPreview: portrait?.preview ?? result.portraitPreview ?? null,
    portraitBox: portrait?.box ?? result.portraitBox
  };
}
