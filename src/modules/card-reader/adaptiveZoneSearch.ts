import type { OcrZone, OcrZoneKey } from '@/lib/ocr';

export type AdaptiveZoneVariant = {
  id: string;
  label: string;
  zone: OcrZone;
  priority: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeZone(zone: OcrZone, patch: Partial<Pick<OcrZone, 'x' | 'y' | 'w' | 'h'>> = {}): OcrZone {
  const w = clamp(patch.w ?? zone.w, 0.012, 1);
  const h = clamp(patch.h ?? zone.h, 0.012, 1);
  return {
    ...zone,
    x: clamp(patch.x ?? zone.x, 0, Math.max(0, 1 - w)),
    y: clamp(patch.y ?? zone.y, 0, Math.max(0, 1 - h)),
    w,
    h
  };
}

function shifted(zone: OcrZone, dx: number, dy: number, scaleX = 1, scaleY = 1) {
  const w = zone.w * scaleX;
  const h = zone.h * scaleY;
  return safeZone(zone, {
    x: zone.x + dx + (zone.w - w) / 2,
    y: zone.y + dy + (zone.h - h) / 2,
    w,
    h
  });
}

function uniqueVariants(items: AdaptiveZoneVariant[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.zone.x, item.zone.y, item.zone.w, item.zone.h].map((value) => value.toFixed(4)).join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function criticalOffsets(zone: OcrZone, horizontal: number, vertical: number) {
  return {
    dx: Math.max(0.004, zone.w * horizontal),
    dy: Math.max(0.003, zone.h * vertical)
  };
}

export function adaptiveZoneVariants(zone: OcrZone, mode: 'balanced' | 'precision' | 'fast'): AdaptiveZoneVariant[] {
  const variants: AdaptiveZoneVariant[] = [{ id: 'exact', label: 'área exata', zone: safeZone(zone), priority: 100 }];
  const key: OcrZoneKey = zone.key;
  if (mode === 'fast') {
    // Contrato legado: o modo fast deste helper sempre representa somente a
    // área exata. A segunda tentativa de nome do leitor manual é controlada
    // diretamente por manualCalibrationFastReader, para não multiplicar zonas
    // nem chamadas OCR escondidas.
    return variants;
  }

  if (key === 'name') {
    const { dx, dy } = criticalOffsets(zone, 0.12, 0.30);
    variants.push(
      { id: 'name-tight', label: 'nome concentrado', zone: shifted(zone, 0, 0, 0.92, 0.78), priority: 98 },
      { id: 'name-up', label: 'nome acima', zone: shifted(zone, 0, -dy, 1.04, 1.05), priority: 94 },
      { id: 'name-down', label: 'nome abaixo', zone: shifted(zone, 0, dy, 1.04, 1.05), priority: 93 },
      { id: 'name-left', label: 'nome à esquerda', zone: shifted(zone, -dx, 0, 1.10, 1.10), priority: 91 },
      { id: 'name-right', label: 'nome à direita', zone: shifted(zone, dx, 0, 1.10, 1.10), priority: 90 },
      { id: 'name-wide', label: 'nome ampliado', zone: shifted(zone, 0, 0, 1.22, 1.38), priority: 88 }
    );
  } else if (key === 'overall' || key === 'level' || key === 'points' || key === 'mainPosition' || key === 'playstyle') {
    const { dx, dy } = criticalOffsets(zone, 0.10, 0.16);
    variants.push(
      { id: 'tight', label: 'área concentrada', zone: shifted(zone, 0, 0, 0.86, 0.82), priority: 96 },
      { id: 'up', label: 'área acima', zone: shifted(zone, 0, -dy, 1.05, 1.08), priority: 92 },
      { id: 'down', label: 'área abaixo', zone: shifted(zone, 0, dy, 1.05, 1.08), priority: 91 },
      { id: 'left', label: 'área à esquerda', zone: shifted(zone, -dx, 0, 1.08, 1.05), priority: 90 },
      { id: 'right', label: 'área à direita', zone: shifted(zone, dx, 0, 1.08, 1.05), priority: 89 },
      { id: 'expanded', label: 'área ampliada', zone: shifted(zone, 0, 0, 1.20, 1.24), priority: 86 }
    );
  } else if (key === 'skills' || key === 'attributes' || key === 'positionGrid' || key === 'physicalModel' || key === 'impetos') {
    const { dy } = criticalOffsets(zone, 0.04, 0.08);
    variants.push(
      { id: 'upper-band', label: 'faixa superior', zone: shifted(zone, 0, -dy, 1.02, 0.84), priority: 93 },
      { id: 'lower-band', label: 'faixa inferior', zone: shifted(zone, 0, dy, 1.02, 0.84), priority: 92 },
      { id: 'expanded-band', label: 'faixa ampliada', zone: shifted(zone, 0, 0, 1.04, 1.18), priority: 89 }
    );
  }

  const cap = mode === 'precision' ? 7 : 3;
  return uniqueVariants(variants).sort((a, b) => b.priority - a.priority).slice(0, cap);
}
