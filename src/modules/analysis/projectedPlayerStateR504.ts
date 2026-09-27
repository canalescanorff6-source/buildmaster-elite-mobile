import type { AttributeKey, Attributes, ParsedCard, TrainingKey, TrainingPlan } from '../../lib/analyzerDomain';
import { normalizeTrainingPlan, trainingPlanTotalCost } from '../../lib/trainingPlanCore';

export const PROJECTED_PLAYER_STATE_R504_VERSION = '40.80-r504-projected-player-state-v1' as const;

export const TRAINING_ATTRIBUTE_GROUPS_R504: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing', 'placeKicking', 'curl'],
  passing: ['lowPass', 'loftedPass'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach'],
};

const ATTRIBUTE_TRAINING_GROUP_R504: Partial<Record<AttributeKey, TrainingKey>> = (() => {
  const mapping: Partial<Record<AttributeKey, TrainingKey>> = {};
  for (const [group, attributes] of Object.entries(TRAINING_ATTRIBUTE_GROUPS_R504) as Array<[TrainingKey, AttributeKey[]]>) {
    for (const attribute of attributes) mapping[attribute] = group;
  }
  return mapping;
})();

export type ProjectedPlayerStateR504 = {
  version: typeof PROJECTED_PLAYER_STATE_R504_VERSION;
  source: 'BASE_CARD_PLUS_FINAL_TRAINING';
  baseAttributes: Attributes;
  finalAttributes: Attributes;
  training: TrainingPlan;
  trainingCost: number;
  projectedAttributeCount: number;
};

function clampAttribute(value: number): number {
  return Math.max(1, Math.min(99, value));
}

export function deriveProjectedPlayerStateR504(parsed: ParsedCard, training: TrainingPlan): ProjectedPlayerStateR504 {
  const normalizedTraining = normalizeTrainingPlan(training);
  const baseAttributes = {} as Attributes;
  const finalAttributes = {} as Attributes;

  for (const [key, rawValue] of Object.entries(parsed.attributes ?? {}) as Array<[AttributeKey, unknown]>) {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) continue;
    const base = clampAttribute(numeric);
    const group = ATTRIBUTE_TRAINING_GROUP_R504[key];
    const gain = group ? Number(normalizedTraining[group] ?? 0) : 0;
    baseAttributes[key] = base;
    finalAttributes[key] = clampAttribute(base + gain);
  }

  return {
    version: PROJECTED_PLAYER_STATE_R504_VERSION,
    source: 'BASE_CARD_PLUS_FINAL_TRAINING',
    baseAttributes,
    finalAttributes,
    training: normalizedTraining,
    trainingCost: trainingPlanTotalCost(normalizedTraining),
    projectedAttributeCount: Object.keys(finalAttributes).length,
  };
}
