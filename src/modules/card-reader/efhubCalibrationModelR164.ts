/**
 * R164 — modelo leve da calibração EFHub.
 *
 * Snapshot proporcional derivado da geometria canônica 1400×1600. O teste
 * R164 compara estes defaults com `EFHUB_CANONICAL_MACRO_BOXES` para impedir
 * drift. Nenhum detector de imagem é carregado por este módulo.
 */
import type { OcrZoneKey } from '@/lib/ocrZonesModelR164';

export const EFHUB_CALIBRATION_MODEL_R164_VERSION = 'v40.00-manual-map-rebuild-r1' as const;

export type EfhubCalibrationZoneId =
  | 'identity'
  | 'card'
  | 'bio'
  | 'positions'
  | 'boosters'
  | 'attributes'
  | 'physical'
  | 'skills'
  | 'progression'
  | 'specialSkill';

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

const W = 1400;
const H = 1600;
const DEFAULT_META = [
  ['identity', 'name', '1. Nome + estilo', 'Nome + estilo', '#ffd24c', 10, 5, 440, 110],
  ['card', 'cardType', '2. Carta / foto', 'Carta / foto', '#23d8ff', 75, 115, 335, 470],
  ['bio', 'identityMeta', '3. Bio + condição', 'Bio + condição', '#69ef91', 340, 105, 760, 465],
  ['positions', 'positionGrid', '4. Posições + overalls', 'Posições + overalls', '#c777ff', 770, 105, 1388, 470],
  ['boosters', 'impetos', '5. Boosters / Ímpeto', 'Boosters / ímpeto', '#ff9d45', 15, 472, 1385, 555],
  ['attributes', 'attributes', '6. 26 atributos', '26 atributos', '#ff536b', 15, 555, 1385, 1085],
  ['physical', 'physicalModel', '7. Modelo físico', 'Modelo físico', '#4b9bff', 15, 1085, 1385, 1425],
  ['skills', 'skills', '8. Habilidades', 'Habilidades', '#52f4d2', 15, 1425, 1385, 1590],
  ['progression', 'progression', '9. Pontos distribuídos', 'Pontos distribuídos', '#ffcf4a', 650, 472, 1385, 555],
  ['specialSkill', 'specialSkill', '10. Habilidade especial', 'Habilidade especial', '#ff65c5', 15, 1425, 1385, 1590]
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function createDefaultEfhubCalibrationZones(): EfhubCalibrationZone[] {
  return DEFAULT_META.map(([id, key, label, shortLabel, color, x1, y1, x2, y2]) => ({
    id,
    key,
    label,
    shortLabel,
    color,
    x: x1 / W,
    y: y1 / H,
    w: (x2 - x1) / W,
    h: (y2 - y1) / H,
    enabled: true,
    locked: false,
  }));
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
    return { ...fallback, x, y, w, h, enabled: item.enabled !== false, locked: Boolean(item.locked) };
  });
}

export function createEfhubCalibrationMap(zones: EfhubCalibrationZone[]): EfhubCalibrationMap {
  return {
    version: EFHUB_CALIBRATION_MODEL_R164_VERSION,
    updatedAt: new Date().toISOString(),
    zones: normalizeEfhubCalibrationZones(zones),
  };
}

export function readEfhubCalibrationMap(raw: string | null | undefined): EfhubCalibrationMap | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EfhubCalibrationMap>;
    if (!parsed || !Array.isArray(parsed.zones)) return null;
    return {
      version: String(parsed.version || EFHUB_CALIBRATION_MODEL_R164_VERSION),
      updatedAt: String(parsed.updatedAt || ''),
      zones: normalizeEfhubCalibrationZones(parsed.zones),
    };
  } catch {
    return null;
  }
}
