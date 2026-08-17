import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import { detectEfhubSkillCapsuleZones } from '@/modules/card-reader/skillCapsuleDetector';
import {
  EFHUB_CANONICAL_HEIGHT,
  EFHUB_CANONICAL_MACRO_BOXES,
  EFHUB_CANONICAL_OCR_BOXES,
  EFHUB_CANONICAL_WIDTH
} from '@/modules/card-reader/efhubLayoutGeometry';

export const EFHUB_MANUAL_CALIBRATION_VERSION = 'v40.00-manual-map-rebuild-r1';

export type EfhubCalibrationZoneId =
  | 'identity'
  | 'card'
  | 'bio'
  | 'positions'
  | 'boosters'
  | 'attributes'
  | 'physical'
  | 'skills'
  | 'progression';

export type EfhubCalibrationZone = {
  id: EfhubCalibrationZoneId;
  key: OcrZoneKey;
  label: string;
  shortLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
  locked: boolean;
  color: string;
};

export type EfhubCalibrationMap = {
  version: string;
  updatedAt: string;
  zones: EfhubCalibrationZone[];
};

const MACRO_META: Array<{
  id: EfhubCalibrationZoneId;
  key: OcrZoneKey;
  shortLabel: string;
  color: string;
}> = [
  { id: 'identity', key: 'name', shortLabel: 'Nome + estilo', color: '#ffd24c' },
  { id: 'card', key: 'cardType', shortLabel: 'Carta / foto', color: '#23d8ff' },
  { id: 'bio', key: 'identityMeta', shortLabel: 'Bio + condição', color: '#69ef91' },
  { id: 'positions', key: 'positionGrid', shortLabel: 'Posições + overalls', color: '#c777ff' },
  { id: 'boosters', key: 'impetos', shortLabel: 'Boosters / ímpeto', color: '#ff9d45' },
  { id: 'attributes', key: 'attributes', shortLabel: '26 atributos', color: '#ff536b' },
  { id: 'physical', key: 'physicalModel', shortLabel: 'Modelo físico', color: '#4b9bff' },
  { id: 'skills', key: 'skills', shortLabel: 'Habilidades', color: '#52f4d2' },
  { id: 'progression', key: 'progression', shortLabel: 'Pontos distribuídos', color: '#ffcf4a' }
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function macroBoxById(id: EfhubCalibrationZoneId) {
  const index = MACRO_META.findIndex((item) => item.id === id);
  return EFHUB_CANONICAL_MACRO_BOXES[index];
}

export function createDefaultEfhubCalibrationZones(): EfhubCalibrationZone[] {
  return MACRO_META.map((meta, index) => {
    const item = EFHUB_CANONICAL_MACRO_BOXES[index];
    return {
      ...meta,
      label: item.label,
      x: item.x1 / EFHUB_CANONICAL_WIDTH,
      y: item.y1 / EFHUB_CANONICAL_HEIGHT,
      w: (item.x2 - item.x1) / EFHUB_CANONICAL_WIDTH,
      h: (item.y2 - item.y1) / EFHUB_CANONICAL_HEIGHT,
      enabled: true,
      locked: false
    };
  });
}

export function normalizeEfhubCalibrationZones(input: unknown): EfhubCalibrationZone[] {
  const defaults = createDefaultEfhubCalibrationZones();
  if (!Array.isArray(input)) return defaults;
  const incoming = input as Array<Partial<EfhubCalibrationZone>>;
  return defaults.map((fallback) => {
    const item = incoming.find((candidate) => candidate.id === fallback.id);
    if (!item) return fallback;
    const x = clamp(Number(item.x ?? fallback.x), 0, 0.985);
    const y = clamp(Number(item.y ?? fallback.y), 0, 0.985);
    const w = clamp(Number(item.w ?? fallback.w), 0.015, 1 - x);
    const h = clamp(Number(item.h ?? fallback.h), 0.015, 1 - y);
    return {
      ...fallback,
      x,
      y,
      w,
      h,
      enabled: item.enabled !== false,
      locked: Boolean(item.locked)
    };
  });
}

export function createEfhubCalibrationMap(zones: EfhubCalibrationZone[]): EfhubCalibrationMap {
  return {
    version: EFHUB_MANUAL_CALIBRATION_VERSION,
    updatedAt: new Date().toISOString(),
    zones: normalizeEfhubCalibrationZones(zones)
  };
}

export function readEfhubCalibrationMap(raw: string | null | undefined): EfhubCalibrationMap | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EfhubCalibrationMap>;
    if (!parsed || !Array.isArray(parsed.zones)) return null;
    return {
      version: String(parsed.version || EFHUB_MANUAL_CALIBRATION_VERSION),
      updatedAt: String(parsed.updatedAt || ''),
      zones: normalizeEfhubCalibrationZones(parsed.zones)
    };
  } catch {
    return null;
  }
}

