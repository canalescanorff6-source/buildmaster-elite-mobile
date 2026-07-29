import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  CalibrationV32Analysis,
  CalibrationV32Profile,
  ConnectionProfile,
  ControlProfile,
  GameplayMode,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { normalizeObjective } from './analyzerDomain';
import { BASE_BY_POSITION } from '@/modules/analysis/analyzerCatalog';
import { fitTrainingToBudget } from '@/modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  normalizeTrainingPlan,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import type { BuildVariant } from './trainingEngine';
import { cardAnalysisInputFingerprint } from './cardAnalysisFingerprint';
import { buildMaxPrecisionAnalysis } from './maxPrecision';
import { buildEliteEvolutionAnalysis } from './eliteEvolution';
import { buildMetaBuildUniverse } from './metaBuildUniverse';

const ENGINE_VERSION = '32.00-calibration-matrix-1';
const PATCH_REFERENCE = 'eFootball v5.4.0' as const;
const CACHE_LIMIT = 24;

const LINE_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
const GK_KEYS: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 10, dexterity: 8.6, lowerBodyStrength: 7.4, aerialStrength: 5.2, dribbling: 4.6, passing: 2.4 },
  SS: { dexterity: 9.2, dribbling: 8.2, passing: 7.2, shooting: 6.4, lowerBodyStrength: 4.4 },
  LWF: { dribbling: 9.6, dexterity: 9.2, lowerBodyStrength: 7.2, shooting: 6.4, passing: 4.2 },
  RWF: { dribbling: 9.6, dexterity: 9.2, lowerBodyStrength: 7.2, shooting: 6.4, passing: 4.2 },
  LMF: { passing: 8.2, lowerBodyStrength: 8.0, dexterity: 6.4, dribbling: 5.5, defending: 5.2 },
  RMF: { passing: 8.2, lowerBodyStrength: 8.0, dexterity: 6.4, dribbling: 5.5, defending: 5.2 },
  AMF: { passing: 9.6, dribbling: 8.6, dexterity: 8.0, shooting: 5.4, lowerBodyStrength: 3.5 },
  CMF: { passing: 9.2, lowerBodyStrength: 7.6, dexterity: 6.6, defending: 5.8, dribbling: 5.0 },
  DMF: { defending: 10, passing: 7.8, lowerBodyStrength: 7.8, dexterity: 5.1, aerialStrength: 4.6 },
  CB: { defending: 10, aerialStrength: 8.5, lowerBodyStrength: 7.8, dexterity: 5.6, passing: 2.8 },
  LB: { defending: 8.8, lowerBodyStrength: 8.5, passing: 6.4, dexterity: 5.6, dribbling: 3.4 },
  RB: { defending: 8.8, lowerBodyStrength: 8.5, passing: 6.4, dexterity: 5.6, dribbling: 3.4 },
  GK: { gk2: 10, gk3: 9.2, gk1: 8.8, aerialStrength: 5.4, lowerBodyStrength: 4.4 }
};

const MODE_WEIGHTS: Record<GameplayMode, Partial<Record<TrainingKey, number>>> = {
  RANKED: { passing: 1.25, dexterity: 1.25, lowerBodyStrength: 1.18, defending: 1.05, gk2: 1.15, gk3: 1.05 },
  UNIVERSAL: { passing: .55, dribbling: .5, dexterity: .65, lowerBodyStrength: .65, defending: .45, shooting: .35, gk1: .4, gk2: .55, gk3: .45 },
  OFFLINE: { shooting: 1.05, dribbling: 1.1, dexterity: .9, passing: .65, aerialStrength: .4, gk1: .55, gk2: .6 }
};

const CONNECTION_WEIGHTS: Record<ConnectionProfile, Partial<Record<TrainingKey, number>>> = {
  STABLE: { dribbling: .45, shooting: .3, dexterity: .35 },
  VARIABLE: { passing: .9, dexterity: .9, lowerBodyStrength: .75, defending: .4, gk2: .5 },
  HIGH_DELAY: { passing: 1.45, dexterity: 1.35, lowerBodyStrength: 1.1, defending: .65, dribbling: -.35, gk2: .75, gk3: .5 }
};

