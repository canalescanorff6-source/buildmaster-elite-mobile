'use client';

import { useMemo } from 'react';
import type { AnalysisResult } from '../../lib/analyzer';
import { analysisUsagePositionR138 } from '../../lib/analysisUsagePositionR138';
import { buildBuildSimulatorR483 } from '../build-simulator/buildSimulatorEngineR483';
import { buildExplainableDecisionR489 } from './explainableDecisionEngineR489';
import { ExplainableDecisionPanelR489 } from './ExplainableDecisionPanelR489';

export function BuildExplainabilityR489({ result }: { result: AnalysisResult }) {
  const targetPositionR489 = analysisUsagePositionR138(result);
  const buildSimulatorR489 = useMemo(
    () => buildBuildSimulatorR483({ result, targetPosition: targetPositionR489 }),
    [result, targetPositionR489]
  );
  const decisionR489 = useMemo(
    () => buildExplainableDecisionR489({
      kind: 'BUILD',
      decisionId: String(result.parsed.internalId || result.parsed.playerName || 'build-sem-id'),
      verdict: result.buildName || `Ficha oficial de ${result.parsed.playerName}`,
      availability: {
        r480: 'NOT_APPLICABLE',
        r481: 'NOT_APPLICABLE',
        r482: 'NOT_APPLICABLE',
        r483: buildSimulatorR489.blockedReason ? 'BLOCKED' : 'AVAILABLE',
        r484: 'NOT_APPLICABLE'
      },
      result,
      buildSimulator: buildSimulatorR489
    }),
    [result, buildSimulatorR489]
  );

  return <ExplainableDecisionPanelR489 decision={decisionR489} compact />;
}
