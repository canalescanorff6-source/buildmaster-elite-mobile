import type { AnalysisResult, PositionCode, TacticalStyle, TrainingKey, TrainingPlan } from '../../lib/analyzer';
import { TRAINING_KEYS, normalizeTrainingPlan, trainingPlanTotalCost, trainingTotalCost } from '../../lib/trainingPlanCore';
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
  optimizeOverall: false,
};

const GAMEPLAY_STYLE_PRIORITY_R483: Partial<Record<TacticalStyle, TrainingKey[]>> = {
  POSSE_DE_BOLA: ['passing', 'dribbling', 'dexterity'],
  CONTRA_ATAQUE_RAPIDO: ['dexterity', 'lowerBodyStrength', 'shooting'],
  CONTRA_ATAQUE: ['lowerBodyStrength', 'passing', 'dexterity'],
  POR_FORA: ['lowerBodyStrength', 'passing', 'dribbling'],
  PASSE_LONGO: ['passing', 'lowerBodyStrength', 'aerialStrength'],
  SOBREPOSICAO: ['passing', 'lowerBodyStrength', 'dexterity'],
};

function blockedSnapshotR483(
  result: AnalysisResult,
  budget: number,
  officialPointsUsed: number,
  blockedReason: string,
): BuildSimulatorSnapshotR483 {
  return {
    version: BUILD_SIMULATOR_R483_VERSION,
    baselineFingerprint: result.parsed.internalId || null,
    budget,
    officialPointsUsed,
    variants: [],
    blockedReason,
    authority: AUTHORITY_R483,
  };
}