const CONTROL_WEIGHTS: Record<ControlProfile, Partial<Record<TrainingKey, number>>> = {
  BALANCED: { passing: .35, dribbling: .3, dexterity: .35, lowerBodyStrength: .3, defending: .2 },
  PASSING: { passing: 1.45, dexterity: .7, dribbling: .35, lowerBodyStrength: .35 },
  DRIBBLE: { dribbling: 1.5, dexterity: 1.15, lowerBodyStrength: .45, passing: .2 },
  DIRECT: { shooting: 1.2, lowerBodyStrength: 1.15, aerialStrength: .8, passing: .45, dexterity: .35 }
};

const GROUP_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['offensiveAwareness', 'finishing', 'placeKicking', 'curl', 'kickingPower'],
  passing: ['ballControl', 'lowPass', 'loftedPass', 'curl'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession', 'balance'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'acceleration', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach', 'jump']
};

const cache = new Map<string, AnalysisResult>();

type WeightMap = Record<TrainingKey, number>;
type CandidateScore = {
  plan: TrainingPlan;
  score: number;
  dimensions: CalibrationV32Analysis['dimensions'];
};

type CalibrationMaps = ReturnType<typeof targetWeights>;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function activeKeys(position: PositionCode) {
  return position === 'GK' ? GK_KEYS : LINE_KEYS;
}

function emptyWeights(): WeightMap {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function addWeights(target: WeightMap, values: Partial<Record<TrainingKey, number>>, factor = 1) {
  for (const [key, value] of Object.entries(values) as Array<[TrainingKey, number]>) target[key] += Number(value || 0) * factor;
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => Number(plan[key] ?? 0)).join('-');
}

function completeAttributes(result: AnalysisResult): Required<Attributes> {
  const base = BASE_BY_POSITION[result.parsed.mainPosition] ?? BASE_BY_POSITION[result.bestPosition.code];
  return { ...base, ...result.parsed.attributes } as Required<Attributes>;
}

function groupAverage(attributes: Required<Attributes>, key: TrainingKey) {
  return average(GROUP_ATTRIBUTES[key].map((attribute) => Number(attributes[attribute] ?? 0)));
}

function formationWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  const formation = result.tacticalProfile.formation;
  const position = result.bestPosition.code;
  const weights: Partial<Record<TrainingKey, number>> = {};
  const add = (key: TrainingKey, value: number) => { weights[key] = (weights[key] ?? 0) + value; };
  const backThree = ['3-2-4-1', '3-4-3', '3-5-2', '5-3-2', '5-2-3'].includes(formation);
  const narrowTwo = ['4-2-2-2', '4-3-1-2', '4-1-3-2', '3-5-2', '5-3-2'].includes(formation);
  const wideThree = ['4-3-3', '4-1-2-3', '4-2-1-3', '3-4-3', '5-2-3'].includes(formation);
  const singlePivot = ['4-1-2-3', '4-3-3', '4-1-3-2', '4-1-4-1'].includes(formation);

  if (backThree && position === 'CB') { add('defending', 1.2); add('lowerBodyStrength', .8); add('aerialStrength', .65); add('passing', .35); }
  if (backThree && (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF')) { add('lowerBodyStrength', 1.15); add('passing', .75); add('defending', .65); add('dexterity', .45); }
  if (narrowTwo && (position === 'CF' || position === 'SS')) { add('passing', .65); add('dexterity', .8); add('shooting', .65); add('lowerBodyStrength', .55); }
  if (wideThree && (position === 'LWF' || position === 'RWF')) { add('dribbling', 1.0); add('dexterity', .9); add('lowerBodyStrength', .75); add('shooting', .45); }
  if (singlePivot && position === 'DMF') { add('defending', 1.35); add('passing', .75); add('lowerBodyStrength', .8); }
  if (formation === '4-2-3-1' && position === 'AMF') { add('passing', 1.0); add('dribbling', .65); add('dexterity', .55); }
  if (formation === '4-1-4-1' && position === 'CF') { add('shooting', .9); add('lowerBodyStrength', .75); add('aerialStrength', .45); }
  return weights;
}

function teamStyleWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  switch (result.tacticalProfile.style) {
    case 'POSSE_DE_BOLA': return { passing: 1.3, dribbling: .85, dexterity: .55 };
    case 'CONTRA_ATAQUE': return { passing: .7, lowerBodyStrength: 1.05, aerialStrength: .5, defending: .35 };
    case 'CONTRA_ATAQUE_RAPIDO': return { dexterity: 1.15, lowerBodyStrength: 1.2, passing: .55, shooting: .45 };
    case 'POR_FORA': return { passing: 1.0, lowerBodyStrength: .8, dribbling: .55, aerialStrength: .45 };
    case 'PASSE_LONGO': return { passing: 1.05, aerialStrength: .9, lowerBodyStrength: .75 };
    default: return {};
  }
}

function playstyleWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  const style = normalizeText(result.parsed.playstyle);
  if (/artilheiro|goal poacher|atacante matador/.test(style)) return { shooting: 1.4, dexterity: .8, lowerBodyStrength: .55 };
  if (/homem de area|fox in the box/.test(style)) return { shooting: 1.2, aerialStrength: 1.05, lowerBodyStrength: .65 };
  if (/pivo|target man|puxa marcacao/.test(style)) return { lowerBodyStrength: 1.25, passing: .9, aerialStrength: .7 };
  if (/armador criativo|creative playmaker|classico|orquestrador/.test(style)) return { passing: 1.35, dribbling: .75, dexterity: .4 };
  if (/infiltracao|hole player|atacante surpresa/.test(style)) return { dexterity: 1.25, shooting: .8, lowerBodyStrength: .4 };
  if (/ala produtivo|prolific winger|lateral movel|roaming flank/.test(style)) return { dribbling: 1.1, dexterity: 1.0, lowerBodyStrength: .65 };
  if (/perito em cruzamento|cross specialist/.test(style)) return { passing: 1.35, lowerBodyStrength: .55 };
  if (/primeiro volante|1º volante|anchor man|ancora/.test(style)) return { defending: 1.4, passing: .65, lowerBodyStrength: .7 };
  if (/destruidor|destroyer/.test(style)) return { defending: 1.45, lowerBodyStrength: .8, dexterity: .35 };
  if (/defensor criativo|build up/.test(style)) return { defending: 1.05, passing: .95, lowerBodyStrength: .4 };
  if (/lateral defensivo/.test(style)) return { defending: 1.2, lowerBodyStrength: .75, passing: .4 };
  if (/lateral ofensivo|lateral atacante/.test(style)) return { lowerBodyStrength: 1.0, passing: .85, dexterity: .55, defending: .3 };
  if (/goleiro ofensivo/.test(style)) return { gk2: 1.0, gk3: .8, lowerBodyStrength: .4 };
  if (/goleiro defensivo/.test(style)) return { gk1: 1.0, gk2: .9, gk3: .45 };
  return {};
}

function keywordWeights(items: string[]): Partial<Record<TrainingKey, number>> {
  const weights: Partial<Record<TrainingKey, number>> = {};
  const add = (key: TrainingKey, value: number) => { weights[key] = (weights[key] ?? 0) + value; };
  for (const item of items.map(normalizeText)) {
    if (/chute|finaliza|curva|cabeceio ofensivo/.test(item)) add('shooting', .75);
    if (/passe|cruzamento|lan[cç]amento|vision/.test(item)) add('passing', .75);
    if (/drible|controle|sola|duplo toque|finta/.test(item)) add('dribbling', .75);
    if (/acelera|arranque|movimenta|giro|equilibrio/.test(item)) add('dexterity', .65);
    if (/veloc|resist|fisic|garra|impulso ofensivo/.test(item)) add('lowerBodyStrength', .65);
    if (/cabe[cç]a|aereo|salto|fortaleza/.test(item)) add('aerialStrength', .65);
    if (/intercept|bloque|desarme|marca[cç]|defesa|esticada/.test(item)) add('defending', .8);
    if (/goleiro|reflex|alcance|defesa de go|firmeza/.test(item)) { add('gk1', .45); add('gk2', .65); add('gk3', .55); }
  }
  return weights;
}

function deficitWeights(result: AnalysisResult, attributes: Required<Attributes>): Partial<Record<TrainingKey, number>> {
  const weights: Partial<Record<TrainingKey, number>> = {};
  const position = result.bestPosition.code;
  const role = POSITION_WEIGHTS[position];
  for (const key of activeKeys(position)) {
    const importance = Number(role[key] ?? 0);
    if (importance <= 0) continue;
    const current = groupAverage(attributes, key);
    const target = position === 'GK' ? 82 : importance >= 8 ? 82 : importance >= 5 ? 78 : 74;
    const gap = Math.max(0, target - current);
    weights[key] = Math.min(1.8, gap * .07) * Math.min(1.2, importance / 8);
  }
  return weights;
}

