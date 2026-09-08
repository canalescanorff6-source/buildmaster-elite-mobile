import type { AnalysisResult } from '../../src/lib/analyzerDomain';
import { enforceComplementarySkillIntegrity } from '../../src/lib/skillIntegrity';
import { applyPowerBuildEngineV3850 } from './performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from '../../src/lib/maxMatchPerformanceEngineV3860';
import { applySupremePerformanceV3870 } from './supremePerformanceEngineV3870';
import { applyCardFirstAiV3880 } from './cardFirstAiEngineV3880';
import { applyCanonicalCardV3890 } from './canonicalCardEngineV3890';

type AnalysisEngine = (input: AnalysisResult) => AnalysisResult;

function applyLegacyTrainingReadOnlyR184(current: AnalysisResult, engine: AnalysisEngine): AnalysisResult {
  const lockedTraining = { ...current.training };
  const lockedTrainingCost = { ...current.trainingCost };
  const lockedUsed = current.trainingPointsUsed;
  const lockedRemaining = current.trainingPointsRemaining;
  const analyzed = engine(current);
  return {
    ...analyzed,
    training: lockedTraining,
    trainingCost: lockedTrainingCost,
    trainingPointsUsed: lockedUsed,
    trainingPointsRemaining: lockedRemaining,
  };
}

/** Test-only exact compatibility chain for historical v38.50-v38.90 regressions. */
export function applyLegacyPerformanceDiagnosticsR184(input: AnalysisResult): AnalysisResult {
  let current = applyLegacyTrainingReadOnlyR184(input, applyPowerBuildEngineV3850);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnlyR184(current, applyMaxMatchPerformanceV3860);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnlyR184(current, applySupremePerformanceV3870);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnlyR184(current, applyCardFirstAiV3880);
  current = enforceComplementarySkillIntegrity(current);
  return applyLegacyTrainingReadOnlyR184(current, applyCanonicalCardV3890);
}