function planKeyR483(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key] ?? 0}`).join('|');
}

function planDistanceR483(a: TrainingPlan, b: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(a[key] ?? 0) - Number(b[key] ?? 0)), 0);
}

function buildDeltasR483(official: TrainingPlan, candidate: TrainingPlan): BuildSimulatorVariantR483['deltas'] {
  return TRAINING_KEYS
    .map((key) => ({ key, before: Number(official[key] ?? 0), after: Number(candidate[key] ?? 0), delta: Number(candidate[key] ?? 0) - Number(official[key] ?? 0) }))
    .filter((item) => item.delta !== 0);
}

function enumerateExactCostTransfersR483(official: TrainingPlan, officialPoints: number): TrainingPlan[] {
  const seen = new Set<string>();
  const candidates: TrainingPlan[] = [];

  for (const donor of TRAINING_KEYS) {
    for (const receiver of TRAINING_KEYS) {
      if (donor === receiver) continue;
      for (let remove = 1; remove <= 2; remove += 1) {
        if (Number(official[donor] ?? 0) < remove) continue;
        for (let add = 1; add <= 4; add += 1) {
          if (Number(official[receiver] ?? 0) + add > 16) continue;
          const candidate = normalizeTrainingPlan({ ...official });
          candidate[donor] = Number(candidate[donor] ?? 0) - remove;
          candidate[receiver] = Number(candidate[receiver] ?? 0) + add;
          if (trainingPlanTotalCost(candidate) !== officialPoints) continue;
          const key = planKeyR483(candidate);
          if (key === planKeyR483(official) || seen.has(key)) continue;
          seen.add(key);
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates;
}

function officialPriorityR483(official: TrainingPlan): TrainingKey[] {
  return TRAINING_KEYS
    .filter((key) => Number(official[key] ?? 0) > 0)
    .sort((a, b) => {
      const levelDiff = Number(official[b] ?? 0) - Number(official[a] ?? 0);
      if (levelDiff !== 0) return levelDiff;
      const costDiff = trainingTotalCost(Number(official[b] ?? 0)) - trainingTotalCost(Number(official[a] ?? 0));
      if (costDiff !== 0) return costDiff;
      return TRAINING_KEYS.indexOf(a) - TRAINING_KEYS.indexOf(b);
    });
}

function selectBalancedVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null {
  const active = new Set(TRAINING_KEYS.filter((key) => Number(official[key] ?? 0) > 0));
  const eligible = candidates.filter((candidate) => buildDeltasR483(official, candidate).every((delta) => active.has(delta.key)));
  let best: TrainingPlan | null = null;
  let bestTuple: [number, number] | null = null;

  for (const candidate of eligible) {
    const levels = TRAINING_KEYS.filter((key) => active.has(key)).map((key) => Number(candidate[key] ?? 0));
    const dispersion = levels.length ? Math.max(...levels) - Math.min(...levels) : 0;
    const distance = planDistanceR483(official, candidate);
    const tuple: [number, number] = [dispersion, distance];
    if (!bestTuple || tuple[0] < bestTuple[0] || (tuple[0] === bestTuple[0] && tuple[1] < bestTuple[1])) {
      best = candidate;
      bestTuple = tuple;
    }
  }

  return best;
}

function specialistScoreR483(candidate: TrainingPlan, official: TrainingPlan, priority: TrainingKey[]): number {
  const deltas = buildDeltasR483(official, candidate);
  const top3 = new Set(priority.slice(0, 3));
  const top2 = new Set(priority.slice(0, 2));
  let score = 0;
  for (const delta of deltas) {
    if (delta.delta > 0 && top3.has(delta.key)) score += delta.delta * 12;
    if (delta.delta < 0 && top2.has(delta.key)) score += delta.delta * 18;
    if (delta.delta > 0 && !top3.has(delta.key)) score -= delta.delta * 3;
  }
  score -= planDistanceR483(official, candidate);
  return score;
}

function selectSpecialistVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null {
  const priority = officialPriorityR483(official);
  if (!priority.length) return null;
  let best: TrainingPlan | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const score = specialistScoreR483(candidate, official, priority);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function gameplayScoreR483(candidate: TrainingPlan, official: TrainingPlan, style: TacticalStyle): number {
  const base = specialistScoreR483(candidate, official, officialPriorityR483(official));
  const stylePriority = GAMEPLAY_STYLE_PRIORITY_R483[style] ?? [];
  const styleRank = new Map(stylePriority.map((key, index) => [key, stylePriority.length - index]));
  let bonus = 0;
  for (const delta of buildDeltasR483(official, candidate)) {
    if (delta.delta > 0) bonus += delta.delta * Number(styleRank.get(delta.key) ?? 0) * 2;
  }
  return base + bonus;
}

function selectGameplayVariantR483(candidates: TrainingPlan[], official: TrainingPlan, style: TacticalStyle): TrainingPlan | null {
  let best: TrainingPlan | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const score = gameplayScoreR483(candidate, official, style);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function scoreVariantR483(official: TrainingPlan, candidate: TrainingPlan): number {
  const deltas = buildDeltasR483(official, candidate);
  const gain = deltas.filter((delta) => delta.delta > 0).reduce((sum, delta) => sum + delta.delta, 0);
  const distance = planDistanceR483(official, candidate);
  return Math.max(1, Math.min(99, 100 - distance + gain));
}

function explainVariantR483(official: TrainingPlan, candidate: TrainingPlan): Pick<BuildSimulatorVariantR483, 'strengths' | 'sacrifices' | 'explanation'> {
  const deltas = buildDeltasR483(official, candidate);
  const strengths = deltas
    .filter((delta) => delta.delta > 0)
    .map((delta) => `${delta.key} +${delta.delta} nível(is) em relação à ficha Oficial.`);
  const sacrifices = deltas
    .filter((delta) => delta.delta < 0)
    .map((delta) => `${delta.key} ${delta.delta} nível(is) em relação à ficha Oficial.`);
  const explanation = `Redistribuição read-only com ${strengths.length} ganho(s) e ${sacrifices.length} sacrifício(s), mantendo exatamente ${trainingPlanTotalCost(candidate)} PP da mesma carta.`;
  return { strengths, sacrifices, explanation };
}

function makeVariantR483(
  id: Exclude<BuildSimulatorVariantR483['id'], 'official'>,
  label: string,
  plan: TrainingPlan,
  official: TrainingPlan,
  officialPoints: number,
  budget: number,
): BuildSimulatorVariantR483 {
  const normalized = normalizeTrainingPlan({ ...plan });
  const explanation = explainVariantR483(official, normalized);
  return {
    id,
    label,
    plan: normalized,
    pointsUsed: officialPoints,
    pointsAvailable: budget - officialPoints,
    validBudget: trainingPlanTotalCost(normalized) === officialPoints && officialPoints <= budget,
    score: scoreVariantR483(official, normalized),
    deltas: buildDeltasR483(official, normalized),
    ...explanation,
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
      Number(result.trainingPointsUsed ?? 0),
      'Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.',
    );
  }

  if (canonicalOfficialCost !== result.trainingPointsUsed || canonicalOfficialCost > budget) {
    return blockedSnapshotR483(
      result,
      budget,
      canonicalOfficialCost,
      'A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.',
    );
  }

  const official: BuildSimulatorVariantR483 = {
    id: 'official',
    label: 'Oficial',
    plan: officialPlan,
    pointsUsed: canonicalOfficialCost,
    pointsAvailable: budget - canonicalOfficialCost,
    validBudget: true,
    score: 100,
    deltas: [],
    strengths: ['Ficha oficial preservada como referência soberana.'],
    sacrifices: [],
    explanation: 'Baseline oficial selada; o R483 apenas compara alternativas e não altera a ficha.',
  };

  const candidates = enumerateExactCostTransfersR483(officialPlan, canonicalOfficialCost);
  const variants: BuildSimulatorVariantR483[] = [official];
  const balanced = selectBalancedVariantR483(candidates, officialPlan);
  if (balanced) variants.push(makeVariantR483('balanced', 'Equilibrada', balanced, officialPlan, canonicalOfficialCost, budget));

  const functionReady = result.validation?.level !== 'blocked' && Boolean(result.teamMap?.functionLabel?.trim());
  if (functionReady) {
    const specialist = selectSpecialistVariantR483(candidates, officialPlan);
    if (specialist) variants.push(makeVariantR483('specialist', 'Especialista', specialist, officialPlan, canonicalOfficialCost, budget));
    const gameplay = selectGameplayVariantR483(candidates, officialPlan, result.tacticalProfile.style);
    if (gameplay) variants.push(makeVariantR483('gameplay', 'Gameplay', gameplay, officialPlan, canonicalOfficialCost, budget));
  }

  return {
    version: BUILD_SIMULATOR_R483_VERSION,
    baselineFingerprint: result.parsed.internalId || null,
    budget,
    officialPointsUsed: canonicalOfficialCost,
    variants,
    blockedReason: null,
    authority: AUTHORITY_R483,
  };
}