function targetWeights(result: AnalysisResult, mode: GameplayMode) {
  const position = result.bestPosition.code;
  const attributes = completeAttributes(result);
  const target = emptyWeights();
  const role = emptyWeights();
  const tactical = emptyWeights();
  const style = emptyWeights();
  const control = emptyWeights();
  const connection = emptyWeights();
  const skill = emptyWeights();
  const impeto = emptyWeights();
  const manager = Number(result.tacticalProfile.managerProficiency ?? 0);
  const tacticalTrust = manager > 0 ? Math.max(.45, Math.min(1, (manager - 65) / 28)) : .55;

  addWeights(role, POSITION_WEIGHTS[position]);
  addWeights(tactical, formationWeights(result), tacticalTrust);
  addWeights(tactical, teamStyleWeights(result), tacticalTrust);
  addWeights(style, playstyleWeights(result));
  addWeights(control, CONTROL_WEIGHTS[result.tacticalProfile.controlProfile ?? 'BALANCED']);
  addWeights(connection, CONNECTION_WEIGHTS[result.tacticalProfile.connectionProfile ?? 'VARIABLE']);
  addWeights(skill, keywordWeights([...result.parsed.nativeSkills, ...result.parsed.specialSkills, ...result.recommendedSkills]));
  addWeights(impeto, keywordWeights(result.recommendedImpetos.slice(0, 3).flatMap((item) => [item.name, ...item.attributes, item.reason])));

  addWeights(target, role, 1);
  addWeights(target, tactical, 1);
  addWeights(target, style, .9);
  addWeights(target, MODE_WEIGHTS[mode], 1);
  addWeights(target, control, .8);
  addWeights(target, connection, .9);
  addWeights(target, skill, .52);
  addWeights(target, impeto, .32);
  addWeights(target, deficitWeights(result, attributes), .75);

  for (const key of TRAINING_KEYS) {
    const active = activeKeys(position).includes(key);
    target[key] = active ? Math.max(.05, target[key]) : 0;
  }
  return { target, role, tactical, style, control, connection, skill, impeto };
}

function costShares(plan: TrainingPlan, keys: TrainingKey[]) {
  const costs = trainingPlanCost(plan);
  const total = Math.max(1, keys.reduce((sum, key) => sum + Number(costs[key] ?? 0), 0));
  const result = emptyWeights();
  for (const key of keys) result[key] = Number(costs[key] ?? 0) / total;
  return result;
}

function weightShares(weights: WeightMap, keys: TrainingKey[]) {
  const total = Math.max(.001, keys.reduce((sum, key) => sum + Math.max(0, weights[key] ?? 0), 0));
  const result = emptyWeights();
  for (const key of keys) result[key] = Math.max(0, weights[key] ?? 0) / total;
  return result;
}

function distributionFit(plan: TrainingPlan, weights: WeightMap, keys: TrainingKey[]) {
  const actual = costShares(plan, keys);
  const desired = weightShares(weights, keys);
  const distance = keys.reduce((sum, key) => sum + Math.abs(actual[key] - desired[key]), 0);
  return clamp((1 - Math.min(2, distance) / 2) * 100);
}

function pointEfficiency(result: AnalysisResult, plan: TrainingPlan, weights: WeightMap) {
  const used = trainingPlanTotalCost(plan);
  const budget = result.trainingPointsTotal;
  const exact = used === budget;
  const overflow = Math.max(0, used - budget);
  const remaining = Math.max(0, budget - used);
  let score = exact ? 100 : 100 - overflow * 14 - remaining * 7;
  for (const key of activeKeys(result.bestPosition.code)) {
    const level = Number(plan[key] ?? 0);
    if (level > 12) score -= (level - 12) * 2.2;
    if (level > 9 && weights[key] < 2.2) score -= (level - 9) * 1.1;
  }
  return clamp(score);
}

