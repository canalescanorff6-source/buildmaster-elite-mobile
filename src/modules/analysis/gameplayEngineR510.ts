import type { AttributeKey, Attributes, TrainingKey } from '../../lib/analyzerDomain';
import { trainingTotalCost } from '../../lib/trainingPlanCore';
import {
  TRAINING_ATTRIBUTE_GROUPS_R504,
  type ProjectedPlayerStateR504,
} from './projectedPlayerStateR504';

export const GAMEPLAY_ENGINE_R510_VERSION = '40.80-r510-gameplay-engine-2-v1' as const;

export const GAMEPLAY_ENGINE_R510_CALIBRATION = {
  status: 'PROVISIONAL_UNCALIBRATED',
  provenance: 'ENGINEERING_SEED',
  officialGameData: false,
  certifiedForFinalWrite: false,
  calibrationRequired: ['GOLDEN_CARD_LAB', 'REAL_MATCH_DATA'],
} as const;

export type GameplayActionIdR510 =
  | 'firstTouchUnderPressure'
  | 'shortCombination'
  | 'lineBreakingPass'
  | 'centralCarry'
  | 'pressEscape'
  | 'duelShield'
  | 'attackingMovement'
  | 'finishingAction'
  | 'defensiveDuel'
  | 'aerialDuel';

export type GameplayEngineContextR510 = {
  actionWeights?: Partial<Record<GameplayActionIdR510, number>>;
};

type ActionDependencyR510 = {
  attribute: AttributeKey;
  weight: number;
  target: number;
  saturation: number;
};

type ActionDefinitionR510 = {
  dependencies: readonly ActionDependencyR510[];
};

type GameplaySeedPolicyR510 = {
  attributeMaximum: number;
  defaultActionWeight: number;
  utility: {
    belowTargetExponent: number;
    targetUtility: number;
    saturationUtility: number;
    maximumUtility: number;
  };
  saturationPenalty: {
    atSaturation: number;
    maximum: number;
  };
  actions: Record<GameplayActionIdR510, ActionDefinitionR510>;
};

/**
 * R510 seed policy.
 *
 * Estes parâmetros são uma semente de engenharia explícita e auditável para
 * validar a arquitetura do motor (gargalo, saturação e ganho marginal por PP).
 * Não representam dados oficiais do jogo nem podem, nesta fase, certificar ou
 * escrever a ficha final. Golden Card Lab + dados reais precisam calibrá-los.
 */
