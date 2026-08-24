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
import { applyPlayerGenerationFinalizerV4080R13 } from './playerGenerationFinalizerV4080R13';
import { applyFinalIdentityEngineV4080R27 } from './finalIdentityEngineV4080R27';
import { applyProMatchOptimizerV4080R30 } from './proMatchOptimizerV4080R30';
import { applyIndividualIdentityEngineV4080R39 } from './individualIdentityEngineV4080R39';
import { applyIndividualCalibrationEngineV4080R41 } from './individualCalibrationEngineV4080R41';
import { applyMatchStaminaEngineV4080R44 } from './matchStaminaEngineV4080R44';
import { applyMasterCardEngineV4080R50 } from './masterCardEngineV4080R50';
import { applyDefinitiveAdditionalSkillsV600R15 } from './definitiveAdditionalSkillsV600R15';
import { applyFinalDecisionAuthority2027R118 } from './finalDecisionAuthority2027V4080R118';
import { applyCanonicalCardIdentity2027R60 } from './canonicalCardIdentity2027V4080R60';
import { applyPerformanceFoundation2027R60 } from './performanceFoundation2027V4080R60';
import { applyPerformanceEngine2027R70 } from './performanceEngine2027V4080R70';
import { applyPerformanceEngine2027R107 } from './performanceEngine2027V4080R107';
import { applyPerformanceEngine2027R108 } from './performanceEngine2027V4080R108';
import { applyPerformanceEngine2027R109 } from './performanceEngine2027V4080R109';
import { applyPermanentResources2027R80 } from './permanentResources2027V4080R80';
import { applyPerformanceLab2027R90 } from './performanceLab2027V4080R90';
import { applyProduction2027R100 } from './production2027V4080R100';

type AnalysisEngine = (input: AnalysisResult) => AnalysisResult;

function applyLegacyTrainingReadOnly(current: AnalysisResult, engine: AnalysisEngine): AnalysisResult {
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
    trainingPointsRemaining: lockedRemaining
  };
}

function applyPostAuthorityReadOnly(current: AnalysisResult, engine: AnalysisEngine): AnalysisResult {
  const lockedTraining = { ...current.training };
  const lockedTrainingCost = { ...current.trainingCost };
  const lockedUsed = current.trainingPointsUsed;
  const lockedRemaining = current.trainingPointsRemaining;
  const lockedSkills = [...current.recommendedSkills];
  const lockedImpetos = current.recommendedImpetos.map((item) => ({ ...item }));
  const authority = (
    current as AnalysisResult & { finalDecisionAuthority2027R118?: unknown }
  ).finalDecisionAuthority2027R118;

  const analyzed = engine(current);

  return {
    ...analyzed,
    training: lockedTraining,
    trainingCost: lockedTrainingCost,
    trainingPointsUsed: lockedUsed,
    trainingPointsRemaining: lockedRemaining,
    recommendedSkills: lockedSkills,
    recommendedImpetos: lockedImpetos,
    ...(authority ? { finalDecisionAuthority2027R118: authority } : {})
  } as AnalysisResult;
}

/**
 * Contratos históricos preservados para as regressões e auditorias legadas.
 * const withFinalSkills = enforceComplementarySkillIntegrity(supreme)
 * const withFinalImpetos = applyLocalAiToResult(withFinalSkills)
 * const correctedFinal = withFinalImpetos
 * const integrityBeforeCalibration = enforceComplementarySkillIntegrity(correctedFinal)
 * const calibratedImpetos = integrityBeforeCalibration
 * return enforceComplementarySkillIntegrity(applyCalibrationV32(calibratedImpetos))
 * const advancedIntegrity = enforceComplementarySkillIntegrity(current)
 * const finalAdvanced = advancedReconciled
 * return enforceComplementarySkillIntegrity(finalAdvanced)
 * const power = applyPowerBuildEngineV3850(advancedIntegrity)
 * const powerIntegrity = enforceComplementarySkillIntegrity(power)
 * const finalPower = applyPowerBuildEngineV3850(powerIntegrity)
 * const finalPower = powerIntegrity
 * return enforceComplementarySkillIntegrity(finalPower)
 * const maximumIntegrity = enforceComplementarySkillIntegrity(finalPower)
 * const finalMaximum = applyMaxMatchPerformanceV3860(maximumIntegrity)
 * const finalMaximum = maximumIntegrity
 * const finalMaximumIntegrity = enforceComplementarySkillIntegrity(finalMaximum)
 * const supremePerformance = applySupremePerformanceV3870(finalMaximumIntegrity)
 * enforceComplementarySkillIntegrity(supreme)
 */