const OCR_TO_MACRO: Record<string, EfhubCalibrationZoneId> = {
  name: 'identity',
  playstyle: 'identity',
  overall: 'card',
  mainPosition: 'card',
  cardType: 'card',
  identityMeta: 'bio',
  condition: 'bio',
  manager: 'bio',
  positionGrid: 'positions',
  impetos: 'boosters',
  progression: 'progression',
  autoTraining: 'progression',
  attributes: 'attributes',
  physicalModel: 'physical',
  skills: 'skills'
};

function transformCanonicalBox(
  zone: EfhubCalibrationZone,
  canonicalMacro: ReturnType<typeof macroBoxById>,
  item: (typeof EFHUB_CANONICAL_OCR_BOXES)[number]
): OcrZone {
  const macroWidth = Math.max(1, canonicalMacro.x2 - canonicalMacro.x1);
  const macroHeight = Math.max(1, canonicalMacro.y2 - canonicalMacro.y1);
  const relativeX = (item.x1 - canonicalMacro.x1) / macroWidth;
  const relativeY = (item.y1 - canonicalMacro.y1) / macroHeight;
  const relativeW = (item.x2 - item.x1) / macroWidth;
  const relativeH = (item.y2 - item.y1) / macroHeight;
  const x = clamp(zone.x + zone.w * relativeX, 0, 0.999);
  const y = clamp(zone.y + zone.h * relativeY, 0, 0.999);
  const w = clamp(zone.w * relativeW, 0.004, 1 - x);
  const h = clamp(zone.h * relativeH, 0.004, 1 - y);
  return { key: item.key, label: item.label, x, y, w, h, enabled: zone.enabled };
}

export function buildOcrZonesFromEfhubCalibration(zones: EfhubCalibrationZone[]): OcrZone[] {
  const safeZones = normalizeEfhubCalibrationZones(zones);
  const byId = new Map(safeZones.map((zone) => [zone.id, zone]));
  return EFHUB_CANONICAL_OCR_BOXES.map((item) => {
    const macroId = OCR_TO_MACRO[item.key];
    const zone = byId.get(macroId);
    if (!zone) {
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
    return transformCanonicalBox(zone, macroBoxById(macroId), item);
  });
}

function canonicalZone(key: OcrZoneKey, label: string, x1: number, y1: number, x2: number, y2: number): OcrZone {
  return {
    key,
    label,
    x: x1 / EFHUB_CANONICAL_WIDTH,
    y: y1 / EFHUB_CANONICAL_HEIGHT,
    w: (x2 - x1) / EFHUB_CANONICAL_WIDTH,
    h: (y2 - y1) / EFHUB_CANONICAL_HEIGHT,
    enabled: true
  };
}

function transformCanonicalZone(zone: EfhubCalibrationZone, canonicalMacro: ReturnType<typeof macroBoxById>, item: OcrZone): OcrZone {
  return transformCanonicalBox(zone, canonicalMacro, {
    key: item.key,
    label: item.label,
    x1: item.x * EFHUB_CANONICAL_WIDTH,
    y1: item.y * EFHUB_CANONICAL_HEIGHT,
    x2: (item.x + item.w) * EFHUB_CANONICAL_WIDTH,
    y2: (item.y + item.h) * EFHUB_CANONICAL_HEIGHT
  });
}

async function canonicalSkillLayer(file: File | Blob, skills: EfhubCalibrationZone): Promise<Blob | null> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return null;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bitmap) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = EFHUB_CANONICAL_WIDTH;
    canvas.height = EFHUB_CANONICAL_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#05080d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const sourceX = Math.round(skills.x * bitmap.width);
    const sourceY = Math.round(skills.y * bitmap.height);
    const sourceW = Math.max(1, Math.round(skills.w * bitmap.width));
    const sourceH = Math.max(1, Math.round(skills.h * bitmap.height));
    const macro = macroBoxById('skills');
    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      macro.x1,
      macro.y1,
      macro.x2 - macro.x1,
      macro.y2 - macro.y1
    );
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  } finally {
    bitmap.close?.();
  }
}

