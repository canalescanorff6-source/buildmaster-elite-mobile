'use client';

import type { MatchVisionSnapshotR482 } from '../matches/matchVisionEngineR482';
import { buildAutonomousTacticalDirectorR500 } from '../tactical-director/tacticalDirectorEngineR500';
import { TacticalDirectorPanelR500 } from '../tactical-director/TacticalDirectorPanelR500';
import { buildExplainableDecisionR489 } from './explainableDecisionEngineR489';
import { ExplainableDecisionPanelR489 } from './ExplainableDecisionPanelR489';

export function MatchExplainabilityR489({ matchVision }: { matchVision: MatchVisionSnapshotR482 }) {
  const decision = buildExplainableDecisionR489({
    kind: 'MATCH',
    decisionId: `match:${matchVision.version}:${matchVision.configuredContext.formation}:${matchVision.configuredContext.teamStyle}:${matchVision.evidence.durationMs}:${matchVision.evidence.confirmedMarkers}`,
    verdict: matchVision.styleObservation || 'Leitura explicável da partida com base apenas em evidências confirmadas.',
    availability: {
      r480: 'NOT_APPLICABLE',
      r481: 'NOT_APPLICABLE',
      r482: 'AVAILABLE',
      r483: 'NOT_APPLICABLE',
      r484: 'NOT_APPLICABLE'
    },
    matchVision
  });

  const tacticalDirectorR500 = buildAutonomousTacticalDirectorR500({
    officialDecisionFingerprint: `match:${matchVision.version}:${matchVision.configuredContext.formation}:${matchVision.configuredContext.teamStyle}`,
    formation: matchVision.configuredContext.formation,
    teamStyle: matchVision.configuredContext.teamStyle,
    lineupContext: [],
    tacticalTwin: null,
    squadBrain: null,
    matchVision,
    buildSimulator: null,
    chemistry: null,
    explanations: [decision],
    confirmedMatchRecords: [],
    proMetaContext: null,
    phase: 'POST_MATCH',
    currentScenario: 'base',
    previousPlan: null
  });

  return (
    <>
      <TacticalDirectorPanelR500 plan={tacticalDirectorR500} compact />
      <ExplainableDecisionPanelR489 decision={decision} compact />
    </>
  );
}
