import type { MatchEventKind, MatchEventMarker, MatchTrainerSession } from './matchTrainerEngine';

export const MATCH_VISION_R482_VERSION = '40.80-r482-match-vision-v1';

export const MATCH_VISION_DIMENSIONS_R482 = [
  'zones',
  'lines',
  'isolation',
  'forcedPasses',
  'possessionLosses',
  'involvement',
  'spaceOccupation',
  'progression',
  'pressure',
  'transitions',
  'finishing',
  'offBallMovement'
] as const;

export type MatchVisionDimensionIdR482 = (typeof MATCH_VISION_DIMENSIONS_R482)[number];
export type MatchVisionEvidenceStateR482 = 'INSUFFICIENT' | 'OBSERVED' | 'REPEATED_PATTERN';
export type MatchVisionConfidenceR482 = 'low' | 'medium' | 'high';

export type MatchVisionDimensionR482 = {
  id: MatchVisionDimensionIdR482;
  evidenceCount: number;
  sessionsWithEvidence: number;
  positiveCount: number;
  warningCount: number;
  score: number | null;
  confidence: MatchVisionConfidenceR482;
  evidenceState: MatchVisionEvidenceStateR482;
  markerKinds: MatchEventKind[];
};

export type MatchVisionSnapshotR482 = {
  version: string;
  sessionsAnalyzed: number;
  confirmedMarkers: number;
  dimensionsCovered: number;
  confidenceScore: number;
  confidence: MatchVisionConfidenceR482;
  evidenceState: MatchVisionEvidenceStateR482;
  dimensions: MatchVisionDimensionR482[];
  safeguards: string[];
  authority: {
    readOnly: true;
    canWriteTraining: false;
    canWriteTop5: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canChangePosition: false;
    canOverrideCleanSlate: false;
    canOverrideR126: false;
    canOverrideR128: false;
    optimizeOverall: false;
    certifiedForFinalWrite: false;
  };
};

const AUTHORITY_R482: MatchVisionSnapshotR482['authority'] = {
  readOnly: true,
  canWriteTraining: false,
  canWriteTop5: false,
  canWriteSkills: false,
  canWriteImpetus: false,
  canChangePosition: false,
  canOverrideCleanSlate: false,
  canOverrideR126: false,
  canOverrideR128: false,
  optimizeOverall: false,
  certifiedForFinalWrite: false
};

const SAFEGUARDS_R482 = [
  'Match Vision R482 é consultivo e nunca escreve a ficha final, Top 5, Skills adicionais ou Ímpeto.',
  'Um único vídeo ou partida não estabelece padrão definitivo de gameplay.',
  'Somente marcadores manuais ou automáticos confirmados entram como evidência.',
  'Overall/GER não participa da autoridade, confiança ou pontuação deste motor.',
  'Ausência de evidência permanece insuficiente; o motor não inventa eventos não observados.'
] as const;

type MarkerPolarityR482 = 'positive' | 'warning' | 'neutral';

type MarkerRuleR482 = {
  dimensions: readonly MatchVisionDimensionIdR482[];
  polarity: MarkerPolarityR482;
};

