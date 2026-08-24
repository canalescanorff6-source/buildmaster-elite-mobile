import type { AnalysisResult, AttributeKey, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const PERFORMANCE_ENGINE_2027_R107_VERSION = '40.80-r107-dna-first-v600-quality-engine' as const;

export type QualityProfileR107 = 'DNA_LOCK' | 'ROLE_PEAK' | 'MATCH_90' | 'BALANCED';

export type PerformanceCandidateR107 = {
  profile: QualityProfileR107;
  training: TrainingPlan;
  exactBudget: boolean;
  totalScore: number;
  roleScore: number;
  dnaScore: number;
  staminaScore: number;
  efficiencyScore: number;
  essentialFloorCoverage: number;
  projectedStrongUntilMinute: number;
  projectedStamina: number;
  wastedLevels: number;
};

export type PerformanceEngine2027R107 = {
  version: typeof PERFORMANCE_ENGINE_2027_R107_VERSION;
  authority: 'SPECIALIST_READ_ONLY';
  model: 'ATTRIBUTE_LEVEL_DNA_FIRST_V600';
  budget: number;
  naturalPosition: PositionCode;
  selectedPosition: PositionCode;
  defensivePosition: PositionCode;
  positionMix: { natural: number; selected: number; defensive: number };
  staminaTarget: number;
  staminaLevelFloor: number;
  strongestDna: string[];
  baseline: PerformanceCandidateR107;
  winner: PerformanceCandidateR107;
  alternatives: PerformanceCandidateR107[];
  improvementVsIncoming: number;
  confidence: number;
  guards: {
    exactBudget: boolean;
    masterEngineIsOnlyWriter: false;
    finalAuthorityR118IsOnlyWriter: true;
    overallIgnored: true;
    formationIndependent: true;
    correctGkMapping: true;
    dnaProtected: boolean;
    staminaBalanced: boolean;
    diminishingReturns: true;
    antiGeneric: true;
  };
};

type Carrier = AnalysisResult & { canonicalCardIdentity2027R60?: CanonicalCardIdentityR60 };
export type WithPerformanceEngineR107 = AnalysisResult & { performanceEngine2027R107: PerformanceEngine2027R107 };

/* eFootball: os grupos de progressão são avaliados pelos atributos que realmente sobem.
 * GK1/GK2/GK3 corrigidos para o mapeamento atual do jogo:
 * GK1 = Awareness + Jump; GK2 = Parrying + Reach; GK3 = Catching + Reflexes.
 */
export const ATTRIBUTE_GROUPS_R107: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing', 'placeKicking', 'curl'],
  passing: ['lowPass', 'loftedPass'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'jump'],
  gk2: ['goalkeeperParrying', 'goalkeeperReach'],
  gk3: ['goalkeeperCatching', 'goalkeeperReflexes']
};