export const GAMEPLAY_ENGINE_R510_SEED_POLICY: GameplaySeedPolicyR510 = {
  attributeMaximum: 99,
  defaultActionWeight: 1,
  utility: {
    belowTargetExponent: 1.12,
    targetUtility: 1,
    saturationUtility: 1.04,
    maximumUtility: 1.05,
  },
  saturationPenalty: {
    atSaturation: 0.7,
    maximum: 1,
  },
  actions: {
    firstTouchUnderPressure: {
      dependencies: [
        { attribute: 'ballControl', weight: 0.28, target: 91, saturation: 96 },
        { attribute: 'tightPossession', weight: 0.28, target: 92, saturation: 96 },
        { attribute: 'balance', weight: 0.17, target: 89, saturation: 95 },
        { attribute: 'dribbling', weight: 0.11, target: 88, saturation: 95 },
        { attribute: 'lowPass', weight: 0.10, target: 88, saturation: 95 },
        { attribute: 'physicalContact', weight: 0.06, target: 82, saturation: 92 },
      ],
    },
    shortCombination: {
      dependencies: [
        { attribute: 'lowPass', weight: 0.40, target: 90, saturation: 96 },
        { attribute: 'ballControl', weight: 0.22, target: 90, saturation: 96 },
        { attribute: 'tightPossession', weight: 0.16, target: 90, saturation: 96 },
        { attribute: 'offensiveAwareness', weight: 0.12, target: 88, saturation: 95 },
        { attribute: 'balance', weight: 0.10, target: 87, saturation: 94 },
      ],
    },
    lineBreakingPass: {
      dependencies: [
        { attribute: 'lowPass', weight: 0.48, target: 91, saturation: 97 },
        { attribute: 'loftedPass', weight: 0.14, target: 89, saturation: 96 },
        { attribute: 'ballControl', weight: 0.11, target: 89, saturation: 95 },
        { attribute: 'offensiveAwareness', weight: 0.10, target: 88, saturation: 95 },
        { attribute: 'tightPossession', weight: 0.09, target: 88, saturation: 95 },
        { attribute: 'kickingPower', weight: 0.08, target: 84, saturation: 94 },
      ],
    },
    centralCarry: {
      dependencies: [
        { attribute: 'tightPossession', weight: 0.30, target: 92, saturation: 97 },
        { attribute: 'dribbling', weight: 0.27, target: 92, saturation: 97 },
        { attribute: 'ballControl', weight: 0.18, target: 90, saturation: 96 },
        { attribute: 'balance', weight: 0.15, target: 90, saturation: 96 },
        { attribute: 'acceleration', weight: 0.10, target: 88, saturation: 95 },
      ],
    },
    pressEscape: {
      dependencies: [
        { attribute: 'tightPossession', weight: 0.27, target: 92, saturation: 97 },
        { attribute: 'ballControl', weight: 0.22, target: 91, saturation: 96 },
        { attribute: 'balance', weight: 0.18, target: 90, saturation: 96 },
        { attribute: 'acceleration', weight: 0.12, target: 89, saturation: 95 },
        { attribute: 'dribbling', weight: 0.11, target: 90, saturation: 96 },
        { attribute: 'lowPass', weight: 0.10, target: 87, saturation: 94 },
      ],
    },
    duelShield: {
      dependencies: [
        { attribute: 'physicalContact', weight: 0.34, target: 87, saturation: 95 },
        { attribute: 'balance', weight: 0.24, target: 88, saturation: 95 },
        { attribute: 'ballControl', weight: 0.16, target: 88, saturation: 95 },
        { attribute: 'tightPossession', weight: 0.14, target: 88, saturation: 95 },
        { attribute: 'stamina', weight: 0.12, target: 86, saturation: 94 },
      ],
    },
    attackingMovement: {
      dependencies: [
        { attribute: 'offensiveAwareness', weight: 0.38, target: 91, saturation: 97 },
        { attribute: 'acceleration', weight: 0.28, target: 90, saturation: 96 },
        { attribute: 'speed', weight: 0.18, target: 88, saturation: 95 },
        { attribute: 'finishing', weight: 0.16, target: 86, saturation: 95 },
      ],
    },
    finishingAction: {
      dependencies: [
        { attribute: 'finishing', weight: 0.54, target: 92, saturation: 97 },
        { attribute: 'offensiveAwareness', weight: 0.20, target: 90, saturation: 96 },
        { attribute: 'kickingPower', weight: 0.16, target: 88, saturation: 95 },
        { attribute: 'balance', weight: 0.10, target: 85, saturation: 93 },
      ],
    },
    defensiveDuel: {
      dependencies: [
        { attribute: 'defensiveAwareness', weight: 0.28, target: 91, saturation: 97 },
        { attribute: 'defensiveEngagement', weight: 0.25, target: 91, saturation: 97 },
        { attribute: 'tackling', weight: 0.23, target: 90, saturation: 96 },
        { attribute: 'aggression', weight: 0.11, target: 87, saturation: 94 },
        { attribute: 'speed', weight: 0.07, target: 85, saturation: 93 },
        { attribute: 'physicalContact', weight: 0.06, target: 86, saturation: 94 },
      ],
    },
    aerialDuel: {
      dependencies: [
        { attribute: 'heading', weight: 0.30, target: 90, saturation: 96 },
        { attribute: 'jump', weight: 0.27, target: 90, saturation: 96 },
        { attribute: 'physicalContact', weight: 0.25, target: 88, saturation: 95 },
        { attribute: 'defensiveAwareness', weight: 0.10, target: 86, saturation: 94 },
        { attribute: 'offensiveAwareness', weight: 0.08, target: 84, saturation: 93 },
      ],
    },
  },
};

