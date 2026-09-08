import type { AnalysisResult, PositionCode } from '@/lib/analyzerDomain';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { MAX_PLAYER_TRAINING_BUDGET, MIN_PLAYER_TRAINING_BUDGET, inferPointsFromCardLevel } from '@/modules/builds/pointBudget';
import { trainingTotalCost } from '@/lib/trainingPlanCore';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';
import { buildProductionOcrEvidenceTextR132, buildReviewHydrationR132 } from './cardOcrEvidenceBoundaryR132';
import type { DetailedValue } from './detailedPrintReader';
import type { SingleFieldEvidence, SinglePrintSession } from './singlePrintPro';

export const CARD_STRUCTURED_EVIDENCE_BOUNDARY_R133_VERSION = 'r133-structured-evidence-boundary-1';

function fieldByKey(session: SinglePrintSession | null, key: SingleFieldEvidence['key']) {
  return session?.fields.find((field) => field.key === key) ?? null;
}

const POSITION_CODES = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'] as const;
const TRAINING_LABELS = ['Finalização', 'Passe', 'Drible', 'Destreza', 'Força nas pernas', 'Bola aérea', 'Defesa'] as const;

function normalize(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function confirmedField(session: SinglePrintSession, key: SingleFieldEvidence['key']) {
  const field = fieldByKey(session, key);
  return field?.status === 'confirmed' && field.value ? field : null;
}

function confirmedTrainingPointsField(session: SinglePrintSession) {
  const field = confirmedField(session, 'points');
  const value = Number(field?.numericValue ?? field?.value ?? NaN);
  return field && Number.isFinite(value) && value >= MIN_PLAYER_TRAINING_BUDGET && value <= MAX_PLAYER_TRAINING_BUDGET ? field : null;
}

function confirmedZone(readings: PremiumZoneReading[], keys: Array<PremiumZoneReading['key']>) {
  return readings.some((item) => keys.includes(item.key) && item.status === 'confirmed' && item.text.trim());
}

function detailedConfirmed(value: DetailedValue | null | undefined) {
  return value?.status === 'confirmed' && value.value ? value : null;
}

function isControlledScalarLine(line: string) {
  return /^(?:NOME DO JOGADOR|NOME|POSI[CÇ][AÃ]O PRINCIPAL|ESTILO DE JOGO(?: OFENSIVO| DEFENSIVO)?|GER|OVERALL|N[IÍ]VEL M[AÁ]XIMO|PONTOS TOTAIS|TIPO DA CARTA)\s*:/i.test(line);
}

function isPositionRatingLine(line: string) {
  return new RegExp(`^(?:${POSITION_CODES.join('|')})\\s*:\\s*\\d{2,3}\\s*$`, 'i').test(line);
}

function isTrainingLine(line: string) {
  const label = line.split(':')[0] ?? '';
  return TRAINING_LABELS.some((candidate) => normalize(candidate) === normalize(label)) && /:\s*\d{1,2}\s*$/.test(line);
}

function stripUntrustedStructuredLinesR133(text: string) {
  const output: string[] = [];
  let inProgression = false;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^PROGRESS[AÃ]O AUTOM[AÁ]TICA LIDA\s*:/i.test(line)) {
      inProgression = true;
      continue;
    }
    if (inProgression) {
      if (isTrainingLine(line)) continue;
      inProgression = false;
    }
    if (isControlledScalarLine(line)) continue;
    if (isPositionRatingLine(line)) continue;
    output.push(line);
  }
  return output.join('\n');
}

export type PositionRatingEvidenceR133 = {
  code: PositionCode;
  value: number;
  confidence: number;
  status: DetailedValue['status'];
};

export function positionRatingEvidenceR133(session: SinglePrintSession): PositionRatingEvidenceR133[] {
  return session.detailedReading.positionRatings
    .filter((item) => POSITION_CODES.includes(item.label as (typeof POSITION_CODES)[number]))
    .map((item) => ({
      code: item.label as PositionCode,
      value: Number(item.numericValue ?? item.value),
      confidence: item.confidence,
      status: item.status
    }))
    .filter((item) => Number.isFinite(item.value) && item.value >= 40 && item.value <= 110);
}

export function trustedPositionRatingsR133(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  if (!confirmedZone(readings, ['positionGrid'])) return [];
  return positionRatingEvidenceR133(session).filter((item) => item.status === 'confirmed');
}

export function reviewPositionRatingsR133(session: SinglePrintSession) {
  return positionRatingEvidenceR133(session).filter((item) => item.status !== 'confirmed');
}

export function progressionCostR133(sequence: DetailedValue[]) {
  return sequence.reduce((sum, item) => {
    const level = Number(item.numericValue ?? item.value);
    return sum + (Number.isFinite(level) && level >= 0 && level <= 16 ? trainingTotalCost(level) : 0);
  }, 0);
}

export function trustedProgressionSequenceR133(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  if (!confirmedZone(readings, ['progression', 'autoTraining'])) return [];
  const sequence = session.detailedReading.progressionSequence;
  if (sequence.length !== TRAINING_LABELS.length) return [];
  const byLabel = new Map(sequence.map((item) => [normalize(item.label), item] as const));
  const ordered = TRAINING_LABELS.map((label) => byLabel.get(normalize(label))).filter((item): item is DetailedValue => Boolean(item));
  if (ordered.length !== TRAINING_LABELS.length || ordered.some((item) => item.status !== 'confirmed')) return [];
  const cost = progressionCostR133(ordered);
  if (cost < MIN_PLAYER_TRAINING_BUDGET || cost > MAX_PLAYER_TRAINING_BUDGET) return [];
  const levelField = confirmedField(session, 'level');
  const levelBudget = inferPointsFromCardLevel(Number(levelField?.numericValue ?? levelField?.value ?? 0));
  const pointsField = confirmedTrainingPointsField(session);
  const expectedBudget = Number(pointsField?.numericValue ?? pointsField?.value ?? levelBudget ?? 0);
  if (expectedBudget > 0 && Math.abs(cost - expectedBudget) > 4) return [];
  return ordered;
}