function antiOverallWaste(result: AnalysisResult, plan: TrainingPlan, weights: WeightMap) {
  const keys = activeKeys(result.bestPosition.code);
  const costs = trainingPlanCost(plan);
  let penalty = 0;
  for (const key of keys) {
    const cost = Number(costs[key] ?? 0);
    if (cost <= 0) continue;
    if (weights[key] < 1.3 && plan[key] >= 7) penalty += cost * .85;
    if (weights[key] < .6 && plan[key] >= 4) penalty += cost * 1.15;
  }
  const inactiveCost = TRAINING_KEYS.filter((key) => !keys.includes(key)).reduce((sum, key) => sum + Number(costs[key] ?? 0), 0);
  penalty += inactiveCost * 4;
  const total = Math.max(1, trainingPlanTotalCost(plan));
  return clamp(100 - penalty / total * 100);
}

function crossModePlanScore(result: AnalysisResult, plan: TrainingPlan, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const keys = activeKeys(result.bestPosition.code);
  return average((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) =>
    distributionFit(plan, allMaps[mode].target, keys)
  ));
}

function scorePlan(result: AnalysisResult, plan: TrainingPlan, maps: CalibrationMaps, allMaps: Record<GameplayMode, CalibrationMaps>): CandidateScore {
  const keys = activeKeys(result.bestPosition.code);
  const roleFit = distributionFit(plan, maps.role, keys);
  const formationFit = Object.values(maps.tactical).some((value) => value > 0) ? distributionFit(plan, maps.tactical, keys) : 72;
  const playstyleFit = result.parsed.playstyle ? distributionFit(plan, maps.style, keys) : 68;
  const controlFit = distributionFit(plan, maps.control, keys);
  const connectionRobustness = distributionFit(plan, maps.connection, keys);
  const efficiency = pointEfficiency(result, plan, maps.target);
  const skillSynergy = [...result.parsed.nativeSkills, ...result.parsed.specialSkills, ...result.recommendedSkills].length ? distributionFit(plan, maps.skill, keys) : 70;
  const impetoSynergy = result.recommendedImpetos.length ? distributionFit(plan, maps.impeto, keys) : 68;
  const waste = antiOverallWaste(result, plan, maps.target);
  const crossModeStability = crossModePlanScore(result, plan, allMaps);
  const targetFit = distributionFit(plan, maps.target, keys);
  const score = clamp(
    targetFit * .20
    + roleFit * .14
    + formationFit * .10
    + playstyleFit * .10
    + controlFit * .07
    + connectionRobustness * .11
    + efficiency * .13
    + skillSynergy * .07
    + impetoSynergy * .03
    + waste * .03
    + crossModeStability * .02
  );
  return {
    plan,
    score,
    dimensions: {
      roleFit,
      formationFit,
      playstyleFit,
      controlFit,
      connectionRobustness,
      pointEfficiency: efficiency,
      skillSynergy,
      impetoSynergy,
      antiOverallWaste: waste,
      crossModeStability
    }
  };
}

function collectCandidates(result: AnalysisResult, maps: CalibrationMaps) {
  const map = new Map<string, TrainingPlan>();
  const add = (plan: TrainingPlan | null | undefined) => {
    if (!plan) return;
    const normalized = normalizeTrainingPlan(plan);
    map.set(signature(normalized), normalized);
  };
  add(result.training);
  add(result.supremeGameplay?.finalTraining);
  add(result.unifiedIntelligence?.finalTraining);
  add(result.deepCardIntelligence?.finalTraining);
  add(result.competitiveFusion?.finalTraining);
  add(result.errorTolerance?.conservative);
  add(result.errorTolerance?.probable);
  add(result.errorTolerance?.optimistic);
  add(result.unifiedIntelligence?.simulation.abTest.variantA);
  add(result.unifiedIntelligence?.simulation.abTest.variantB);
  result.buildVariants.forEach((variant) => add(variant.training));
  result.maxPrecision?.alternatives.forEach((variant) => add(variant.training));

  const keys = activeKeys(result.bestPosition.code);
  const priority = [...keys].sort((left, right) => maps.target[right] - maps.target[left]);
  const bases = Array.from(map.values()).slice(0, 7);
  for (const base of bases) {
    for (const plus of keys) {
      for (const minus of keys) {
        if (plus === minus) continue;
        for (const amount of [1, 2]) {
          const next = { ...base };
          next[plus] = Math.min(16, next[plus] + amount);
          next[minus] = Math.max(0, next[minus] - amount);
          add(fitTrainingToBudget(next, priority, result.trainingPointsTotal));
        }
      }
    }
    for (let first = 0; first < keys.length; first += 1) {
      for (let second = first + 1; second < keys.length; second += 1) {
        const minus = [...keys].reverse().find((key) => key !== keys[first] && key !== keys[second]);
        if (!minus) continue;
        const next = { ...base };
        next[keys[first]] = Math.min(16, next[keys[first]] + 1);
        next[keys[second]] = Math.min(16, next[keys[second]] + 1);
        next[minus] = Math.max(0, next[minus] - 2);
        add(fitTrainingToBudget(next, priority, result.trainingPointsTotal));
      }
    }
  }
  return Array.from(map.values());
}

