import type { OcrFieldKind } from '@/lib/ocrWorkerManager';
import { cancelOcrProcessing, prewarmOcrWorker, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { cropImage, mergeOcrTexts } from './imageProcessing';
import { normalizeEfhubCalibrationZones, type EfhubCalibrationZone, type EfhubCalibrationZoneId } from './efhubManualCalibration';

export const MANUAL_CALIBRATION_FAST_READER_VERSION = '40.20-nine-macros-r2';
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
  { id: 'positions', key: 'positionGrid', label: 'Posições + overalls', kind: 'tableSparse', width: 1450, enhancement: 'inverted', timeoutMs: 11_000 },
  { id: 'boosters', key: 'impetos', label: 'Ímpetos / boosters', kind: 'tableSparse', width: 1350, enhancement: 'sharp', timeoutMs: 10_000 },
  { id: 'progression', key: 'progression', label: 'Pontos distribuídos', kind: 'numeric', width: 1800, enhancement: 'contrast', timeoutMs: 10_000 },
  { id: 'attributes', key: 'attributes', label: '26 atributos', kind: 'table', width: 1600, enhancement: 'inverted', timeoutMs: 13_000 },
  { id: 'physical', key: 'physicalModel', label: 'Modelo físico', kind: 'tableSparse', width: 1450, enhancement: 'inverted', timeoutMs: 11_000 },
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
      'O modo v40.40 executa nove leituras principais; nova passagem ocorre apenas em campo crítico de baixa confiança.'
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

type AttributeColumnId = 'left' | 'center' | 'right';

type AttributeColumnProfile = { id: AttributeColumnId; x: number; w: number; expected: number; valueX: number; valueW: number };

const ATTRIBUTE_COLUMNS: AttributeColumnProfile[] = [
  // Colunas amplas preservadas como fallback para rótulo + número.
  // valueX/valueW apontam apenas para a faixa dos badges numéricos do eFHUB.
  // Nela os dígitos são escuros sobre caixas verdes/vermelhas/amarelas, por isso
  // usamos contraste + OCR numérico multlinha antes do binário de tema escuro.
  { id: 'left', x: 0, w: 0.345, expected: 10, valueX: 0.255, valueW: 0.085 },
  { id: 'center', x: 0.315, w: 0.37, expected: 9, valueX: 0.590, valueW: 0.100 },
  { id: 'right', x: 0.655, w: 0.345, expected: 7, valueX: 0.905, valueW: 0.095 }
];

function nestedZone(macro: EfhubCalibrationZone, relative: { x: number; w: number }): OcrZone {
  const x = Math.max(0, macro.x + macro.w * relative.x);
  return {
    key: 'attributes',
    label: `26 atributos • coluna`,
    x,
    y: macro.y,
    w: Math.max(0.01, Math.min(1 - x, macro.w * relative.w)),
    h: macro.h,
    enabled: macro.enabled
  };
}

export function buildAttributeValueStripZonesForCalibration(macro: EfhubCalibrationZone): Array<OcrZone & { columnId: AttributeColumnId; expected: number }> {
  return ATTRIBUTE_COLUMNS.map((column) => ({
    ...nestedZone(macro, { x: column.valueX, w: column.valueW }),
    label: `26 atributos • valores ${column.id}`,
    columnId: column.id,
    expected: column.expected
  }));
}

function numericTokens(text: string, min: number, max: number) {
  return Array.from(text.matchAll(/\b(\d{1,3}(?:[,.]\d+)?)\b/g))
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value >= min && value <= max);
}

