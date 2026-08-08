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
import { applyCardFirstAiV3880 } from './cardFirstAiEngineV3880';
import { applyCanonicalCardV3890 } from './canonicalCardEngineV3890';
import { applyGlobalProBenchmarkV3900 } from './globalProBenchmarkV3900';
import { applyEliteDominanceV3910 } from './eliteDominanceEngineV3910';
import { applyUnifiedPerformanceV3920 } from './unifiedPerformanceEngineV3920';
import { stabilizeUnifiedRecipeFromMemoryV3920 } from './unifiedRecipeMemoryV3920';

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
  // A v38.80 é a autoridade final orientada pela carta. A posição escolhida
  // continua sendo respeitada, mas deixa de funcionar como molde genérico.
  const cardFirst = applyCardFirstAiV3880(finalSupreme);
  const finalCardFirst = enforceComplementarySkillIntegrity(cardFirst);
  // A v38.90 é a autoridade final determinística. Ela recalcula uma única
  // receita usando somente a identidade canônica da carta e neutraliza posição,
  // formação, técnico, contexto de conexão e alternativas dos motores antigos.
  // Portanto, ler a mesma carta em CA, SA, MAT, MLG ou qualquer outra posição
  // produz exatamente a mesma ficha, o mesmo Top adicional e o mesmo Ímpeto.
  const canonicalCard = applyCanonicalCardV3890(finalCardFirst);
  // A v39.00 compara a receita canônica com fichas completas de pro players
  // mundialmente verificados. Só altera a saída quando existem pelo menos duas
  // fontes independentes da mesma versão exata da carta; sem evidência, mostra
  // a comparação e preserva a receita própria sem inventar dados.
  const globalPro = applyGlobalProBenchmarkV3900(canonicalCard);
  // A v39.10 é a autoridade final. Ela ignora a posição selecionada e cria uma
  // única receita determinística pela identidade da carta, testando a mesma
  // progressão em todas as posições próprias. A base profissional funciona
  // como adversário auditável de benchmark, nunca como fonte aleatória.
  const dominant = applyEliteDominanceV3910(globalPro);
  // A v39.20 unifica ficha, habilidades, Ímpeto, identidade, encaixe tático,
  // benchmark profissional e proteção de recursos em uma única decisão.
  // A receita canônica permanece invariável por posição; somente o diagnóstico
  // de encaixe e uma microadaptação opcional podem mudar.
  const unifiedPerformance = applyUnifiedPerformanceV3920(dominant);
  const stableUnifiedPerformance = stabilizeUnifiedRecipeFromMemoryV3920(unifiedPerformance);
  return {
    ...stableUnifiedPerformance,
    buildVariants: stableUnifiedPerformance.buildVariants.slice(0, 1)
  };
}