const RULES_R482: Partial<Record<MatchEventKind, MarkerRuleR482>> = {
  'pass-error': { dimensions: ['forcedPasses', 'possessionLosses', 'progression'], polarity: 'warning' },
  'dangerous-turnover': { dimensions: ['possessionLosses', 'transitions'], polarity: 'warning' },
  'marking-error': { dimensions: ['zones', 'lines', 'spaceOccupation'], polarity: 'warning' },
  'cursor-error': { dimensions: ['lines', 'pressure'], polarity: 'warning' },
  'forced-shot': { dimensions: ['finishing'], polarity: 'warning' },
  'defender-out-of-line': { dimensions: ['lines', 'zones', 'spaceOccupation'], polarity: 'warning' },
  'late-recomposition': { dimensions: ['transitions', 'lines', 'spaceOccupation'], polarity: 'warning' },
  'pressing-error': { dimensions: ['pressure', 'lines'], polarity: 'warning' },
  'game-management': { dimensions: ['progression', 'transitions'], polarity: 'warning' },
  'good-transition': { dimensions: ['transitions', 'progression', 'offBallMovement'], polarity: 'positive' },
  'good-build-up': { dimensions: ['progression', 'lines', 'spaceOccupation'], polarity: 'positive' },
  'good-play': { dimensions: ['involvement', 'spaceOccupation', 'offBallMovement'], polarity: 'positive' },
  'delayed-pass': { dimensions: ['forcedPasses', 'progression'], polarity: 'warning' },
  'pressured-receiver': { dimensions: ['isolation', 'forcedPasses', 'spaceOccupation'], polarity: 'warning' },
  'late-release': { dimensions: ['forcedPasses', 'progression'], polarity: 'warning' },
  'dangerous-dribble': { dimensions: ['isolation', 'possessionLosses'], polarity: 'warning' },
  'unbalanced-shot': { dimensions: ['finishing'], polarity: 'warning' },
  'predictable-attack': { dimensions: ['isolation', 'spaceOccupation', 'offBallMovement'], polarity: 'warning' },
  'no-triangulation': { dimensions: ['isolation', 'spaceOccupation', 'offBallMovement'], polarity: 'warning' },
  'lost-counterattack': { dimensions: ['transitions', 'progression'], polarity: 'warning' },
  'wrong-double-mark': { dimensions: ['pressure', 'zones', 'lines'], polarity: 'warning' },
  'premature-tackle': { dimensions: ['pressure', 'lines'], polarity: 'warning' },
  'fullback-corridor-open': { dimensions: ['zones', 'spaceOccupation', 'lines'], polarity: 'warning' },
  'double-defender': { dimensions: ['pressure', 'spaceOccupation'], polarity: 'warning' },
  'central-corridor-open': { dimensions: ['zones', 'spaceOccupation', 'lines'], polarity: 'warning' },
  'second-ball-failure': { dimensions: ['zones', 'involvement', 'transitions'], polarity: 'warning' },
  'interception': { dimensions: ['pressure', 'lines', 'involvement'], polarity: 'positive' },
  'command-pass-early': { dimensions: ['forcedPasses', 'progression'], polarity: 'warning' },
  'command-sprint-excess': { dimensions: ['offBallMovement', 'spaceOccupation'], polarity: 'warning' },
  'command-double-tap': { dimensions: ['involvement'], polarity: 'warning' }
};

function isConfirmedMarkerR482(marker: MatchEventMarker): boolean {
  if (marker.reviewStatus === 'rejected') return false;
  if (marker.source === 'automatic') return marker.reviewStatus === 'confirmed';
  return marker.reviewStatus !== 'suggested';
}

function confidenceFromEvidenceR482(evidenceCount: number, sessionsWithEvidence: number): MatchVisionConfidenceR482 {
  if (evidenceCount >= 5 && sessionsWithEvidence >= 3) return 'high';
  if (evidenceCount >= 3 && sessionsWithEvidence >= 2) return 'medium';
  return 'low';
}

function evidenceStateR482(evidenceCount: number, sessionsWithEvidence: number): MatchVisionEvidenceStateR482 {
  if (evidenceCount === 0) return 'INSUFFICIENT';
  if (evidenceCount >= 3 && sessionsWithEvidence >= 2) return 'REPEATED_PATTERN';
  return 'OBSERVED';
}

