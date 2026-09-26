import type { AnalysisResult, PositionCode, TacticalStyle, TrainingKey, TrainingPlan } from '../../lib/analyzer';
import { TRAINING_LABELS } from '../../lib/trainingEngine';
import {
  TRAINING_KEYS,
  normalizeTrainingPlan,
  trainingPlanTotalCost,
  trainingTotalCost
} from '../../lib/trainingPlanCore';
import { normalizePlayerTrainingBudget } from '../builds/pointBudget';

export const BUILD_SIMULATOR_R483_VERSION = '40.80-r483-build-simulator-v1';

export type BuildSimulatorInputR483 = {
  result: AnalysisResult;
  targetPosition: PositionCode;
};

export type BuildSimulatorVariantR483 = {
  id: 'official' | 'balanced' | 'specialist' | 'gameplay';
  label: string;
  plan: TrainingPlan;
  pointsUsed: number;
  pointsAvailable: number;
  validBudget: boolean;
  score: number;
  deltas: Array<{ key: TrainingKey; before: number; after: number; delta: number }>;
  strengths: string[];
  sacrifices: string[];
  explanation: string;
};

export type BuildSimulatorSnapshotR483 = {
  version: string;
  baselineFingerprint: string | null;
  budget: number;
  officialPointsUsed: number;
  variants: BuildSimulatorVariantR483[];
  blockedReason: string | null;
  authority: {
    readOnly: true;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canChangePosition: false;
    canOverrideCleanSlate: false;
    canOverrideR126: false;
    canOverrideR128: false;
    optimizeOverall: false;
  };
};

const AUTHORITY_R483: BuildSimulatorSnapshotR483['authority'] = {
  readOnly: true,
  canWriteTraining: false,
  canWriteSkills: false,
  canWriteImpetus: false,
  canChangePosition: false,
  canOverrideCleanSlate: false,
  canOverrideR126: false,
  canOverrideR128: false,
  optimizeOverall: false
};

const GAMEPLAY_STYLE_PRIORITY_R483: Partial<Record<TacticalStyle, TrainingKey[]>> = {
  POSSE_DE_BOLA: ['passing', 'dribbling', 'dexterity'],
  CONTRA_ATAQUE_RAPIDO: ['dexterity', 'lowerBodyStrength', 'shooting'],
  CONTRA_ATAQUE: ['lowerBodyStrength', 'passing', 'dexterity'],
  POR_FORA: ['lowerBodyStrength', 'passing', 'dribbling'],
  PASSE_LONGO: ['passing', 'lowerBodyStrength', 'aerialStrength'],
  SOBREPOSICAO: ['passing', 'lowerBodyStrength', 'dexterity']
};

function blockedSnapshotR483(
  result: AnalysisResult,
  budget: number,
  officialPointsUsed: number,
  blockedReason: string
): BuildSimulatorSnapshotR483 {
  return {
    version: BUILD_SIMULATOR_R483_VERSION,
    baselineFingerprint: result.parsed.internalId || null,
    budget,
    officialPointsUsed,
    variants: [],
    blockedReason,
    authority: { ...AUTHORITY_R483 }
  };
}

