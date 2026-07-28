import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import { runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import type { CardCropBox } from './cardArtCrop';
import type { SinglePrintContentBounds, SinglePrintTemplate, SinglePrintZoneBox } from './singlePrintPro';

export const OCR_TEMPLATE_CALIBRATION_VERSION = '31.78-template-memory-skills-2';

export type OcrTemplateCalibration = {
  id: string;
  template: SinglePrintTemplate;
  widthBucket: number;
  heightBucket: number;
  orientation: 'portrait' | 'landscape';
  layoutBounds?: SinglePrintContentBounds;
  zones: Array<Pick<OcrZone, 'key' | 'x' | 'y' | 'w' | 'h'>>;
  cardBox?: CardCropBox;
  confirmations: number;
  manualCropConfirmations: number;
  qualityAverage: number;
  firstSeenAt: string;
  lastSeenAt: string;
  version: string;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function bucket(value: number) {
  return Math.round(value / 100) * 100;
}

function zoneKey(zone: Pick<OcrZone, 'key'>) {
  return zone.key;
}

function sanitizeZone(zone: Pick<OcrZone, 'key' | 'x' | 'y' | 'w' | 'h'>) {
  const x = clamp(zone.x);
  const y = clamp(zone.y);
  const w = clamp(zone.w, 0.01, 1 - x);
  const h = clamp(zone.h, 0.01, 1 - y);
  return { key: zone.key, x, y, w, h };
}

function average(left: number, right: number, rightWeight: number) {
  return (left + right * rightWeight) / (1 + rightWeight);
}

function averageBox(left: CardCropBox | undefined, right: CardCropBox | undefined, rightWeight: number): CardCropBox | undefined {
  if (!right) return left;
  if (!left) return right;
  return {
    x: average(left.x, right.x, rightWeight),
    y: average(left.y, right.y, rightWeight),
    w: average(left.w, right.w, rightWeight),
    h: average(left.h, right.h, rightWeight)
  };
}

function calibrationId(template: SinglePrintTemplate, width: number, height: number) {
  return `${template}:${bucket(width)}x${bucket(height)}`;
}

export function applyOcrTemplateCalibration<T extends OcrZone>(zones: T[], calibration: OcrTemplateCalibration | null): T[] {
  if (!calibration || calibration.version !== OCR_TEMPLATE_CALIBRATION_VERSION) return zones.map((zone) => ({ ...zone }));
  const learned = new Map<OcrZoneKey, OcrTemplateCalibration['zones'][number]>(calibration.zones.map((zone) => [zone.key, zone]));
  const strength = Math.min(0.82, 0.34 + calibration.confirmations * 0.08 + calibration.manualCropConfirmations * 0.05);
  return zones.map((zone) => {
    const remembered = learned.get(zone.key);
    if (!remembered) return { ...zone };
    const next = sanitizeZone({
      key: zone.key,
      x: zone.x * (1 - strength) + remembered.x * strength,
      y: zone.y * (1 - strength) + remembered.y * strength,
      w: zone.w * (1 - strength) + remembered.w * strength,
      h: zone.h * (1 - strength) + remembered.h * strength
    });
    return { ...zone, ...next };
  });
}

export function applyRememberedCardBox<T extends CardCropBox>(cardBox: T, calibration: OcrTemplateCalibration | null): T {
  if (!calibration?.cardBox || calibration.version !== OCR_TEMPLATE_CALIBRATION_VERSION) return { ...cardBox };
  const strength = Math.min(0.88, 0.46 + calibration.manualCropConfirmations * 0.12 + calibration.confirmations * 0.04);
  return {
    ...cardBox,
    x: cardBox.x * (1 - strength) + calibration.cardBox.x * strength,
    y: cardBox.y * (1 - strength) + calibration.cardBox.y * strength,
    w: cardBox.w * (1 - strength) + calibration.cardBox.w * strength,
    h: cardBox.h * (1 - strength) + calibration.cardBox.h * strength
  };
}

export async function findBestOcrTemplateCalibration(template: SinglePrintTemplate, width: number, height: number): Promise<OcrTemplateCalibration | null> {
  const entries = await runtimeList<OcrTemplateCalibration>('ocr-calibrations', 120).catch(() => []);
  const orientation = width > height ? 'landscape' : 'portrait';
  const candidates = entries
    .map((entry) => entry.value)
    .filter((item) => item.version === OCR_TEMPLATE_CALIBRATION_VERSION && item.template === template && item.orientation === orientation)
    .map((item) => ({
      item,
      distance: Math.abs(item.widthBucket - bucket(width)) + Math.abs(item.heightBucket - bucket(height))
    }))
    .filter((entry) => entry.distance <= 400)
    .sort((left, right) => left.distance - right.distance || right.item.confirmations - left.item.confirmations);
  return candidates[0]?.item ?? null;
}

export async function learnOcrTemplateCalibration(input: {
  template: SinglePrintTemplate;
  width: number;
  height: number;
  layoutBounds?: SinglePrintContentBounds;
  zones?: SinglePrintZoneBox[];
  cardBox?: CardCropBox;
  qualityScore?: number;
  manualCrop?: boolean;
}): Promise<OcrTemplateCalibration | null> {
  const validZones = (input.zones ?? [])
    .filter((zone) => zone.w > 0.01 && zone.h > 0.01)
    .map((zone) => sanitizeZone(zone));
  if (!validZones.length && !input.cardBox) return null;
  const id = calibrationId(input.template, input.width, input.height);
  const previous = await runtimeList<OcrTemplateCalibration>('ocr-calibrations', 120)
    .then((entries) => entries.map((entry) => entry.value).find((item) => item.id === id && item.version === OCR_TEMPLATE_CALIBRATION_VERSION) ?? null)
    .catch(() => null);
  const weight = input.manualCrop ? 3 : 1;
  const previousZones = new Map<OcrZoneKey, OcrTemplateCalibration['zones'][number]>((previous?.zones ?? []).map((zone) => [zone.key, zone]));
  const mergedZones = validZones.map((zone) => {
    const old = previousZones.get(zone.key);
    if (!old) return zone;
    return sanitizeZone({
      key: zone.key,
      x: average(old.x, zone.x, weight),
      y: average(old.y, zone.y, weight),
      w: average(old.w, zone.w, weight),
      h: average(old.h, zone.h, weight)
    });
  });
  for (const old of previous?.zones ?? []) if (!mergedZones.some((zone) => zoneKey(zone) === zoneKey(old))) mergedZones.push(old);
  const now = new Date().toISOString();
  const confirmations = (previous?.confirmations ?? 0) + 1;
  const quality = Math.max(0, Math.min(100, input.qualityScore ?? 0));
  const report: OcrTemplateCalibration = {
    id,
    template: input.template,
    widthBucket: bucket(input.width),
    heightBucket: bucket(input.height),
    orientation: input.width > input.height ? 'landscape' : 'portrait',
    layoutBounds: input.layoutBounds ?? previous?.layoutBounds,
    zones: mergedZones,
    cardBox: averageBox(previous?.cardBox, input.cardBox, weight),
    confirmations,
    manualCropConfirmations: (previous?.manualCropConfirmations ?? 0) + (input.manualCrop ? 1 : 0),
    qualityAverage: previous ? Math.round((previous.qualityAverage * previous.confirmations + quality) / confirmations) : quality,
    firstSeenAt: previous?.firstSeenAt ?? now,
    lastSeenAt: now,
    version: OCR_TEMPLATE_CALIBRATION_VERSION
  };
  await runtimePut('ocr-calibrations', id, report);
  void runtimeTrimStore('ocr-calibrations', 80).catch(() => undefined);
  return report;
}