function scoreDimensionR482(positiveCount: number, warningCount: number): number | null {
  const total = positiveCount + warningCount;
  if (total === 0) return null;
  const raw = 50 + ((positiveCount - warningCount) / total) * 50;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function stableSessionsR482(sessions: readonly MatchTrainerSession[]): MatchTrainerSession[] {
  return [...sessions].sort((a, b) => a.id.localeCompare(b.id));
}

function stableMarkersR482(session: MatchTrainerSession): MatchEventMarker[] {
  return session.markers
    .filter(isConfirmedMarkerR482)
    .slice()
    .sort((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));
}

export function analyzeMatchVisionR482(sessions: readonly MatchTrainerSession[]): MatchVisionSnapshotR482 {
  const accumulators = new Map<MatchVisionDimensionIdR482, {
    evidenceCount: number;
    positiveCount: number;
    warningCount: number;
    sessionIds: Set<string>;
    markerKinds: Set<MatchEventKind>;
  }>();

  for (const id of MATCH_VISION_DIMENSIONS_R482) {
    accumulators.set(id, {
      evidenceCount: 0,
      positiveCount: 0,
      warningCount: 0,
      sessionIds: new Set<string>(),
      markerKinds: new Set<MatchEventKind>()
    });
  }

  let confirmedMarkers = 0;
  const normalizedSessions = stableSessionsR482(sessions);

  for (const session of normalizedSessions) {
    for (const marker of stableMarkersR482(session)) {
      confirmedMarkers += 1;
      const rule = RULES_R482[marker.kind];
      const dimensions = new Set<MatchVisionDimensionIdR482>(rule?.dimensions ?? []);

      if (marker.playerId || marker.playerLabel || marker.playerCardFingerprint) {
        dimensions.add('involvement');
      }
      if (marker.annotations?.some((annotation) => annotation.kind === 'open-space' || annotation.kind === 'hold-position')) {
        dimensions.add('offBallMovement');
        dimensions.add('spaceOccupation');
      }
      if (marker.annotations?.some((annotation) => annotation.kind === 'blocked-line' || annotation.kind === 'recommended-line')) {
        dimensions.add('lines');
      }

      for (const dimensionId of dimensions) {
        const accumulator = accumulators.get(dimensionId);
        if (!accumulator) continue;
        accumulator.evidenceCount += 1;
        accumulator.sessionIds.add(session.id);
        accumulator.markerKinds.add(marker.kind);
        if (rule?.polarity === 'positive' || marker.severity === 'positive') accumulator.positiveCount += 1;
        else if (rule?.polarity === 'warning' || marker.severity === 'high' || marker.severity === 'critical' || marker.severity === 'medium') accumulator.warningCount += 1;
      }
    }
  }

  const dimensions = MATCH_VISION_DIMENSIONS_R482.map((id): MatchVisionDimensionR482 => {
    const accumulator = accumulators.get(id)!;
    const sessionsWithEvidence = accumulator.sessionIds.size;
    return {
      id,
      evidenceCount: accumulator.evidenceCount,
      sessionsWithEvidence,
      positiveCount: accumulator.positiveCount,
      warningCount: accumulator.warningCount,
      score: scoreDimensionR482(accumulator.positiveCount, accumulator.warningCount),
      confidence: confidenceFromEvidenceR482(accumulator.evidenceCount, sessionsWithEvidence),
      evidenceState: evidenceStateR482(accumulator.evidenceCount, sessionsWithEvidence),
      markerKinds: [...accumulator.markerKinds].sort()
    };
  });

  const dimensionsCovered = dimensions.filter((dimension) => dimension.evidenceCount > 0).length;
  const repeatedDimensions = dimensions.filter((dimension) => dimension.evidenceState === 'REPEATED_PATTERN').length;
  const sessionsAnalyzed = normalizedSessions.length;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(
    Math.min(45, confirmedMarkers * 4) +
    Math.min(30, dimensionsCovered * 2.5) +
    Math.min(25, Math.max(0, sessionsAnalyzed - 1) * 12.5)
  )));
  const confidence: MatchVisionConfidenceR482 =
    sessionsAnalyzed >= 3 && repeatedDimensions >= 3 && confidenceScore >= 75
      ? 'high'
      : sessionsAnalyzed >= 2 && repeatedDimensions >= 1 && confidenceScore >= 45
        ? 'medium'
        : 'low';
  const evidenceState: MatchVisionEvidenceStateR482 =
    confirmedMarkers === 0
      ? 'INSUFFICIENT'
      : sessionsAnalyzed >= 2 && repeatedDimensions >= 1
        ? 'REPEATED_PATTERN'
        : 'OBSERVED';

  return {
    version: MATCH_VISION_R482_VERSION,
    sessionsAnalyzed,
    confirmedMarkers,
    dimensionsCovered,
    confidenceScore,
    confidence,
    evidenceState,
    dimensions,
    safeguards: [...SAFEGUARDS_R482],
    authority: { ...AUTHORITY_R482 }
  };
}
