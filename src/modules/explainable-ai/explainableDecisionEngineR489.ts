import type {
  EvidenceAvailabilityR489,
  ExplainableAuthorityR489,
  ExplainableAvailabilityR489,
  ExplainableDecisionInputR489,
  ExplainableDecisionR489,
  ExplainableEvidenceR489,
  ExplainableReasonR489
} from './explainableDecisionTypesR489';
import { buildExplainablePiecesR489, type ExplainablePiecesR489 } from './explainableDecisionBuildersR489';
import { evidenceConfidenceR489 } from './explainableEvidenceR489';

export const EXPLAINABLE_AI_R489_VERSION = '40.80-r489-explainable-ai-v1' as const;

const AUTHORITY_R489: ExplainableAuthorityR489 = {
  readOnly: true,
  canWriteTraining: false,
  canWriteSkills: false,
  canWriteImpetus: false,
  canChangePosition: false,
  canChangeLineupAutomatically: false,
  canConfirmMatchMarkersAutomatically: false,
  canWriteVault: false,
  canOverrideR119: false,
  canOverrideR126: false,
  canOverrideR128: false,
  optimizeOverall: false
};

const AVAILABILITY_KEYS_R489 = ['r480', 'r481', 'r482', 'r483', 'r484'] as const;
const REASON_TYPE_ORDER_R489: Record<ExplainableReasonR489['type'], number> = {
  CONTRADICTION: 0,
  RISK: 1,
  TRADE_OFF: 2,
  BENEFIT: 3
};

function sourceLabelR489(key: typeof AVAILABILITY_KEYS_R489[number]): string {
  return key.toUpperCase();
}

function availabilityLimitationsR489(availability: ExplainableAvailabilityR489): string[] {
  return AVAILABILITY_KEYS_R489.flatMap((key) => {
    const state: EvidenceAvailabilityR489 = availability[key];
    if (state === 'BLOCKED') {
      return [`${sourceLabelR489(key)} bloqueado para esta explicação; a decisão original permanece intacta.`];
    }
    if (state === 'UNAVAILABLE') {
      return [`${sourceLabelR489(key)} indisponível para esta explicação; nenhuma evidência foi inferida no lugar.`];
    }
    return [];
  });
}