export function structuredReviewSummaryR133(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const scalarReview = session.fields.filter((item) => item.status === 'review' && ['playerName', 'position', 'playstyle', 'level', 'points', 'cardType'].includes(item.key));
  const positionReview = reviewPositionRatingsR133(session);
  const progressionTrusted = trustedProgressionSequenceR133(session, readings);
  return {
    scalarReview,
    positionReview,
    progressionTrusted: progressionTrusted.length === TRAINING_LABELS.length,
    progressionNeedsReview: session.detailedReading.progressionSequence.length > 0 && progressionTrusted.length === 0
  };
}

/**
 * Texto de produção R133. Primeiro aplica a fronteira granular R132 (atributos e
 * habilidades) e depois remove identidade/grade/progressão que não possuam
 * evidência confirmada. Dados em review continuam na sessão para auditoria.
 */
export function buildProductionOcrEvidenceTextR133(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const r132 = buildProductionOcrEvidenceTextR132(session.canonicalText, session.detailedReading, []);
  const base = stripUntrustedStructuredLinesR133(r132);
  const lines: string[] = [base, '[EVIDÊNCIA ESTRUTURADA R133]'];

  const name = confirmedField(session, 'playerName');
  const position = confirmedField(session, 'position');
  const playstyle = confirmedField(session, 'playstyle');
  const overall = confirmedField(session, 'overall');
  const level = confirmedField(session, 'level');
  const points = confirmedTrainingPointsField(session);
  const cardType = confirmedField(session, 'cardType');

  if (name) lines.push(`NOME DO JOGADOR: ${name.value}`);
  if (position) lines.push(`POSIÇÃO PRINCIPAL: ${position.value}`);

  const playstyleZoneConfirmed = confirmedZone(readings, ['playstyle']);
  const offensive = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;
  const defensive = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;
  if (offensive) lines.push(`ESTILO DE JOGO OFENSIVO: ${offensive.value}`);
  else if (playstyle) lines.push(`ESTILO DE JOGO: ${playstyle.value}`);
  if (defensive) lines.push(`ESTILO DE JOGO DEFENSIVO: ${defensive.value}`);

  if (overall) lines.push(`GER: ${overall.value}`);
  if (level) lines.push(`NÍVEL MÁXIMO: ${level.value}`);
  if (points) lines.push(`PONTOS TOTAIS: ${points.value}`);
  if (cardType) lines.push(`TIPO DA CARTA: ${cardType.value}`);

  for (const rating of trustedPositionRatingsR133(session, readings)) lines.push(`${rating.code}: ${rating.value}`);

  const progression = trustedProgressionSequenceR133(session, readings);
  if (progression.length) {
    lines.push('PROGRESSÃO AUTOMÁTICA LIDA:');
    for (const item of progression) lines.push(`${item.label}: ${item.numericValue ?? item.value}`);
  }
  lines.push('[FIM EVIDÊNCIA ESTRUTURADA R133]');
  return lines.filter(Boolean).join('\n');
}

export function buildReviewHydrationR133(nextResult: AnalysisResult, session?: SinglePrintSession | null) {
  const hydration = buildReviewHydrationR132(nextResult, session);
  if (!session) return hydration;

  const name = confirmedField(session, 'playerName');
  const position = confirmedField(session, 'position');
  const playstyle = confirmedField(session, 'playstyle');
  const level = confirmedField(session, 'level');
  const points = confirmedTrainingPointsField(session);
  const levelNumber = Number(level?.numericValue ?? level?.value ?? 0);
  const inferredPoints = levelNumber > 0 ? inferPointsFromCardLevel(levelNumber) : null;
  const defensive = playstyle ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;
  const offensive = playstyle ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;

  return {
    ...hydration,
    manualFields: {
      ...hydration.manualFields,
      playerName: name?.value ?? '',
      level: level?.value ?? '',
      trainingPointsTotal: points?.value ?? (inferredPoints ? String(inferredPoints) : '')
    },
    suggestedCardPosition: (position?.value as PositionCode | undefined) ?? 'AUTO',
    suggestedOffensivePlaystyle: offensive?.value ?? playstyle?.value ?? 'AUTO',
    suggestedDefensivePlaystyle: defensive?.value ?? 'AUTO'
  };
}

export function buildPreFinalConfirmationR133(input: {
  result: AnalysisResult;
  session: SinglePrintSession;
  manualFields: ManualFields;
  preview: string | null;
}) {
  const { result, session, manualFields, preview } = input;
  const name = manualFields.playerName.trim() || confirmedField(session, 'playerName')?.value || '';
  const levelField = confirmedField(session, 'level');
  const pointsField = confirmedTrainingPointsField(session);
  const level = manualFields.level.trim() || levelField?.value || '';
  const manualPoints = manualFields.trainingPointsTotal.trim();
  const inferred = inferPointsFromCardLevel(Number(level || 0));
  const trustedTrainingRead = result.parsed.trainingPointSource === 'TRAINING_READ' && result.trainingPointsTotal > 0;
  const points = manualPoints
    || pointsField?.value
    || (inferred ? String(inferred) : '')
    || (trustedTrainingRead ? String(result.trainingPointsTotal) : '');

  return { playerName: name, level, points, preview };
}
