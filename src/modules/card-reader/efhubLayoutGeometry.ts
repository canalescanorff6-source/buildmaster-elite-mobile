import type { OcrZone, OcrZoneKey } from '@/lib/ocr';

export const EFHUB_CANONICAL_WIDTH = 1400;
export const EFHUB_CANONICAL_HEIGHT = 1600;
export const EFHUB_CANONICAL_RATIO = EFHUB_CANONICAL_WIDTH / EFHUB_CANONICAL_HEIGHT;
export const EFHUB_LAYOUT_GEOMETRY_VERSION = '31.81-visual-calibration-layout-1';

export type NormalizedBounds = { x: number; y: number; w: number; h: number };
export type EfhubLayoutMode =
  | 'canonical'
  | 'proportional'
  | 'letterbox-horizontal'
  | 'letterbox-vertical'
  | 'cropped-bottom'
  | 'cropped-top'
  | 'cropped-right'
  | 'cropped-left'
  | 'reflowed-unknown'
  | 'incompatible';

export type EfhubLayoutAudit = {
  version: string;
  mode: EfhubLayoutMode;
  width: number;
  height: number;
  contentBounds: NormalizedBounds;
  canonicalFrame: NormalizedBounds;
  sourceRatio: number;
  canonicalRatio: number;
  ratioError: number;
  confidence: number;
  complete: boolean;
  visibleFraction: number;
  croppedEdges: Array<'top' | 'bottom' | 'left' | 'right'>;
  missingZones: string[];
  reason: string;
};

export type EfhubLayoutPlan = {
  audit: EfhubLayoutAudit;
  framePixels: { x: number; y: number; w: number; h: number };
  visiblePixels: { x: number; y: number; w: number; h: number };
};

