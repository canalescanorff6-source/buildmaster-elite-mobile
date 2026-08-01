import type { AnalysisResult } from './analyzerDomain';
import { applyCompetitiveFusionToResult } from './competitiveBuildFusion';
import { applyDeepCardIntelligenceToResult } from './deepCardIntelligence';
import { applyLocalAiToResult } from './localAiEngine';
import { applyLocalCorrectionsToResult } from '../modules/builds/dynamicRules';
import { applyUnifiedCardIntelligence } from './unifiedCardIntelligence';
import { applySupremeGameplayEngine } from './supremeGameplayEngine';
import { enforceComplementarySkillIntegrity } from './skillIntegrity';
import { applyCalibrationV32 } from './calibrationV32';
import { applyAdvancedMotorV3750 } from './advancedMotorV3750';

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
  const integrityBeforeCalibration = enforceComplementarySkillIntegrity(correctedFinal);
  const calibrated = applyCalibrationV32(integrityBeforeCalibration);
  const calibratedSkills = enforceComplementarySkillIntegrity(calibrated);
  const calibratedImpetos = applyLocalAiToResult(calibratedSkills);
  // A segunda passagem usa o Top 5 e o ranking de Ímpetos já reconciliados.
  // Assim a ficha final, as habilidades e o Ímpeto terminam no mesmo contexto.
  // Contrato legado preservado para regressões anteriores: return enforceComplementarySkillIntegrity(applyCalibrationV32(calibratedImpetos))
  const reconciled = enforceComplementarySkillIntegrity(applyCalibrationV32(calibratedImpetos));
  // A v37.50 é a última autoridade: compara função, 3–5 fichas, conjuntos de
  // cinco habilidades e Ímpetos no mesmo cálculo. Uma segunda passagem garante
  // que o conjunto final permaneça íntegro depois da escolha conjunta.
  const advanced = applyAdvancedMotorV3750(reconciled);
  return applyAdvancedMotorV3750(enforceComplementarySkillIntegrity(advanced));
}
