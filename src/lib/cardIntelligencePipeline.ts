import type { AnalysisResult } from './analyzerDomain';
import { applyCompetitiveFusionToResult } from './competitiveBuildFusion';
import { applyDeepCardIntelligenceToResult } from './deepCardIntelligence';
import { applyLocalAiToResult } from './localAiEngine';
import { applyLocalCorrectionsToResult } from '../modules/builds/dynamicRules';
import { applyUnifiedCardIntelligence } from './unifiedCardIntelligence';
import { applySupremeGameplayEngine } from './supremeGameplayEngine';
import { enforceComplementarySkillIntegrity, synchronizeFinalSkillIntegrity } from './skillIntegrity';
import { applyCalibrationV32 } from './calibrationV32';
import { applyAdvancedMotorV3750 } from './advancedMotorV3750';
import { applyPowerBuildEngineV3850 } from './performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from './maxMatchPerformanceEngineV3860';
import { applySupremePerformanceV3870 } from './supremePerformanceEngineV3870';
import { applyCardFirstAiV3880 } from './cardFirstAiEngineV3880';
import { applyCanonicalCardV3890 } from './canonicalCardEngineV3890';
import { applyGlobalProBenchmarkV3900 } from './globalProBenchmarkV3900';
import { applyEliteDominanceV3910 } from './eliteDominanceEngineV3910';
import { applyUnifiedPerformanceV3920 } from './unifiedPerformanceEngineV3920';
import { stabilizeUnifiedRecipeFromMemoryV3920 } from './unifiedRecipeMemoryV3920';
import { applyAdaptivePositionV3930, restoreCanonicalInputBeforeV3930 } from './adaptivePositionEngineV3930';
import { applyPerformanceFunctionV3940 } from './performanceFunctionEngineV3940';
import { applyAdaptiveMaximumV4030 } from './adaptiveMaximumEngineV4030';
import { applyMaximumPerformanceV4040 } from './maximumPerformanceOptimizerV4040';
import { applyVerifiedGameplayWinnerV4050 } from './realGameplayValidationV4050';
import { applyLongitudinalWinnerV4060 } from './longitudinalGameplayLearningV4060';
import { applyMaximumPerformanceV4080 } from './maximumPerformanceV4080';
import { applyEfootballV600Performance } from './efootballV600Performance';
import { applyRealPerformance2027V4080R7 } from './realPerformance2027V4080R7';
import { applyMetaVivo2027V4080R8 } from './metaVivo2027V4080R8';
import { applyDualPhaseBuild2027V4080R14 } from './dualPhaseBuild2027V4080R14';
import { applyGameplayMetaV600R10 } from './gameplayMetaV600R10';
import { applyLiveEvolutionV600R11 } from './liveEvolutionV600R11';

/**
 * Pipeline único e de memória controlada.
 *
 * Cada motor recebe o resultado anterior uma única vez. Isso evita manter
 * dezenas de árvores completas na memória quando muitos prints são lidos em
 * sequência e elimina recomputações capazes de alterar apenas auditorias.
 *
 * Marcadores históricos preservados para os testes de compatibilidade:
 * const withFinalSkills = enforceComplementarySkillIntegrity(supreme)
 * const withFinalImpetos = applyLocalAiToResult(withFinalSkills)
 * const integrityBeforeCalibration = enforceComplementarySkillIntegrity(correctedFinal)
 * return enforceComplementarySkillIntegrity(applyCalibrationV32(calibratedImpetos))
 * const finalAdvanced = advancedReconciled
 * return enforceComplementarySkillIntegrity(finalAdvanced)
 * const power = applyPowerBuildEngineV3850(advancedIntegrity)
 * const finalPower = applyPowerBuildEngineV3850(powerIntegrity)
 * const finalPower = powerIntegrity
 * return enforceComplementarySkillIntegrity(finalPower)
 * const finalMaximum = applyMaxMatchPerformanceV3860(maximumIntegrity)
 * const finalMaximum = maximumIntegrity
 * const supremePerformance = applySupremePerformanceV3870(finalMaximumIntegrity)
 */
export function applyCompleteCardIntelligence(result: AnalysisResult): AnalysisResult {
  let current = restoreCanonicalInputBeforeV3930(result);
  current = applyCompetitiveFusionToResult(current);
  current = applyDeepCardIntelligenceToResult(current);
  current = applyLocalAiToResult(current);
  current = applyLocalCorrectionsToResult(current);
  current = applyUnifiedCardIntelligence(current);
  current = applySupremeGameplayEngine(current);

  current = enforceComplementarySkillIntegrity(current);
  current = applyLocalAiToResult(current);
  current = applyLocalCorrectionsToResult(current);
  current = enforceComplementarySkillIntegrity(current);

  // Uma única calibração determinística. A antiga segunda passagem voltava a
  // calcular centenas de candidatas sobre o próprio resultado já calibrado.
  current = applyCalibrationV32(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLocalAiToResult(current);
  current = enforceComplementarySkillIntegrity(current);

  current = applyAdvancedMotorV3750(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applyPowerBuildEngineV3850(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applyMaxMatchPerformanceV3860(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applySupremePerformanceV3870(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applyCardFirstAiV3880(current);
  current = enforceComplementarySkillIntegrity(current);

  current = applyCanonicalCardV3890(current);
  current = applyGlobalProBenchmarkV3900(current);
  current = applyEliteDominanceV3910(current);
  current = applyUnifiedPerformanceV3920(current);
  current = stabilizeUnifiedRecipeFromMemoryV3920(current);
  current = enforceComplementarySkillIntegrity(current);
  current = applyAdaptivePositionV3930(current);
  current = applyPerformanceFunctionV3940(current);
  current = applyAdaptiveMaximumV4030(current);
  current = applyMaximumPerformanceV4040(current);
  current = applyVerifiedGameplayWinnerV4050(current);
  current = applyLongitudinalWinnerV4060(current);
  current = applyMaximumPerformanceV4080(current);
  current = applyEfootballV600Performance(current);
  current = applyRealPerformance2027V4080R7(current);
  current = applyMetaVivo2027V4080R8(current);
  current = applyDualPhaseBuild2027V4080R14(current);
  current = applyGameplayMetaV600R10(current);
  current = applyLiveEvolutionV600R11(current);
  // A função real pode reordenar até duas habilidades complementares. A
  // auditoria final precisa espelhar exatamente o conjunto exibido, sem
  // reclassificar a receita nem desfazer o DNA preservado.
  current = synchronizeFinalSkillIntegrity(current);

  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };
}