function profileLabel(mode: GameplayMode) {
  if (mode === 'RANKED') return 'Ranqueado robusto';
  if (mode === 'OFFLINE') return 'Offline expressivo';
  return 'Universal equilibrado';
}

function topStrengths(score: CandidateScore) {
  const labels: Array<[keyof CandidateScore['dimensions'], string]> = [
    ['roleFit', 'função em campo'],
    ['formationFit', 'formação'],
    ['playstyleFit', 'Estilo de Jogo'],
    ['controlFit', 'forma de controlar'],
    ['connectionRobustness', 'robustez de conexão'],
    ['pointEfficiency', 'retorno dos pontos'],
    ['skillSynergy', 'habilidades adicionais'],
    ['impetoSynergy', 'Ímpeto'],
    ['antiOverallWaste', 'proteção contra overall artificial'],
    ['crossModeStability', 'estabilidade entre modos']
  ];
  return labels.sort((left, right) => score.dimensions[right[0]] - score.dimensions[left[0]])
    .slice(0, 3)
    .map(([key, label]) => `${label}: ${Math.round(score.dimensions[key])}/100`);
}

function tradeOffs(score: CandidateScore) {
  const alerts: string[] = [];
  if (score.dimensions.connectionRobustness < 74) alerts.push('Pode responder pior quando houver atraso ou oscilação de rede.');
  if (score.dimensions.playstyleFit < 74) alerts.push('A distribuição não explora totalmente o Estilo de Jogo confirmado.');
  if (score.dimensions.formationFit < 72) alerts.push('A formação exige um comportamento diferente desta distribuição.');
  if (score.dimensions.antiOverallWaste < 82) alerts.push('Há investimento próximo da faixa de retorno baixo.');
  if (score.dimensions.crossModeStability < 76) alerts.push('É mais especializada e pode variar entre ranqueado e offline.');
  return alerts.length ? alerts.slice(0, 3) : ['Nenhum comprometimento crítico detectado para este perfil.'];
}

function readiness(result: AnalysisResult) {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const attributes = Object.values(result.parsed.attributes).filter((value) => Number.isFinite(value)).length;
  if (!result.parsed.playstyle) blockers.push('Confirmar o Estilo de Jogo da carta.');
  if (result.tacticalProfile.formation === 'AUTO') blockers.push('Escolher a formação em que o jogador será usado.');
  if (result.tacticalProfile.style === 'AUTO') blockers.push('Escolher o estilo coletivo do técnico.');
  if (attributes < 12) blockers.push(`Confirmar mais atributos da carta; apenas ${attributes} foram lidos.`);
  if (result.validation.level === 'blocked') blockers.push('Resolver os campos bloqueados na validação do print.');
  if (!result.tacticalProfile.managerName && !result.tacticalProfile.managerId) warnings.push('Sem técnico específico, a proficiência não participa do ajuste fino.');
  if (result.recommendedSkills.length < 5) warnings.push('O Top 5 de habilidades ainda não está completo.');
  if (!result.recommendedImpetos.length) warnings.push('Nenhum Ímpeto foi classificado com segurança.');
  const score = clamp(100 - blockers.length * 16 - warnings.length * 5 - (result.parsed.confidence < 70 ? 12 : 0));
  const state: CalibrationV32Analysis['readiness'] = score >= 88 ? 'pronta' : score >= 68 ? 'quase pronta' : 'revisar';
  return { blockers, warnings, score, state };
}

