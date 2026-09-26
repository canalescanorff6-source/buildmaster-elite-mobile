import type {
  EvidenceAvailabilityR489,
  ExplainableAuthorityR489,
  ExplainableAvailabilityR489,
  ExplainableDecisionInputR489,
  ExplainableDecisionR489
} from './explainableDecisionTypesR489';

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

function fingerprintR489(input: ExplainableDecisionInputR489): string {
  const availability = AVAILABILITY_KEYS_R489
    .map((key) => `${sourceLabelR489(key)}:${input.availability[key]}`)
    .join('|');
  const decisionId = String(input.decisionId || '').trim() || 'SEM_ID';
  return `R489:${input.kind}:${decisionId}:${availability}`;
}

export function buildExplainableDecisionR489(
  input: ExplainableDecisionInputR489
): ExplainableDecisionR489 {
  const availability: ExplainableAvailabilityR489 = { ...input.availability };
  const limitations = availabilityLimitationsR489(availability);

  return {
    version: EXPLAINABLE_AI_R489_VERSION,
    kind: input.kind,
    verdict: String(input.verdict || '').trim(),
    decisionConfidence: String(input.decisionId || '').trim() ? 35 : 0,
    performanceConfidence: null,
    evidenceState: 'INSUFFICIENT',
    availability,
    reasons: [],
    evidence: [],
    benefits: [],
    tradeOffs: [],
    risks: [],
    alternatives: [],
    counterfactual: {
      available: false,
      explanation: null,
      evidenceIds: []
    },
    limitations,
    fingerprint: fingerprintR489(input),
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
