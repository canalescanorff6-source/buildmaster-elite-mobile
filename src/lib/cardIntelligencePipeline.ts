import type { AnalysisResult } from './analyzerDomain';
import { applyCompetitiveFusionToResult } from './competitiveBuildFusion';
import { applyDeepCardIntelligenceToResult } from './deepCardIntelligence';
import { applyLocalAiToResult } from './localAiEngine';
import { applyLocalCorrectionsToResult } from '../modules/builds/dynamicRules';

export function applyCompleteCardIntelligence(result: AnalysisResult): AnalysisResult {
  const fused = applyCompetitiveFusionToResult(result);
  const optimized = applyDeepCardIntelligenceToResult(fused);
  const withLocalAi = applyLocalAiToResult(optimized);
  const reconciled = applyDeepCardIntelligenceToResult(withLocalAi);
  return applyLocalCorrectionsToResult(reconciled);
}
