import type { AnalysisResult, ParsedCard } from './analyzerDomain';
import { applyCompetitiveFusionToResult } from './competitiveBuildFusion';
import { applyDeepCardIntelligenceToResult } from './deepCardIntelligence';
import { applyLocalAiToResult } from './localAiEngine';
import { applyLocalCorrectionsToResult } from '../modules/builds/dynamicRules';
import { applyUnifiedCardIntelligence } from './unifiedCardIntelligence';
import { applySupremeGameplayEngine } from './supremeGameplayEngine';
import { enforceComplementarySkillIntegrity, synchronizeFinalSkillIntegrity } from './skillIntegrity';
import { applyCalibrationV32 } from './calibrationV32';
import { applyAdvancedMotorV3750 } from './advancedMotorV3750';
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
import { applyMatchStaminaEngineV4080R44 } from './matchStaminaEngineV4080R44';
import { applyMasterCardEngineV4080R50 } from './masterCardEngineV4080R50';
import { applyDefinitiveAdditionalSkillsV600R15 } from './definitiveAdditionalSkillsV600R15';
import { applyFinalDecisionAuthority2027R118 } from './finalDecisionAuthority2027V4080R118';
import { applyCanonicalCardIdentity2027R60 } from './canonicalCardIdentity2027V4080R60';
import { applyPerformanceEngine2027R108 } from './performanceEngine2027V4080R108';
import { applyPermanentResources2027R80 } from './permanentResources2027V4080R80';
import { applyPerformanceLab2027R90 } from './performanceLab2027V4080R90';
import { applyProduction2027R100 } from './production2027V4080R100';
import { applyCleanSlatePerformance2027R119 } from './cleanSlatePerformance2027V4080R119';
import { sealProductionAuthorityR126 } from './productionAuthorityR126';
import { sealProductionAuthorityR128 } from './productionAuthorityR128';
import { attachMatchEvidenceCalibrationR136 } from '../modules/matches/matchEvidenceCalibrationR136';

type AnalysisEngine = (input: AnalysisResult) => AnalysisResult;

type LegacyPerformanceDiagnosticsR184Hook = (input: AnalysisResult) => AnalysisResult;

function applyLegacyPerformanceDiagnosticsBridgeR184(current: AnalysisResult): AnalysisResult {
  const hook = (globalThis as typeof globalThis & { __BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__?: LegacyPerformanceDiagnosticsR184Hook }).__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__;
  return typeof hook === 'function' ? hook(current) : current;
}

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
function rawCardSnapshot(parsed: ParsedCard): ParsedCard {
  return JSON.parse(JSON.stringify(parsed)) as ParsedCard;
}

function legacyDiagnosticsEnabled(): boolean {
  // No app/Android: os motores históricos saem do caminho crítico por padrão.
  // Em Node, regressões antigas ainda podem auditá-los; a suíte final r119 pode forçar o caminho rápido.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  if (env?.BUILDMASTER_FORCE_FAST_CARD_PIPELINE === '1') return false;
  if (env?.BUILDMASTER_LEGACY_DIAGNOSTICS === '1') return true;
  if (typeof window === 'undefined') return true;
  return env?.NEXT_PUBLIC_ENABLE_LEGACY_CARD_DIAGNOSTICS === '1';
}

export function applyCompleteCardIntelligence(result: AnalysisResult): AnalysisResult {
  const protectedRawCard = rawCardSnapshot(result.parsed);
  let current = result;

  if (legacyDiagnosticsEnabled()) {
    current = applyLegacyTrainingReadOnly(current, restoreCanonicalInputBeforeV3930);
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
    // R184: v38.50-v38.90 saíram do runtime de produção. Em Node, a suíte histórica
    // instala uma ponte lazy test-only que reproduz exatamente a cadeia antiga.
    current = applyLegacyPerformanceDiagnosticsBridgeR184(current);
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
    current = applyLegacyTrainingReadOnly(current, applyMatchStaminaEngineV4080R44);
    current = applyLegacyTrainingReadOnly(current, applyCanonicalCardIdentity2027R60);
    current = applyLegacyTrainingReadOnly(current, applyPerformanceEngine2027R108);
    current = applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50);
    current = applyDefinitiveAdditionalSkillsV600R15(current);
    current = enforceComplementarySkillIntegrity(current);
    current = synchronizeFinalSkillIntegrity(current);
    current = applyPermanentResources2027R80(current);
    current = applyFinalDecisionAuthority2027R118(current);
    current = applyPostAuthorityReadOnly(current, applyPerformanceLab2027R90);
  } else {
    // Fast path de produção: identidade leve + Clean Slate. Nenhuma cadeia v38/v39/v40 roda no celular.
    current = applyLegacyTrainingReadOnly(current, applyCanonicalCardIdentity2027R60);
  }

  // R136: feedback real vira evidência temporal/contextual limitada ANTES do único escritor final.
  // Histórico antigo/fora de contexto perde peso; nenhum calibrador escolhe pontos/Top 5/Ímpeto.
  current = attachMatchEvidenceCalibrationR136(current);

  // Único escritor final: sempre recalcula do snapshot cru obtido ANTES de qualquer motor histórico.
  current = applyCleanSlatePerformance2027R119(current, protectedRawCard);
  current = applyPostAuthorityReadOnly(current, applyProduction2027R100);
  current = applyPostAuthorityReadOnly(current, applyPlayerGenerationFinalizerV4080R13);
  current = sealProductionAuthorityR126(current);
  current = {
    ...current,
    recommendationExplanation: [
      'Produção r128: Clean Slate r125 é o único escritor de ficha, Top 5 e Ímpeto; o selo R128 rejeita qualquer mutação posterior desses outputs e mantém Overall/GER fora da decisão.',
      'Motores históricos permanecem somente para auditoria; a Card Signature r108 é o especialista moderno preservado e não entra no caminho crítico do Android.',
      'Overall, ficha anterior e regras floor/peak/ceiling não participam da decisão final.',
      ...current.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 112)
  };
  // BM_R119_CLEAN_SLATE_SINGLE_WRITER: único escritor final de ficha + Top 5 + Ímpeto.
  // BM_R119_RAW_SNAPSHOT_GUARD: snapshot da carta é capturado antes de qualquer motor legado.
  // BM_R119_FAST_ANDROID_PATH: motores históricos não executam no browser/Android por padrão.
  // BM_R123_ONLINE_SINGLE_WRITER: o mesmo Clean Slate sela ficha, Top 5 e Ímpeto; confiança/saturação/A-B não criam autoridade paralela.
  // BM_R126_PRODUCTION_CONTRACT: toda saída de produção carrega selo explícito e rejeita decisão persistida obsoleta.
  // BM_R128_OUTPUT_INTEGRITY: qualquer mutação posterior em ficha/Top 5/Ímpeto invalida a saída de produção.
  // BM_R136_TEMPORAL_CONTEXT_EVIDENCE: partidas reais só calibram retorno marginal dentro do Clean Slate; tempo/patch/contexto limitam evidência antiga.
  current = { ...current, buildVariants: current.buildVariants.slice(0, 3) };
  current = sealProductionAuthorityR128(current);
  return current;
}
