import type { AnalysisResult } from './analyzerDomain';
import { applyCompetitiveFusionToResult } from './competitiveBuildFusion';
import { applyDeepCardIntelligenceToResult } from './deepCardIntelligence';
import { applyLocalAiToResult } from './localAiEngine';
import { applyLocalCorrectionsToResult } from '../modules/builds/dynamicRules';
import { applyUnifiedCardIntelligence } from './unifiedCardIntelligence';
import { applySupremeGameplayEngine } from './supremeGameplayEngine';
import { enforceComplementarySkillIntegrity } from './skillIntegrity';

export function applyCompleteCardIntelligence(result: AnalysisResult): AnalysisResult {
  const fused = applyCompetitiveFusionToResult(result);
  const optimized = applyDeepCardIntelligenceToResult(fused);
  // A primeira leitura de Ímpeto alimenta os motores integrados e as correções
  // locais. Depois da ficha vencedora, o ranking é calculado novamente usando
  // a distribuição final e o Top 5 definitivo de habilidades.
  const preliminaryLocalAi = applyLocalAiToResult(optimized);
  const preliminaryCorrections = applyLocalCorrectionsToResult(preliminaryLocalAi);
  const unified = applyUnifiedCardIntelligence(preliminaryCorrections);
  const supreme = applySupremeGameplayEngine(unified);
  const withFinalSkills = enforceComplementarySkillIntegrity(supreme);
  const withFinalImpetos = applyLocalAiToResult(withFinalSkills);
  const correctedFinal = applyLocalCorrectionsToResult(withFinalImpetos);
  return enforceComplementarySkillIntegrity(correctedFinal);
}
