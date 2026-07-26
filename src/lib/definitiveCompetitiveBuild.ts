import type { AnalysisResult, TrainingKey, TrainingPlan } from './analyzerDomain';
import { buildCreatorBuildConsensus } from './creatorBuildResearch';
import { TRAINING_KEYS, normalizeTrainingPlan, trainingLevelCost, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';
import type { BuildVariant } from './trainingEngine';

export type DefinitiveBuildSourceMode = 'MOTOR_LOCAL' | 'MOTOR_E_CONSENSO_PRO';

export type DefinitiveCompetitiveBuild = {
  title: string;
  training: TrainingPlan;
  pointsUsed: number;
  pointsTotal: number;
  pointsRemaining: number;
  confidence: number;
  sourceMode: DefinitiveBuildSourceMode;
  sourceCount: number;
  exactCardCount: number;
  proSourceCount: number;
  selectedVariant: string;
  verdict: string;
  reasons: string[];
  onlineImpact: string[];
  protectedTraits: string[];
  warnings: string[];
};

const POSITION_PRIORITIES: Record<string, TrainingKey[]> = {
  GK: ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'],
  CB: ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'],
  LB: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'dribbling'],
  RB: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'dribbling'],
  DMF: ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'dribbling'],
  CMF: ['passing', 'dexterity', 'dribbling', 'lowerBodyStrength', 'defending'],
  AMF: ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'],
  LMF: ['dribbling', 'passing', 'dexterity', 'lowerBodyStrength', 'shooting'],
  RMF: ['dribbling', 'passing', 'dexterity', 'lowerBodyStrength', 'shooting'],
  LWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
  RWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
  SS: ['dexterity', 'dribbling', 'shooting', 'passing', 'lowerBodyStrength'],
  CF: ['shooting', 'dexterity', 'lowerBodyStrength', 'dribbling', 'aerialStrength']
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scenarioAverage(variant: BuildVariant): number {
  const scores = variant.scenarioScores ? Object.values(variant.scenarioScores) : [];
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 70;
}

function variantScore(variant: BuildVariant): number {
  const quality = variant.qualityScore ?? 70;
  const efficiency = variant.efficiencyScore ?? quality;
  const balance = variant.balanceScore ?? quality;
  const scenarios = scenarioAverage(variant);
  const riskPenalty = (variant.risks?.length ?? 0) * 2.3 + (variant.tradeOffs?.length ?? 0) * 0.8;
  return (quality * 0.43) + (efficiency * 0.25) + (balance * 0.14) + (scenarios * 0.18) - riskPenalty;
}

function chooseBestVariant(result: AnalysisResult): BuildVariant | null {
  return [...(result.buildVariants ?? [])].sort((a, b) => variantScore(b) - variantScore(a))[0] ?? null;
}

function blendPlans(local: TrainingPlan, pro: TrainingPlan, proWeight: number): TrainingPlan {
  const plan = { ...local };
  for (const key of TRAINING_KEYS) {
    const localValue = Number(local[key] ?? 0);
    const proValue = Number(pro[key] ?? 0);
    if (proValue <= 0 && localValue <= 0) {
      plan[key] = 0;
      continue;
    }
    plan[key] = Math.max(0, Math.min(16, Math.round((localValue * (1 - proWeight)) + (proValue * proWeight))));
  }
  return normalizeTrainingPlan(plan);
}

function fitPlanToBudget(plan: TrainingPlan, budget: number, priorities: TrainingKey[]): TrainingPlan {
  const next = normalizeTrainingPlan(plan);
  const priorityIndex = new Map(priorities.map((key, index) => [key, index]));

  while (trainingPlanTotalCost(next) > budget) {
    const removable = TRAINING_KEYS
      .filter((key) => next[key] > 0)
      .sort((a, b) => {
        const priorityA = priorityIndex.get(a) ?? 99;
        const priorityB = priorityIndex.get(b) ?? 99;
        const levelCostA = trainingLevelCost(next[a]);
        const levelCostB = trainingLevelCost(next[b]);
        return priorityB - priorityA || levelCostB - levelCostA || next[b] - next[a];
      });
    const key = removable[0];
    if (!key) break;
    next[key] -= 1;
  }

  let guard = 0;
  while (trainingPlanTotalCost(next) < budget && guard < 240) {
    guard += 1;
    let improved = false;
    for (const key of priorities) {
      if (next[key] >= 16) continue;
      const currentCost = trainingPlanTotalCost(next);
      const candidate = { ...next, [key]: next[key] + 1 };
      const candidateCost = trainingPlanTotalCost(candidate);
      if (candidateCost <= budget && candidateCost > currentCost) {
        next[key] += 1;
        improved = true;
        break;
      }
    }
    if (!improved) break;
  }
  return next;
}