function planKeyR483(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key] ?? 0}`).join('|');
}

function buildDeltasR483(
  official: TrainingPlan,
  candidate: TrainingPlan
): BuildSimulatorVariantR483['deltas'] {
  return TRAINING_KEYS
    .map((key) => ({
      key,
      before: Number(official[key] ?? 0),
      after: Number(candidate[key] ?? 0),
      delta: Number(candidate[key] ?? 0) - Number(official[key] ?? 0)
    }))
    .filter((item) => item.delta !== 0);
}

function planDistanceR483(a: TrainingPlan, b: TrainingPlan): number {
  return TRAINING_KEYS.reduce((total, key) => total + Math.abs(Number(a[key] ?? 0) - Number(b[key] ?? 0)), 0);
}

function enumerateExactCostTransfersR483(official: TrainingPlan, officialPoints: number): TrainingPlan[] {
  const candidates: TrainingPlan[] = [];
  const seen = new Set<string>([planKeyR483(official)]);

  for (const donor of TRAINING_KEYS) {
    for (const receiver of TRAINING_KEYS) {
      if (donor === receiver) continue;
      for (const removeLevels of [1, 2]) {
        if (Number(official[donor] ?? 0) < removeLevels) continue;
        for (let addLevels = 1; addLevels <= 4; addLevels += 1) {
          if (Number(official[receiver] ?? 0) + addLevels > 16) continue;
          const candidate = normalizeTrainingPlan({
            ...official,
            [donor]: Number(official[donor] ?? 0) - removeLevels,
            [receiver]: Number(official[receiver] ?? 0) + addLevels
          });
          if (trainingPlanTotalCost(candidate) !== officialPoints) continue;
          const key = planKeyR483(candidate);
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates;
}

function officialPriorityR483(official: TrainingPlan): TrainingKey[] {
  const order = new Map(TRAINING_KEYS.map((key, index) => [key, index]));
  return TRAINING_KEYS
    .filter((key) => Number(official[key] ?? 0) > 0)
    .sort((a, b) => {
      const levelDelta = Number(official[b] ?? 0) - Number(official[a] ?? 0);
      if (levelDelta !== 0) return levelDelta;
      const costDelta = trainingTotalCost(Number(official[b] ?? 0)) - trainingTotalCost(Number(official[a] ?? 0));
      if (costDelta !== 0) return costDelta;
      return Number(order.get(a) ?? 0) - Number(order.get(b) ?? 0);
    });
}

function selectBalancedVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null {
  const active = TRAINING_KEYS.filter((key) => Number(official[key] ?? 0) > 0);
  const activeSet = new Set(active);
  const eligible = candidates.filter((candidate) =>
    buildDeltasR483(official, candidate).every((item) => activeSet.has(item.key))
  );
  let best: TrainingPlan | null = null;
  let bestMetric = Number.POSITIVE_INFINITY;

  for (const candidate of eligible) {
    const levels = active.map((key) => Number(candidate[key] ?? 0));
    const spread = levels.length ? Math.max(...levels) - Math.min(...levels) : 0;
    const metric = spread * 100 + planDistanceR483(official, candidate);
    if (metric < bestMetric) {
      bestMetric = metric;
      best = candidate;
    }
  }
  return best ? { ...best } : null;
}

function specialistScoreR483(candidate: TrainingPlan, official: TrainingPlan): number {
  const priority = officialPriorityR483(official);
  const top3 = priority.slice(0, 3);
  const top2 = new Set(priority.slice(0, 2));
  const top3Set = new Set(top3);
  const deltas = buildDeltasR483(official, candidate);

  if (deltas.some((item) => item.delta < 0 && top2.has(item.key)) &&
      deltas.some((item) => item.delta > 0 && !top3Set.has(item.key))) {
    return Number.NEGATIVE_INFINITY;
  }

  const gainWeights = [30, 20, 10];
  const lossWeights = [50, 40, 30];
  let score = -planDistanceR483(official, candidate);
  top3.forEach((key, index) => {
    const delta = Number(candidate[key] ?? 0) - Number(official[key] ?? 0);
    if (delta > 0) score += delta * gainWeights[index];
    if (delta < 0) score += delta * lossWeights[index];
  });
  return score;
}

function selectSpecialistVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null {
  let best: TrainingPlan | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const score = specialistScoreR483(candidate, official);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best && Number.isFinite(bestScore) ? { ...best } : null;
}

function gameplayScoreR483(candidate: TrainingPlan, official: TrainingPlan, tacticalStyle: TacticalStyle): number {
  const priority = officialPriorityR483(official);
  const top3 = priority.slice(0, 3);
  const top2 = new Set(priority.slice(0, 2));
  const stylePriority = GAMEPLAY_STYLE_PRIORITY_R483[tacticalStyle] ?? [];
  const deltas = buildDeltasR483(official, candidate);

  if (deltas.some((item) => item.delta < 0 && top2.has(item.key)) &&
      deltas.some((item) => item.delta > 0 && !top3.includes(item.key))) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = -planDistanceR483(official, candidate);
  const functionalWeights = [20, 14, 8];
  const styleWeights = [12, 8, 4];
  top3.forEach((key, index) => {
    const delta = Number(candidate[key] ?? 0) - Number(official[key] ?? 0);
    score += delta * functionalWeights[index];
  });
  stylePriority.slice(0, 3).forEach((key, index) => {
    const delta = Number(candidate[key] ?? 0) - Number(official[key] ?? 0);
    score += delta * styleWeights[index];
  });
  return score;
}

function selectGameplayVariantR483(
  candidates: TrainingPlan[],
  official: TrainingPlan,
  tacticalStyle: TacticalStyle
): TrainingPlan | null {
  let best: TrainingPlan | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const score = gameplayScoreR483(candidate, official, tacticalStyle);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best && Number.isFinite(bestScore) ? { ...best } : null;
}

function variantFromPlanR483(
  id: BuildSimulatorVariantR483['id'],
  label: string,
  plan: TrainingPlan,
  official: TrainingPlan,
  officialPointsUsed: number,
  budget: number,
  score: number
): BuildSimulatorVariantR483 {
  const deltas = buildDeltasR483(official, plan);
  const strengths = deltas
    .filter((item) => item.delta > 0)
    .map((item) => `${TRAINING_LABELS[item.key]} recebe ${item.delta > 0 ? '+' : ''}${item.delta} nível(is) nesta simulação.`);
  const sacrifices = deltas
    .filter((item) => item.delta < 0)
    .map((item) => `${TRAINING_LABELS[item.key]} cede ${Math.abs(item.delta)} nível(is) para manter o mesmo custo total.`);
  const deltaSummary = deltas
    .map((item) => `${item.delta > 0 ? '+' : ''}${item.delta} ${TRAINING_LABELS[item.key]}`)
    .join(' • ');

  return {
    id,
    label,
    plan: { ...plan },
    pointsUsed: officialPointsUsed,
    pointsAvailable: budget - officialPointsUsed,
    validBudget: trainingPlanTotalCost(plan) === officialPointsUsed && officialPointsUsed <= budget,
    score,
    deltas,
    strengths,
    sacrifices,
    explanation: `${label}: ${deltaSummary}. Mantém exatamente ${officialPointsUsed} PP, igual à ficha Oficial, e existe somente para comparação.`
  };
}

export function buildBuildSimulatorR483(input: BuildSimulatorInputR483): BuildSimulatorSnapshotR483 {
  const { result } = input;
  const officialPlan = normalizeTrainingPlan({ ...result.training });
  const canonicalOfficialCost = trainingPlanTotalCost(officialPlan);
  const budget = normalizePlayerTrainingBudget(result.trainingPointsTotal);

  if (budget === 0) {
    return blockedSnapshotR483(
      result,
      0,
      canonicalOfficialCost,
      'Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.'
    );
  }

  if (canonicalOfficialCost !== result.trainingPointsUsed || canonicalOfficialCost > budget) {
    return blockedSnapshotR483(
      result,
      budget,
      canonicalOfficialCost,
      'A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.'
    );
  }

  const official: BuildSimulatorVariantR483 = {
    id: 'official',
    label: 'Oficial',
    plan: { ...officialPlan },
    pointsUsed: canonicalOfficialCost,
    pointsAvailable: budget - canonicalOfficialCost,
    validBudget: true,
    score: 100,
    deltas: [],
    strengths: ['Referência oficial selada pelo pipeline atual.'],
    sacrifices: [],
    explanation: 'Ficha oficial usada apenas como referência para comparação; o simulador não altera esta distribuição.'
  };

  const candidates = enumerateExactCostTransfersR483(officialPlan, canonicalOfficialCost);
  const variants: BuildSimulatorVariantR483[] = [official];
  const usedPlans = new Set<string>([planKeyR483(officialPlan)]);

  const balancedPlan = selectBalancedVariantR483(candidates, officialPlan);
  if (balancedPlan) {
    variants.push(variantFromPlanR483('balanced', 'Equilibrada', balancedPlan, officialPlan, canonicalOfficialCost, budget, 90));
    usedPlans.add(planKeyR483(balancedPlan));
  }

  const functionIsReliable = result.validation?.level !== 'blocked' && Boolean(result.teamMap?.functionLabel?.trim());
  if (functionIsReliable) {
    const specialistPool = candidates.filter((candidate) => !usedPlans.has(planKeyR483(candidate)));
    const specialistPlan = selectSpecialistVariantR483(specialistPool, officialPlan);
    if (specialistPlan) {
      const specialistScore = specialistScoreR483(specialistPlan, officialPlan);
      variants.push(variantFromPlanR483('specialist', 'Especialista', specialistPlan, officialPlan, canonicalOfficialCost, budget, specialistScore));
      usedPlans.add(planKeyR483(specialistPlan));
    }

    const gameplayPool = candidates.filter((candidate) => !usedPlans.has(planKeyR483(candidate)));
    const tacticalStyle = result.tacticalProfile?.style ?? 'AUTO';
    const gameplayPlan = selectGameplayVariantR483(gameplayPool, officialPlan, tacticalStyle);
    if (gameplayPlan) {
      const gameplayScore = gameplayScoreR483(gameplayPlan, officialPlan, tacticalStyle);
      variants.push(variantFromPlanR483('gameplay', 'Gameplay', gameplayPlan, officialPlan, canonicalOfficialCost, budget, gameplayScore));
    }
  }

  return {
    version: BUILD_SIMULATOR_R483_VERSION,
    baselineFingerprint: result.parsed.internalId || null,
    budget,
    officialPointsUsed: canonicalOfficialCost,
    variants,
    blockedReason: null,
    authority: { ...AUTHORITY_R483 }
  };
}
