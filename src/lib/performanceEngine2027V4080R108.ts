import type { AnalysisResult, AttributeKey, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const PERFORMANCE_ENGINE_2027_R108_VERSION = '40.80-r108-extreme-gameplay-v600' as const;

export type ExtremeProfileR108 = 'EXTREME_DNA' | 'ROLE_KILLER' | 'RESPONSE_META' | 'MATCH_ENDURANCE';

type AttrRule = { weight: number; floor: number; peak: number; ceiling: number };

export type PerformanceCandidateR108 = {
  profile: ExtremeProfileR108;
  training: TrainingPlan;
  exactBudget: boolean;
  totalScore: number;
  impactScore: number;
  synergyScore: number;
  responseScore: number;
  floorCoverage: number;
  staminaScore: number;
  wasteScore: number;
  concentrationScore: number;
  projectedStamina: number;
  projectedStrongUntilMinute: number;
  fatalBottlenecks: string[];
  wastedLevels: number;
  categoryCount: number;
};

export type PerformanceEngine2027R108 = {
  version: typeof PERFORMANCE_ENGINE_2027_R108_VERSION;
  authority: 'SPECIALIST_READ_ONLY';
  model: 'EXTREME_GAMEPLAY_BREAKPOINT_SYNERGY_V600';
  budget: number;
  naturalPosition: PositionCode;
  selectedPosition: PositionCode;
  defensivePosition: PositionCode;
  staminaTarget: number;
  dominantCore: string[];
  baseline: PerformanceCandidateR108;
  winner: PerformanceCandidateR108;
  alternatives: PerformanceCandidateR108[];
  improvementVsIncoming: number;
  confidence: number;
  guards: {
    exactBudget: boolean;
    masterEngineIsOnlyWriter: true;
    overallIgnored: true;
    formationIndependent: true;
    positionSelectionDoesNotRewriteCore: true;
    fatalBottlenecksControlled: boolean;
    staminaProtected: boolean;
    wasteControlled: boolean;
    synergyFirst: true;
    antiOverallSpread: boolean;
  };
};

type Carrier = AnalysisResult & { canonicalCardIdentity2027R60?: CanonicalCardIdentityR60 };
export type WithPerformanceEngineR108 = AnalysisResult & { performanceEngine2027R108: PerformanceEngine2027R108 };

export const ATTRIBUTE_GROUPS_R108: Record<TrainingKey, AttributeKey[]> = {
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

const rule = (weight: number, floor: number, peak: number, ceiling = peak + 2): AttrRule => ({ weight, floor, peak, ceiling });

const BASE_RULES: Record<PositionCode, Partial<Record<AttributeKey, AttrRule>>> = {
  GK: {
    goalkeeperAwareness: rule(3.4, 90, 95, 97),
    goalkeeperReflexes: rule(3.4, 90, 95, 97),
    goalkeeperReach: rule(3.15, 89, 94, 97),
    goalkeeperParrying: rule(2.1, 85, 91, 94),
    goalkeeperCatching: rule(1.45, 82, 89, 92),
    jump: rule(.7, 78, 86, 90)
  },
  CB: {
    defensiveAwareness: rule(3.35, 87, 94, 96),
    tackling: rule(3.0, 86, 93, 95),
    defensiveEngagement: rule(2.75, 85, 92, 95),
    physicalContact: rule(2.0, 82, 90, 93),
    speed: rule(1.8, 80, 88, 91),
    acceleration: rule(1.05, 76, 84, 88),
    jump: rule(1.35, 79, 88, 92),
    heading: rule(1.25, 80, 89, 92),
    aggression: rule(1.05, 80, 89, 92),
    stamina: rule(.8, 79, 85, 88),
    lowPass: rule(.65, 75, 84, 88)
  },
  LB: {
    speed: rule(2.55, 83, 91, 94),
    stamina: rule(2.45, 85, 91, 94),
    defensiveAwareness: rule(2.35, 82, 90, 93),
    tackling: rule(2.15, 82, 90, 93),
    defensiveEngagement: rule(1.95, 81, 89, 92),
    acceleration: rule(1.95, 81, 89, 92),
    balance: rule(1.05, 78, 86, 90),
    lowPass: rule(1.05, 78, 87, 90),
    loftedPass: rule(.95, 78, 87, 90),
    ballControl: rule(.8, 77, 85, 89)
  },
  RB: {
    speed: rule(2.55, 83, 91, 94),
    stamina: rule(2.45, 85, 91, 94),
    defensiveAwareness: rule(2.35, 82, 90, 93),
    tackling: rule(2.15, 82, 90, 93),
    defensiveEngagement: rule(1.95, 81, 89, 92),
    acceleration: rule(1.95, 81, 89, 92),
    balance: rule(1.05, 78, 86, 90),
    lowPass: rule(1.05, 78, 87, 90),
    loftedPass: rule(.95, 78, 87, 90),
    ballControl: rule(.8, 77, 85, 89)
  },
  DMF: {
    defensiveAwareness: rule(3.1, 85, 93, 96),
    defensiveEngagement: rule(2.8, 84, 92, 95),
    tackling: rule(2.65, 84, 92, 95),
    stamina: rule(2.2, 84, 90, 93),
    physicalContact: rule(1.8, 80, 89, 92),
    lowPass: rule(1.7, 81, 90, 93),
    speed: rule(1.15, 78, 86, 90),
    acceleration: rule(.9, 76, 84, 88),
    balance: rule(.85, 76, 84, 88),
    ballControl: rule(.85, 78, 86, 90),
    loftedPass: rule(.8, 77, 86, 90),
    aggression: rule(1.2, 80, 89, 92)
  },
  CMF: {
    lowPass: rule(2.55, 83, 92, 95),
    ballControl: rule(2.3, 82, 91, 94),
    tightPossession: rule(2.15, 81, 90, 94),
    stamina: rule(2.05, 83, 90, 93),
    balance: rule(1.55, 79, 88, 92),
    acceleration: rule(1.45, 79, 87, 91),
    loftedPass: rule(1.35, 80, 89, 92),
    dribbling: rule(1.2, 79, 88, 92),
    speed: rule(.95, 77, 85, 89),
    defensiveEngagement: rule(.95, 77, 86, 90),
    defensiveAwareness: rule(.85, 76, 85, 89),
    offensiveAwareness: rule(.75, 77, 86, 90)
  },
  LMF: {
    speed: rule(2.2, 82, 90, 94),
    stamina: rule(2.1, 83, 90, 93),
    acceleration: rule(2.0, 82, 90, 94),
    ballControl: rule(1.85, 81, 90, 93),
    dribbling: rule(1.8, 81, 90, 94),
    tightPossession: rule(1.65, 80, 89, 93),
    lowPass: rule(1.55, 80, 89, 92),
    balance: rule(1.45, 80, 88, 92),
    loftedPass: rule(1.25, 79, 88, 92),
    offensiveAwareness: rule(.75, 77, 86, 90)
  },
  RMF: {
    speed: rule(2.2, 82, 90, 94),
    stamina: rule(2.1, 83, 90, 93),
    acceleration: rule(2.0, 82, 90, 94),
    ballControl: rule(1.85, 81, 90, 93),
    dribbling: rule(1.8, 81, 90, 94),
    tightPossession: rule(1.65, 80, 89, 93),
    lowPass: rule(1.55, 80, 89, 92),
    balance: rule(1.45, 80, 88, 92),
    loftedPass: rule(1.25, 79, 88, 92),
    offensiveAwareness: rule(.75, 77, 86, 90)
  },
  AMF: {
    ballControl: rule(2.9, 84, 93, 96),
    tightPossession: rule(2.75, 84, 93, 96),
    lowPass: rule(2.55, 83, 92, 95),
    dribbling: rule(2.4, 83, 92, 96),
    acceleration: rule(2.15, 82, 91, 95),
    balance: rule(2.0, 82, 91, 95),
    offensiveAwareness: rule(1.65, 80, 90, 94),
    loftedPass: rule(1.25, 79, 89, 92),
    finishing: rule(1.0, 77, 87, 91),
    curl: rule(.9, 77, 87, 91),
    stamina: rule(.75, 78, 85, 89)
  },
  SS: {
    offensiveAwareness: rule(2.95, 85, 94, 97),
    acceleration: rule(2.65, 84, 93, 97),
    balance: rule(2.25, 82, 91, 95),
    ballControl: rule(2.2, 83, 92, 95),
    tightPossession: rule(2.1, 82, 92, 95),
    dribbling: rule(2.0, 82, 92, 96),
    finishing: rule(2.0, 82, 91, 95),
    speed: rule(1.35, 80, 89, 93),
    lowPass: rule(1.25, 79, 89, 92),
    kickingPower: rule(1.1, 79, 88, 92),
    stamina: rule(.75, 78, 85, 89)
  },
  CF: {
    offensiveAwareness: rule(3.45, 87, 95, 98),
    finishing: rule(3.3, 87, 95, 98),
    acceleration: rule(2.65, 83, 92, 96),
    speed: rule(1.85, 81, 90, 94),
    kickingPower: rule(1.75, 82, 91, 95),
    balance: rule(1.35, 78, 87, 91),
    physicalContact: rule(1.25, 78, 88, 92),
    ballControl: rule(1.15, 78, 88, 92),
    heading: rule(1.0, 77, 87, 92),
    jump: rule(.9, 77, 87, 92),
    stamina: rule(.65, 76, 83, 87),
    lowPass: rule(.45, 74, 82, 86)
  },
  LWF: {
    dribbling: rule(3.15, 85, 94, 97),
    tightPossession: rule(3.0, 84, 94, 97),
    acceleration: rule(2.85, 84, 93, 97),
    speed: rule(2.6, 83, 92, 96),
    ballControl: rule(2.55, 84, 93, 96),
    balance: rule(2.2, 82, 91, 95),
    offensiveAwareness: rule(1.55, 80, 89, 93),
    finishing: rule(1.45, 79, 89, 93),
    curl: rule(1.15, 79, 89, 93),
    stamina: rule(.8, 78, 86, 90),
    lowPass: rule(.7, 77, 86, 90)
  },
  RWF: {
    dribbling: rule(3.15, 85, 94, 97),
    tightPossession: rule(3.0, 84, 94, 97),
    acceleration: rule(2.85, 84, 93, 97),
    speed: rule(2.6, 83, 92, 96),
    ballControl: rule(2.55, 84, 93, 96),
    balance: rule(2.2, 82, 91, 95),
    offensiveAwareness: rule(1.55, 80, 89, 93),
    finishing: rule(1.45, 79, 89, 93),
    curl: rule(1.15, 79, 89, 93),
    stamina: rule(.8, 78, 86, 90),
    lowPass: rule(.7, 77, 86, 90)
  }
};

const DNA_ATTRIBUTES: Record<keyof CanonicalCardIdentityR60['dna'], AttributeKey[]> = {
  technical: ['ballControl', 'dribbling', 'tightPossession', 'balance', 'acceleration'],
  creation: ['lowPass', 'loftedPass', 'ballControl', 'tightPossession'],
  finishing: ['offensiveAwareness', 'finishing', 'kickingPower', 'curl'],
  mobility: ['speed', 'acceleration', 'balance', 'stamina'],
  physical: ['physicalContact', 'balance', 'speed', 'stamina'],
  aerial: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  stamina: ['stamina', 'speed'],
  goalkeeper: ['goalkeeperAwareness', 'goalkeeperReflexes', 'goalkeeperReach', 'goalkeeperParrying', 'goalkeeperCatching']
};

const DNA_KEYS: Record<keyof CanonicalCardIdentityR60['dna'], TrainingKey[]> = {
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

const POSITION_ALLOWED_KEYS: Record<PositionCode, TrainingKey[]> = {
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

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round1 = (value: number) => Math.round(value * 10) / 10;
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function emptyPlan(): TrainingPlan {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function attribute(result: AnalysisResult, key: AttributeKey) {
  return Number(result.parsed.attributes[key] ?? 0);
}

function cloneRules(position: PositionCode) {
  const output: Partial<Record<AttributeKey, AttrRule>> = {};
  for (const [key, value] of Object.entries(BASE_RULES[position]) as Array<[AttributeKey, AttrRule]>) output[key] = { ...value };
  return output;
}

function ensureRule(rules: Partial<Record<AttributeKey, AttrRule>>, key: AttributeKey) {
  if (!rules[key]) rules[key] = rule(.45, 76, 86, 90);
  return rules[key] as AttrRule;
}

function bump(rules: Partial<Record<AttributeKey, AttrRule>>, key: AttributeKey, weight: number, floor?: number, peak?: number, ceiling?: number) {
  const current = ensureRule(rules, key);
  current.weight += weight;
  if (floor !== undefined) current.floor = Math.max(current.floor, floor);
  if (peak !== undefined) current.peak = Math.max(current.peak, peak);
  if (ceiling !== undefined) current.ceiling = Math.max(current.ceiling, ceiling);
}

function applyStyleOverlay(rules: Partial<Record<AttributeKey, AttrRule>>, identity: CanonicalCardIdentityR60) {
  const style = normalize(`${identity.offensivePlaystyle ?? ''} ${identity.defensivePlaystyle ?? ''}`);
  const add = (pattern: RegExp, entries: Array<[AttributeKey, number, number?, number?, number?]>) => {
    if (!pattern.test(style)) return;
    for (const [key, weight, floor, peak, ceiling] of entries) bump(rules, key, weight, floor, peak, ceiling);
  };

  add(/artilheiro|goal poacher/, [
    ['offensiveAwareness', 1.0, 88, 96, 98], ['finishing', 1.05, 88, 96, 98], ['acceleration', .55, 84, 93, 96]
  ]);
  add(/puxa marcacao|deep lying forward/, [
    ['lowPass', 1.0, 82, 91, 94], ['ballControl', .8, 83, 92, 95], ['tightPossession', .75, 82, 91, 95],
    ['dribbling', .55, 80, 90, 94], ['balance', .45, 80, 89, 93]
  ]);
  add(/homem de area|fox in the box/, [
    ['offensiveAwareness', 1.0, 88, 96, 98], ['finishing', 1.0, 88, 96, 98], ['heading', .75, 80, 90, 94],
    ['jump', .7, 80, 90, 94], ['physicalContact', .45, 80, 89, 93]
  ]);
  add(/pivo|target man|atacante pivo/, [
    ['physicalContact', 1.15, 83, 92, 95], ['ballControl', .8, 82, 91, 94], ['lowPass', .75, 80, 89, 92],
    ['heading', .85, 82, 91, 95], ['jump', .65, 80, 90, 94], ['balance', .5, 80, 89, 93]
  ]);
  add(/armador criativo|creative playmaker/, [
    ['lowPass', 1.15, 84, 93, 96], ['ballControl', .95, 84, 93, 96], ['tightPossession', .9, 83, 92, 96],
    ['dribbling', .75, 82, 91, 95], ['balance', .5, 81, 90, 94]
  ]);
  add(/primeiro volante|anchor man/, [
    ['defensiveAwareness', 1.1, 86, 94, 96], ['defensiveEngagement', .9, 85, 93, 96], ['tackling', .9, 85, 93, 96],
    ['stamina', .65, 85, 91, 94], ['physicalContact', .55, 82, 90, 93], ['lowPass', .35, 80, 88, 92]
  ]);
  add(/destruidor|destroyer/, [
    ['defensiveEngagement', 1.15, 86, 94, 96], ['tackling', 1.0, 86, 94, 96], ['aggression', .8, 84, 92, 95],
    ['stamina', .6, 84, 91, 94], ['speed', .35, 80, 88, 92]
  ]);
  add(/orquestrador|orchestrator/, [
    ['lowPass', 1.2, 84, 93, 96], ['loftedPass', .95, 82, 91, 94], ['ballControl', .75, 82, 91, 94],
    ['tightPossession', .5, 80, 89, 93]
  ]);
  add(/classico|classic no/, [
    ['lowPass', 1.0, 83, 92, 95], ['ballControl', .9, 84, 93, 96], ['tightPossession', .85, 83, 92, 96],
    ['dribbling', .6, 82, 91, 95], ['balance', .45, 81, 90, 94]
  ]);
  add(/jogador de infiltracao|hole player|atacante surpresa/, [
    ['offensiveAwareness', 1.0, 85, 94, 97], ['acceleration', .8, 84, 93, 96], ['finishing', .7, 82, 91, 95],
    ['balance', .4, 80, 89, 93]
  ]);
  add(/meia versatil|box.to.box/, [
    ['stamina', 1.0, 86, 92, 95], ['speed', .45, 80, 88, 92], ['acceleration', .4, 80, 88, 92],
    ['lowPass', .45, 82, 90, 93], ['defensiveEngagement', .4, 80, 88, 92]
  ]);
  add(/defensor criativo|build up/, [
    ['defensiveAwareness', .9, 87, 94, 96], ['tackling', .55, 85, 92, 95], ['defensiveEngagement', .55, 84, 92, 95],
    ['lowPass', .65, 80, 88, 92], ['loftedPass', .45, 78, 86, 90]
  ]);
  add(/lateral defensivo|defensive full/, [
    ['defensiveAwareness', 1.0, 84, 92, 95], ['tackling', .85, 84, 92, 95], ['defensiveEngagement', .75, 83, 91, 94],
    ['speed', .45, 83, 91, 94], ['stamina', .45, 85, 91, 94]
  ]);
  add(/lateral ofensivo|lateral atacante|offensive full/, [
    ['speed', .75, 84, 92, 95], ['stamina', .85, 86, 92, 95], ['acceleration', .6, 82, 90, 94],
    ['loftedPass', .6, 80, 89, 93], ['lowPass', .4, 80, 88, 92]
  ]);
  add(/ala produtivo|lateral movel|roaming flank|prolific winger/, [
    ['speed', .8, 84, 92, 96], ['acceleration', .8, 84, 92, 96], ['dribbling', .7, 83, 92, 96],
    ['stamina', .55, 83, 90, 94]
  ]);
  add(/perito em cruzamento|cross specialist/, [
    ['loftedPass', 1.15, 84, 93, 96], ['curl', .9, 82, 91, 95], ['stamina', .45, 82, 89, 93]
  ]);
  add(/goleiro ofensivo|offensive goalkeeper/, [
    ['goalkeeperReflexes', .65, 90, 95, 97], ['goalkeeperReach', .75, 90, 95, 97], ['goalkeeperAwareness', .45, 90, 95, 97]
  ]);
  add(/goleiro defensivo|defensive goalkeeper/, [
    ['goalkeeperAwareness', .75, 91, 96, 98], ['goalkeeperReflexes', .6, 90, 95, 97], ['goalkeeperCatching', .35, 84, 90, 93]
  ]);
}

function applySkillOverlay(result: AnalysisResult, rules: Partial<Record<AttributeKey, AttrRule>>) {
  const skills = normalize([...(result.parsed.nativeSkills ?? []), ...(result.parsed.additionalSkills ?? []), ...(result.parsed.specialSkills ?? [])].join(' | '));
  const add = (pattern: RegExp, entries: Array<[AttributeKey, number]>) => {
    if (!pattern.test(skills)) return;
    for (const [key, value] of entries) bump(rules, key, value);
  };
  add(/duplo|double touch|sola|sole control/, [['ballControl', .35], ['dribbling', .45], ['tightPossession', .45], ['balance', .25], ['acceleration', .2]]);
  add(/passe em profundidade|through passing|passe de primeira|one.touch pass|weighted pass|passe ponderado/, [['lowPass', .4], ['loftedPass', .2], ['ballControl', .15]]);
  add(/chute de primeira|first.time shot|finaliza|phenomenal finishing|blitz curler/, [['finishing', .45], ['offensiveAwareness', .25], ['kickingPower', .2], ['curl', .2]]);
  add(/cabec|heading|superioridade aerea|aerial superiority/, [['heading', .45], ['jump', .35], ['physicalContact', .25]]);
  add(/intercept|bloqueador|blocker|marcacao individual|man marking/, [['defensiveAwareness', .4], ['tackling', .35], ['defensiveEngagement', .35]]);
  add(/cruzamento|pinpoint crossing/, [['loftedPass', .5], ['curl', .35]]);
}

function applyDnaAmplifier(result: AnalysisResult, identity: CanonicalCardIdentityR60, rules: Partial<Record<AttributeKey, AttrRule>>) {
  for (const dnaName of identity.dominantDna.slice(0, 3)) {
    const dna = Number(identity.dna[dnaName] ?? 0);
    if (dna < 82) continue;
    for (const key of DNA_ATTRIBUTES[dnaName]) {
      const existing = rules[key];
      if (!existing) continue;
      const base = attribute(result, key);
      const bonus = dna >= 92 ? .38 : dna >= 87 ? .26 : .16;
      existing.weight += bonus;
      if (base >= existing.floor) existing.peak = Math.min(97, existing.peak + (dna >= 92 ? 1 : 0));
      if (base >= 92 && existing.weight >= 1.6) existing.ceiling = Math.min(99, existing.ceiling + 1);
    }
  }
}

function buildRules(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const rules = cloneRules(identity.naturalPosition);
  applyStyleOverlay(rules, identity);
  applySkillOverlay(result, rules);
  applyDnaAmplifier(result, identity, rules);

  for (const [key, current] of Object.entries(rules) as Array<[AttributeKey, AttrRule]>) {
    const base = attribute(result, key);
    if (base >= 90 && current.weight >= 1.6) current.weight *= 1.08;
    if (base >= 93 && current.weight >= 2.0) current.weight *= 1.06;
    if (base > 0 && base <= current.floor - 10 && current.weight < 1.55) current.weight *= .58;
  }
  return rules;
}

function staminaTarget(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const pos = identity.naturalPosition;
  if (pos === 'GK') return 0;
  let target = pos === 'CB' ? 80
    : pos === 'CF' ? 82
      : pos === 'SS' ? 84
        : pos === 'AMF' ? 84
          : ['LWF', 'RWF'].includes(pos) ? 84
            : ['LMF', 'RMF'].includes(pos) ? 87
              : ['LB', 'RB', 'DMF', 'CMF'].includes(pos) ? 86
                : 84;
  const style = normalize(`${identity.offensivePlaystyle ?? ''} ${identity.defensivePlaystyle ?? ''}`);
  if (/meia versatil|box.to.box|lateral ofensivo|lateral atacante|lateral movel|ala produtivo|destruidor/.test(style)) target += 1;
  const natural = attribute(result, 'stamina');
  if (natural >= target) return natural;
  return Math.min(90, target);
}

function groupPriority(rules: Partial<Record<AttributeKey, AttrRule>>, key: TrainingKey) {
  return ATTRIBUTE_GROUPS_R108[key].reduce((sum, attr) => sum + Number(rules[attr]?.weight ?? 0), 0);
}

function mandatoryKeys(identity: CanonicalCardIdentityR60, staminaGoal: number, result: AnalysisResult, profile: ExtremeProfileR108) {
  const keys = new Set<TrainingKey>();
  const pos = identity.naturalPosition;
  if (pos === 'GK') {
    keys.add('gk1'); keys.add('gk2'); keys.add('gk3');
    return keys;
  }
  if (['CB', 'LB', 'RB', 'DMF'].includes(pos)) keys.add('defending');
  if (pos === 'CF') { keys.add('shooting'); keys.add('dexterity'); }
  if (['AMF', 'SS', 'LWF', 'RWF'].includes(pos)) { keys.add('dribbling'); keys.add('dexterity'); }
  if (['CMF', 'LMF', 'RMF'].includes(pos)) keys.add('passing');
  if (staminaGoal > 0 && attribute(result, 'stamina') < staminaGoal - 1) keys.add('lowerBodyStrength');
  if (profile === 'RESPONSE_META') {
    if (['CB', 'LB', 'RB', 'DMF'].includes(pos)) keys.add('lowerBodyStrength');
    else keys.add('dexterity');
  }
  if (profile === 'MATCH_ENDURANCE') keys.add('lowerBodyStrength');
  return keys;
}

function activeKeys(result: AnalysisResult, identity: CanonicalCardIdentityR60, rules: Partial<Record<AttributeKey, AttrRule>>, profile: ExtremeProfileR108, staminaGoal: number) {
  const allowed = POSITION_ALLOWED_KEYS[identity.naturalPosition];
  const ranked = [...allowed].sort((a, b) => groupPriority(rules, b) - groupPriority(rules, a));
  const mandatory = mandatoryKeys(identity, staminaGoal, result, profile);
  const desired = profile === 'EXTREME_DNA' ? 5 : 6;
  const chosen = new Set<TrainingKey>(mandatory);
  for (const key of ranked) {
    if (chosen.size >= desired) break;
    chosen.add(key);
  }
  while (chosen.size < 4) {
    const next = ranked.find((key) => !chosen.has(key));
    if (!next) break;
    chosen.add(next);
  }
  return TRAINING_KEYS.filter((key) => chosen.has(key));
}

function profileMultiplier(profile: ExtremeProfileR108, key: TrainingKey, identity: CanonicalCardIdentityR60) {
  let value = 1;
  const dnaKeys = new Set(identity.dominantDna.slice(0, 2).flatMap((name) => DNA_KEYS[name]));
  if (profile === 'EXTREME_DNA' && dnaKeys.has(key)) value *= 1.34;
  if (profile === 'ROLE_KILLER') value *= 1.12;
  if (profile === 'RESPONSE_META') {
    if (['dexterity', 'dribbling', 'lowerBodyStrength', 'defending', 'gk2', 'gk3'].includes(key)) value *= 1.28;
    else value *= .96;
  }
  if (profile === 'MATCH_ENDURANCE') {
    if (key === 'lowerBodyStrength') value *= 1.42;
    else value *= 1.0;
  }
  return value;
}

function marginalAttrValue(base: number, before: number, current: AttrRule, dominant: boolean) {
  const after = before + 1;
  let factor = 0;
  if (after <= current.floor) factor = current.weight >= 2.0 ? 1.7 : 1.1;
  else if (after <= current.peak) factor = 1.14;
  else if (after <= current.ceiling) factor = dominant && current.weight >= 1.7 ? .56 : .28;
  else factor = .025;

  if (after === current.floor) factor += current.weight >= 2.0 ? .52 : .18;
  if (after === current.peak) factor += current.weight >= 2.0 ? .34 : .12;
  if (base >= current.floor && current.weight >= 1.6 && after <= current.peak) factor *= 1.12;
  if (base >= 90 && current.weight >= 2.0 && after <= current.ceiling) factor *= 1.08;
  if (base > 0 && base <= current.floor - 10 && current.weight < 1.55) factor *= .55;
  return current.weight * factor;
}

function dominantAttributeSet(identity: CanonicalCardIdentityR60) {
  return new Set(identity.dominantDna.slice(0, 3).flatMap((name) => DNA_ATTRIBUTES[name]));
}

function levelUtility(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  rules: Partial<Record<AttributeKey, AttrRule>>,
  key: TrainingKey,
  level: number,
  profile: ExtremeProfileR108,
  staminaGoal: number,
  active: TrainingKey[]
) {
  const dominant = dominantAttributeSet(identity);
  const priority = groupPriority(rules, key);
  const priorities = active.map((activeKey) => groupPriority(rules, activeKey)).sort((a, b) => b - a);
  const topCut = priorities[Math.min(3, Math.max(0, priorities.length - 1))] ?? 0;
  let score = level > 0 && priority < topCut ? -0.35 : 0;

  for (let currentLevel = 1; currentLevel <= level; currentLevel += 1) {
    let marginal = 0;
    for (const attr of ATTRIBUTE_GROUPS_R108[key]) {
      const attrRule = rules[attr];
      if (!attrRule || attrRule.weight <= .05) continue;
      const base = attribute(result, attr);
      marginal += marginalAttrValue(base, base + currentLevel - 1, attrRule, dominant.has(attr));
    }
    if (key === 'lowerBodyStrength' && staminaGoal > 0) {
      const beforeStamina = attribute(result, 'stamina') + currentLevel - 1;
      if (beforeStamina < staminaGoal) marginal += (staminaGoal - beforeStamina) * .18;
    }
    score += marginal * profileMultiplier(profile, key, identity);
  }
  return score;
}

function hardPlanValid(identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const pos = identity.naturalPosition;
  if (pos === 'GK') {
    return Number(plan.shooting) === 0 && Number(plan.passing) === 0 && Number(plan.dribbling) === 0
      && Number(plan.dexterity) === 0 && Number(plan.defending) === 0;
  }
  if (pos === 'CB' && (Number(plan.shooting) > 0 || Number(plan.dribbling) > 0)) return false;
  if (['CF', 'SS', 'AMF', 'LWF', 'RWF'].includes(pos) && Number(plan.defending) > 0) return false;
  if ((pos === 'LB' || pos === 'RB') && /lateral defensivo|defensive full/.test(normalize(identity.offensivePlaystyle)) && Number(plan.shooting) > 0) return false;
  if (pos === 'DMF' && /primeiro volante|anchor man|destruidor|destroyer/.test(normalize(identity.offensivePlaystyle)) && Number(plan.shooting) > 2) return false;
  return true;
}

function optimize(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  rules: Partial<Record<AttributeKey, AttrRule>>,
  profile: ExtremeProfileR108,
  staminaGoal: number
): TrainingPlan | null {
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  if (!Number.isFinite(budget) || budget <= 0) return null;
  const keys = activeKeys(result, identity, rules, profile, staminaGoal);
  type Node = { score: number; plan: TrainingPlan };
  let dp: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
  dp[0] = { score: 0, plan: emptyPlan() };

  for (const key of keys) {
    const next: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
    for (let spent = 0; spent <= budget; spent += 1) {
      const previous = dp[spent];
      if (!previous) continue;
      for (let level = 0; level <= 16; level += 1) {
        const total = spent + trainingTotalCost(level);
        if (total > budget) break;
        const plan = { ...previous.plan, [key]: level };
        if (!hardPlanValid(identity, plan)) continue;
        const score = previous.score + levelUtility(result, identity, rules, key, level, profile, staminaGoal, keys);
        if (!next[total] || score > Number(next[total]?.score ?? -Infinity) + 1e-9) next[total] = { score, plan };
      }
    }
    dp = next;
  }
  return dp[budget]?.plan ?? null;
}

function projectedAttribute(result: AnalysisResult, plan: TrainingPlan, attr: AttributeKey) {
  let gain = 0;
  for (const key of TRAINING_KEYS) if (ATTRIBUTE_GROUPS_R108[key].includes(attr)) gain += Number(plan[key] ?? 0);
  return attribute(result, attr) + gain;
}

function n(value: number, target: number) {
  return clamp((value / Math.max(1, target)) * 100, 0, 105);
}

function weakLink(values: Array<[number, number]>) {
  if (!values.length) return 0;
  const normalized = values.map(([value, target]) => n(value, target));
  const minimum = Math.min(...normalized);
  const average = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return clamp(minimum * .56 + average * .44);
}

function posSynergy(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const p = (attr: AttributeKey) => projectedAttribute(result, plan, attr);
  const pos = identity.naturalPosition;
  if (pos === 'GK') {
    const core = weakLink([[p('goalkeeperAwareness'), 95], [p('goalkeeperReflexes'), 95], [p('goalkeeperReach'), 94]]);
    const secondary = weakLink([[p('goalkeeperParrying'), 90], [p('goalkeeperCatching'), 87]]);
    return core * .78 + secondary * .22;
  }
  if (pos === 'CB') {
    const defend = weakLink([[p('defensiveAwareness'), 93], [p('tackling'), 92], [p('defensiveEngagement'), 91]]);
    const recovery = weakLink([[p('speed'), 87], [p('acceleration'), 81]]);
    const duel = weakLink([[p('physicalContact'), 89], [p('jump'), 87]]);
    return defend * .6 + recovery * .22 + duel * .18;
  }
  if (pos === 'LB' || pos === 'RB') {
    const defend = weakLink([[p('defensiveAwareness'), 90], [p('tackling'), 90], [p('defensiveEngagement'), 88]]);
    const recovery = weakLink([[p('speed'), 91], [p('acceleration'), 89]]);
    const work = n(p('stamina'), 90);
    return defend * .45 + recovery * .35 + work * .2;
  }
  if (pos === 'DMF') {
    const defend = weakLink([[p('defensiveAwareness'), 92], [p('tackling'), 91], [p('defensiveEngagement'), 91]]);
    const shield = weakLink([[p('physicalContact'), 88], [p('stamina'), 89]]);
    const exit = weakLink([[p('lowPass'), 89], [p('ballControl'), 85]]);
    return defend * .55 + shield * .25 + exit * .2;
  }
  if (pos === 'CMF') {
    const control = weakLink([[p('lowPass'), 91], [p('ballControl'), 90], [p('tightPossession'), 89]]);
    const response = weakLink([[p('acceleration'), 86], [p('balance'), 87]]);
    const work = n(p('stamina'), 89);
    return control * .58 + response * .24 + work * .18;
  }
  if (pos === 'LMF' || pos === 'RMF') {
    const carry = weakLink([[p('speed'), 90], [p('acceleration'), 90], [p('ballControl'), 89], [p('dribbling'), 89], [p('tightPossession'), 88]]);
    const pass = weakLink([[p('lowPass'), 88], [p('loftedPass'), 87]]);
    const work = n(p('stamina'), 89);
    return carry * .62 + pass * .2 + work * .18;
  }
  if (pos === 'AMF') {
    const control = weakLink([[p('ballControl'), 92], [p('tightPossession'), 92], [p('dribbling'), 91], [p('acceleration'), 90], [p('balance'), 90]]);
    const create = weakLink([[p('lowPass'), 91], [p('offensiveAwareness'), 89]]);
    return control * .68 + create * .32;
  }
  if (pos === 'SS') {
    const response = weakLink([[p('acceleration'), 92], [p('balance'), 90], [p('ballControl'), 91], [p('tightPossession'), 91]]);
    const killer = weakLink([[p('offensiveAwareness'), 93], [p('finishing'), 90]]);
    return response * .58 + killer * .42;
  }
  if (pos === 'CF') {
    const killer = weakLink([[p('offensiveAwareness'), 95], [p('finishing'), 95], [p('acceleration'), 91]]);
    const movement = weakLink([[p('speed'), 89], [p('balance'), 85], [p('kickingPower'), 89]]);
    return killer * .72 + movement * .28;
  }
  const carry = weakLink([[p('dribbling'), 94], [p('tightPossession'), 93], [p('acceleration'), 93], [p('speed'), 92], [p('ballControl'), 92], [p('balance'), 90]]);
  const attack = weakLink([[p('offensiveAwareness'), 89], [p('finishing'), 88]]);
  return carry * .76 + attack * .24;
}

function styleSynergy(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const p = (attr: AttributeKey) => projectedAttribute(result, plan, attr);
  const style = normalize(`${identity.offensivePlaystyle ?? ''} ${identity.defensivePlaystyle ?? ''}`);
  const scores: number[] = [];
  const add = (pattern: RegExp, values: Array<[AttributeKey, number]>) => {
    if (!pattern.test(style)) return;
    scores.push(weakLink(values.map(([attr, target]) => [p(attr), target] as [number, number])));
  };
  add(/artilheiro|goal poacher/, [['offensiveAwareness', 95], ['finishing', 95], ['acceleration', 91]]);
  add(/puxa marcacao|deep lying forward/, [['lowPass', 90], ['ballControl', 91], ['tightPossession', 90], ['balance', 88]]);
  add(/homem de area|fox in the box/, [['offensiveAwareness', 95], ['finishing', 95], ['heading', 89], ['jump', 88]]);
  add(/pivo|target man|atacante pivo/, [['physicalContact', 91], ['ballControl', 90], ['lowPass', 87], ['heading', 90]]);
  add(/armador criativo|creative playmaker/, [['lowPass', 92], ['ballControl', 92], ['tightPossession', 91], ['dribbling', 90]]);
  add(/primeiro volante|anchor man/, [['defensiveAwareness', 93], ['tackling', 92], ['defensiveEngagement', 92], ['stamina', 89]]);
  add(/destruidor|destroyer/, [['defensiveEngagement', 93], ['tackling', 93], ['aggression', 90], ['stamina', 89]]);
  add(/orquestrador|orchestrator/, [['lowPass', 92], ['loftedPass', 90], ['ballControl', 90], ['tightPossession', 88]]);
  add(/classico|classic no/, [['lowPass', 91], ['ballControl', 92], ['tightPossession', 91], ['dribbling', 90]]);
  add(/jogador de infiltracao|hole player|atacante surpresa/, [['offensiveAwareness', 93], ['acceleration', 92], ['finishing', 90]]);
  add(/meia versatil|box.to.box/, [['stamina', 91], ['speed', 87], ['acceleration', 87], ['lowPass', 89]]);
  add(/defensor criativo|build up/, [['defensiveAwareness', 93], ['tackling', 91], ['lowPass', 87]]);
  add(/lateral defensivo|defensive full/, [['defensiveAwareness', 91], ['tackling', 91], ['speed', 90], ['stamina', 90]]);
  add(/lateral ofensivo|lateral atacante|offensive full/, [['speed', 92], ['stamina', 91], ['acceleration', 90], ['loftedPass', 88]]);
  add(/ala produtivo|lateral movel|roaming flank|prolific winger/, [['speed', 92], ['acceleration', 92], ['dribbling', 91], ['stamina', 89]]);
  add(/perito em cruzamento|cross specialist/, [['loftedPass', 92], ['curl', 90], ['stamina', 88]]);
  add(/goleiro ofensivo|goleiro defensivo|offensive goalkeeper|defensive goalkeeper/, [['goalkeeperAwareness', 95], ['goalkeeperReflexes', 95], ['goalkeeperReach', 94]]);
  if (!scores.length) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function responseScore(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const p = (attr: AttributeKey) => projectedAttribute(result, plan, attr);
  const pos = identity.naturalPosition;
  if (pos === 'GK') return weakLink([[p('goalkeeperReflexes'), 95], [p('goalkeeperReach'), 94], [p('goalkeeperAwareness'), 95]]);
  if (['CB', 'LB', 'RB', 'DMF'].includes(pos)) return weakLink([[p('defensiveAwareness'), 91], [p('speed'), 87], [p('acceleration'), 82], [p('tackling'), 90]]);
  if (['CMF', 'LMF', 'RMF'].includes(pos)) return weakLink([[p('tightPossession'), 88], [p('balance'), 87], [p('acceleration'), 87], [p('lowPass'), 89]]);
  if (pos === 'CF') return weakLink([[p('acceleration'), 91], [p('balance'), 86], [p('offensiveAwareness'), 94], [p('ballControl'), 86]]);
  return weakLink([[p('tightPossession'), 91], [p('balance'), 90], [p('acceleration'), 92], [p('ballControl'), 91]]);
}

function topCore(rules: Partial<Record<AttributeKey, AttrRule>>) {
  return (Object.entries(rules) as Array<[AttributeKey, AttrRule]>)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 6);
}

function wastedLevels(result: AnalysisResult, rules: Partial<Record<AttributeKey, AttrRule>>, plan: TrainingPlan) {
  let wasted = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    if (!level) continue;
    for (let current = 1; current <= level; current += 1) {
      const useful = ATTRIBUTE_GROUPS_R108[key].some((attr) => {
        const attrRule = rules[attr];
        if (!attrRule || attrRule.weight < .35) return false;
        return attribute(result, attr) + current <= attrRule.ceiling;
      });
      if (!useful) wasted += 1;
    }
  }
  return wasted;
}

function concentrationScore(rules: Partial<Record<AttributeKey, AttrRule>>, plan: TrainingPlan) {
  const priorities = TRAINING_KEYS
    .map((key) => ({ key, priority: groupPriority(rules, key) }))
    .sort((a, b) => b.priority - a.priority);
  const top = new Set(priorities.slice(0, 3).map((item) => item.key));
  const total = trainingPlanTotalCost(plan);
  if (!total) return 0;
  const topCost = TRAINING_KEYS.reduce((sum, key) => sum + (top.has(key) ? trainingTotalCost(Number(plan[key] ?? 0)) : 0), 0);
  const ratio = topCost / total;
  if (ratio >= .55 && ratio <= .9) return 100;
  if (ratio < .55) return clamp((ratio / .55) * 100);
  return clamp(100 - (ratio - .9) * 80);
}

export function scorePerformancePlan2027R108(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  plan: TrainingPlan,
  profile: ExtremeProfileR108 = 'EXTREME_DNA'
): PerformanceCandidateR108 {
  const rules = buildRules(result, identity);
  const core = topCore(rules);
  const totalCoreWeight = core.reduce((sum, [, current]) => sum + current.weight, 0) || 1;
  let impactRaw = 0;
  let floorRaw = 0;
  let floorWeight = 0;
  const fatal: string[] = [];

  for (const [attr, current] of core) {
    const projected = projectedAttribute(result, plan, attr);
    const impact = clamp((Math.min(projected, current.peak) / Math.max(1, current.peak)) * 100);
    impactRaw += impact * current.weight;
    if (current.weight >= 2.0) {
      floorWeight += current.weight;
      floorRaw += clamp((projected / Math.max(1, current.floor)) * 100) * current.weight;
      if (projected < current.floor - 2) fatal.push(`${attr}:${Math.round(projected)}/${current.floor}`);
    }
  }

  const impactScore = clamp(impactRaw / totalCoreWeight);
  const floorCoverage = floorWeight ? clamp(floorRaw / floorWeight) : 100;
  const positionSynergy = posSynergy(result, identity, plan);
  const style = styleSynergy(result, identity, plan);
  const synergyScore = clamp(style === null ? positionSynergy : positionSynergy * .72 + style * .28);
  const response = responseScore(result, identity, plan);
  const staminaGoal = staminaTarget(result, identity);
  const projectedStamina = projectedAttribute(result, plan, 'stamina');
  const staminaScore = identity.naturalPosition === 'GK' || staminaGoal <= 0
    ? 100
    : projectedStamina >= staminaGoal
      ? 100
      : clamp(100 - (staminaGoal - projectedStamina) * 7.5);
  const waste = wastedLevels(result, rules, plan);
  const wasteScore = clamp(100 - waste * 6);
  const concentration = concentrationScore(rules, plan);
  const categoryCount = TRAINING_KEYS.filter((key) => Number(plan[key] ?? 0) > 0).length;
  const spreadPenalty = Math.max(0, categoryCount - 6) * 2.5;
  const exactBudget = trainingPlanTotalCost(plan) === Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));

  const totalScore = clamp(
    synergyScore * .34 +
    impactScore * .25 +
    response * .18 +
    floorCoverage * .1 +
    staminaScore * .07 +
    wasteScore * .04 +
    concentration * .02 -
    spreadPenalty
  );
  const projectedStrongUntilMinute = identity.naturalPosition === 'GK'
    ? 90
    : Math.round(clamp(72 + staminaScore * .16 + response * .03, 72, 90));

  return {
    profile,
    training: { ...plan },
    exactBudget,
    totalScore: round1(totalScore),
    impactScore: round1(impactScore),
    synergyScore: round1(synergyScore),
    responseScore: round1(response),
    floorCoverage: round1(floorCoverage),
    staminaScore: round1(staminaScore),
    wasteScore: round1(wasteScore),
    concentrationScore: round1(concentration),
    projectedStamina: round1(projectedStamina),
    projectedStrongUntilMinute,
    fatalBottlenecks: fatal,
    wastedLevels: waste,
    categoryCount
  };
}

function confidence(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const count = Number(result.parsed.evidence.attributeCount ?? 0);
  const expected = identity.naturalPosition === 'GK' ? 8 : 16;
  const coverage = clamp((count / expected) * 100);
  const base = Number(result.parsed.confidence ?? 0);
  const normalized = base <= 1 ? base * 100 : base;
  return round1(clamp(identity.identityConfidence * .5 + coverage * .34 + normalized * .16));
}

export function applyPerformanceEngine2027R108(input: AnalysisResult): AnalysisResult {
  const carrier = input as Carrier;
  const identity = carrier.canonicalCardIdentity2027R60;
  if (!identity) return input;
  const budget = Number(input.trainingPointsTotal ?? trainingPlanTotalCost(input.training));
  if (!Number.isFinite(budget) || budget <= 0) return input;

  const rules = buildRules(input, identity);
  const target = staminaTarget(input, identity);
  const profiles: ExtremeProfileR108[] = ['EXTREME_DNA', 'ROLE_KILLER', 'RESPONSE_META', 'MATCH_ENDURANCE'];
  const generated = profiles.map((profile) => {
    const plan = optimize(input, identity, rules, profile, target) ?? input.training;
    return scorePerformancePlan2027R108(input, identity, plan, profile);
  });
  const baseline = scorePerformancePlan2027R108(input, identity, input.training, 'EXTREME_DNA');

  const unique = new Map<string, PerformanceCandidateR108>();
  for (const candidate of generated) {
    const signature = TRAINING_KEYS.map((key) => `${key}:${candidate.training[key] ?? 0}`).join('|');
    const previous = unique.get(signature);
    if (!previous || candidate.totalScore > previous.totalScore) unique.set(signature, candidate);
  }
  const ranked = [...unique.values()].sort((a, b) =>
    b.totalScore - a.totalScore ||
    b.synergyScore - a.synergyScore ||
    b.responseScore - a.responseScore ||
    a.fatalBottlenecks.length - b.fatalBottlenecks.length ||
    a.wastedLevels - b.wastedLevels
  );
  const winner = ranked[0] ?? baseline;
  const conf = confidence(input, identity);
  const dominantCore = topCore(rules).map(([attr]) => attr);
  const analysis: PerformanceEngine2027R108 = {
    version: PERFORMANCE_ENGINE_2027_R108_VERSION,
    authority: 'SPECIALIST_READ_ONLY',
    model: 'EXTREME_GAMEPLAY_BREAKPOINT_SYNERGY_V600',
    budget,
    naturalPosition: identity.naturalPosition,
    selectedPosition: identity.attackPosition,
    defensivePosition: identity.defencePosition,
    staminaTarget: target,
    dominantCore,
    baseline,
    winner,
    alternatives: ranked.slice(1, 4),
    improvementVsIncoming: round1(winner.totalScore - baseline.totalScore),
    confidence: conf,
    guards: {
      exactBudget: winner.exactBudget,
      masterEngineIsOnlyWriter: true,
      overallIgnored: true,
      formationIndependent: true,
      positionSelectionDoesNotRewriteCore: true,
      fatalBottlenecksControlled: winner.fatalBottlenecks.length <= 2,
      staminaProtected: identity.naturalPosition === 'GK' || target <= 0 || winner.projectedStamina >= target - 2,
      wasteControlled: winner.wastedLevels <= 2,
      synergyFirst: true,
      antiOverallSpread: winner.categoryCount <= 6
    }
  };

  return {
    ...input,
    performanceEngine2027R108: analysis,
    recommendationExplanation: [
      `Extreme Gameplay r108: ${winner.totalScore}/100 • ${winner.profile} • sinergia real ${winner.synergyScore}/100 • resposta ${winner.responseScore}/100.`,
      `Núcleo da carta: ${dominantCore.join(', ')}. O motor não tenta deixar tudo alto: ele empurra os atributos que mudam a jogabilidade e só corrige gargalo fatal.`,
      `Stamina projetada ${winner.projectedStamina}${target > 0 ? ` / alvo funcional ${target}` : ''}; intensidade estimada até ~${winner.projectedStrongUntilMinute} min.`,
      `Eficiência: desperdício ${winner.wastedLevels} nível(is), concentração ${winner.concentrationScore}/100, categorias usadas ${winner.categoryCount}.`,
      winner.fatalBottlenecks.length ? `Gargalos ainda presentes: ${winner.fatalBottlenecks.join(', ')}.` : 'Sem gargalo fatal no núcleo de gameplay.',
      'r108 ignora overall e formação. A ficha é guiada por breakpoints, sinergia, resposta, estilo, habilidades da carta e DNA; a posição selecionada não reescreve o núcleo permanente.',
      ...input.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 110)
  } as WithPerformanceEngineR108;
}