function buildProfile(result: AnalysisResult, mode: GameplayMode, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const maps = allMaps[mode];
  const candidates = collectCandidates(result, maps);
  const scored = candidates.map((plan) => scorePlan(result, plan, maps, allMaps))
    .sort((left, right) => {
      const leftExact = trainingPlanTotalCost(left.plan) === result.trainingPointsTotal ? 1 : 0;
      const rightExact = trainingPlanTotalCost(right.plan) === result.trainingPointsTotal ? 1 : 0;
      return rightExact - leftExact || right.score - left.score || right.dimensions.pointEfficiency - left.dimensions.pointEfficiency;
    });
  const exact = scored.filter((item) => trainingPlanTotalCost(item.plan) === result.trainingPointsTotal);
  const winner = exact[0] ?? scored[0] ?? scorePlan(result, result.training, maps, allMaps);
  const profile: CalibrationV32Profile = {
    mode,
    label: profileLabel(mode),
    score: winner.score,
    training: winner.plan,
    exactBudget: trainingPlanTotalCost(winner.plan) === result.trainingPointsTotal,
    strengths: topStrengths(winner),
    tradeOffs: tradeOffs(winner)
  };
  return { profile, winner, candidates: candidates.length, exactCandidates: exact.length };
}

function updateDerivedPrecision(result: AnalysisResult, profiles: CalibrationV32Profile[]) {
  const baseAttributes = completeAttributes(result);
  const objective = normalizeObjective(result.objective);
  const variants: BuildVariant[] = profiles.map((profile, index) => ({
    kind: index === 0 ? 'competitive' : index === 1 ? 'safe' : 'alternative',
    title: profile.label,
    positionLabel: result.bestPosition.label,
    training: profile.training,
    pointsUsed: trainingPlanTotalCost(profile.training),
    qualityScore: profile.score,
    efficiencyScore: profile.exactBudget ? 100 : 80,
    balanceScore: profile.score,
    note: profile.strengths.join(' • '),
    verdict: profile.tradeOffs[0],
    simulationsTested: 0
  }));
  const maxPrecision = buildMaxPrecisionAnalysis({
    parsed: result.parsed,
    position: result.bestPosition.code,
    selectedScore: result.bestPosition.score,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    trainingPointsTotal: result.trainingPointsTotal
  });
  const eliteEvolution = buildEliteEvolutionAnalysis({
    parsed: result.parsed,
    position: result.bestPosition.code,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    maxPrecision
  });
  const metaBuildUniverse = buildMetaBuildUniverse({
    parsed: result.parsed,
    position: result.bestPosition.code,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    maxPrecision,
    trainingPointsTotal: result.trainingPointsTotal
  });
  return { variants, maxPrecision, eliteEvolution, metaBuildUniverse };
}

