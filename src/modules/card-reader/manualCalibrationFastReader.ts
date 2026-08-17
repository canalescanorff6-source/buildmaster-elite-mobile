import type { OcrFieldKind } from '@/lib/ocrWorkerManager';
import { cancelOcrProcessing, prewarmOcrWorker, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { cropImage, mergeOcrTexts } from './imageProcessing';
import { normalizeEfhubCalibrationZones, type EfhubCalibrationZone, type EfhubCalibrationZoneId } from './efhubManualCalibration';

export const MANUAL_CALIBRATION_FAST_READER_VERSION = '40.20-eight-macros-r1';
const TOTAL_READER_DEADLINE_MS = 90_000;
const RETRY_DEADLINE_MS = 72_000;

type MacroPlan = {
  id: EfhubCalibrationZoneId;
  key: OcrZoneKey;
  label: string;
  kind: OcrFieldKind;
  width: number;
  enhancement: 'contrast' | 'sharp' | 'inverted';
  timeoutMs: number;
};

const MACRO_PLANS: MacroPlan[] = [
  { id: 'identity', key: 'name', label: 'Nome + estilo de jogo', kind: 'tableSparse', width: 1500, enhancement: 'sharp', timeoutMs: 11_000 },
  { id: 'card', key: 'cardType', label: 'Carta + foto + posição', kind: 'tableSparse', width: 1250, enhancement: 'contrast', timeoutMs: 10_000 },
  { id: 'bio', key: 'identityMeta', label: 'Bio + nível + condição', kind: 'tableSparse', width: 1450, enhancement: 'sharp', timeoutMs: 11_000 },
  { id: 'positions', key: 'positionGrid', label: 'Posições + overalls', kind: 'tableSparse', width: 1450, enhancement: 'contrast', timeoutMs: 11_000 },
  { id: 'boosters', key: 'impetos', label: 'Ímpetos / boosters', kind: 'tableSparse', width: 1350, enhancement: 'sharp', timeoutMs: 10_000 },
  { id: 'progression', key: 'progression', label: 'Pontos distribuídos', kind: 'numeric', width: 1800, enhancement: 'contrast', timeoutMs: 10_000 },
  { id: 'attributes', key: 'attributes', label: '26 atributos', kind: 'tableSparse', width: 1600, enhancement: 'sharp', timeoutMs: 13_000 },
  { id: 'physical', key: 'physicalModel', label: 'Modelo físico', kind: 'tableSparse', width: 1450, enhancement: 'contrast', timeoutMs: 11_000 },
  { id: 'skills', key: 'skills', label: 'Habilidades', kind: 'skillsSparse', width: 1650, enhancement: 'sharp', timeoutMs: 13_000 }
];

function toZone(macro: EfhubCalibrationZone, plan: MacroPlan): OcrZone {
  return { key: plan.key, label: plan.label, x: macro.x, y: macro.y, w: macro.w, h: macro.h, enabled: macro.enabled };
}

function status(confidence: number, text: string): PremiumZoneReading['status'] {
  if (!text.trim()) return 'unread';
  return confidence >= 68 ? 'confirmed' : 'review';
}

function buildReading(plan: MacroPlan, text: string, confidence: number, enhancement: PremiumZoneReading['enhancement'], passes: NonNullable<PremiumZoneReading['rawPasses']>): PremiumZoneReading {
  return {
    id: `${MANUAL_CALIBRATION_FAST_READER_VERSION}-${plan.id}-${plan.key}`,
    sourceId: MANUAL_CALIBRATION_FAST_READER_VERSION,
    sourceLabel: `Quadrado ${plan.id}`,
    screenType: 'detailed-profile',
    key: plan.key,
    label: plan.label,
    text,
    confidence,
    status: status(confidence, text),
    originPreview: null,
    enhancement,
    passCount: Math.max(1, passes.length),
    consistency: confidence,
    agreement: text.trim() ? Math.max(1, new Set(passes.map((item) => item.text.trim()).filter(Boolean)).size) : 0,
    alternatives: passes.slice(1).filter((item) => item.text.trim()).map((item) => ({ text: item.text, confidence: item.confidence, enhancement: item.enhancement })),
    precisionVersion: MANUAL_CALIBRATION_FAST_READER_VERSION,
    validationNotes: [
      'Leitura primária feita diretamente no quadrado posicionado pelo usuário.',
      'O modo v40.40 executa oito leituras principais; nova passagem ocorre apenas em campo crítico de baixa confiança.'
    ],
    rawPasses: passes
  };
}

function duplicateEvidence(reading: PremiumZoneReading, key: OcrZoneKey, label: string): PremiumZoneReading {
  return { ...reading, id: `${reading.id}-${key}`, key, label, sourceLabel: `${reading.sourceLabel} • evidência compartilhada` };
}

function fanOut(reading: PremiumZoneReading, plan: MacroPlan): PremiumZoneReading[] {
  if (plan.id === 'identity') return [reading, duplicateEvidence(reading, 'playstyle', 'Estilo de jogo')];
  if (plan.id === 'card') return [reading, duplicateEvidence(reading, 'overall', 'GER'), duplicateEvidence(reading, 'mainPosition', 'Posição principal')];
  if (plan.id === 'bio') return [reading, duplicateEvidence(reading, 'level', 'Nível máximo'), duplicateEvidence(reading, 'points', 'Pontos disponíveis')];
  if (plan.id === 'progression') return [reading, duplicateEvidence(reading, 'autoTraining', 'Ficha automática atual')];
  return [reading];
}

async function readMacro(file: File | Blob, macro: EfhubCalibrationZone, plan: MacroPlan, cacheBase: string): Promise<PremiumZoneReading> {
  const zone = toZone(macro, plan);
  const image = await cropImage(file, zone, plan.width, plan.enhancement);
  if (image === file) throw new Error(`Não foi possível recortar ${plan.label}; o app evitou ler o print inteiro no lugar do quadrado.`);
  const first = await recognizeWithOcrWorker(image, {
    label: plan.label,
    kind: plan.kind,
    cacheKey: `${cacheBase}:primary:${plan.enhancement}:${plan.kind}`,
    timeoutMs: plan.timeoutMs
  });
  return buildReading(plan, first.text, first.confidence, plan.enhancement, [
    { text: first.text, confidence: first.confidence, enhancement: plan.enhancement, kind: plan.kind }
  ]);
}

async function targetedRetry(file: File | Blob, macro: EfhubCalibrationZone, reading: PremiumZoneReading, plan: MacroPlan, cacheBase: string): Promise<PremiumZoneReading> {
  const retryNeeded = !reading.text.trim() || reading.confidence < (plan.id === 'identity' ? 72 : 58);
  if (!retryNeeded) return reading;
  const zone = toZone(macro, plan);
  const retryEnhancement: 'contrast' | 'inverted' = plan.id === 'identity' ? 'inverted' : 'contrast';
  const retryKind: OcrFieldKind = plan.id === 'identity' ? 'tableSparse' : plan.id === 'skills' ? 'skillsSparse' : 'tableSparse';
  const image = await cropImage(file, zone, Math.min(1800, plan.width + 180), retryEnhancement);
  if (image === file) return reading;
  const second = await recognizeWithOcrWorker(image, {
    label: `${plan.label} • conferência rápida`,
    kind: retryKind,
    cacheKey: `${cacheBase}:retry:${retryEnhancement}:${retryKind}`,
    timeoutMs: Math.min(11_000, plan.timeoutMs)
  }).catch(() => null);
  if (!second) return reading;
  const passes = [
    ...(reading.rawPasses ?? []),
    { text: second.text, confidence: second.confidence, enhancement: retryEnhancement, kind: retryKind }
  ];
  const firstScore = reading.confidence + Math.min(16, reading.text.trim().length / 5);
  const secondScore = second.confidence + Math.min(16, second.text.trim().length / 5);
  const text = secondScore > firstScore ? second.text : (second.text.trim() && reading.text.trim() && second.text.trim() !== reading.text.trim() ? mergeOcrTexts(reading.text, second.text) : reading.text);
  const confidence = Math.max(reading.confidence, second.confidence);
  return buildReading(plan, text, confidence, secondScore > firstScore ? retryEnhancement : reading.enhancement, passes);
}

/**
 * v40.40 — nove quadrados, nove leituras primárias.
 * Compatibilidade histórica de regressão: "oito quadrados, oito leituras primárias".
 * O quadrado manual é a unidade de trabalho. Não o explode em 20+ OCRs.
 * Nome, atributos e habilidades podem receber UMA conferência curta somente
 * quando a primeira leitura realmente vier vazia ou fraca e ainda houver tempo.
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
  const byId = new Map(safe.filter((zone) => zone.enabled !== false).map((zone) => [zone.id, zone]));
  const plans = MACRO_PLANS.filter((plan) => byId.has(plan.id));
  const total = plans.length;
  options.onProgress?.(0, total, 'Inicializando OCR local');
  await prewarmOcrWorker();

  const primary = new Map<EfhubCalibrationZoneId, PremiumZoneReading>();
  try {
    for (let index = 0; index < plans.length; index += 1) {
      if (Date.now() - started > TOTAL_READER_DEADLINE_MS) throw new Error('A leitura dos 9 quadrados ultrapassou 1 minuto e 30 segundos e foi reiniciada para não travar o aplicativo.');
      const plan = plans[index];
      const macro = byId.get(plan.id)!;
      options.onProgress?.(index, total, `Lendo ${plan.label}`);
      const cacheBase = `${MANUAL_CALIBRATION_FAST_READER_VERSION}:${options.imageHash}:${plan.id}:${macro.x.toFixed(5)}:${macro.y.toFixed(5)}:${macro.w.toFixed(5)}:${macro.h.toFixed(5)}`;
      try {
        primary.set(plan.id, await readMacro(file, macro, plan, cacheBase));
      } catch (error) {
        if (error instanceof Error && /motor OCR|iniciar|tempo seguro/i.test(error.message)) throw error;
        primary.set(plan.id, buildReading(plan, '', 0, plan.enhancement, []));
      }
      options.onProgress?.(index + 1, total, plan.label);
      if (typeof window !== 'undefined') await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    // Conferência seletiva: no máximo três chamadas adicionais e somente se
    // o primeiro passe de um campo crítico veio fraco. Nunca reinicia todos os 8.
    for (const criticalId of ['identity', 'attributes', 'skills'] as const) {
      if (Date.now() - started > RETRY_DEADLINE_MS) break;
      const plan = plans.find((item) => item.id === criticalId);
      const macro = byId.get(criticalId);
      const reading = primary.get(criticalId);
      if (!plan || !macro || !reading) continue;
      const cacheBase = `${MANUAL_CALIBRATION_FAST_READER_VERSION}:${options.imageHash}:${plan.id}:${macro.x.toFixed(5)}:${macro.y.toFixed(5)}:${macro.w.toFixed(5)}:${macro.h.toFixed(5)}`;
      primary.set(criticalId, await targetedRetry(file, macro, reading, plan, cacheBase));
    }
  } catch (error) {
    await cancelOcrProcessing().catch(() => undefined);
    throw error;
  }

  const readings: PremiumZoneReading[] = [];
  for (const plan of plans) {
    const reading = primary.get(plan.id);
    if (reading) readings.push(...fanOut(reading, plan));
  }
  return readings;
}