export type EfhubPixelBox = {
  key: OcrZoneKey;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function box(key: OcrZoneKey, label: string, x1: number, y1: number, x2: number, y2: number): EfhubPixelBox {
  return { key, label, x1, y1, x2, y2 };
}

/**
 * As oito áreas visuais seguem exatamente o mapa 1400 × 1600 enviado como
 * referência. Elas são usadas no overlay de conferência.
 */
export const EFHUB_CANONICAL_MACRO_BOXES: EfhubPixelBox[] = [
  box('name', '1. Nome + estilo', 10, 5, 440, 110),
  box('cardType', '2. Carta / foto', 75, 115, 335, 470),
  box('identityMeta', '3. Bio + condição', 340, 105, 760, 465),
  box('positionGrid', '4. Posições + overalls', 770, 105, 1388, 470),
  box('impetos', '5. Boosters / Ímpeto', 15, 472, 1385, 555),
  box('attributes', '6. 26 atributos', 15, 555, 1385, 1085),
  box('physicalModel', '7. Modelo físico', 15, 1085, 1385, 1425),
  box('skills', '8. Habilidades', 15, 1425, 1385, 1590)
];

/**
 * Subáreas internas usadas pelo OCR. O contorno geral continua idêntico ao
 * mapa visual, mas nome, estilo, biografia e condição são lidos separadamente.
 */
export const EFHUB_CANONICAL_OCR_BOXES: EfhubPixelBox[] = [
  box('name', 'Nome do jogador', 18, 8, 432, 61),
  box('playstyle', 'Estilo de jogo', 18, 54, 432, 108),
  box('overall', 'GER da carta', 76, 115, 176, 205),
  box('mainPosition', 'Posição principal da carta', 76, 150, 190, 235),
  box('cardType', 'Carta completa e arte do jogador', 75, 115, 335, 470),
  box('identityMeta', 'Altura, peso, idade e nível', 340, 105, 505, 465),
  box('condition', 'Pior pé, condição e lesão', 492, 105, 760, 365),
  box('manager', 'Técnico e bônus', 482, 350, 760, 465),
  box('positionGrid', 'Mapa completo de posições', 770, 105, 1388, 470),
  box('impetos', 'Booster e Ímpeto', 15, 472, 1385, 555),
  box('attributes', 'Tabela completa de 26 atributos', 15, 555, 1385, 1085),
  box('physicalModel', 'Modelo físico e alcance corporal', 15, 1085, 1385, 1425),
  // As cápsulas de habilidades mudam de largura e podem ocupar até três
  // linhas. O leitor canônico combina o bloco completo, três linhas e três
  // janelas horizontais sobrepostas. Isso reduz texto colado e recupera nomes
  // longos sem depender da posição exata de cada cápsula.
  box('skills', 'Habilidades • bloco completo', 18, 1427, 1382, 1595),
  box('skills', 'Habilidades • linha 1', 18, 1436, 1382, 1498),
  box('skills', 'Habilidades • linha 2', 18, 1484, 1382, 1550),
  box('skills', 'Habilidades • linha 3', 18, 1532, 1382, 1595),
  box('skills', 'Habilidades • janela esquerda', 18, 1427, 560, 1595),
  box('skills', 'Habilidades • janela central', 430, 1427, 1010, 1595),
  box('skills', 'Habilidades • janela direita', 880, 1427, 1382, 1595)
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markerState(text: string) {
  const normalized = normalizeText(text);
  const top = [
    'condicao fisica', 'resistencia a lesao', 'pior pe', 'peso', 'idade', 'nivel'
  ].filter((marker) => normalized.includes(marker)).length;
  const middle = [
    'talento ofensivo', 'talento defensivo', 'passe rasteiro', 'velocidade', 'aceleracao'
  ].filter((marker) => normalized.includes(marker)).length;
  const bottom = [
    'modelo de jogador', 'raio de cobertura', 'comprimento da perna', 'altura de salto', 'habilidades'
  ].filter((marker) => normalized.includes(marker)).length;
  return { top, middle, bottom };
}

function pixelBounds(bounds: NormalizedBounds, width: number, height: number) {
  return {
    x: bounds.x * width,
    y: bounds.y * height,
    w: bounds.w * width,
    h: bounds.h * height
  };
}

function normalizedBounds(input: { x: number; y: number; w: number; h: number }, width: number, height: number): NormalizedBounds {
  return {
    x: clamp(input.x / Math.max(1, width)),
    y: clamp(input.y / Math.max(1, height)),
    w: clamp(input.w / Math.max(1, width), 0, 1),
    h: clamp(input.h / Math.max(1, height), 0, 1)
  };
}

function intersection(
  left: { x: number; y: number; w: number; h: number },
  right: { x: number; y: number; w: number; h: number }
) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
}

function pixelBoxToCanonicalZone(item: EfhubPixelBox): OcrZone {
  return {
    key: item.key,
    label: item.label,
    x: item.x1 / EFHUB_CANONICAL_WIDTH,
    y: item.y1 / EFHUB_CANONICAL_HEIGHT,
    w: (item.x2 - item.x1) / EFHUB_CANONICAL_WIDTH,
    h: (item.y2 - item.y1) / EFHUB_CANONICAL_HEIGHT,
    enabled: true
  };
}

export function canonicalEfhubOcrZones() {
  return EFHUB_CANONICAL_OCR_BOXES.map(pixelBoxToCanonicalZone);
}

export function canonicalEfhubMacroZones() {
  return EFHUB_CANONICAL_MACRO_BOXES.map(pixelBoxToCanonicalZone);
}

function zoneVisibility(item: EfhubPixelBox, plan: EfhubLayoutPlan) {
  const frame = plan.framePixels;
  const scaleX = frame.w / EFHUB_CANONICAL_WIDTH;
  const scaleY = frame.h / EFHUB_CANONICAL_HEIGHT;
  const projected = {
    x: frame.x + item.x1 * scaleX,
    y: frame.y + item.y1 * scaleY,
    w: (item.x2 - item.x1) * scaleX,
    h: (item.y2 - item.y1) * scaleY
  };
  const clipped = intersection(projected, plan.visiblePixels);
  const projectedArea = Math.max(1, projected.w * projected.h);
  return { projected, clipped, visibility: (clipped.w * clipped.h) / projectedArea };
}

function missingZonesForPlan(plan: Omit<EfhubLayoutPlan, 'audit'>) {
  return EFHUB_CANONICAL_MACRO_BOXES
    .filter((item) => {
      const frame = plan.framePixels;
      const scaleX = frame.w / EFHUB_CANONICAL_WIDTH;
      const scaleY = frame.h / EFHUB_CANONICAL_HEIGHT;
      const projected = {
        x: frame.x + item.x1 * scaleX,
        y: frame.y + item.y1 * scaleY,
        w: (item.x2 - item.x1) * scaleX,
        h: (item.y2 - item.y1) * scaleY
      };
      const clipped = intersection(projected, plan.visiblePixels);
      return (clipped.w * clipped.h) / Math.max(1, projected.w * projected.h) < 0.96;
    })
    .map((item) => item.label.replace(/^\d+\.\s*/, ''));
}

export function buildEfhubLayoutPlan(
  width: number,
  height: number,
  contentBounds: NormalizedBounds = { x: 0, y: 0, w: 1, h: 1 },
  recognizedText = ''
): EfhubLayoutPlan {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const content = pixelBounds(contentBounds, safeWidth, safeHeight);
  const sourceRatio = content.w / Math.max(1, content.h);
  const ratioError = Math.abs(sourceRatio - EFHUB_CANONICAL_RATIO) / EFHUB_CANONICAL_RATIO;
  const markers = markerState(recognizedText);
  const textAvailable = normalizeText(recognizedText).length >= 12;
  const sideInsets = contentBounds.x + Math.max(0, 1 - contentBounds.x - contentBounds.w);
  const verticalInsets = contentBounds.y + Math.max(0, 1 - contentBounds.y - contentBounds.h);
  const tolerance = 0.018;
  const uniformScale = Math.min(
    content.w / EFHUB_CANONICAL_WIDTH,
    content.h / EFHUB_CANONICAL_HEIGHT
  );
  const fittedFrame = {
    x: content.x + (content.w - EFHUB_CANONICAL_WIDTH * uniformScale) / 2,
    y: content.y + (content.h - EFHUB_CANONICAL_HEIGHT * uniformScale) / 2,
    w: EFHUB_CANONICAL_WIDTH * uniformScale,
    h: EFHUB_CANONICAL_HEIGHT * uniformScale
  };

  let mode: EfhubLayoutMode = ratioError <= 0.006 ? 'canonical' : 'proportional';
  // Mesmo quando a diferença é de apenas um pixel, o painel é encaixado com
  // uma escala única. Isso impede que largura e altura sejam deformadas de
  // forma independente em resoluções como 3283 × 3751.
  let framePixels = { ...fittedFrame };
  let complete = ratioError <= tolerance;
  let confidence = complete ? Math.round(clamp(98 - ratioError * 350, 74, 99)) : 42;
  let croppedEdges: EfhubLayoutAudit['croppedEdges'] = [];
  let reason = complete
    ? 'A proporção do painel é compatível com o mapa oficial 1400 × 1600; os recortes usam escala uniforme.'
    : 'A proporção não corresponde ao painel completo e exige classificação por conteúdo.';

  if (!complete && sourceRatio > EFHUB_CANONICAL_RATIO) {
    const fullHeightAtWidth = content.w / EFHUB_CANONICAL_RATIO;
    const missingHeight = Math.max(0, fullHeightAtWidth - content.h);
    const hasTop = markers.top >= 2 || (markers.top >= 1 && markers.middle >= 2);
    const hasBottom = markers.bottom >= 2;
    if (textAvailable && hasTop && !hasBottom) {
      mode = 'cropped-bottom';
      framePixels = { x: content.x, y: content.y, w: content.w, h: fullHeightAtWidth };
      croppedEdges = ['bottom'];
      complete = false;
      confidence = 94;
      reason = `O cabeçalho e os atributos foram reconhecidos, mas a parte inferior está cortada em aproximadamente ${Math.round(missingHeight)} px.`;
    } else if (textAvailable && hasBottom && !hasTop) {
      mode = 'cropped-top';
      framePixels = { x: content.x, y: content.y - missingHeight, w: content.w, h: fullHeightAtWidth };
      croppedEdges = ['top'];
      complete = false;
      confidence = 90;
      reason = `A área inferior foi reconhecida, mas o cabeçalho está cortado em aproximadamente ${Math.round(missingHeight)} px.`;
    } else if (textAvailable && hasTop && hasBottom && sideInsets < 0.025) {
      mode = 'reflowed-unknown';
      complete = false;
      confidence = 88;
      reason = 'O print contém áreas superiores e inferiores, porém o layout foi reorganizado ou comprimido. O app não força caixas incorretas neste formato.';
    } else if (sideInsets >= 0.025 || (textAvailable && hasTop && hasBottom)) {
      const fittedWidth = content.h * EFHUB_CANONICAL_RATIO;
      mode = 'letterbox-horizontal';
      framePixels = { x: content.x + (content.w - fittedWidth) / 2, y: content.y, w: fittedWidth, h: content.h };
      complete = true;
      confidence = sideInsets >= 0.025 ? 88 : 72;
      reason = 'O painel completo foi centralizado dentro de uma imagem mais larga; as margens laterais foram compensadas.';
    } else {
      mode = 'cropped-bottom';
      framePixels = { x: content.x, y: content.y, w: content.w, h: fullHeightAtWidth };
      croppedEdges = ['bottom'];
      complete = false;
      confidence = 58;
      reason = 'A imagem é mais curta que o painel 1400 × 1600. Até o OCR confirmar as âncoras, ela é tratada com segurança como corte inferior.';
    }
  } else if (!complete && sourceRatio < EFHUB_CANONICAL_RATIO) {
    const fullWidthAtHeight = content.h * EFHUB_CANONICAL_RATIO;
    const missingWidth = Math.max(0, fullWidthAtHeight - content.w);
    const hasLeftContext = markers.top >= 2 || markers.middle >= 2;
    const hasRightContext = markers.bottom >= 1;
    if (verticalInsets >= 0.025 || (textAvailable && hasLeftContext && hasRightContext)) {
      const fittedHeight = content.w / EFHUB_CANONICAL_RATIO;
      mode = 'letterbox-vertical';
      framePixels = { x: content.x, y: content.y + (content.h - fittedHeight) / 2, w: content.w, h: fittedHeight };
      complete = true;
      confidence = verticalInsets >= 0.025 ? 88 : 72;
      reason = 'O painel completo foi centralizado dentro de uma imagem mais alta; as margens superior e inferior foram compensadas.';
    } else if (textAvailable && markers.top >= 2) {
      mode = 'cropped-right';
      framePixels = { x: content.x, y: content.y, w: fullWidthAtHeight, h: content.h };
      croppedEdges = ['right'];
      complete = false;
      confidence = 72;
      reason = `A imagem é mais estreita que o painel completo e parece perder aproximadamente ${Math.round(missingWidth)} px à direita.`;
    } else {
      mode = 'incompatible';
      complete = false;
      confidence = 35;
      reason = 'A geometria é estreita demais e não há âncoras suficientes para posicionar o painel sem risco.';
    }
  }

  const visiblePixels = { ...content };
  const frameIntersection = intersection(framePixels, visiblePixels);
  const visibleFraction = (frameIntersection.w * frameIntersection.h) / Math.max(1, framePixels.w * framePixels.h);
  const provisional = { framePixels, visiblePixels };
  const missingZones = mode === 'reflowed-unknown' || mode === 'incompatible'
    ? EFHUB_CANONICAL_MACRO_BOXES.map((item) => item.label.replace(/^\d+\.\s*/, ''))
    : missingZonesForPlan(provisional);
  if (missingZones.length) complete = false;

  const canonicalFrame = normalizedBounds(framePixels, safeWidth, safeHeight);
  const audit: EfhubLayoutAudit = {
    version: EFHUB_LAYOUT_GEOMETRY_VERSION,
    mode,
    width: safeWidth,
    height: safeHeight,
    contentBounds,
    canonicalFrame,
    sourceRatio: Number(sourceRatio.toFixed(6)),
    canonicalRatio: EFHUB_CANONICAL_RATIO,
    ratioError: Number((ratioError * 100).toFixed(3)),
    confidence,
    complete,
    visibleFraction: Number(clamp(visibleFraction).toFixed(4)),
    croppedEdges,
    missingZones,
    reason
  };
  return { audit, framePixels, visiblePixels };
}

export function mapEfhubBoxesToImage(
  boxes: EfhubPixelBox[],
  plan: EfhubLayoutPlan,
  options: { minimumVisibility?: number } = {}
): OcrZone[] {
  const minimumVisibility = options.minimumVisibility ?? 0.62;
  if (plan.audit.mode === 'reflowed-unknown' || plan.audit.mode === 'incompatible') return [];
  return boxes.map((item) => {
    const { clipped, visibility } = zoneVisibility(item, plan);
    const normalized = normalizedBounds(clipped, plan.audit.width, plan.audit.height);
    return {
      key: item.key,
      label: item.label,
      x: normalized.x,
      y: normalized.y,
      w: Math.max(0.001, normalized.w),
      h: Math.max(0.001, normalized.h),
      enabled: visibility >= minimumVisibility,
      visibility: Number(visibility.toFixed(4))
    } as OcrZone & { visibility: number };
  });
}

export function mapEfhubOcrZones(plan: EfhubLayoutPlan) {
  return mapEfhubBoxesToImage(EFHUB_CANONICAL_OCR_BOXES, plan, { minimumVisibility: 0.62 });
}

export function mapEfhubMacroZones(plan: EfhubLayoutPlan) {
  return mapEfhubBoxesToImage(EFHUB_CANONICAL_MACRO_BOXES, plan, { minimumVisibility: 0.96 })
    .filter((zone) => zone.w > 0.003 && zone.h > 0.003);
}

export function mapCanonicalZoneWithPlan(zone: OcrZone, plan: EfhubLayoutPlan) {
  const item: EfhubPixelBox = {
    key: zone.key,
    label: zone.label,
    x1: zone.x * EFHUB_CANONICAL_WIDTH,
    y1: zone.y * EFHUB_CANONICAL_HEIGHT,
    x2: (zone.x + zone.w) * EFHUB_CANONICAL_WIDTH,
    y2: (zone.y + zone.h) * EFHUB_CANONICAL_HEIGHT
  };
  return mapEfhubBoxesToImage([item], plan)[0] ?? { ...zone, enabled: false };
}