const ACTION_IDS_R510 = Object.keys(GAMEPLAY_ENGINE_R510_SEED_POLICY.actions) as GameplayActionIdR510[];

export type GameplayActionScoreR510 = {
  action: GameplayActionIdR510;
  score: number;
  coverage: number;
};

export type GameplayBottleneckR510 = {
  attribute: AttributeKey;
  severity: number;
  currentValue: number;
  contextualTarget: number;
  actionImpact: number;
};

export type MarginalTrainingOptionR510 = {
  trainingKey: TrainingKey;
  currentLevel: number;
  nextLevel: number;
  ppCost: number;
  functionalGain: number;
  gainPerPp: number;
  saturationPenalty: number;
  affectedAttributes: AttributeKey[];
};

export type GameplayEngineResultR510 = {
  version: typeof GAMEPLAY_ENGINE_R510_VERSION;
  source: 'PROJECTED_PLAYER_STATE_R504';
  calibration: typeof GAMEPLAY_ENGINE_R510_CALIBRATION;
  actionScores: Record<GameplayActionIdR510, GameplayActionScoreR510>;
  overallFunctionalScore: number;
  coverage: number;
  bottlenecks: GameplayBottleneckR510[];
  marginalTrainingOptions: MarginalTrainingOptionR510[];
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteAttribute(attributes: Attributes, key: AttributeKey): number | null {
  const value = Number(attributes[key]);
  return Number.isFinite(value)
    ? clamp(value, 1, GAMEPLAY_ENGINE_R510_SEED_POLICY.attributeMaximum)
    : null;
}

function actionWeight(context: GameplayEngineContextR510, action: GameplayActionIdR510): number {
  const requested = Number(
    context.actionWeights?.[action] ?? GAMEPLAY_ENGINE_R510_SEED_POLICY.defaultActionWeight,
  );
  return Number.isFinite(requested) ? Math.max(0, requested) : 0;
}

function attributeUtility(value: number, target: number, saturation: number): number {
  const utility = GAMEPLAY_ENGINE_R510_SEED_POLICY.utility;
  if (value <= target) {
    return clamp(
      Math.pow(value / target, utility.belowTargetExponent),
      0,
      utility.targetUtility,
    );
  }
  if (value <= saturation) {
    const span = Math.max(1, saturation - target);
    const progress = (value - target) / span;
    return utility.targetUtility
      + (utility.saturationUtility - utility.targetUtility) * progress;
  }
  const tail = Math.max(1, GAMEPLAY_ENGINE_R510_SEED_POLICY.attributeMaximum - saturation);
  const progress = (value - saturation) / tail;
  return utility.saturationUtility
    + (utility.maximumUtility - utility.saturationUtility) * progress;
}

function scoreAction(attributes: Attributes, action: GameplayActionIdR510): GameplayActionScoreR510 {
  const definition = GAMEPLAY_ENGINE_R510_SEED_POLICY.actions[action];
  let availableWeight = 0;
  let totalWeight = 0;
  let weightedUtility = 0;

  for (const dependency of definition.dependencies) {
    totalWeight += dependency.weight;
    const value = finiteAttribute(attributes, dependency.attribute);
    if (value === null) continue;
    availableWeight += dependency.weight;
    weightedUtility += dependency.weight * attributeUtility(
      value,
      dependency.target,
      dependency.saturation,
    );
  }

  const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;
  const normalized = availableWeight > 0 ? weightedUtility / availableWeight : 0;
  const scoreNormalizer = 100 / GAMEPLAY_ENGINE_R510_SEED_POLICY.utility.maximumUtility;
  return {
    action,
    score: clamp(normalized * scoreNormalizer, 0, 100),
    coverage: clamp(coverage, 0, 1),
  };
}

function scoreAllActions(attributes: Attributes): Record<GameplayActionIdR510, GameplayActionScoreR510> {
  const entries = ACTION_IDS_R510.map((action) => [action, scoreAction(attributes, action)] as const);
  return Object.fromEntries(entries) as Record<GameplayActionIdR510, GameplayActionScoreR510>;
}

function weightedFunctionalScore(
  actionScores: Record<GameplayActionIdR510, GameplayActionScoreR510>,
  context: GameplayEngineContextR510,
): { score: number; coverage: number } {
  let requestedWeight = 0;
  let coveredWeight = 0;
  let weightedScore = 0;

  for (const action of ACTION_IDS_R510) {
    const weight = actionWeight(context, action);
    if (weight <= 0) continue;
    requestedWeight += weight;
    const actionCoverage = actionScores[action].coverage;
    const effectiveWeight = weight * actionCoverage;
    coveredWeight += effectiveWeight;
    weightedScore += effectiveWeight * actionScores[action].score;
  }

  return {
    score: coveredWeight > 0 ? weightedScore / coveredWeight : 0,
    coverage: requestedWeight > 0 ? coveredWeight / requestedWeight : 0,
  };
}

function contextualAttributeStats(
  attributes: Attributes,
  context: GameplayEngineContextR510,
): Map<AttributeKey, { impact: number; targetWeighted: number; saturationWeighted: number }> {
  const stats = new Map<AttributeKey, { impact: number; targetWeighted: number; saturationWeighted: number }>();

  for (const action of ACTION_IDS_R510) {
    const weight = actionWeight(context, action);
    if (weight <= 0) continue;
    for (const dependency of GAMEPLAY_ENGINE_R510_SEED_POLICY.actions[action].dependencies) {
      if (finiteAttribute(attributes, dependency.attribute) === null) continue;
      const impact = weight * dependency.weight;
      const current = stats.get(dependency.attribute) ?? {
        impact: 0,
        targetWeighted: 0,
        saturationWeighted: 0,
      };
      current.impact += impact;
      current.targetWeighted += impact * dependency.target;
      current.saturationWeighted += impact * dependency.saturation;
      stats.set(dependency.attribute, current);
    }
  }

  return stats;
}

function deriveBottlenecks(
  attributes: Attributes,
  context: GameplayEngineContextR510,
): GameplayBottleneckR510[] {
  const stats = contextualAttributeStats(attributes, context);
  const rows: GameplayBottleneckR510[] = [];

  for (const [attribute, stat] of stats) {
    const currentValue = finiteAttribute(attributes, attribute);
    if (currentValue === null || stat.impact <= 0) continue;
    const contextualTarget = stat.targetWeighted / stat.impact;
    const deficit = Math.max(0, contextualTarget - currentValue);
    const severity = stat.impact * (deficit / Math.max(1, contextualTarget));
    rows.push({
      attribute,
      severity,
      currentValue,
      contextualTarget,
      actionImpact: stat.impact,
    });
  }

  return rows.sort((a, b) =>
    b.severity - a.severity
    || b.actionImpact - a.actionImpact
    || a.attribute.localeCompare(b.attribute),
  );
}

function groupSaturationPenalty(
  attributes: Attributes,
  group: TrainingKey,
  context: GameplayEngineContextR510,
): number {
  const stats = contextualAttributeStats(attributes, context);
  const penaltyPolicy = GAMEPLAY_ENGINE_R510_SEED_POLICY.saturationPenalty;
  let weight = 0;
  let penalty = 0;

  for (const attribute of TRAINING_ATTRIBUTE_GROUPS_R504[group]) {
    const currentValue = finiteAttribute(attributes, attribute);
    const stat = stats.get(attribute);
    if (currentValue === null || !stat || stat.impact <= 0) continue;
    const target = stat.targetWeighted / stat.impact;
    const saturation = stat.saturationWeighted / stat.impact;
    const localPenalty = currentValue <= target
      ? 0
      : currentValue >= saturation
        ? clamp(
          penaltyPolicy.atSaturation
            + (penaltyPolicy.maximum - penaltyPolicy.atSaturation)
              * ((currentValue - saturation)
                / Math.max(1, GAMEPLAY_ENGINE_R510_SEED_POLICY.attributeMaximum - saturation)),
          0,
          penaltyPolicy.maximum,
        )
        : clamp(
          penaltyPolicy.atSaturation * ((currentValue - target) / Math.max(1, saturation - target)),
          0,
          penaltyPolicy.atSaturation,
        );
    penalty += localPenalty * stat.impact;
    weight += stat.impact;
  }

  return weight > 0 ? penalty / weight : 0;
}

function projectOneTrainingLevel(attributes: Attributes, group: TrainingKey): Attributes {
  const next: Attributes = { ...attributes };
  for (const attribute of TRAINING_ATTRIBUTE_GROUPS_R504[group]) {
    const value = finiteAttribute(attributes, attribute);
    if (value === null) continue;
    next[attribute] = clamp(
      value + 1,
      1,
      GAMEPLAY_ENGINE_R510_SEED_POLICY.attributeMaximum,
    );
  }
  return next;
}

function marginalTrainingOptions(
  state: ProjectedPlayerStateR504,
  context: GameplayEngineContextR510,
  baselineScore: number,
): MarginalTrainingOptionR510[] {
  const options: MarginalTrainingOptionR510[] = [];

  for (const trainingKey of Object.keys(TRAINING_ATTRIBUTE_GROUPS_R504) as TrainingKey[]) {
    const currentLevel = Math.max(0, Math.min(16, Math.round(Number(state.training[trainingKey] ?? 0))));
    if (currentLevel >= 16) continue;

    const affectedAttributes = TRAINING_ATTRIBUTE_GROUPS_R504[trainingKey]
      .filter((attribute) => finiteAttribute(state.finalAttributes, attribute) !== null);
    if (affectedAttributes.length === 0) continue;

    const nextLevel = currentLevel + 1;
    const ppCost = trainingTotalCost(nextLevel) - trainingTotalCost(currentLevel);
    if (ppCost <= 0) continue;

    const candidateAttributes = projectOneTrainingLevel(state.finalAttributes, trainingKey);
    const candidateScores = scoreAllActions(candidateAttributes);
    const candidateFunctional = weightedFunctionalScore(candidateScores, context).score;
    const functionalGain = Math.max(0, candidateFunctional - baselineScore);
    const saturationPenalty = groupSaturationPenalty(state.finalAttributes, trainingKey, context);

    options.push({
      trainingKey,
      currentLevel,
      nextLevel,
      ppCost,
      functionalGain,
      gainPerPp: functionalGain / ppCost,
      saturationPenalty,
      affectedAttributes,
    });
  }

  return options.sort((a, b) =>
    b.gainPerPp - a.gainPerPp
    || b.functionalGain - a.functionalGain
    || a.ppCost - b.ppCost
    || a.trainingKey.localeCompare(b.trainingKey),
  );
}

export function analyzeGameplayEngineR510(
  state: ProjectedPlayerStateR504,
  context: GameplayEngineContextR510 = {},
): GameplayEngineResultR510 {
  const actionScores = scoreAllActions(state.finalAttributes);
  const functional = weightedFunctionalScore(actionScores, context);

  return {
    version: GAMEPLAY_ENGINE_R510_VERSION,
    source: 'PROJECTED_PLAYER_STATE_R504',
    calibration: GAMEPLAY_ENGINE_R510_CALIBRATION,
    actionScores,
    overallFunctionalScore: functional.score,
    coverage: clamp(functional.coverage, 0, 1),
    bottlenecks: deriveBottlenecks(state.finalAttributes, context),
    marginalTrainingOptions: marginalTrainingOptions(state, context, functional.score),
  };
}