/**
 * Gera os recortes internos a partir dos nove quadrados movidos pelo usuário.
 * Atributos e modelo físico continuam separados por coluna, e habilidades
 * preservam linhas completas mais cápsulas/janelas de contingência.
 */
export async function buildPreciseOcrZonesFromEfhubCalibration(
  file: File | Blob,
  zones: EfhubCalibrationZone[],
  options: { detectSkillCapsules?: boolean } = {}
): Promise<OcrZone[]> {
  const safe = normalizeEfhubCalibrationZones(zones);
  const byId = new Map(safe.map((zone) => [zone.id, zone]));
  const base = EFHUB_CANONICAL_OCR_BOXES
    .filter((item) => !['attributes', 'physicalModel', 'skills'].includes(item.key))
    .map((item) => {
      const macroId = OCR_TO_MACRO[item.key];
      const macroZone = byId.get(macroId)!;
      return transformCanonicalBox(macroZone, macroBoxById(macroId), item);
    });

  const attributeCanonical = [
    canonicalZone('attributes', 'Atributos • coluna esquerda', 15, 555, 470, 1085),
    canonicalZone('attributes', 'Atributos • coluna central', 455, 555, 930, 1085),
    canonicalZone('attributes', 'Atributos • coluna direita', 915, 555, 1385, 1085)
  ];
  const physicalCanonical = [
    canonicalZone('physicalModel', 'Modelo físico • coluna esquerda', 15, 1085, 470, 1425),
    canonicalZone('physicalModel', 'Modelo físico • coluna central', 455, 1085, 930, 1425),
    canonicalZone('physicalModel', 'Modelo físico • indicadores', 915, 1085, 1385, 1425)
  ];
  const skillRows = [
    canonicalZone('skills', 'Habilidades • linha completa 1', 15, 1428, 1270, 1498),
    canonicalZone('skills', 'Habilidades • linha completa 2', 15, 1482, 1270, 1554),
    canonicalZone('skills', 'Habilidades • linha completa 3', 15, 1534, 1270, 1595)
  ];

  const attributeZone = byId.get('attributes')!;
  const physicalZone = byId.get('physical')!;
  const skillZone = byId.get('skills')!;
  const attributes = attributeCanonical.map((item) => transformCanonicalZone(attributeZone, macroBoxById('attributes'), item));
  const physical = physicalCanonical.map((item) => transformCanonicalZone(physicalZone, macroBoxById('physical'), item));
  const rows = skillRows.map((item) => transformCanonicalZone(skillZone, macroBoxById('skills'), item));

  const capsules = options.detectSkillCapsules === false
    ? []
    : await (async () => {
        const canonicalLayer = await canonicalSkillLayer(file, skillZone).catch(() => null);
        const detected = await detectEfhubSkillCapsuleZones(canonicalLayer ?? file).catch(() => ({ zones: [], detectedCount: 0, usedFallback: true, diagnostics: [] }));
        return detected.zones.map((item) => transformCanonicalZone(skillZone, macroBoxById('skills'), item));
      })();

  return [...base, ...attributes, ...physical, ...rows, ...capsules];
}

export function efhubCalibrationCardArtZone(zones: EfhubCalibrationZone[]): OcrZone {
  const card = normalizeEfhubCalibrationZones(zones).find((zone) => zone.id === 'card')!;
  return {
    key: 'cardType',
    label: 'Carta completa e arte do jogador',
    x: card.x,
    y: card.y,
    w: card.w,
    h: card.h,
    enabled: card.enabled
  };
}

export function isEfhubCalibrationComplete(zones: EfhubCalibrationZone[]) {
  const safe = normalizeEfhubCalibrationZones(zones);
  return safe.length === 8 && safe.every((zone) => zone.enabled && zone.w >= 0.015 && zone.h >= 0.015);
}
