import type { ReaderV2FieldKey, ReaderV2Zone } from './readerV2Types';
import {mapReaderV2ZoneToFrame,type ReaderV2Frame} from './readerV2Frame';

type LegacyCalibrationZoneLike = {
  key?: string;
  label?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  enabled?: boolean;
};

const W = 1400;
const H = 1600;

const canonical = [
  ['playerName', '1. Nome + estilo', 10, 5, 440, 110],
  ['cardType', '2. Carta / foto', 75, 115, 335, 470],
  ['identityMeta', '3. Bio + condição', 340, 105, 760, 465],
  ['positionGrid', '4. Posições + overalls', 770, 105, 1388, 470],
  ['impeto', '5. Boosters / Ímpeto', 15, 472, 1385, 555],
  ['attributes', '6. 26 atributos', 15, 555, 1385, 1085],
  ['physicalModel', '7. Modelo físico', 15, 1085, 1385, 1425],
  ['skills', '8. Habilidades', 15, 1425, 1385, 1590],
  ['progression', '9. Pontos distribuídos', 650, 472, 1385, 555],
  ['specialSkill', '10. Habilidade especial', 15, 1425, 1385, 1590],
] as const;

export const READER_V2_DEFAULT_ZONES: ReaderV2Zone[] = canonical.map(([key, label, x1, y1, x2, y2]) => ({
  key,
  label,
  x: x1 / W,
  y: y1 / H,
  w: (x2 - x1) / W,
  h: (y2 - y1) / H,
  enabled: true,
}));

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeLegacyKey(key: string | undefined): ReaderV2FieldKey {
  const normalized = String(key ?? '').trim();
  if (normalized === 'name') return 'playerName';
  if (normalized === 'impetos') return 'impeto';
  return normalized || 'unknown';
}

export function mapLegacyCalibrationToReaderV2(zones: LegacyCalibrationZoneLike[]): ReaderV2Zone[] {
  if (!Array.isArray(zones)) return [...READER_V2_DEFAULT_ZONES];
  return zones.map((zone, index) => {
    const x = clamp(Number(zone.x ?? 0), 0, 0.999);
    const y = clamp(Number(zone.y ?? 0), 0, 0.999);
    const w = clamp(Number(zone.w ?? 0.01), 0.001, 1 - x);
    const h = clamp(Number(zone.h ?? 0.01), 0.001, 1 - y);
    return {
      key: normalizeLegacyKey(zone.key),
      label: String(zone.label || `Zona ${index + 1}`),
      x,
      y,
      w,
      h,
      enabled: zone.enabled !== false,
    };
  });
}

/** Saved coordinates belong to their original screenshot, not every import. */
export function resolveReaderV2FrameZones(zones:ReaderV2Zone[],frame?:ReaderV2Frame):ReaderV2Zone[] {
 if(!frame)return zones;
 const attributes=zones.find(zone=>zone.key==='attributes'&&zone.enabled);
 const fullProfile=zones.filter(zone=>zone.enabled&&READER_V2_DEFAULT_ZONES.some(standard=>standard.key===zone.key)).length>=8;
 if(!fullProfile||!attributes||attributes.attributeLayout==='labels')return zones;
 const centers=[.303,.632,.960];
 const strips=[[.255,.340],[.590,.690],[.905,1]];
 const columnsFit=centers.every((center,index)=>{
  const x=frame.x+frame.w*center;
  return x>=attributes.x+attributes.w*strips[index][0]&&x<=attributes.x+attributes.w*strips[index][1];
 });
 const rowsFit=Math.abs(attributes.y-(frame.y+frame.h*555/1600))<=frame.h*.04
  &&Math.abs(attributes.y+attributes.h-(frame.y+frame.h*1085/1600))<=frame.h*.04;
 if(columnsFit&&rowsFit)return zones;
 return zones.map(zone=>{
  const standard=READER_V2_DEFAULT_ZONES.find(candidate=>candidate.key===zone.key);
  return standard?{...mapReaderV2ZoneToFrame(standard,frame),label:zone.label,enabled:zone.enabled}:zone;
 });
}