function uniqueStringsR489(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function sourceVersionsR489(input: ExplainableDecisionInputR489): string[] {
  const versions: string[] = [];
  if (input.kind === 'BUILD' && input.buildSimulator?.version) versions.push(`R483:${input.buildSimulator.version}`);
  if (input.kind === 'STARTER') {
    if (input.squadBrain?.version) versions.push(`R481:${input.squadBrain.version}`);
    if (input.chemistry?.version) versions.push(`R484:${input.chemistry.version}`);
  }
  if (input.kind === 'ROTATION') {
    if (input.tacticalTwin?.version) versions.push(`R480:${input.tacticalTwin.version}`);
    if (input.squadBrain?.version) versions.push(`R481:${input.squadBrain.version}`);
    if (input.chemistry?.version) versions.push(`R484:${input.chemistry.version}`);
  }
  if (input.kind === 'TACTICAL') {
    if (input.tacticalTwin?.version) versions.push(`R480:${input.tacticalTwin.version}`);
    if (input.squadBrain?.version) versions.push(`R481:${input.squadBrain.version}`);
    if (input.chemistry?.version) versions.push(`R484:${input.chemistry.version}`);
  }
  if (input.kind === 'MATCH' && input.matchVision?.version) versions.push(`R482:${input.matchVision.version}`);
  return versions.sort();
}

function fingerprintR489(
  input: ExplainableDecisionInputR489,
  evidence: ExplainableEvidenceR489[]
): string {
  const availability = AVAILABILITY_KEYS_R489
    .map((key) => `${sourceLabelR489(key)}:${input.availability[key]}`)
    .join('|');
  const decisionId = String(input.decisionId || '').trim() || 'SEM_ID';
  const versions = sourceVersionsR489(input).join(',') || 'SEM_VERSAO_FONTE';
  const evidenceTokens = evidence
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((item) => `${item.id}@${item.fingerprint}`)
    .join(',') || 'SEM_EVIDENCIA';
  return `R489:${input.kind}:${decisionId}:${availability}:${versions}:${evidenceTokens}`;
}

function buildFingerprintMismatchR489(input: ExplainableDecisionInputR489): string | null {
  if (input.kind !== 'BUILD' || !input.buildSimulator) return null;
  const decisionId = String(input.decisionId || '').trim();
  const baselineFingerprint = String(input.buildSimulator.baselineFingerprint || '').trim();
  if (!decisionId || !baselineFingerprint || decisionId === baselineFingerprint) return null;
  return `Fingerprint incompatível: a decisão oficial ${decisionId} não corresponde ao baseline R483 ${baselineFingerprint}. A explicação foi degradada sem corrigir a origem.`;
}

function emptyPiecesR489(limitation: string): ExplainablePiecesR489 {
  return {
    evidence: [],
    reasons: [],
    benefits: [],
    tradeOffs: [],
    risks: [],
    alternatives: [],
    limitations: [limitation]
  };
}

function evidenceStrengthForReasonR489(
  reason: ExplainableReasonR489,
  byId: Map<string, ExplainableEvidenceR489>
): number {
  return reason.evidenceIds.reduce((sum, id) => sum + (byId.get(id)?.effectiveWeight ?? 0), 0);
}

function stableReasonKeyR489(reason: ExplainableReasonR489): string {
  return `${reason.type}|${reason.title}|${reason.explanation}|${reason.evidenceIds.slice().sort().join(',')}`;
}

function rankReasonsR489(
  reasons: ExplainableReasonR489[],
  evidence: ExplainableEvidenceR489[]
): ExplainableReasonR489[] {
  const byId = new Map(evidence.map((item) => [item.id, item] as const));
  return reasons
    .slice()
    .sort((left, right) => {
      if (right.impact !== left.impact) return right.impact - left.impact;
      const evidenceDelta = evidenceStrengthForReasonR489(right, byId) - evidenceStrengthForReasonR489(left, byId);
      if (Math.abs(evidenceDelta) > 0.000001) return evidenceDelta > 0 ? 1 : -1;
      const typeDelta = REASON_TYPE_ORDER_R489[left.type] - REASON_TYPE_ORDER_R489[right.type];
      if (typeDelta !== 0) return typeDelta;
      return stableReasonKeyR489(left).localeCompare(stableReasonKeyR489(right));
    })
    .slice(0, 5)
    .map((reason, index) => ({ ...reason, rank: index + 1 }));
}

function contradictionReasonsR489(
  reasons: ExplainableReasonR489[],
  evidence: ExplainableEvidenceR489[]
): ExplainableReasonR489[] {
  const byId = new Map(evidence.map((item) => [item.id, item] as const));
  const benefit = reasons
    .filter((reason) => reason.type === 'BENEFIT')
    .sort((left, right) => right.impact - left.impact || stableReasonKeyR489(left).localeCompare(stableReasonKeyR489(right)))[0];
  const cost = reasons
    .filter((reason) => reason.type === 'TRADE_OFF' || reason.type === 'RISK')
    .sort((left, right) => right.impact - left.impact || stableReasonKeyR489(left).localeCompare(stableReasonKeyR489(right)))[0];
  if (!benefit || !cost) return [];

  const benefitSources = new Set(benefit.evidenceIds.map((id) => byId.get(id)?.source).filter(Boolean));
  const costSources = new Set(cost.evidenceIds.map((id) => byId.get(id)?.source).filter(Boolean));
  const distinctSources = Array.from(benefitSources).some((source) => !costSources.has(source));
  if (!distinctSources) return [];

  const evidenceIds = uniqueStringsR489([...benefit.evidenceIds, ...cost.evidenceIds]);
  return [{
    rank: 0,
    type: 'CONTRADICTION',
    title: 'Benefício funcional com custo estrutural',
    explanation: `${benefit.title} é sustentado por uma fonte, mas ${cost.title.toLocaleLowerCase('pt-BR')} registra um custo concorrente. O R489 mantém os dois lados explícitos em vez de transformar o conflito em uma média silenciosa.`,
    evidenceIds,
    impact: Math.max(benefit.impact, cost.impact)
  }];
}

function counterfactualR489(
  input: ExplainableDecisionInputR489,
  evidence: ExplainableEvidenceR489[],
  alternatives: string[]
): ExplainableDecisionR489['counterfactual'] {
  if (input.kind === 'BUILD' && alternatives.length) {
    const candidate = evidence
      .filter((item) => item.source === 'R483' && item.family === 'BUILD_ALTERNATIVES')
      .sort((left, right) => left.id.localeCompare(right.id))[0];
    if (candidate) {
      const alternative = alternatives.find((item) => candidate.claim.includes(item.split(':')[0] ?? '')) ?? alternatives[0];
      return {
        available: true,
        explanation: `Se a alternativa ${alternative} fosse considerada, ela continuaria apenas como comparação; a ficha oficial não seria substituída automaticamente.`,
        evidenceIds: [candidate.id]
      };
    }
  }

  if (input.kind === 'ROTATION') {
    const candidate = evidence
      .filter((item) => item.source === 'R481' && item.id.startsWith('R481:rotation:'))
      .sort((left, right) => left.id.localeCompare(right.id))[0];
    if (candidate) {
      return {
        available: true,
        explanation: `Se a rotação confirmada no R481 fosse utilizada, o efeito descrito seria: ${candidate.claim}`,
        evidenceIds: [candidate.id]
      };
    }
  }

  if (input.kind === 'TACTICAL') {
    const candidate = evidence
      .filter((item) => item.source === 'R480' && item.id.startsWith('R480:scenario:'))
      .sort((left, right) => left.id.localeCompare(right.id))[0];
    if (candidate) {
      return {
        available: true,
        explanation: `No cenário real do R480, a alternativa observável é: ${candidate.claim}`,
        evidenceIds: [candidate.id]
      };
    }
  }

  return { available: false, explanation: null, evidenceIds: [] };
}

export function buildExplainableDecisionR489(
  input: ExplainableDecisionInputR489
): ExplainableDecisionR489 {
  const availability: ExplainableAvailabilityR489 = { ...input.availability };
  const fingerprintMismatch = buildFingerprintMismatchR489(input);
  const pieces = fingerprintMismatch
    ? emptyPiecesR489(fingerprintMismatch)
    : buildExplainablePiecesR489(input);
  const evidenceIds = new Set(pieces.evidence.map((item) => item.id));
  const linkedReasons = pieces.reasons.filter(
    (reason) => reason.evidenceIds.length > 0 && reason.evidenceIds.every((id) => evidenceIds.has(id))
  );
  const contradictions = contradictionReasonsR489(linkedReasons, pieces.evidence);
  const reasons = rankReasonsR489([...linkedReasons, ...contradictions], pieces.evidence);
  const limitations = uniqueStringsR489([
    ...availabilityLimitationsR489(availability),
    ...pieces.limitations
  ]);
  const basePerformanceConfidence = evidenceConfidenceR489(pieces.evidence);
  const contradictionPenalty = Math.min(24, contradictions.length * 8);
  const performanceConfidence = basePerformanceConfidence == null
    ? null
    : Math.max(0, basePerformanceConfidence - contradictionPenalty);
  const availabilityPenalty = Math.min(25, availabilityLimitationsR489(availability).length * 5);
  const decisionConfidence = String(input.decisionId || '').trim()
    ? Math.max(35, 92 - availabilityPenalty - contradictionPenalty)
    : 0;
  const evidenceState: ExplainableDecisionR489['evidenceState'] = !pieces.evidence.length
    ? 'INSUFFICIENT'
    : limitations.length || contradictions.length
      ? 'PARTIAL'
      : 'FULL';
  const benefits = uniqueStringsR489(pieces.benefits).slice(0, 3);
  const tradeOffs = uniqueStringsR489(pieces.tradeOffs).slice(0, 3);
  const risks = uniqueStringsR489(pieces.risks).slice(0, 3);
  const alternatives = uniqueStringsR489(pieces.alternatives).slice(0, 3);

  return {
    version: EXPLAINABLE_AI_R489_VERSION,
    kind: input.kind,
    verdict: String(input.verdict || '').trim(),
    decisionConfidence,
    performanceConfidence,
    evidenceState,
    availability,
    reasons,
    evidence: pieces.evidence,
    benefits,
    tradeOffs,
    risks,
    alternatives,
    counterfactual: counterfactualR489(input, pieces.evidence, alternatives),
    limitations,
    fingerprint: fingerprintR489(input, pieces.evidence),
    authority: { ...AUTHORITY_R489 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R489 explica decisões existentes e não cria uma segunda autoridade.',
      'Sem evidência suficiente, desempenho permanece sem previsão numérica.'
    ]
  };
}

export type {
  EvidenceAvailabilityR489,
  ExplainableAvailabilityR489,
  ExplainableDecisionInputR489,
  ExplainableDecisionR489
} from './explainableDecisionTypesR489';
