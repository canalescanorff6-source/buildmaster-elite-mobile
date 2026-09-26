'use client';

import type { TacticalTwinScenarioR480, TacticalTwinSnapshotR480 } from '../tactical-twin/tacticalTwinEngineR480';
import type { SquadBrainCorePlayerR481, SquadBrainRotationR481, SquadBrainSnapshotR481 } from '../squad-brain/squadBrainEngineR481';
import type { ChemistryGraphSnapshotR484 } from '../chemistry/chemistryGraphEngineR484';
import { buildExplainableDecisionR489 } from './explainableDecisionEngineR489';
import { ExplainableDecisionPanelR489 } from './ExplainableDecisionPanelR489';

function collapsedPanelR489(label: string, decision: ReturnType<typeof buildExplainableDecisionR489>) {
  return (
    <details className="r489-team-explanation">
      <summary>{label}</summary>
      <ExplainableDecisionPanelR489 decision={decision} compact />
    </details>
  );
}

export function StarterExplainabilityR489({
  starter,
  squadBrain,
  chemistry
}: {
  starter: SquadBrainCorePlayerR481;
  squadBrain: SquadBrainSnapshotR481;
  chemistry: ChemistryGraphSnapshotR484;
}) {
  const decision = buildExplainableDecisionR489({
    kind: 'STARTER',
    decisionId: `starter:${starter.playerId}`,
    verdict: `${starter.playerName} está entre os titulares no diagnóstico atual.`,
    availability: {
      r480: 'NOT_APPLICABLE',
      r481: 'AVAILABLE',
      r482: 'NOT_APPLICABLE',
      r483: 'NOT_APPLICABLE',
      r484: 'AVAILABLE'
    },
    starter,
    squadBrain,
    chemistry
  });

  return collapsedPanelR489('Por que titular?', decision);
}

export function RotationExplainabilityR489({
  rotation,
  tacticalTwin,
  squadBrain,
  chemistry
}: {
  rotation: SquadBrainRotationR481;
  tacticalTwin: TacticalTwinSnapshotR480;
  squadBrain: SquadBrainSnapshotR481;
  chemistry: ChemistryGraphSnapshotR484;
}) {
  const scenarioId = squadBrain.scenarioBench.find((item) => item.reserveIds.includes(rotation.reserveId))?.scenario;
  const scenario = scenarioId ? tacticalTwin.scenarios.find((item) => item.id === scenarioId) ?? null : null;
  const chemistryImpact = chemistry.rotations.find((item) => item.reserveId === rotation.reserveId && item.replaces === rotation.replaces) ?? null;
  const decision = buildExplainableDecisionR489({
    kind: 'ROTATION',
    decisionId: `rotation:${rotation.reserveId}:${rotation.replaces}`,
    verdict: `${rotation.reserveName} é uma rotação real para ${rotation.replaces}.`,
    availability: {
      r480: scenario ? 'AVAILABLE' : 'NOT_APPLICABLE',
      r481: 'AVAILABLE',
      r482: 'NOT_APPLICABLE',
      r483: 'NOT_APPLICABLE',
      r484: chemistryImpact ? 'AVAILABLE' : 'NOT_APPLICABLE'
    },
    rotation,
    scenario,
    tacticalTwin,
    squadBrain,
    chemistry,
    chemistryImpact
  });

  return collapsedPanelR489('Por que esta rotação?', decision);
}

export function TacticalExplainabilityR489({
  scenario,
  tacticalTwin,
  squadBrain,
  chemistry
}: {
  scenario: TacticalTwinScenarioR480;
  tacticalTwin: TacticalTwinSnapshotR480;
  squadBrain: SquadBrainSnapshotR481;
  chemistry: ChemistryGraphSnapshotR484;
}) {
  const decision = buildExplainableDecisionR489({
    kind: 'TACTICAL',
    decisionId: `tactical:${scenario.id}`,
    verdict: `${scenario.label}: ${scenario.summary}`,
    availability: {
      r480: 'AVAILABLE',
      r481: 'AVAILABLE',
      r482: 'NOT_APPLICABLE',
      r483: 'NOT_APPLICABLE',
      r484: 'AVAILABLE'
    },
    scenario,
    tacticalTwin,
    squadBrain,
    chemistry
  });

  return collapsedPanelR489('Por que esta leitura tática?', decision);
}