const POSITION_ATTRIBUTE_WEIGHTS: Record<PositionCode, Partial<Record<AttributeKey, number>>> = {
  GK: {
    goalkeeperAwareness: 3.0, goalkeeperReflexes: 3.0, goalkeeperReach: 2.85,
    goalkeeperParrying: 2.35, goalkeeperCatching: 2.0, jump: 1.0,
    kickingPower: .25, stamina: .12
  },
  CB: {
    defensiveAwareness: 3.0, tackling: 2.65, defensiveEngagement: 2.45, physicalContact: 2.0,
    jump: 1.55, heading: 1.35, speed: 1.35, acceleration: .75, aggression: 1.25,
    lowPass: .75, loftedPass: .5, stamina: .75, balance: .4
  },
  LB: {
    speed: 2.05, stamina: 2.05, defensiveAwareness: 1.9, tackling: 1.75,
    defensiveEngagement: 1.65, acceleration: 1.5, lowPass: 1.1, loftedPass: 1.2,
    ballControl: .8, tightPossession: .65, balance: .85, physicalContact: .7
  },
  RB: {
    speed: 2.05, stamina: 2.05, defensiveAwareness: 1.9, tackling: 1.75,
    defensiveEngagement: 1.65, acceleration: 1.5, lowPass: 1.1, loftedPass: 1.2,
    ballControl: .8, tightPossession: .65, balance: .85, physicalContact: .7
  },
  DMF: {
    defensiveAwareness: 2.7, defensiveEngagement: 2.5, tackling: 2.35, physicalContact: 1.55,
    stamina: 1.8, lowPass: 1.65, loftedPass: 1.05, speed: 1.0, acceleration: .75,
    ballControl: .8, tightPossession: .65, balance: .65, aggression: 1.25, jump: .55
  },
  CMF: {
    lowPass: 2.15, ballControl: 1.7, stamina: 1.75, tightPossession: 1.55,
    loftedPass: 1.45, acceleration: 1.15, balance: 1.15, dribbling: 1.05,
    defensiveEngagement: 1.0, defensiveAwareness: .9, tackling: .8, speed: .9,
    offensiveAwareness: .75, kickingPower: .6, finishing: .4
  },
  LMF: {
    speed: 1.75, stamina: 1.8, acceleration: 1.55, lowPass: 1.55, loftedPass: 1.4,
    ballControl: 1.45, dribbling: 1.35, tightPossession: 1.25, balance: 1.2,
    defensiveEngagement: .75, defensiveAwareness: .6, offensiveAwareness: .65
  },
  RMF: {
    speed: 1.75, stamina: 1.8, acceleration: 1.55, lowPass: 1.55, loftedPass: 1.4,
    ballControl: 1.45, dribbling: 1.35, tightPossession: 1.25, balance: 1.2,
    defensiveEngagement: .75, defensiveAwareness: .6, offensiveAwareness: .65
  },
  AMF: {
    lowPass: 2.25, ballControl: 2.15, tightPossession: 2.05, dribbling: 1.8,
    offensiveAwareness: 1.65, acceleration: 1.5, balance: 1.45, loftedPass: 1.35,
    finishing: .9, curl: .85, kickingPower: .6, stamina: .65, speed: .55
  },
  SS: {
    offensiveAwareness: 2.3, acceleration: 2.05, finishing: 1.8, ballControl: 1.7,
    dribbling: 1.55, tightPossession: 1.55, balance: 1.6, lowPass: 1.15,
    speed: 1.15, kickingPower: 1.0, curl: .85, stamina: .7, physicalContact: .35
  },
  CF: {
    offensiveAwareness: 2.75, finishing: 2.65, acceleration: 1.75, kickingPower: 1.45,
    speed: 1.35, ballControl: .9, balance: .85, physicalContact: 1.0,
    heading: .9, jump: .8, stamina: .65, lowPass: .4, dribbling: .5
  },
  LWF: {
    dribbling: 2.35, tightPossession: 2.15, acceleration: 2.15, speed: 1.95,
    ballControl: 1.9, balance: 1.6, offensiveAwareness: 1.35, finishing: 1.15,
    curl: 1.05, lowPass: .75, stamina: .8, kickingPower: .65
  },
  RWF: {
    dribbling: 2.35, tightPossession: 2.15, acceleration: 2.15, speed: 1.95,
    ballControl: 1.9, balance: 1.6, offensiveAwareness: 1.35, finishing: 1.15,
    curl: 1.05, lowPass: .75, stamina: .8, kickingPower: .65
  }
};

const POSITION_KEYS: Record<PositionCode, TrainingKey[]> = {
  GK: ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'],
  CB: ['passing', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'],
  LB: ['passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'],
  RB: ['passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'],
  DMF: ['passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'],
  CMF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'],
  LMF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'defending'],
  RMF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'defending'],
  AMF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength'],
  SS: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength'],
  CF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength'],
  LWF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength'],
  RWF: ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength']
};