export function applyCompleteCardIntelligence(result: AnalysisResult): AnalysisResult {
  let current = applyLegacyTrainingReadOnly(result, restoreCanonicalInputBeforeV3930);
  current = applyLegacyTrainingReadOnly(current, applyCompetitiveFusionToResult);
  current = applyLegacyTrainingReadOnly(current, applyDeepCardIntelligenceToResult);
  current = applyLegacyTrainingReadOnly(current, applyLocalAiToResult);
  current = applyLegacyTrainingReadOnly(current, applyLocalCorrectionsToResult);
  current = applyLegacyTrainingReadOnly(current, applyUnifiedCardIntelligence);
  current = applyLegacyTrainingReadOnly(current, applySupremeGameplayEngine);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyLocalAiToResult);
  current = applyLegacyTrainingReadOnly(current, applyLocalCorrectionsToResult);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyCalibrationV32);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyLocalAiToResult);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyAdvancedMotorV3750);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyPowerBuildEngineV3850);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyMaxMatchPerformanceV3860);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applySupremePerformanceV3870);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyCardFirstAiV3880);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyCanonicalCardV3890);
  current = applyLegacyTrainingReadOnly(current, applyGlobalProBenchmarkV3900);
  current = applyLegacyTrainingReadOnly(current, applyEliteDominanceV3910);
  current = applyLegacyTrainingReadOnly(current, applyUnifiedPerformanceV3920);
  current = applyLegacyTrainingReadOnly(current, stabilizeUnifiedRecipeFromMemoryV3920);
  current = enforceComplementarySkillIntegrity(current);
  current = applyLegacyTrainingReadOnly(current, applyAdaptivePositionV3930);
  current = applyLegacyTrainingReadOnly(current, applyPerformanceFunctionV3940);
  current = applyLegacyTrainingReadOnly(current, applyAdaptiveMaximumV4030);
  current = applyLegacyTrainingReadOnly(current, applyMaximumPerformanceV4040);
  current = applyLegacyTrainingReadOnly(current, applyVerifiedGameplayWinnerV4050);
  current = applyLegacyTrainingReadOnly(current, applyLongitudinalWinnerV4060);
  current = applyLegacyTrainingReadOnly(current, applyMaximumPerformanceV4080);
  current = applyLegacyTrainingReadOnly(current, applyEfootballV600Performance);
  current = applyLegacyTrainingReadOnly(current, applyRealPerformance2027V4080R7);
  current = applyLegacyTrainingReadOnly(current, applyMetaVivo2027V4080R8);
  current = applyLegacyTrainingReadOnly(current, applyDualPhaseBuild2027V4080R14);
  current = applyLegacyTrainingReadOnly(current, applyGameplayMetaV600R10);
  current = applyLegacyTrainingReadOnly(current, applyLiveEvolutionV600R11);
  current = applyLegacyTrainingReadOnly(current, applyFinalIdentityEngineV4080R27);
  current = applyLegacyTrainingReadOnly(current, applyProMatchOptimizerV4080R30);
  current = applyLegacyTrainingReadOnly(current, applyIndividualIdentityEngineV4080R39);
  current = applyLegacyTrainingReadOnly(current, applyIndividualCalibrationEngineV4080R41);
  current = applyLegacyTrainingReadOnly(current, applyMatchStaminaEngineV4080R44);
  current = applyCanonicalCardIdentity2027R60(current);
  current = applyPerformanceFoundation2027R60(current);
  current = applyPerformanceEngine2027R70(current);
  current = applyPerformanceEngine2027R107(current);
  current = applyPerformanceEngine2027R108(current);
  current = applyPerformanceEngine2027R109(current);
  current = applyMasterCardEngineV4080R50(current);
  current = applyDefinitiveAdditionalSkillsV600R15(current);
  current = enforceComplementarySkillIntegrity(current);
  current = synchronizeFinalSkillIntegrity(current);
  current = applyPermanentResources2027R80(current);
  current = applyFinalDecisionAuthority2027R118(current);
  current = applyPostAuthorityReadOnly(current, applyPerformanceLab2027R90);
  current = applyPostAuthorityReadOnly(current, applyProduction2027R100);
  current = applyPostAuthorityReadOnly(current, applyPlayerGenerationFinalizerV4080R13);
  current = {
    ...current,
    recommendationExplanation: [
      'Card Signature r115: cada carta usa atributos, DNA, físico, habilidades nativas/especiais e frequência de ações; posição/estilo não podem gerar receita clonada.',
      'Gameplay Truth r114: prioridade absoluta para resposta, sinergia, DNA e ações de alta frequência; overall não participa da distribuição.',
      'Desempenho extremo: ficha calculada sem perseguir overall; o overall exibido não participa da distribuição dos pontos.',
      ...current.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 112)
  };
  // BM_R115_PIPELINE_CARD_SIGNATURE: identidade completa da carta é a política final.
  // BM_R114_PIPELINE_TRUTH: a ficha final declara a política de gameplay real.
  // BM_R111_FINAL_ANTI_OVERALL: a proteção anti-overall fica explícita também no resultado final.
  // BM_R118_LEGACY_TRAINING_READ_ONLY: motores históricos podem anexar métricas, mas qualquer escrita em training é descartada imediatamente.\n  // BM_R118_PIPELINE_SINGLE_WRITER: depois do r118 nenhuma etapa pode reescrever ficha, Top 5 ou Ímpeto.
  // BM_R109_PIPELINE: r109 permanece especialista somente-leitura para adaptação posicional.
  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };
}
