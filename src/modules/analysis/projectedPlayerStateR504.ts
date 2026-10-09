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
  gk1: ['goalkeeperAwareness', 'jump'],
  gk2: ['goalkeeperParrying', 'goalkeeperReach'],
  gk3: ['goalkeeperCatching', 'goalkeeperReflexes'],
};

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

export function verifiedTrainingBaseAttributes(parsed:ParsedCard):Attributes|null {
  const base=parsed.trainingBase;
  if(!base || !parsed.editionIdentity?.officialCardIdVerified || base.cardId!==parsed.editionIdentity.officialCardId || !base.sources.some(url=>/^https:\/\//.test(url)))return null;
  const keys=Object.values(TRAINING_ATTRIBUTE_GROUPS_R504).flat();
  if(keys.some(key=>typeof base.attributes[key]!=='number'||!Number.isFinite(base.attributes[key])||base.attributes[key]!<1||base.attributes[key]!>120))return null;
  if(Object.values(base.fixedBonus??{}).some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0||value>20))return null;
  return Object.fromEntries(keys.map(key=>[key,base.attributes[key]!+Number(base.fixedBonus?.[key]??0)]));
}

export function deriveProjectedPlayerStateR504(parsed: ParsedCard, training: TrainingPlan): ProjectedPlayerStateR504 {
  const normalizedTraining = normalizeTrainingPlan(training);
  const baseAttributes = {} as Attributes;
  const finalAttributes = {} as Attributes;

  for (const [key, rawValue] of Object.entries(verifiedTrainingBaseAttributes(parsed) ?? parsed.attributes ?? {}) as Array<[AttributeKey, unknown]>) {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) continue;
    const base = clampAttribute(numeric);
    const gain = Object.entries(TRAINING_ATTRIBUTE_GROUPS_R504).reduce((sum,[group,keys])=>sum+(keys.includes(key)?Number(normalizedTraining[group as TrainingKey]??0):0),0);
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
