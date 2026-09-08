import type { AnalysisResult } from '@/lib/analyzerDomain';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';
import {
  buildPreFinalConfirmationR133,
  buildProductionOcrEvidenceTextR133,
  buildReviewHydrationR133
} from './cardStructuredEvidenceBoundaryR133';
import type { DetailedValue } from './detailedPrintReader';
import type { SinglePrintSession } from './singlePrintPro';

export const CARD_PHYSICAL_PERMANENT_EVIDENCE_BOUNDARY_R134_VERSION = 'r134-physical-permanent-evidence-boundary-1';

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function confirmedZoneText(readings: PremiumZoneReading[], keys: Array<PremiumZoneReading['key']>) {
  return readings
    .filter((item) => keys.includes(item.key) && item.status === 'confirmed' && item.text.trim())
    .map((item) => item.text)
    .join('\n');
}

function numericValue(item: DetailedValue | null | undefined) {
  const value = Number(item?.numericValue ?? String(item?.value ?? '').match(/-?\d+(?:[,.]\d+)?/)?.[0]?.replace(',', '.') ?? NaN);
  return Number.isFinite(value) ? value : null;
}

function scalarPresentInZone(zoneText: string, labels: string[], item: DetailedValue | null | undefined) {
  if (!item || item.status !== 'confirmed' || !zoneText.trim()) return false;
  const normalizedZone = normalize(zoneText);
  const hasLabel = labels.some((label) => normalizedZone.includes(normalize(label)));
  if (!hasLabel) return false;
  const numeric = numericValue(item);
  if (numeric !== null) return new RegExp(`(?:^|\\D)${String(numeric).replace('.', '[.,]')}(?:\\D|$)`).test(zoneText);
  return normalizedZone.includes(normalize(item.value));
}

function detailedValuePresentInZone(zoneText: string, item: DetailedValue) {
  if (item.status !== 'confirmed' || !zoneText.trim()) return false;
  const normalizedZone = normalize(zoneText);
  const value = normalize(item.value);
  const label = normalize(item.label);
  if (value && normalizedZone.includes(value)) return true;
  if (label && normalizedZone.includes(label)) {
    const numeric = numericValue(item);
    return numeric === null || new RegExp(`(?:^|\\D)${String(numeric).replace('.', '[.,]')}(?:\\D|$)`).test(zoneText);
  }
  return false;
}

function controlledPhysicalLabels(session: SinglePrintSession) {
  return new Set([
    'altura', 'peso', 'idade', 'pe dominante', 'dominant foot',
    'pior pe frequencia', 'pior pe precisao', 'condicao fisica', 'resistencia a lesao',
    'tecnico', 'manager', 'bonus do tecnico', 'impeto', 'booster', 'reforco',
    ...session.detailedReading.physicalModel.map((item) => normalize(item.label))
  ]);
}

function stripUntrustedPhysicalPermanentLinesR134(text: string, session: SinglePrintSession) {
  const controlled = controlledPhysicalLabels(session);
  return String(text || '')
    .split(/\r?\n/)
    .filter((rawLine) => {
      const line = rawLine.trim();
      if (!line) return false;
      const colon = line.indexOf(':');
      if (colon < 0) return true;
      return !controlled.has(normalize(line.slice(0, colon)));
    })
    .join('\n');
}

export function trustedIdentityMetaR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const zoneText = confirmedZoneText(readings, ['identityMeta']);
  const identity = session.detailedReading.identity;
  return {
    height: scalarPresentInZone(zoneText, ['altura', 'height'], identity.height) ? identity.height : null,
    weight: scalarPresentInZone(zoneText, ['peso', 'weight'], identity.weight) ? identity.weight : null,
    age: scalarPresentInZone(zoneText, ['idade', 'age'], identity.age) ? identity.age : null
  };
}

export function trustedConditionR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const zoneText = confirmedZoneText(readings, ['condition']);
  if (!zoneText) return [];
  return session.detailedReading.condition.filter((item) => detailedValuePresentInZone(zoneText, item));
}

export function trustedImpetosR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const zoneText = confirmedZoneText(readings, ['impetos']);
  if (!zoneText) return [];
  return session.detailedReading.impetos.filter((item) => detailedValuePresentInZone(zoneText, item));
}

export function trustedPhysicalModelR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const zoneText = confirmedZoneText(readings, ['physicalModel']);
  if (!zoneText || session.detailedReading.coverage.physicalCount !== 16) return [];
  const trusted = session.detailedReading.physicalModel.filter((item) => item.status === 'confirmed');
  return trusted.length === 16 ? trusted : [];
}

export function physicalPermanentReviewSummaryR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const identity = trustedIdentityMetaR134(session, readings);
  const trustedCondition = trustedConditionR134(session, readings);
  const trustedImpetos = trustedImpetosR134(session, readings);
  const trustedPhysical = trustedPhysicalModelR134(session, readings);
  const detailed = session.detailedReading;
  return {
    identityNeedsReview: Boolean((detailed.identity.height || detailed.identity.weight || detailed.identity.age)
      && (!identity.height || !identity.weight || !identity.age)),
    conditionNeedsReview: detailed.condition.length > trustedCondition.length,
    impetosNeedReview: detailed.impetos.length > trustedImpetos.length,
    physicalNeedsReview: detailed.physicalModel.length > 0 && trustedPhysical.length !== 16,
    trustedConditionCount: trustedCondition.length,
    trustedImpetoCount: trustedImpetos.length,
    trustedPhysicalCount: trustedPhysical.length
  };
}

/**
 * Última fronteira antes da produção para dados físicos/permanentes. A R133
 * continua responsável por identidade estrutural/grade/progressão; a R134
 * remove altura, peso, idade, condição, Ímpetos, técnico e modelo físico que
 * tenham sobrevivido pelo texto canônico e reintroduz apenas evidência
 * individualmente confirmada na zona correta. Técnico lido do perfil nunca é
 * reinjetado: o contexto de técnico do app é escolhido separadamente.
 */
export function buildProductionOcrEvidenceTextR134(session: SinglePrintSession, readings: PremiumZoneReading[]) {
  const r133 = buildProductionOcrEvidenceTextR133(session, readings);
  const base = stripUntrustedPhysicalPermanentLinesR134(r133, session);
  const lines: string[] = [base, '[EVIDÊNCIA FÍSICA/PERMANENTE R134]'];

  const identity = trustedIdentityMetaR134(session, readings);
  if (identity.height) lines.push(`ALTURA: ${identity.height.value}`);
  if (identity.weight) lines.push(`PESO: ${identity.weight.value}`);
  if (identity.age) lines.push(`IDADE: ${identity.age.numericValue ?? identity.age.value}`);

  for (const item of trustedConditionR134(session, readings)) lines.push(`${item.label}: ${item.value}`);
  for (const item of trustedImpetosR134(session, readings)) lines.push(`ÍMPETO: ${item.value}`);
  for (const item of trustedPhysicalModelR134(session, readings)) lines.push(`${item.label}: ${item.value}`);

  lines.push('[FIM EVIDÊNCIA FÍSICA/PERMANENTE R134]');
  return lines.filter(Boolean).join('\n');
}

export function buildReviewHydrationR134(nextResult: AnalysisResult, session?: SinglePrintSession | null) {
  return buildReviewHydrationR133(nextResult, session);
}

export function buildPreFinalConfirmationR134(input: {
  result: AnalysisResult;
  session: SinglePrintSession;
  manualFields: ManualFields;
  preview: string | null;
}) {
  return buildPreFinalConfirmationR133(input);
}
