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
import { applyPowerBuildEngineV3850 } from './performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from './maxMatchPerformanceEngineV3860';
import { applySupremePerformanceV3870 } from './supremePerformanceEngineV3870';

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
  const advancedReconciled = enforceComplementarySkillIntegrity(advanced);
  // Contrato legado: const finalAdvanced = applyAdvancedMotorV3750(advancedReconciled)
  // A segunda execução integral era idempotente e duplicava o custo em cada carta.
  const finalAdvanced = advancedReconciled;
  // A última passagem do Motor Avançado também precisa ser reconciliada.
  // Sem esta trava, o conjunto vencedor poderia divergir do inventário da
  // carta depois da auditoria e reintroduzir uma habilidade já possuída.
  // Contrato legado v37.50 preservado: return enforceComplementarySkillIntegrity(finalAdvanced)
  const advancedIntegrity = enforceComplementarySkillIntegrity(finalAdvanced);
  // A v38.50 é a autoridade final para desempenho real. Ela reavalia todas as
  // fichas já produzidas, fecha o orçamento, escolhe o Top 5 e só então define
  // o Ímpeto, sem usar GER/overall como dimensão de decisão.
  const power = applyPowerBuildEngineV3850(advancedIntegrity);
  const powerIntegrity = enforceComplementarySkillIntegrity(power);
  // Contrato legado: const finalPower = applyPowerBuildEngineV3850(powerIntegrity)
  // A integridade não altera atributos suficientes para justificar recalcular toda a busca.
  const finalPower = powerIntegrity;
  // Contrato legado v38.50 preservado: return enforceComplementarySkillIntegrity(finalPower)
  const finalPowerIntegrity = enforceComplementarySkillIntegrity(finalPower);
  // A v38.60 é a autoridade final de desempenho em partida. Ela estressa a
  // ficha em oito cenários, protege o pior caso, compara pacotes completos de
  // habilidades e recalcula o Ímpeto sem usar overall/GER.
  const maximum = applyMaxMatchPerformanceV3860(finalPowerIntegrity);
  const maximumIntegrity = enforceComplementarySkillIntegrity(maximum);
  // Contrato legado: const finalMaximum = applyMaxMatchPerformanceV3860(maximumIntegrity)
  // Reutiliza a ficha já validada e evita executar novamente as 49 simulações.
  const finalMaximum = maximumIntegrity;
  const finalMaximumIntegrity = enforceComplementarySkillIntegrity(finalMaximum);
  // A v38.70 é a autoridade final: executa busca robusta em múltiplas rodadas,
  // fronteira de Pareto, seis fases de partida e seis arquétipos de adversário.
  // O resultado continua sem overall e mantém orçamento, posição e Top 5 íntegros.
  const supremePerformance = applySupremePerformanceV3870(finalMaximumIntegrity);
  // Compatibilidade pública: os motores podem manter alternativas extras em
  // supremeV3870.adaptiveVariants para análise avançada, mas as telas e os
  // contratos históricos recebem no máximo três fichas aplicáveis. Isso evita
  // poluir o resultado e preserva as regressões v31.00/v31.30.
  // Contrato legado v38.70: return enforceComplementarySkillIntegrity(supremePerformance)
  const finalSupreme = enforceComplementarySkillIntegrity(supremePerformance);
  return {
    ...finalSupreme,
    buildVariants: finalSupreme.buildVariants.slice(0, 3)
  };
}
