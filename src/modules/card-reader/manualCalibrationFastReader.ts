import type { OcrFieldKind } from '@/lib/ocrWorkerManager';
import { cancelOcrProcessing, prewarmOcrWorker, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { cropImage, mergeOcrTexts } from './imageProcessing';
import { recognizeZoneWithHighPrecision } from './highPrecisionOcr';
import {
  buildPreciseOcrZonesFromEfhubCalibration,
  normalizeEfhubCalibrationZones,
  type EfhubCalibrationZone,
  type EfhubCalibrationZoneId
} from './efhubManualCalibration';

export const MANUAL_CALIBRATION_FAST_READER_VERSION = '40.00-calibrated-fields-r1';
const TOTAL_READER_DEADLINE_MS = 180_000;

type ReadPlan = {
  zone: OcrZone;
  macroId: EfhubCalibrationZoneId;
  kind: OcrFieldKind;
  width: number;
  enhancement: 'contrast' | 'sharp' | 'inverted';
  timeoutMs: number;
  retry?: { enhancement: 'contrast' | 'sharp' | 'inverted'; kind?: OcrFieldKind; width?: number; minConfidence: number; minChars: number };
};

function status(confidence: number, text: string): PremiumZoneReading['status'] {
  if (!text.trim()) return 'unread';
  return confidence >= 70 ? 'confirmed' : 'review';
}

function macroIdForKey(key: OcrZoneKey): EfhubCalibrationZoneId {
  if (key === 'name' || key === 'playstyle') return 'identity';
  if (key === 'overall' || key === 'mainPosition' || key === 'cardType') return 'card';
  if (key === 'identityMeta' || key === 'condition' || key === 'manager' || key === 'level' || key === 'points') return 'bio';
  if (key === 'positionGrid') return 'positions';
  if (key === 'impetos') return 'boosters';
  if (key === 'attributes') return 'attributes';
  if (key === 'physicalModel') return 'physical';
  return 'skills';
}

function kindForZone(zone: OcrZone): OcrFieldKind {
  if (zone.key === 'name') return 'name';
  if (zone.key === 'playstyle') return 'style';
  if (zone.key === 'overall' || zone.key === 'level' || zone.key === 'points') return 'numeric';
  if (zone.key === 'mainPosition') return 'position';
  if (zone.key === 'skills') return 'skillsSparse';
  if (zone.key === 'attributes' || zone.key === 'physicalModel') return 'table';
  if (zone.key === 'positionGrid') return 'tableSparse';
  return 'general';
}

function planFor(zone: OcrZone): ReadPlan {
  const kind = kindForZone(zone);
  if (zone.key === 'name') return {
    zone, macroId: 'identity', kind, width: 1850, enhancement: 'sharp', timeoutMs: 14_000,
    retry: { enhancement: 'inverted', kind: 'nameSparse', width: 2050, minConfidence: 72, minChars: 3 }
  };
  if (zone.key === 'playstyle') return {
    zone, macroId: 'identity', kind, width: 1750, enhancement: 'sharp', timeoutMs: 13_000,
    retry: { enhancement: 'contrast', kind: 'style', width: 1900, minConfidence: 64, minChars: 5 }
  };
  if (zone.key === 'overall' || zone.key === 'mainPosition') return {
    zone, macroId: 'card', kind, width: 1450, enhancement: 'sharp', timeoutMs: 11_000,
    retry: { enhancement: 'inverted', kind, width: 1650, minConfidence: 66, minChars: 1 }
  };
  if (zone.key === 'skills') return {
    zone, macroId: 'skills', kind, width: 1950, enhancement: 'sharp', timeoutMs: 15_000,
    retry: { enhancement: 'contrast', kind: 'skillsSparse', width: 2100, minConfidence: 58, minChars: 6 }
  };
  if (zone.key === 'attributes') return {
    zone, macroId: 'attributes', kind, width: 1800, enhancement: 'sharp', timeoutMs: 15_000,
    retry: { enhancement: 'contrast', kind: 'tableSparse', width: 1950, minConfidence: 58, minChars: 8 }
  };
  if (zone.key === 'physicalModel') return { zone, macroId: 'physical', kind, width: 1650, enhancement: 'contrast', timeoutMs: 13_000 };
  if (zone.key === 'positionGrid') return { zone, macroId: 'positions', kind, width: 1750, enhancement: 'contrast', timeoutMs: 14_000 };
  if (zone.key === 'impetos') return { zone, macroId: 'boosters', kind, width: 1750, enhancement: 'sharp', timeoutMs: 13_000 };
  if (zone.key === 'identityMeta') return {
    zone, macroId: 'bio', kind: 'tableSparse', width: 1700, enhancement: 'sharp', timeoutMs: 14_000,
    retry: { enhancement: 'contrast', kind: 'tableSparse', width: 1850, minConfidence: 55, minChars: 5 }
  };
  return { zone, macroId: macroIdForKey(zone.key), kind, width: 1600, enhancement: 'contrast', timeoutMs: 12_000 };
}

function readingFrom(plan: ReadPlan, text: string, confidence: number, enhancement: PremiumZoneReading['enhancement'], rawPasses: PremiumZoneReading['rawPasses']): PremiumZoneReading {
  return {
    id: `${MANUAL_CALIBRATION_FAST_READER_VERSION}-${plan.zone.key}-${plan.zone.label}`,
    sourceId: MANUAL_CALIBRATION_FAST_READER_VERSION,
    sourceLabel: `Quadrado ${plan.macroId}`,
    screenType: 'detailed-profile',
    key: plan.zone.key,
    label: plan.zone.label,
    text,
    confidence,
    status: status(confidence, text),
    originPreview: null,
    enhancement,
    passCount: rawPasses?.length || 1,
    consistency: confidence,
    agreement: text.trim() ? Math.max(1, new Set((rawPasses ?? []).map((pass) => pass.text.trim()).filter(Boolean)).size) : 0,
    alternatives: (rawPasses ?? []).slice(1).filter((pass) => pass.text.trim()).map((pass) => ({ text: pass.text, confidence: pass.confidence, enhancement: pass.enhancement })),
    precisionVersion: MANUAL_CALIBRATION_FAST_READER_VERSION,
    validationNotes: [
      'Subárea determinística derivada do quadrado posicionado pelo usuário.',
      'A leitura por quadrados não executa o scanner forense multipass completo.'
    ],
    rawPasses: rawPasses ?? []
  };
}

async function readPlan(file: File | Blob, plan: ReadPlan, cacheBase: string): Promise<PremiumZoneReading> {
  let image = await cropImage(file, plan.zone, plan.width, plan.enhancement);
  if (image === file) throw new Error(`Não foi possível recortar ${plan.zone.label}; o app evitou ler o print inteiro no lugar do quadrado.`);
  const first = await recognizeWithOcrWorker(image, {
    label: plan.zone.label,
    kind: plan.kind,
    cacheKey: `${cacheBase}:${plan.enhancement}:${plan.kind}`,
    timeoutMs: plan.timeoutMs
  });
  let text = first.text;
  let confidence = first.confidence;
  let enhancement: PremiumZoneReading['enhancement'] = plan.enhancement;
  const rawPasses: NonNullable<PremiumZoneReading['rawPasses']> = [
    { text: first.text, confidence: first.confidence, enhancement: plan.enhancement, kind: plan.kind }
  ];
  const retry = plan.retry;
  if (retry && (confidence < retry.minConfidence || text.trim().length < retry.minChars)) {
    image = await cropImage(file, plan.zone, retry.width ?? plan.width, retry.enhancement);
    if (image !== file) {
      const second = await recognizeWithOcrWorker(image, {
        label: `${plan.zone.label} • conferência`,
        kind: retry.kind ?? plan.kind,
        cacheKey: `${cacheBase}:${retry.enhancement}:${retry.kind ?? plan.kind}`,
        timeoutMs: Math.min(14_000, plan.timeoutMs)
      }).catch(() => null);
      if (second) {
        rawPasses.push({ text: second.text, confidence: second.confidence, enhancement: retry.enhancement, kind: retry.kind ?? plan.kind });
        const firstScore = confidence + Math.min(16, text.trim().length / 4);
        const secondScore = second.confidence + Math.min(16, second.text.trim().length / 4);
        if (secondScore > firstScore) {
          text = second.text;
          confidence = second.confidence;
          enhancement = retry.enhancement;
        } else if (second.text.trim() && text.trim() && second.text.trim() !== text.trim()) {
          text = mergeOcrTexts(text, second.text);
          confidence = Math.max(confidence, second.confidence);
        }
      }
    }
  }
  return readingFrom(plan, text, confidence, enhancement, rawPasses);
}

function duplicateEvidence(reading: PremiumZoneReading, key: OcrZoneKey, label: string): PremiumZoneReading {
  return { ...reading, id: `${reading.id}-${key}`, key, label, sourceLabel: `${reading.sourceLabel} • evidência compartilhada` };
}

function macroFallbackZone(zones: EfhubCalibrationZone[], id: EfhubCalibrationZoneId, key: OcrZoneKey, label: string): OcrZone | null {
  const macro = zones.find((zone) => zone.id === id && zone.enabled !== false);
  if (!macro) return null;
  return { key, label, x: macro.x, y: macro.y, w: macro.w, h: macro.h, enabled: true };
}

function hasUsefulReading(readings: PremiumZoneReading[], key: OcrZoneKey, minimumConfidence = 1) {
  return readings.some((reading) => reading.key === key && reading.text.trim().length >= 2 && reading.confidence >= minimumConfidence);
}

async function addLegacyPrecisionFallback(
  file: File | Blob,
  zones: EfhubCalibrationZone[],
  readings: PremiumZoneReading[],
  options: { imageHash: string; knownPlayerNames?: string[] },
  started: number
) {
  const needsName = !hasUsefulReading(readings, 'name', 70);
  const needsAttributes = !hasUsefulReading(readings, 'attributes');
  const needsSkills = !hasUsefulReading(readings, 'skills');
  const fallbackPlans = [
    needsName ? macroFallbackZone(zones, 'identity', 'name', 'Nome do jogador • fallback legado seguro') : null,
    needsAttributes ? macroFallbackZone(zones, 'attributes', 'attributes', 'Atributos • fallback do bloco completo') : null,
    needsSkills ? macroFallbackZone(zones, 'skills', 'skills', 'Habilidades • fallback do bloco completo') : null
  ].filter((zone): zone is OcrZone => Boolean(zone));
  for (const zone of fallbackPlans) {
    if (Date.now() - started > TOTAL_READER_DEADLINE_MS) break;
    const fallback = await recognizeZoneWithHighPrecision(file, zone, {
      imageHash: `${options.imageHash}:manual-fallback`,
      template: 'detailed-profile-manual',
      targetWidth: zone.key === 'name' ? 2100 : zone.key === 'skills' ? 2050 : 1900,
      readingMode: 'fast',
      knownPlayerNames: options.knownPlayerNames ?? [],
      labelPrefix: 'Conferência dos quadrados'
    }).catch(() => null);
    if (fallback?.text.trim()) readings.push(fallback);
  }
}

/**
 * Leitor manual v40.00.
 * Os 8 quadrados continuam sendo a referência visual escolhida pelo usuário,
 * mas nome/estilo/posição/nível, atributos e habilidades são lidos em
 * subáreas determinísticas. Assim recuperamos a precisão das versões 37.x
 * sem voltar ao scanner pesado que podia ficar processando indefinidamente.
 */
export async function readEightEfhubCalibrationMacros(
  file: File | Blob,
  zones: EfhubCalibrationZone[],
  options: {
    imageHash: string;
    onProgress?: (completed: number, total: number, label: string) => void;
    knownPlayerNames?: string[];
  }
): Promise<PremiumZoneReading[]> {
  const started = Date.now();
  const safe = normalizeEfhubCalibrationZones(zones);
  const enabledMacros = new Set(safe.filter((zone) => zone.enabled !== false).map((zone) => zone.id));
  const precise = await buildPreciseOcrZonesFromEfhubCalibration(file, safe, { detectSkillCapsules: false });
  const relevant = precise.filter((zone) => {
    if (!zone.enabled) return false;
    if (!enabledMacros.has(macroIdForKey(zone.key))) return false;
    if (zone.key === 'cardType') return false;
    if (zone.key === 'condition' || zone.key === 'manager') return false;
    return true;
  });
  const plans = relevant.map(planFor);
  options.onProgress?.(0, plans.length, 'Preparando OCR local');
  await prewarmOcrWorker();
  const readings: PremiumZoneReading[] = [];
  try {
    for (let index = 0; index < plans.length; index += 1) {
      if (Date.now() - started > TOTAL_READER_DEADLINE_MS) {
        await cancelOcrProcessing().catch(() => undefined);
        throw new Error('A leitura por quadrados atingiu o limite seguro de 3 minutos e foi reiniciada. Nenhuma leitura ficará processando indefinidamente.');
      }
      const plan = plans[index];
      options.onProgress?.(index, plans.length, plan.zone.label);
      const cacheBase = `${MANUAL_CALIBRATION_FAST_READER_VERSION}:${options.imageHash}:${plan.zone.key}:${plan.zone.x.toFixed(5)}:${plan.zone.y.toFixed(5)}:${plan.zone.w.toFixed(5)}:${plan.zone.h.toFixed(5)}`;
      try {
        const reading = await readPlan(file, plan, cacheBase);
        readings.push(reading);
        if (reading.key === 'identityMeta' && reading.text.trim()) readings.push(duplicateEvidence(reading, 'level', 'Nível máximo'));
      } catch (error) {
        readings.push(readingFrom(plan, '', 0, plan.enhancement, []));
        if (error instanceof Error && /motor OCR|iniciar|tempo seguro/i.test(error.message)) throw error;
      }
      options.onProgress?.(index + 1, plans.length, plan.zone.label);
      if (typeof window !== 'undefined') await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
  } catch (error) {
    await cancelOcrProcessing().catch(() => undefined);
    throw error;
  }
  await addLegacyPrecisionFallback(file, safe, readings, options, started);
  return readings;
}
