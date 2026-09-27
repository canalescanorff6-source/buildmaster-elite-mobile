import type { CardEvidenceStateR419, ParsedCard } from '../../lib/analyzerDomain';

export const CARD_TRUTH_LAYER_R501_VERSION = '40.80-r501-card-truth-layer-v1' as const;

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
  const declared = Number(parsed.evidence?.attributeCount ?? 0);
  const actual = Object.values(parsed.attributes ?? {}).filter((value) => Number.isFinite(Number(value))).length;
  const count = Math.max(Number.isFinite(declared) ? Math.max(0, Math.floor(declared)) : 0, actual);
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