function onlineImpactFor(result: AnalysisResult, training: TrainingPlan): string[] {
  const position = result.bestPosition.code;
  const impact: string[] = [];
  if (training.dexterity >= 7) impact.push('resposta mais rápida em giro, arranque e mudança de direção');
  if (training.lowerBodyStrength >= 7) impact.push('mais velocidade funcional e força de chute nas ações online');
  if (training.passing >= 5) impact.push('passe curto e lançamento mais confiáveis sob pressão');
  if (training.dribbling >= 5) impact.push('domínio e condução mais limpos antes do comando seguinte');
  if (training.shooting >= 6) impact.push('finalização mais consistente em chances curtas');
  if (training.defending >= 7) impact.push('melhor leitura, aproximação e desarme nas disputas');
  if (training.aerialStrength >= 6) impact.push('mais presença em contato físico e bolas aéreas');
  if (position === 'GK' && training.gk1 + training.gk2 + training.gk3 >= 20) impact.push('mais estabilidade de reflexo, alcance e defesa do goleiro');
  return impact.slice(0, 5);
}

export function buildDefinitiveCompetitiveBuild(result: AnalysisResult): DefinitiveCompetitiveBuild {
  const bestVariant = chooseBestVariant(result);
  const localPlan = normalizeTrainingPlan(bestVariant?.training ?? result.training);
  const consensus = buildCreatorBuildConsensus(result);
  const canUseConsensus = consensus.confidence >= 62
    && consensus.sourceCount >= 2
    && consensus.exactCardCount >= 1
    && consensus.proSourceCount >= 1
    && consensus.totalCost > 0;
  const proWeight = canUseConsensus ? Math.min(0.52, 0.28 + (consensus.confidence - 62) / 125) : 0;
  const blended = canUseConsensus ? blendPlans(localPlan, consensus.training, proWeight) : localPlan;
  const priorities = POSITION_PRIORITIES[result.bestPosition.code] ?? TRAINING_KEYS;
  const training = fitPlanToBudget(blended, result.trainingPointsTotal, priorities);
  const pointsUsed = trainingPlanTotalCost(training);
  const variantConfidence = clamp(bestVariant ? variantScore(bestVariant) : result.bestPosition.score);
  const confidence = clamp(canUseConsensus
    ? (variantConfidence * 0.55) + (consensus.confidence * 0.45)
    : (variantConfidence * 0.72) + (result.parsed.confidence * 0.28));
  const reasons = [
    `A ficha interna com melhor equilíbrio entre qualidade, eficiência e consistência foi “${bestVariant?.title ?? 'Plano competitivo'}”.`,
    `A posição escolhida (${result.bestPosition.label}) continuou soberana durante toda a otimização.`,
    `O custo foi recalculado nível por nível e fechado em ${pointsUsed}/${result.trainingPointsTotal} pontos.`,
    canUseConsensus
      ? `O consenso de ${consensus.sourceCount} fonte(s), incluindo ${consensus.proSourceCount} pro/ranking alto, refinou ${Math.round(proWeight * 100)}% da decisão.`
      : 'Sem consenso suficiente da carta exata, o motor não copiou fichas externas e preservou a decisão local auditada.'
  ];
  const warnings = [
    ...consensus.warnings,
    ...(result.validation.level === 'blocked' ? ['A leitura ainda exige conferência manual antes de usar a ficha em partidas.'] : []),
    ...(pointsUsed < result.trainingPointsTotal ? [`Restaram ${result.trainingPointsTotal - pointsUsed} ponto(s) porque nenhum próximo nível cabia no custo real sem desviar da função.`] : [])
  ];
  return {
    title: 'Ficha Competitiva Definitiva',
    training,
    pointsUsed,
    pointsTotal: result.trainingPointsTotal,
    pointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    confidence,
    sourceMode: canUseConsensus ? 'MOTOR_E_CONSENSO_PRO' : 'MOTOR_LOCAL',
    sourceCount: consensus.sourceCount,
    exactCardCount: consensus.exactCardCount,
    proSourceCount: consensus.proSourceCount,
    selectedVariant: bestVariant?.title ?? 'Plano competitivo local',
    verdict: canUseConsensus
      ? 'Uma única ficha foi fechada pelo motor e refinada por fontes compatíveis da mesma carta.'
      : 'Uma única ficha foi fechada pelo motor local; nenhuma fonte externa insuficiente foi usada para alterar o jogador.',
    reasons,
    onlineImpact: onlineImpactFor(result, training),
    protectedTraits: result.playerIdentity?.protectedCharacteristics?.slice(0, 5) ?? result.strengths.slice(0, 5),
    warnings: Array.from(new Set(warnings)).slice(0, 6)
  };
}

export function applyDefinitiveCompetitiveBuild(result: AnalysisResult): AnalysisResult {
  const definitiveBuild = buildDefinitiveCompetitiveBuild(result);
  const training = definitiveBuild.training;
  const trainingCost = trainingPlanCost(training);
  const buildVariants = [...(result.buildVariants ?? [])].sort((a, b) => {
    if (a.title === definitiveBuild.selectedVariant) return -1;
    if (b.title === definitiveBuild.selectedVariant) return 1;
    return variantScore(b) - variantScore(a);
  });
  const trainingComparison = result.trainingComparison.map((item) => ({
    ...item,
    recommended: training[item.key],
    difference: training[item.key] - item.auto
  }));
  return {
    ...result,
    training,
    trainingCost,
    trainingPointsUsed: definitiveBuild.pointsUsed,
    trainingPointsRemaining: definitiveBuild.pointsRemaining,
    trainingComparison,
    buildVariants,
    definitiveBuild
  };
}