export function applyCalibrationV32(result: AnalysisResult): AnalysisResult {
  const selectedMode = result.tacticalProfile.gameplayMode ?? 'UNIVERSAL';
  const connectionProfile = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const controlProfile = result.tacticalProfile.controlProfile ?? 'BALANCED';
  const cacheKey = cardAnalysisInputFingerprint(result, `calibration-v32:${selectedMode}:${connectionProfile}:${controlProfile}`);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const allMaps = Object.fromEntries((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) => [mode, targetWeights(result, mode)])) as Record<GameplayMode, CalibrationMaps>;
  const modes: GameplayMode[] = [selectedMode, ...(['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).filter((mode) => mode !== selectedMode)];
  const built = modes.map((mode) => buildProfile(result, mode, allMaps));
  const selected = built[0];
  const profiles = built.map((item) => item.profile);
  const finalPlan = selected.profile.training;
  const used = trainingPlanTotalCost(finalPlan);
  const previousSignature = signature(result.training);
  const recalibrated = previousSignature !== signature(finalPlan);
  const ready = readiness(result);
  const confidence = clamp(result.parsed.confidence * .45 + selected.winner.score * .4 + ready.score * .15, 20, 99);
  const reasons = [
    `Modo principal: ${profileLabel(selectedMode)}.`,
    `Conexão: ${connectionProfile === 'HIGH_DELAY' ? 'atraso alto' : connectionProfile === 'VARIABLE' ? 'variável' : 'estável'}; controle: ${controlProfile === 'PASSING' ? 'passe' : controlProfile === 'DRIBBLE' ? 'drible' : controlProfile === 'DIRECT' ? 'jogo direto' : 'equilibrado'}.`,
    `A distribuição foi comparada em ranqueado, universal e offline, sem usar overall como objetivo.`,
    `Orçamento real auditado: ${used}/${result.trainingPointsTotal} pontos.`,
    ...selected.profile.strengths
  ];
  const safeguards = [
    'A posição escolhida pelo usuário permanece soberana.',
    'O motor não recebe overall como meta nem pontua uma ficha pelo GER final.',
    'Grupos de goleiro são bloqueados em jogadores de linha e vice-versa.',
    'Uma ficha incompleta não vence uma alternativa que usa exatamente o orçamento.',
    'Formação, estilo coletivo e técnico só ganham peso quando foram confirmados.',
    'Habilidades nativas são removidas do Top 5 adicional antes da calibração final.',
    'Ímpetos já existentes não são recomendados novamente.',
    'O perfil ranqueado favorece consistência e resposta; o offline aceita mais especialização criativa.'
  ];
  const analysis: CalibrationV32Analysis = {
    engineVersion: ENGINE_VERSION,
    patchReference: PATCH_REFERENCE,
    selectedMode,
    connectionProfile,
    controlProfile,
    readiness: ready.state,
    readinessScore: ready.score,
    confidence,
    calibrationScore: selected.winner.score,
    finalTraining: finalPlan,
    candidatesEvaluated: built.reduce((sum, item) => sum + item.candidates, 0),
    exactBudgetCandidates: built.reduce((sum, item) => sum + item.exactCandidates, 0),
    recalibrated,
    dimensions: selected.winner.dimensions,
    profiles,
    blockers: ready.blockers,
    warnings: [...ready.warnings, ...selected.profile.tradeOffs.filter((item) => !item.startsWith('Nenhum'))].slice(0, 8),
    safeguards,
    reasons,
    summary: `A Matriz de Calibração v32.00 avaliou ${built.reduce((sum, item) => sum + item.candidates, 0)} candidatas nos três modos e ${recalibrated ? 'recalibrou' : 'confirmou'} a ficha ${profileLabel(selectedMode).toLowerCase()} com ${selected.winner.score}/100, sem perseguir overall.`
  };

  const derived = updateDerivedPrecision(result, profiles);
  const finalResult: AnalysisResult = {
    ...result,
    tacticalProfile: { ...result.tacticalProfile, gameplayMode: selectedMode, connectionProfile, controlProfile },
    training: finalPlan,
    trainingCost: trainingPlanCost(finalPlan),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    trainingComparison: result.trainingComparison.map((item) => ({ ...item, recommended: finalPlan[item.key], difference: finalPlan[item.key] - item.auto })),
    buildName: `Ficha v32 — ${profileLabel(selectedMode)}`,
    buildVariants: derived.variants,
    recommendationExplanation: [analysis.summary, ...reasons, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    maxPrecision: derived.maxPrecision,
    eliteEvolution: derived.eliteEvolution,
    metaBuildUniverse: derived.metaBuildUniverse,
    supremeGameplay: result.supremeGameplay ? {
      ...result.supremeGameplay,
      engineVersion: '32.00-supreme-reconciled-1',
      finalTraining: finalPlan,
      winnerScore: selected.winner.score,
      dimensions: {
        ...result.supremeGameplay.dimensions,
        roleFit: selected.winner.dimensions.roleFit,
        pointEfficiency: selected.winner.dimensions.pointEfficiency,
        skillSynergy: selected.winner.dimensions.skillSynergy,
        onlineRobustness: selected.winner.dimensions.connectionRobustness
      },
      summary: analysis.summary
    } : result.supremeGameplay,
    unifiedIntelligence: result.unifiedIntelligence ? {
      ...result.unifiedIntelligence,
      engineVersion: '32.00-unified-calibrated-1',
      finalTraining: finalPlan,
      simulation: { ...result.unifiedIntelligence.simulation, exactBudget: used === result.trainingPointsTotal, winnerScore: selected.winner.score },
      summary: analysis.summary
    } : result.unifiedIntelligence,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      engineVersion: '32.00-deep-calibrated-1',
      finalTraining: finalPlan,
      winnerScore: selected.winner.score,
      summary: analysis.summary
    } : result.deepCardIntelligence,
    calibrationV32: analysis
  };

  cache.set(cacheKey, finalResult);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  return finalResult;
}
