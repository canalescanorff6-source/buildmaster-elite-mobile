export const MATCH_VISION_ENGINE_VERSION_R482 = 'r482-match-vision-v1' as const;

export const MATCH_VISION_DIMENSIONS_R482 = [
  'ZONES',
  'LINES',
  'ISOLATION',
  'FORCED_PASSES',
  'POSSESSION_LOSSES',
  'INVOLVEMENT',
  'SPACE_OCCUPATION',
  'PROGRESSION',
  'PRESSING',
  'TRANSITIONS',
  'FINISHING',
  'OFF_BALL_MOVEMENT'
] as const;

export type MatchVisionDimensionR482 = (typeof MATCH_VISION_DIMENSIONS_R482)[number];
export type MatchVisionSourceKindR482 = 'VIDEO' | 'STRUCTURED_EVENT' | 'MANUAL_REVIEW';
export type MatchVisionEvidenceStateR482 = 'INSUFFICIENT' | 'PROVISIONAL' | 'EXPERIMENTAL_VALIDATED';

export type MatchVisionObservationR482 = {
  id: string;
  sourceId: string;
  sourceKind: MatchVisionSourceKindR482;
  dimension: MatchVisionDimensionR482;
  description: string;
  confidence: number;
  timestampMs?: number;
  zone?: string;
};

export type MatchVisionInputR482 = {
  matchId: string;
  observations: readonly MatchVisionObservationR482[];
};

export type MatchVisionDimensionFindingR482 = {
  dimension: MatchVisionDimensionR482;
  observationCount: number;
  confidence: number;
  evidenceIds: string[];
  sourceIds: string[];
  observations: string[];
};

export type MatchVisionAuthorityR482 = {
  readOnly: true;
  correlationalOnly: true;
  writesFinalCard: false;
  writesTop5: false;
  writesSkills: false;
  writesImpetus: false;
  overallGerUsed: false;
  certifiedForFinalWrite: false;
};

export type MatchVisionResultR482 = {
  engineVersion: typeof MATCH_VISION_ENGINE_VERSION_R482;
  matchId: string;
  evidenceState: MatchVisionEvidenceStateR482;
  completeness: number;
  confidence: number;
  sourceCount: number;
  observationCount: number;
  dimensions: MatchVisionDimensionFindingR482[];
  missingDimensions: MatchVisionDimensionR482[];
  definitive: false;
  authority: MatchVisionAuthorityR482;
  safeguards: string[];
};

const AUTHORITY_R482: MatchVisionAuthorityR482 = Object.freeze({
  readOnly: true,
  correlationalOnly: true,
  writesFinalCard: false,
  writesTop5: false,
  writesSkills: false,
  writesImpetus: false,
  overallGerUsed: false,
  certifiedForFinalWrite: false
});

const DIMENSION_ORDER = new Map<MatchVisionDimensionR482, number>(
  MATCH_VISION_DIMENSIONS_R482.map((dimension, index) => [dimension, index])
);

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeObservation(observation: MatchVisionObservationR482): MatchVisionObservationR482 {
  return {
    id: String(observation.id),
    sourceId: String(observation.sourceId),
    sourceKind: observation.sourceKind,
    dimension: observation.dimension,
    description: String(observation.description).trim(),
    confidence: clampConfidence(observation.confidence),
    ...(Number.isFinite(observation.timestampMs) ? { timestampMs: observation.timestampMs } : {}),
    ...(observation.zone ? { zone: String(observation.zone).trim() } : {})
  };
}

function compareObservation(a: MatchVisionObservationR482, b: MatchVisionObservationR482): number {
  const dimensionDelta = (DIMENSION_ORDER.get(a.dimension) ?? 999) - (DIMENSION_ORDER.get(b.dimension) ?? 999);
  if (dimensionDelta !== 0) return dimensionDelta;
  const sourceDelta = a.sourceId.localeCompare(b.sourceId);
  if (sourceDelta !== 0) return sourceDelta;
  const idDelta = a.id.localeCompare(b.id);
  if (idDelta !== 0) return idDelta;
  return (a.timestampMs ?? -1) - (b.timestampMs ?? -1);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function buildDimensionFinding(
  dimension: MatchVisionDimensionR482,
  observations: readonly MatchVisionObservationR482[]
): MatchVisionDimensionFindingR482 {
  const confidence = observations.length === 0
    ? 0
    : observations.reduce((total, observation) => total + observation.confidence, 0) / observations.length;

  return {
    dimension,
    observationCount: observations.length,
    confidence: round4(confidence),
    evidenceIds: uniqueSorted(observations.map((observation) => observation.id)),
    sourceIds: uniqueSorted(observations.map((observation) => observation.sourceId)),
    observations: observations.map((observation) => observation.description)
  };
}

function deriveEvidenceState(
  observationCount: number,
  sourceCount: number,
  completeness: number,
  confidence: number
): MatchVisionEvidenceStateR482 {
  if (observationCount === 0) return 'INSUFFICIENT';

  // R482 permanece consultivo. Para subir de PROVISIONAL é obrigatório haver
  // convergência entre pelo menos duas fontes independentes e cobertura ampla.
  if (sourceCount >= 2 && completeness >= 0.75 && confidence >= 0.6) {
    return 'EXPERIMENTAL_VALIDATED';
  }

  return 'PROVISIONAL';
}

export function runMatchVisionR482(input: MatchVisionInputR482): MatchVisionResultR482 {
  const observations = input.observations
    .map(normalizeObservation)
    .filter((observation) => observation.id.length > 0 && observation.sourceId.length > 0 && observation.description.length > 0)
    .sort(compareObservation);

  const coveredDimensions = new Set(observations.map((observation) => observation.dimension));
  const completeness = round4(coveredDimensions.size / MATCH_VISION_DIMENSIONS_R482.length);
  const confidence = observations.length === 0
    ? 0
    : round4(observations.reduce((total, observation) => total + observation.confidence, 0) / observations.length);
  const sourceIds = uniqueSorted(observations.map((observation) => observation.sourceId));

  const dimensions = MATCH_VISION_DIMENSIONS_R482
    .filter((dimension) => coveredDimensions.has(dimension))
    .map((dimension) => buildDimensionFinding(
      dimension,
      observations.filter((observation) => observation.dimension === dimension)
    ));

  const missingDimensions = MATCH_VISION_DIMENSIONS_R482.filter((dimension) => !coveredDimensions.has(dimension));
  const evidenceState = deriveEvidenceState(observations.length, sourceIds.length, completeness, confidence);

  return {
    engineVersion: MATCH_VISION_ENGINE_VERSION_R482,
    matchId: String(input.matchId),
    evidenceState,
    completeness,
    confidence,
    sourceCount: sourceIds.length,
    observationCount: observations.length,
    dimensions,
    missingDimensions: [...missingDimensions],
    definitive: false,
    authority: { ...AUTHORITY_R482 },
    safeguards: [
      'R482 é consultivo e correlacional; não possui autoridade de escrita sobre ficha, Top 5, Skills ou Ímpeto.',
      'Overall/GER não participa da autoridade nem da interpretação do Match Vision.',
      'Um único vídeo permanece PROVISIONAL, independentemente da cobertura ou confiança observada.',
      'EXPERIMENTAL_VALIDATED exige convergência de fontes independentes e não equivale a ENGINE_CERTIFIED.',
      'Dimensões sem evidência permanecem explicitamente ausentes; o motor não inventa observações.'
    ]
  };
}