async function readAttributeMacro(
  file: File | Blob,
  macro: EfhubCalibrationZone,
  plan: MacroPlan,
  cacheBase: string
): Promise<PremiumZoneReading> {
  const texts: string[] = [];
  const passes: NonNullable<PremiumZoneReading['rawPasses']> = [];
  const confidences: number[] = [];
  const valueZones = new Map(buildAttributeValueStripZonesForCalibration(macro).map((zone) => [zone.columnId, zone]));

  for (const column of ATTRIBUTE_COLUMNS) {
    const valueZone = valueZones.get(column.id)!;
    const valueImage = await cropImage(file, valueZone, 760, 'contrast');
    if (valueImage === file) throw new Error(`Não foi possível recortar ${plan.label} (valores ${column.id}).`);
    const numeric = await recognizeWithOcrWorker(valueImage, {
      label: `${plan.label} • valores ${column.id}`,
      kind: 'numericColumn',
      cacheKey: `${cacheBase}:values:${column.id}:contrast:numeric-column`,
      timeoutMs: 7_000
    });
    const numericCount = numericTokens(numeric.text, 35, 110).length;
    passes.push({ text: numeric.text, confidence: numeric.confidence, enhancement: 'contrast', kind: `attributes-column-${column.id}:numeric-strip` });

    let columnText = numeric.text;
    let bestConfidence = numeric.confidence;

    // O caminho principal lê somente os badges numéricos. Se os 10/9/7 valores
    // vierem completos, não processamos rótulos nem repetimos OCR da coluna.
    // Se faltar qualquer valor, caímos para o leitor amplo legado daquela coluna.
    if (numericCount !== column.expected) {
      const zone = nestedZone(macro, column);
      const primaryImage = await cropImage(file, zone, 1380, 'inverted');
      if (primaryImage === file) throw new Error(`Não foi possível recortar ${plan.label} (${column.id}).`);
      const primary = await recognizeWithOcrWorker(primaryImage, {
        label: `${plan.label} • coluna ${column.id}`,
        kind: 'table',
        cacheKey: `${cacheBase}:column:${column.id}:inverted:table`,
        timeoutMs: 9_000
      });
      passes.push({ text: primary.text, confidence: primary.confidence, enhancement: 'inverted', kind: `attributes-column-${column.id}:inverted` });
      const primaryCount = numericTokens(primary.text, 35, 110).length;

      const candidates = [
        { text: numeric.text, confidence: numeric.confidence, count: numericCount },
        { text: primary.text, confidence: primary.confidence, count: primaryCount }
      ];

      if (primaryCount < Math.max(4, column.expected - 2)) {
        const retryImage = await cropImage(file, zone, 1380, 'color');
        if (retryImage !== file) {
          const retry = await recognizeWithOcrWorker(retryImage, {
            label: `${plan.label} • coluna ${column.id} • conferência`,
            kind: 'table',
            cacheKey: `${cacheBase}:column:${column.id}:color:table`,
            timeoutMs: 8_000
          }).catch(() => null);
          if (retry) {
            passes.push({ text: retry.text, confidence: retry.confidence, enhancement: 'color', kind: `attributes-column-${column.id}:color` });
            candidates.push({ text: retry.text, confidence: retry.confidence, count: numericTokens(retry.text, 35, 110).length });
          }
        }
      }

      const exact = candidates.filter((candidate) => candidate.count === column.expected).sort((a, b) => b.confidence - a.confidence)[0];
      const best = exact ?? candidates.sort((a, b) => b.count - a.count || b.confidence - a.confidence)[0];
      columnText = best?.text ?? '';
      bestConfidence = best?.confidence ?? 0;
    }

    if (columnText.trim()) texts.push(columnText);
    confidences.push(bestConfidence);
  }

  const text = mergeOcrTexts(...texts);
  const confidence = confidences.length
    ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length)
    : 0;
  return buildReading(plan, text, confidence, 'contrast', passes);
}

async function readMacro(file: File | Blob, macro: EfhubCalibrationZone, plan: MacroPlan, cacheBase: string): Promise<PremiumZoneReading> {
  if (plan.id === 'attributes') return readAttributeMacro(file, macro, plan, cacheBase);
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
  // O macro de atributos já possui conferência independente por coluna.
  if (plan.id === 'attributes') return reading;
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
 * Compatibilidade histórica preservada no nome da função; o mapa atual possui nove quadrados primários.
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
