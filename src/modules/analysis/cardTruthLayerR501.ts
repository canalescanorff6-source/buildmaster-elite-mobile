import type { CardEvidenceStateR419, ParsedCard } from '../../lib/analyzerDomain';
import { ATTRIBUTE_PT } from '../../lib/analyzerDomain';

export const CARD_TRUTH_LAYER_R501_VERSION = '40.80-r501-card-truth-layer-v2' as const;

export function normalizeConfidenceR501(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const normalized = numeric >= 0 && numeric < 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, normalized));
}

export function confidenceAtLeastR501(value: unknown, minimumPercent: number): boolean {
  return normalizeConfidenceR501(value) >= Math.max(0, Math.min(100, minimumPercent));
}

export type CriticalAttributeEvidenceR501 = {
  state: CardEvidenceStateR419;
  count: number;
  minimum: number;
  coveragePercent: number;
  reasons: string[];
};

export function deriveCriticalAttributeEvidenceR501(parsed: ParsedCard): CriticalAttributeEvidenceR501 {
  // A declared OCR count is metadata; only actual, valid attribute values can
  // authorize training. Otherwise a stale count can certify an empty card.
  const count = Object.entries(parsed.attributes ?? {}).filter(([key, value]) =>
    Object.prototype.hasOwnProperty.call(ATTRIBUTE_PT, key)
    && typeof value === 'number'
    && Number.isFinite(value)
    && value >= 1
    && value <= 110
  ).length;
  const minimum = parsed.mainPosition === 'GK' ? 4 : 10;
  const coveragePercent = Math.max(0, Math.min(100, Math.round((count / minimum) * 100)));

  if (count === 0) {
    return {
      state: 'MISSING',
      count,
      minimum,
      coveragePercent,
      reasons: [`Cobertura crítica ausente: 0/${minimum} atributos mínimos.`],
    };
  }
  if (count < minimum) {
    return {
      state: 'UNCERTAIN',
      count,
      minimum,
      coveragePercent,
      reasons: [`Cobertura crítica parcial: ${count}/${minimum} atributos mínimos.`],
    };
  }
  return {
    state: 'TRUSTED',
    count,
    minimum,
    coveragePercent,
    reasons: [`Cobertura crítica mínima atendida: ${count}/${minimum}.`],
  };
}

export type CardTruthCertificationStateR501 =
  | 'FINAL_CERTIFIED'
  | 'PROVISIONAL_HIGH_CONFIDENCE'
  | 'PROVISIONAL_LOW_CONFIDENCE'
  | 'BLOCKED_INSUFFICIENT_DATA';

export type CardTruthCertificationR501 = {
  state: CardTruthCertificationStateR501;
  confidencePercent: number;
  criticalState: CardEvidenceStateR419;
  trainingBudgetState: CardEvidenceStateR419;
  levelState: CardEvidenceStateR419;
  canFinalize: boolean;
  reasons: string[];
};

function evidenceState(value: CardEvidenceStateR419 | undefined): CardEvidenceStateR419 {
  return value ?? 'MISSING';
}

export function deriveCardTruthCertificationR501(parsed: ParsedCard): CardTruthCertificationR501 {
  const confidencePercent = normalizeConfidenceR501(parsed.confidence);
  const criticalState = evidenceState(parsed.evidence?.criticalStateR419);
  const trainingBudgetState = evidenceState(parsed.evidence?.trainingBudgetStateR419);
  const levelState = evidenceState(parsed.evidence?.levelStateR419);
  const reasons = [...(parsed.evidence?.criticalReasonsR419 ?? [])];
  const attributeEvidence = deriveCriticalAttributeEvidenceR501(parsed);
  const totalAttributes = Object.keys(ATTRIBUTE_PT).length;
  const completeAttributes = attributeEvidence.count === totalAttributes;

  if (trainingBudgetState !== 'TRUSTED') {
    reasons.push(`Orçamento de progressão não confiável: ${trainingBudgetState}.`);
    return {
      state: 'BLOCKED_INSUFFICIENT_DATA',
      confidencePercent,
      criticalState,
      trainingBudgetState,
      levelState,
      canFinalize: false,
      reasons: [...new Set(reasons)],
    };
  }

  const identityPresent = Boolean(String(parsed.playerName ?? '').trim())
    && Boolean(parsed.mainPosition)
    && Boolean(String(parsed.playstyle ?? '').trim());
  const identityLocked = Boolean(parsed.manualConfirmed)
    || (parsed.evidence?.positionLocked === true && parsed.evidence?.playstyleLocked === true);

  if (criticalState === 'TRUSTED'
      && completeAttributes
      && levelState === 'TRUSTED'
      && identityPresent
      && identityLocked
      && confidencePercent >= 90) {
    reasons.push('Todos os atributos, identidade, nível e PP atingiram o contrato final R501.');
    return {
      state: 'FINAL_CERTIFIED',
      confidencePercent,
      criticalState,
      trainingBudgetState,
      levelState,
      canFinalize: true,
      reasons: [...new Set(reasons)],
    };
  }

  if (criticalState === 'MISSING' || !identityPresent) {
    reasons.push(criticalState === 'MISSING'
      ? 'Atributos críticos ainda estão ausentes; resultado permanece provisório.'
      : 'Identidade crítica da carta está incompleta; resultado permanece provisório.');
    return {
      state: 'PROVISIONAL_LOW_CONFIDENCE',
      confidencePercent,
      criticalState,
      trainingBudgetState,
      levelState,
      canFinalize: false,
      reasons: [...new Set(reasons)],
    };
  }

  if (criticalState === 'CONFLICTING') {
    reasons.push('Há evidência crítica conflitante; certificação final bloqueada.');
    return {
      state: 'BLOCKED_INSUFFICIENT_DATA',
      confidencePercent,
      criticalState,
      trainingBudgetState,
      levelState,
      canFinalize: false,
      reasons: [...new Set(reasons)],
    };
  }

  if (criticalState === 'UNCERTAIN' || !completeAttributes || !identityLocked || levelState !== 'TRUSTED' || confidencePercent < 90) {
    if (!completeAttributes) reasons.push(`Leitura parcial: ${attributeEvidence.count}/${totalAttributes} atributos reais; a ficha permanece provisória.`);
    reasons.push('A carta possui dados úteis, mas ainda não atende todos os requisitos de certificação final.');
    return {
      state: confidencePercent >= 60 ? 'PROVISIONAL_HIGH_CONFIDENCE' : 'PROVISIONAL_LOW_CONFIDENCE',
      confidencePercent,
      criticalState,
      trainingBudgetState,
      levelState,
      canFinalize: false,
      reasons: [...new Set(reasons)],
    };
  }

  return {
    state: 'PROVISIONAL_LOW_CONFIDENCE',
    confidencePercent,
    criticalState,
    trainingBudgetState,
    levelState,
    canFinalize: false,
    reasons: [...new Set([...reasons, 'A carta ainda não possui evidência suficiente para certificação final.'])],
  };
}