const DNA_TO_KEYS: Record<keyof CanonicalCardIdentityR60['dna'], TrainingKey[]> = {
  technical: ['dribbling', 'dexterity'],
  creation: ['passing', 'dribbling'],
  finishing: ['shooting', 'dexterity'],
  mobility: ['dexterity', 'lowerBodyStrength'],
  physical: ['lowerBodyStrength', 'aerialStrength'],
  aerial: ['aerialStrength'],
  defending: ['defending', 'aerialStrength'],
  stamina: ['lowerBodyStrength'],
  goalkeeper: ['gk1', 'gk2', 'gk3']
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round1 = (value: number) => Math.round(value * 10) / 10;
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function emptyPlan(): TrainingPlan {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function attribute(result: AnalysisResult, key: AttributeKey) {
  return Number(result.parsed.attributes[key] ?? 0);
}

function positionMix(identity: CanonicalCardIdentityR60) {
  if (identity.naturalPosition === 'GK') return { natural: 1, selected: 0, defensive: 0 };
  if (identity.defencePositionSource === 'EXPLICIT' && identity.defencePosition !== identity.attackPosition) {
    return { natural: .68, selected: .22, defensive: .10 };
  }
  if (identity.naturalPosition === identity.attackPosition) return { natural: .86, selected: .14, defensive: 0 };
  return { natural: .72, selected: .28, defensive: 0 };
}

function mixedAttributeWeight(identity: CanonicalCardIdentityR60, key: AttributeKey) {
  const mix = positionMix(identity);
  return Number(POSITION_ATTRIBUTE_WEIGHTS[identity.naturalPosition]?.[key] ?? 0) * mix.natural
    + Number(POSITION_ATTRIBUTE_WEIGHTS[identity.attackPosition]?.[key] ?? 0) * mix.selected
    + Number(POSITION_ATTRIBUTE_WEIGHTS[identity.defencePosition]?.[key] ?? 0) * mix.defensive;
}

function styleGroupBias(identity: CanonicalCardIdentityR60, key: TrainingKey) {
  const attack = normalize(identity.offensivePlaystyle);
  const defence = normalize(identity.defensivePlaystyle);
  let score = 0;
  const add = (source: string, pattern: RegExp, values: Partial<Record<TrainingKey, number>>, factor = 1) => {
    if (pattern.test(source)) score += Number(values[key] ?? 0) * factor;
  };

  add(attack, /artilheiro|goal poacher/, { shooting: 1.6, dexterity: 1.2, lowerBodyStrength: .45 });
  add(attack, /puxa marcacao|deep lying forward/, { passing: 1.25, dribbling: .95, dexterity: .7 });
  add(attack, /homem de area|fox in the box/, { shooting: 1.55, dexterity: .8, aerialStrength: .55 });
  add(attack, /pivo|target man|atacante pivo/, { aerialStrength: 1.15, passing: .8, lowerBodyStrength: .8, shooting: .5 });
  add(attack, /armador criativo|creative playmaker/, { passing: 1.45, dribbling: 1.25, dexterity: .55 });
  add(attack, /meia versatil|box.to.box/, { lowerBodyStrength: 1.1, passing: .85, defending: .55, dexterity: .55 });
  add(attack, /orquestrador|orchestrator/, { passing: 1.5, dribbling: .5, lowerBodyStrength: .35 });
  add(attack, /jogador de infiltracao|hole player/, { dexterity: 1.3, shooting: .85, dribbling: .55, lowerBodyStrength: .45 });
  add(attack, /classico|classic no/, { passing: 1.2, dribbling: .95, dexterity: .35 });
  add(attack, /lateral ofensivo|lateral atacante|lateral movel|offensive full|roaming flank/, { lowerBodyStrength: 1.05, dexterity: .8, passing: .8, dribbling: .55 });
  add(attack, /ala produtivo|prolific winger/, { dribbling: 1.25, dexterity: 1.0, lowerBodyStrength: .7, shooting: .35 });
  add(attack, /perito em cruzamento|cross specialist/, { passing: 1.35, lowerBodyStrength: .75, dexterity: .45 });

  add(defence, /destruidor|destroyer/, { defending: 1.45, lowerBodyStrength: .75, aerialStrength: .45 }, .55);
  add(defence, /defensor criativo|build up/, { defending: 1.25, passing: .65, aerialStrength: .35 }, .55);
  add(defence, /primeiro volante|anchor man/, { defending: 1.4, passing: .5, lowerBodyStrength: .6 }, .55);
  add(defence, /lateral defensivo|defensive full/, { defending: 1.3, lowerBodyStrength: .6, passing: .35 }, .55);
  add(defence, /goleiro ofensivo|offensive goalkeeper/, { gk2: 1.1, gk1: .65, gk3: .7 }, .7);
  add(defence, /goleiro defensivo|defensive goalkeeper/, { gk1: 1.0, gk3: .85, gk2: .8 }, .7);
  return score;
}

function dnaGroupBias(identity: CanonicalCardIdentityR60, key: TrainingKey) {
  let score = 0;
  for (const [dnaName, keys] of Object.entries(DNA_TO_KEYS) as Array<[keyof CanonicalCardIdentityR60['dna'], TrainingKey[]]>) {
    if (!keys.includes(key)) continue;
    const dna = Number(identity.dna[dnaName] ?? 0);
    if (dna >= 90) score += .82;
    else if (dna >= 85) score += .56;
    else if (dna >= 80) score += .32;
    if (identity.dominantDna.includes(dnaName)) score += .55;
  }
  return score;
}

function physicalBias(result: AnalysisResult, identity: CanonicalCardIdentityR60, key: TrainingKey) {
  const p = result.parsed.physicalProfile;
  let score = 0;
  const compact = Number(p.baseHeight ?? result.parsed.height ?? 0) > 0 && Number(p.baseHeight ?? result.parsed.height ?? 0) <= 176;
  const longLegs = Number(p.legLength ?? 0) >= 8 || Number(p.legCoverageRadius ?? 0) >= 176;
  const strong = Number(p.shoulderWidth ?? 0) >= 7 || Number(p.trunkCollision ?? 0) >= 49 || Number(p.thighSize ?? 0) >= 9;
  const highJump = Number(p.jumpHeight ?? 0) >= 250;
  if (compact && key === 'dribbling') score += .35;
  if (compact && key === 'dexterity') score += .42;
  if (longLegs && ['CB', 'DMF', 'LB', 'RB'].includes(identity.naturalPosition) && key === 'defending') score += .4;
  if (strong && key === 'lowerBodyStrength') score += .35;
  if (strong && key === 'aerialStrength') score += .42;
  if (highJump && key === 'aerialStrength') score += .48;
  return score;
}

function activeKeys(identity: CanonicalCardIdentityR60) {
  const keys = new Set<TrainingKey>(POSITION_KEYS[identity.naturalPosition]);
  for (const key of POSITION_KEYS[identity.attackPosition]) keys.add(key);
  if (identity.defencePositionSource === 'EXPLICIT') {
    for (const key of POSITION_KEYS[identity.defencePosition]) keys.add(key);
  }

  const natural = identity.naturalPosition;
  if (natural === 'GK') return ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'] as TrainingKey[];
  if (['CF', 'SS', 'AMF', 'LWF', 'RWF'].includes(natural)) keys.delete('defending');
  if (natural === 'CB') { keys.delete('shooting'); keys.delete('dribbling'); }
  if ((natural === 'LB' || natural === 'RB') && /lateral defensivo|defensive full/.test(normalize(identity.offensivePlaystyle))) keys.delete('shooting');
  return TRAINING_KEYS.filter((key) => keys.has(key));
}

function staminaTarget(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const pos = identity.naturalPosition;
  let target = pos === 'GK' ? 70
    : pos === 'CB' ? 81
      : pos === 'CF' ? 84
        : pos === 'SS' ? 85
          : pos === 'AMF' ? 86
            : ['LWF', 'RWF'].includes(pos) ? 86
              : ['LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF'].includes(pos) ? 88
                : 85;
  const style = normalize(identity.offensivePlaystyle);
  if (/meia versatil|box.to.box|lateral ofensivo|lateral atacante|lateral movel|ala produtivo|destruidor/.test(style)) target += 1;
  const natural = Number(result.parsed.attributes.stamina ?? 0);
  if (natural >= 92) target = Math.min(target, natural);
  return Math.min(91, target);
}

function staminaFloorLevel(result: AnalysisResult, identity: CanonicalCardIdentityR60, target: number) {
  if (identity.naturalPosition === 'GK') return 0;
  const natural = Number(result.parsed.attributes.stamina ?? 0);
  if (!natural) return 0;
  const deficit = Math.max(0, target - natural);
  const work = ['LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF'].includes(identity.naturalPosition) ? 1 : .82;
  return Math.min(8, Math.max(0, Math.ceil(deficit * .55 * work)));
}

function targetForWeight(weight: number, key: AttributeKey, position: PositionCode) {
  let target = weight >= 2.45 ? 95 : weight >= 1.8 ? 94 : weight >= 1.25 ? 92 : weight >= .75 ? 90 : 87;
  if (position === 'GK' && /^goalkeeper/.test(key)) target = weight >= 2.7 ? 95 : weight >= 2.2 ? 94 : 92;
  if (key === 'stamina' && ['LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF'].includes(position)) target = Math.max(target, 89);
  return target;
}

function marginalSaturation(projected: number, target: number) {
  if (projected < target - 7) return 1.22;
  if (projected < target - 3) return 1.12;
  if (projected <= target) return 1.0;
  if (projected <= Math.max(target + 2, 94)) return .64;
  if (projected <= 96) return .34;
  if (projected <= 98) return .14;
  if (projected <= 100) return .045;
  return .012;
}

function profileMultipliers(profile: QualityProfileR107) {
  if (profile === 'DNA_LOCK') return { role: .94, dna: 1.42, stamina: .9, efficiency: 1.12, floor: .68 };
  if (profile === 'ROLE_PEAK') return { role: 1.28, dna: 1.02, stamina: .88, efficiency: .98, floor: .72 };
  if (profile === 'MATCH_90') return { role: 1.0, dna: 1.02, stamina: 1.48, efficiency: 1.12, floor: 1.0 };
  return { role: 1.08, dna: 1.12, stamina: 1.15, efficiency: 1.16, floor: .86 };
}

function levelUtility(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  key: TrainingKey,
  level: number,
  profile: QualityProfileR107,
  staminaGoal: number
) {
  const multi = profileMultipliers(profile);
  const attrs = ATTRIBUTE_GROUPS_R107[key];
  const style = styleGroupBias(identity, key);
  const dna = dnaGroupBias(identity, key);
  const physical = physicalBias(result, identity, key);
  let score = 0;

  for (let current = 1; current <= level; current += 1) {
    let attributeGain = 0;
    for (const attr of attrs) {
      const weight = mixedAttributeWeight(identity, attr);
      if (weight <= .01) continue;
      const base = attribute(result, attr);
      const projected = base + current - 1;
      const target = attr === 'stamina' ? Math.max(staminaGoal, targetForWeight(weight, attr, identity.naturalPosition)) : targetForWeight(weight, attr, identity.naturalPosition);
      attributeGain += weight * marginalSaturation(projected, target);
    }
    const staminaBonus = key === 'lowerBodyStrength'
      ? Math.max(0, staminaGoal - (attribute(result, 'stamina') + current - 1)) * .055 * multi.stamina
      : 0;
    const identityBonus = (dna * multi.dna + style + physical) * .54;
    const wastePenalty = attrs.every((attr) => attribute(result, attr) + current - 1 >= 97) ? .55 * multi.efficiency : 0;
    score += Math.max(.001, attributeGain * multi.role + identityBonus + staminaBonus - wastePenalty);
  }
  return score;
}

function hardPlanValid(identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const pos = identity.naturalPosition;
  if (pos === 'GK') {
    return Number(plan.shooting) === 0 && Number(plan.passing) === 0 && Number(plan.dribbling) === 0 && Number(plan.dexterity) === 0 && Number(plan.defending) === 0;
  }
  if (pos === 'CB' && (Number(plan.shooting) > 0 || Number(plan.dribbling) > 0)) return false;
  if (['CF', 'SS', 'AMF', 'LWF', 'RWF'].includes(pos) && Number(plan.defending) > 0) return false;
  if ((pos === 'LB' || pos === 'RB') && /lateral defensivo|defensive full/.test(normalize(identity.offensivePlaystyle)) && Number(plan.shooting) > 0) return false;
  if (pos === 'DMF' && /primeiro volante|anchor man|destruidor|destroyer/.test(normalize(identity.offensivePlaystyle)) && Number(plan.shooting) > 2) return false;
  return true;
}

function optimize(result: AnalysisResult, identity: CanonicalCardIdentityR60, profile: QualityProfileR107, target: number, floor: number): TrainingPlan | null {
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  if (!Number.isFinite(budget) || budget <= 0) return null;
  const keys = activeKeys(identity);
  const floorForProfile = Math.min(8, Math.round(floor * profileMultipliers(profile).floor));
  type Node = { score: number; plan: TrainingPlan };
  let dp: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
  dp[0] = { score: 0, plan: emptyPlan() };

  for (const key of keys) {
    const next: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
    for (let spent = 0; spent <= budget; spent += 1) {
      const previous = dp[spent];
      if (!previous) continue;
      for (let level = 0; level <= 16; level += 1) {
        if (key === 'lowerBodyStrength' && level < floorForProfile) continue;
        const total = spent + trainingTotalCost(level);
        if (total > budget) break;
        const plan = { ...previous.plan, [key]: level };
        if (!hardPlanValid(identity, plan)) continue;
        const score = previous.score + levelUtility(result, identity, key, level, profile, target);
        if (!next[total] || score > Number(next[total]?.score ?? -Infinity) + 1e-9) next[total] = { score, plan };
      }
    }
    dp = next;
  }
  return dp[budget]?.plan ?? null;
}

function projectedAttribute(result: AnalysisResult, plan: TrainingPlan, attr: AttributeKey) {
  let gain = 0;
  for (const key of TRAINING_KEYS) {
    if (ATTRIBUTE_GROUPS_R107[key].includes(attr)) gain += Number(plan[key] ?? 0);
  }
  return attribute(result, attr) + gain;
}

function essentialAttributes(identity: CanonicalCardIdentityR60) {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[identity.naturalPosition];
  return (Object.entries(weights) as Array<[AttributeKey, number]>)
    .filter(([, weight]) => Number(weight) >= 1.25)
    .sort((a, b) => b[1] - a[1]);
}

function wastedLevels(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  let wasted = 0;
  for (const key of activeKeys(identity)) {
    const level = Number(plan[key] ?? 0);
    for (let current = 1; current <= level; current += 1) {
      const useful = ATTRIBUTE_GROUPS_R107[key].some((attr) => {
        const weight = mixedAttributeWeight(identity, attr);
        return weight >= .45 && attribute(result, attr) + current - 1 < 97;
      });
      if (!useful) wasted += 1;
    }
  }
  return wasted;
}

function dnaProtectionScore(_result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const top = identity.dominantDna.slice(0, 3);
  if (!top.length) return 70;
  const values = top.map((dnaName) => {
    const keys = DNA_TO_KEYS[dnaName].filter((key) => activeKeys(identity).includes(key));
    if (!keys.length) return 82;
    const investment = keys.reduce((sum, key) => sum + Number(plan[key] ?? 0), 0);
    const naturalDna = Number(identity.dna[dnaName] ?? 0);
    if (naturalDna >= 94 && investment === 0) return 90;
    if (naturalDna >= 90) return clamp(82 + Math.min(18, investment * 2));
    return clamp(66 + Math.min(34, investment * 3.2));
  });
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function scorePerformancePlan2027R107(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan, profile: QualityProfileR107 = 'BALANCED'): PerformanceCandidateR107 {
  const target = staminaTarget(result, identity);
  const essential = essentialAttributes(identity);
  const totalWeight = essential.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  let role = 0;
  let floorsMet = 0;
  for (const [attr, weight] of essential) {
    const projected = projectedAttribute(result, plan, attr);
    const wanted = targetForWeight(weight, attr, identity.naturalPosition);
    const ratio = clamp((projected / Math.max(1, wanted)) * 100, 0, 104);
    role += ratio * weight;
    const floor = Math.min(wanted, weight >= 2 ? 91 : 88);
    if (projected >= floor) floorsMet += 1;
  }
  const roleScore = clamp(role / totalWeight);
  const dnaScore = clamp(dnaProtectionScore(result, identity, plan));
  const projectedStamina = projectedAttribute(result, plan, 'stamina');
  const staminaDeficit = Math.max(0, target - projectedStamina);
  const staminaExcess = Math.max(0, projectedStamina - target - 5);
  const staminaScore = identity.naturalPosition === 'GK' ? 96 : clamp(100 - staminaDeficit * 5.2 - staminaExcess * .7);
  const waste = wastedLevels(result, identity, plan);
  const efficiencyScore = clamp(100 - waste * 4.2);
  const essentialFloorCoverage = essential.length ? clamp((floorsMet / essential.length) * 100) : 100;
  const exactBudget = trainingPlanTotalCost(plan) === Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const totalScore = clamp(roleScore * .42 + dnaScore * .24 + staminaScore * .16 + efficiencyScore * .12 + essentialFloorCoverage * .06);
  const projectedStrongUntilMinute = identity.naturalPosition === 'GK'
    ? 90
    : Math.round(clamp(67 + staminaScore * .19 + Math.min(5, efficiencyScore * .04), 67, 90));
  return {
    profile,
    training: { ...plan },
    exactBudget,
    totalScore: round1(totalScore),
    roleScore: round1(roleScore),
    dnaScore: round1(dnaScore),
    staminaScore: round1(staminaScore),
    efficiencyScore: round1(efficiencyScore),
    essentialFloorCoverage: round1(essentialFloorCoverage),
    projectedStrongUntilMinute,
    projectedStamina: round1(projectedStamina),
    wastedLevels: waste
  };
}

function confidence(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const count = Number(result.parsed.evidence.attributeCount ?? 0);
  const expected = identity.naturalPosition === 'GK' ? 10 : 18;
  const coverage = clamp((count / expected) * 100);
  const base = Number(result.parsed.confidence ?? 0);
  const normalizedBase = base <= 1 ? base * 100 : base;
  return round1(clamp(identity.identityConfidence * .52 + coverage * .32 + normalizedBase * .16));
}

export function applyPerformanceEngine2027R107(input: AnalysisResult): AnalysisResult {
  const carrier = input as Carrier;
  const identity = carrier.canonicalCardIdentity2027R60;
  if (!identity) return input;
  const budget = Number(input.trainingPointsTotal ?? trainingPlanTotalCost(input.training));
  if (!Number.isFinite(budget) || budget <= 0) return input;

  const target = staminaTarget(input, identity);
  const floor = staminaFloorLevel(input, identity, target);
  const profiles: QualityProfileR107[] = ['DNA_LOCK', 'ROLE_PEAK', 'MATCH_90', 'BALANCED'];
  const generated = profiles.map((profile) => {
    const plan = optimize(input, identity, profile, target, floor) ?? input.training;
    return scorePerformancePlan2027R107(input, identity, plan, profile);
  });
  const baseline = scorePerformancePlan2027R107(input, identity, input.training, 'BALANCED');
  const unique = new Map<string, PerformanceCandidateR107>();
  for (const candidate of generated) {
    const signature = TRAINING_KEYS.map((key) => `${key}:${candidate.training[key] ?? 0}`).join('|');
    const previous = unique.get(signature);
    if (!previous || candidate.totalScore > previous.totalScore) unique.set(signature, candidate);
  }
  const ranked = [...unique.values()].sort((a, b) =>
    b.totalScore - a.totalScore ||
    b.essentialFloorCoverage - a.essentialFloorCoverage ||
    b.staminaScore - a.staminaScore ||
    a.wastedLevels - b.wastedLevels
  );
  const winner = ranked[0] ?? baseline;
  const conf = confidence(input, identity);
  const staminaBalanced = identity.naturalPosition === 'GK' || winner.projectedStamina >= target - 3;
  const dnaProtected = winner.dnaScore >= 74;
  const analysis: PerformanceEngine2027R107 = {
    version: PERFORMANCE_ENGINE_2027_R107_VERSION,
    authority: 'SPECIALIST_READ_ONLY',
    model: 'ATTRIBUTE_LEVEL_DNA_FIRST_V600',
    budget,
    naturalPosition: identity.naturalPosition,
    selectedPosition: identity.attackPosition,
    defensivePosition: identity.defencePosition,
    positionMix: positionMix(identity),
    staminaTarget: target,
    staminaLevelFloor: floor,
    strongestDna: identity.dominantDna.map(String),
    baseline,
    winner,
    alternatives: ranked.slice(1, 4),
    improvementVsIncoming: round1(winner.totalScore - baseline.totalScore),
    confidence: conf,
    guards: {
      exactBudget: winner.exactBudget,
      masterEngineIsOnlyWriter: false,
      finalAuthorityR118IsOnlyWriter: true,
      overallIgnored: true,
      formationIndependent: true,
      correctGkMapping: true,
      dnaProtected,
      staminaBalanced,
      diminishingReturns: true,
      antiGeneric: true
    }
  };

  return {
    ...input,
    performanceEngine2027R107: analysis,
    recommendationExplanation: [
      `Ficha Quality r107: ${winner.totalScore}/100 • perfil ${winner.profile} • ganho estimado ${analysis.improvementVsIncoming >= 0 ? '+' : ''}${analysis.improvementVsIncoming}.`,
      `DNA-first: ${analysis.strongestDna.join(' + ') || 'DNA ainda incompleto'}; posição natural pesa ${Math.round(analysis.positionMix.natural * 100)}% e a adaptação selecionada ${Math.round(analysis.positionMix.selected * 100)}%.`,
      `90 min: stamina projetada ${winner.projectedStamina}, alvo ${target}; intensidade estimada até ~${winner.projectedStrongUntilMinute} min.`,
      `Eficiência ${winner.efficiencyScore}/100; cobertura dos atributos essenciais ${winner.essentialFloorCoverage}/100; níveis saturados ${winner.wastedLevels}.`,
      'r107 ignora overall e formação ao calcular a ficha; usa atributos reais, DNA, função, estilo e retorno marginal. Apenas o Motor Mestre pode aplicar a vencedora.',
      ...input.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 96)
  } as WithPerformanceEngineR107;
}
