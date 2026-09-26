import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from '../../lib/analyzer';
import { normalizeTrainingPlan, trainingPlanTotalCost } from '../../lib/trainingPlanCore';
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

  return {
    version: BUILD_SIMULATOR_R483_VERSION,
    baselineFingerprint: result.parsed.internalId || null,
    budget,
    officialPointsUsed: canonicalOfficialCost,
    variants: [official],
    blockedReason: null,
    authority: AUTHORITY_R483,
  };
}
