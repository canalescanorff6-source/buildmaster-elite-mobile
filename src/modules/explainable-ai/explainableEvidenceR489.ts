import type {
  EvidenceFamilyR489,
  EvidenceSourceR489,
  ExplainableEvidenceR489
} from './explainableDecisionTypesR489';

export type WeightPartsR489 = {
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
};

export type EvidenceOriginR489 =
  | 'INDEPENDENT'
  | 'SAME_R480_CLAIM'
  | 'R481_ROTATION_DERIVED'
  | 'CHEMISTRY_ONLY'
  | 'CONFIRMED_MATCH';

export function clamp01R489(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function normalizeConfidenceR489(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp01R489(value > 1 ? value / 100 : value);
}

function roundWeightR489(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function effectiveWeightR489(parts: WeightPartsR489): number {
  return roundWeightR489(
    normalizeConfidenceR489(parts.nativeConfidence)
      * clamp01R489(parts.relevance)
      * clamp01R489(parts.independence)
      * clamp01R489(parts.completeness)
  );
}

export function independenceForR489(
  source: EvidenceSourceR489,
  origin: EvidenceOriginR489
): number {
  if (source === 'R481' && origin === 'SAME_R480_CLAIM') return 0.75;
  if (source === 'R484' && origin === 'R481_ROTATION_DERIVED') return 0.65;
  if (source === 'R484' && origin === 'CHEMISTRY_ONLY') return 1;
  if (source === 'R482' && origin === 'CONFIRMED_MATCH') return 1;
  return 1;
}

type DiversityEvidenceR489 = Pick<ExplainableEvidenceR489, 'family' | 'independence' | 'relevance'>;

export function familyDiversityR489(evidence: DiversityEvidenceR489[]): number {
  const independentFamilies = new Set<EvidenceFamilyR489>();
  for (const item of evidence) {
    if (clamp01R489(item.relevance) <= 0) continue;
    if (clamp01R489(item.independence) < 0.999) continue;
    independentFamilies.add(item.family);
  }
  return independentFamilies.size;
}

export function confidenceCeilingR489(independentFamilies: number): number {
  const count = Math.max(0, Math.floor(Number.isFinite(independentFamilies) ? independentFamilies : 0));
  if (count === 0) return 35;
  if (count === 1) return 65;
  if (count === 2) return 82;
  return 100;
}

export function evidenceConfidenceR489(evidence: ExplainableEvidenceR489[]): number | null {
  const relevant = evidence.filter((item) => item.relevance > 0 && item.effectiveWeight > 0);
  if (!relevant.length) return null;
  const totalWeight = relevant.reduce((sum, item) => sum + item.effectiveWeight, 0);
  const weighted = relevant.reduce(
    (sum, item) => sum + normalizeConfidenceR489(item.nativeConfidence) * item.effectiveWeight,
    0
  );
  if (totalWeight <= 0) return null;
  const raw = Math.round((weighted / totalWeight) * 100);
  return Math.min(raw, confidenceCeilingR489(familyDiversityR489(relevant)));
}
