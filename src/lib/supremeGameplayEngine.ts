import type {
  AnalysisResult,
  PositionCode,
  SupremeGameplayAnalysis,
  TacticalStyle,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { TRAINING_LABELS } from './trainingEngine';
import {
  TRAINING_KEYS,
  emptyTraining,
  normalizeTrainingPlan,
  trainingPlanCost,
  trainingPlanTotalCost,
  trainingTotalCost
} from './trainingPlanCore';
import { buildPersonalizedSkillPlan, skillPlanScore } from './skillIntelligenceV31';
import { cardAnalysisInputFingerprint } from './cardAnalysisFingerprint';

const ENGINE_VERSION = '35.00-universal-position-dna-manager-style-1';
const SEARCH_VARIANTS = 960;
const FINALISTS = 64;

const LINE_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
const GK_KEYS: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 10, dexterity: 8.6, lowerBodyStrength: 7.7, aerialStrength: 5.8, dribbling: 4.7, passing: 2.8 },
  SS: { dexterity: 9.2, dribbling: 8.3, passing: 7.4, shooting: 6.8, lowerBodyStrength: 5.2 },
  LWF: { dribbling: 9.7, dexterity: 9.2, lowerBodyStrength: 7.4, shooting: 6.8, passing: 4.8 },
  RWF: { dribbling: 9.7, dexterity: 9.2, lowerBodyStrength: 7.4, shooting: 6.8, passing: 4.8 },
  LMF: { passing: 8.2, lowerBodyStrength: 8.1, dexterity: 6.7, dribbling: 5.8, defending: 5.3 },
  RMF: { passing: 8.2, lowerBodyStrength: 8.1, dexterity: 6.7, dribbling: 5.8, defending: 5.3 },
  AMF: { passing: 9.7, dribbling: 8.7, dexterity: 8.1, shooting: 5.8, lowerBodyStrength: 3.8 },
  CMF: { passing: 9.2, lowerBodyStrength: 7.7, dexterity: 6.8, defending: 5.8, dribbling: 5.2 },
  DMF: { defending: 10, passing: 7.8, lowerBodyStrength: 7.8, aerialStrength: 5.3, dexterity: 4.8 },
  CB: { defending: 10, aerialStrength: 8.7, lowerBodyStrength: 7.7, dexterity: 5.4, passing: 3.2 },
  LB: { defending: 8.8, lowerBodyStrength: 8.7, passing: 6.7, dexterity: 5.8, dribbling: 3.7 },
  RB: { defending: 8.8, lowerBodyStrength: 8.7, passing: 6.7, dexterity: 5.8, dribbling: 3.7 },
  GK: { gk2: 10, gk3: 9.2, gk1: 8.7, aerialStrength: 5.8, lowerBodyStrength: 4.8 }
};

const ROLE_WEIGHTS: Array<{ pattern: RegExp; label: string; weights: Partial<Record<TrainingKey, number>> }> = [
  { pattern: /homem de area|homem de área|fox in the box/, label: 'Homem de Área', weights: { shooting: 10, aerialStrength: 8.5, dexterity: 7.2, lowerBodyStrength: 7, dribbling: 2.8, passing: 1.8 } },
  { pattern: /artilheiro|goal poacher/, label: 'Artilheiro', weights: { shooting: 10, dexterity: 9.2, lowerBodyStrength: 8.2, dribbling: 4.6, aerialStrength: 4.2, passing: 2.2 } },
  { pattern: /puxa marcacao|puxa marcação|deep.?lying forward/, label: 'Puxa Marcação', weights: { passing: 8.7, dribbling: 8.1, dexterity: 8.6, shooting: 6.8, lowerBodyStrength: 5.8 } },
  { pattern: /infiltracao|infiltração|hole player/, label: 'Jogador de Infiltração', weights: { dexterity: 9.5, shooting: 8.4, lowerBodyStrength: 7.3, passing: 6.5, dribbling: 6.3 } },
  { pattern: /orquestrador|orchestrator/, label: 'Orquestrador', weights: { passing: 10, dribbling: 7.2, lowerBodyStrength: 6.5, dexterity: 5.8, defending: 4.8 } },
  { pattern: /meia versatil|meia versátil|box.?to.?box/, label: 'Meia Versátil', weights: { lowerBodyStrength: 9.3, passing: 8.5, defending: 7.2, dexterity: 7, dribbling: 5.4 } },
  { pattern: /1(?:º|o)?\s*volante|primeiro volante|anchor man|ancora|âncora/, label: 'Primeiro Volante', weights: { defending: 10, lowerBodyStrength: 8.4, passing: 7.7, aerialStrength: 6.5, dexterity: 4.6 } },
  { pattern: /destruidor|destroyer/, label: 'Destruidor', weights: { defending: 10, lowerBodyStrength: 8.6, aerialStrength: 7.8, dexterity: 6.1, passing: 3.4 } },
  { pattern: /defensor criativo|build up/, label: 'Defensor Criativo', weights: { defending: 9.5, passing: 7.6, aerialStrength: 7.4, lowerBodyStrength: 7, dexterity: 5.3 } },
  { pattern: /lateral defensivo|defensive full.?back/, label: 'Lateral Defensivo', weights: { defending: 9.4, lowerBodyStrength: 8.5, passing: 6.6, dexterity: 6, dribbling: 3.2 } },
  { pattern: /perito em cruzamento|cross specialist/, label: 'Perito em Cruzamento', weights: { passing: 9.3, lowerBodyStrength: 8.2, dribbling: 6.6, dexterity: 6, aerialStrength: 3.8 } },
  { pattern: /goleiro ofensivo|offensive goalkeeper/, label: 'Goleiro Ofensivo', weights: { gk2: 10, gk3: 9, gk1: 8, lowerBodyStrength: 5.8, aerialStrength: 5.4 } },
  { pattern: /goleiro defensivo|defensive goalkeeper/, label: 'Goleiro Defensivo', weights: { gk1: 9.5, gk2: 9.5, gk3: 9.2, aerialStrength: 6.2, lowerBodyStrength: 4.8 } }
];

const STYLE_WEIGHTS: Record<TacticalStyle, Partial<Record<TrainingKey, number>>> = {
  AUTO: {},
  POSSE_DE_BOLA: { passing: 9.2, dribbling: 7.2, dexterity: 6.3, lowerBodyStrength: 4.2, defending: 3.2 },
  CONTRA_ATAQUE_RAPIDO: { dexterity: 9.3, lowerBodyStrength: 8.5, shooting: 7.6, passing: 5.6, defending: 4.4 },
  CONTRA_ATAQUE: { defending: 7.4, lowerBodyStrength: 7.8, passing: 7.1, aerialStrength: 6.4, shooting: 5.3 },
  POR_FORA: { passing: 8.3, lowerBodyStrength: 7.7, dribbling: 7.2, aerialStrength: 6.2, dexterity: 5.5 },
  PASSE_LONGO: { passing: 8.7, aerialStrength: 8.2, lowerBodyStrength: 7.4, shooting: 5.4, defending: 5.2 }
};

type Dimensions = SupremeGameplayAnalysis['dimensions'];
type QuickCandidate = { plan: TrainingPlan; source: string; quickScore: number };
type FullCandidate = QuickCandidate & { score: number; dimensions: Dimensions; skillScore: number };

const cache = new Map<string, AnalysisResult>();

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value * 10) / 10)); }
function normalizeText(value: string | null | undefined) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function activeKeys(position: PositionCode) { return position === 'GK' ? GK_KEYS : LINE_KEYS; }
function signature(plan: TrainingPlan) { return TRAINING_KEYS.map((key) => plan[key] ?? 0).join('-'); }
function planDistance(left: TrainingPlan, right: TrainingPlan) { return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs((left[key] ?? 0) - (right[key] ?? 0)), 0); }
function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); } return output >>> 0; }
function createRng(seed: number) { let state = seed || 1; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }

function roleProfile(result: AnalysisResult) {
  const normalized = normalizeText(result.parsed.playstyle);
  const found = ROLE_WEIGHTS.find((entry) => entry.pattern.test(normalized));
  return found ?? { label: result.parsed.playstyle || `Perfil ${result.bestPosition.label}`, weights: POSITION_WEIGHTS[result.bestPosition.code] };
}

function mergeWeights(...sources: Array<{ values: Partial<Record<TrainingKey, number>>; factor: number }>) {
  const merged: Record<TrainingKey, number> = { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
  for (const source of sources) for (const key of TRAINING_KEYS) merged[key] += Number(source.values[key] ?? 0) * source.factor;
  return merged;
}

function learnedWeights(result: AnalysisResult) {
  const learned: Partial<Record<TrainingKey, number>> = {};
  for (const pattern of result.unifiedIntelligence?.learning.patterns ?? []) learned[pattern.training] = (learned[pattern.training] ?? 0) + pattern.rate / 15;
  return learned;
}

function managerFit(result: AnalysisResult) {
  const proficiency = Number(result.tacticalProfile.managerProficiency ?? 0);
  const booster = result.tacticalProfile.managerBooster;
  if (!result.tacticalProfile.managerId && !result.tacticalProfile.managerName) return 62;
  const proficiencyScore = proficiency >= 90 ? 96 : proficiency >= 89 ? 93 : proficiency >= 88 ? 89 : proficiency >= 85 ? 82 : proficiency > 0 ? 70 : 65;
  return clamp(proficiencyScore + (booster === 'duplo' ? 3 : booster === 'especial' ? 2 : booster === 'padrao' ? 1 : 0));
}


function managerTacticalTrust(result: AnalysisResult) {
  const hasManager = Boolean(result.tacticalProfile.managerId || result.tacticalProfile.managerName);
  const proficiency = Number(result.tacticalProfile.managerProficiency ?? 0);
  let trust = !hasManager ? 0.56 : proficiency >= 90 ? 1 : proficiency >= 89 ? 0.96 : proficiency >= 88 ? 0.91 : proficiency >= 85 ? 0.82 : proficiency > 0 ? 0.70 : 0.62;
  if (result.tacticalProfile.managerBooster === 'duplo') trust += 0.04;
  else if (result.tacticalProfile.managerBooster === 'especial') trust += 0.025;
  else if (result.tacticalProfile.managerBooster === 'padrao') trust += 0.012;
  return Math.max(0.48, Math.min(1, trust));
}

function capFor(result: AnalysisResult, key: TrainingKey) {
  return result.correctionLimit.correctionCaps.find((item) => item.training === key)?.recommendedMax ?? 12;
}

function goalFor(result: AnalysisResult, key: TrainingKey) {
  return result.cardDna?.individualGoals.find((goal) => goal.training === key) ?? null;
}

function marginalValue(result: AnalysisResult, key: TrainingKey) {
  const item = result.marginalReturn.find((entry) => entry.training === key);
  if (!item) return 0;
  return item.returnLabel === 'alto' ? 2.8 : item.returnLabel === 'médio' ? 1.2 : -2.4;
}

function currentGameplayAdjustment(result: AnalysisResult, key: TrainingKey, currentLevel: number) {
  const position = result.bestPosition.code;
  const attributes = result.parsed.attributes;
  const attacking = ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position);
  const defensive = ['CB', 'LB', 'RB', 'DMF'].includes(position);

  // Ajuste para a jogabilidade atual: jogadores ofensivos tecnicamente fortes devem
  // conservar resposta no domínio/condução, e finalizadores com potência precisam
  // aproveitar melhor conclusões de média e longa distância sem inflar o overall.
  if (attacking && key === 'dribbling') {
    const technique = (
      Number(attributes.ballControl ?? 0)
      + Number(attributes.dribbling ?? 0)
      + Number(attributes.tightPossession ?? 0)
    ) / 3;
    if (technique >= 86) return currentLevel <= 9 ? 1.45 : currentLevel <= 11 ? 0.45 : -0.55;
    if (technique >= 80) return currentLevel <= 8 ? 1.05 : currentLevel <= 10 ? 0.25 : -0.75;
  }
  if (attacking && key === 'shooting') {
    const finishing = Number(attributes.finishing ?? 0);
    const kickingPower = Number(attributes.kickingPower ?? 0);
    const curl = Number(attributes.curl ?? 0);
    if (kickingPower >= 88 && Math.max(finishing, curl) >= 82) return currentLevel <= 9 ? 1.15 : currentLevel <= 11 ? 0.3 : -0.65;
    if (kickingPower >= 84 && finishing >= 80) return currentLevel <= 8 ? 0.75 : currentLevel <= 10 ? 0.15 : -0.7;
  }

  if (!defensive) return 0;
  const awareness = Number(attributes.defensiveAwareness ?? 0);
  const stamina = Number(attributes.stamina ?? 0);
  if (key === 'defending') {
    const awarenessNeed = awareness < 78 ? 3.8 : awareness < 85 ? 3 : awareness < 90 ? 2.1 : 1.2;
    return currentLevel <= 10 ? awarenessNeed : awarenessNeed * 0.45;
  }
  if (key === 'dexterity' && awareness >= 87 && currentLevel >= 8) return -1.5;
  if (key === 'lowerBodyStrength' && stamina >= 90 && currentLevel >= 10) return -0.9;
  return 0;
}

function utilityForLevel(result: AnalysisResult, key: TrainingKey, level: number, weights: Record<TrainingKey, number>, noise: number) {
  if (level <= 0) return 0;
  const cap = capFor(result, key);
  const goal = goalFor(result, key);
  const current = goal?.current ?? 70;
  const ideal = goal?.personalizedIdeal ?? current + 6;
  const ceiling = goal?.recommendedCeiling ?? current + cap;
  let total = 0;
  for (let currentLevel = 1; currentLevel <= level; currentLevel += 1) {
    const estimated = current + currentLevel;
    const needBoost = estimated < ideal ? 2.4 : estimated <= ceiling ? 0.8 : -3.4 * (estimated - ceiling + 1);
    const saturation = currentLevel <= 4 ? 1.7 : currentLevel <= 8 ? 0.8 : currentLevel <= 11 ? -0.8 : currentLevel <= 13 ? -2.5 : -5.5;
    const capPenalty = currentLevel > cap ? -5.5 * (currentLevel - cap) : 0;
    total += weights[key] + needBoost + saturation + capPenalty + marginalValue(result, key) + currentGameplayAdjustment(result, key, currentLevel) + noise;
  }
  return total;
}

function allocateExact(result: AnalysisResult, combinedWeights: Record<TrainingKey, number>, variant: number, seed: number) {
  const keys = activeKeys(result.bestPosition.code);
  const budget = result.trainingPointsTotal;
  const rng = createRng(seed + variant * 104729);
  type State = { score: number; levels: number[] } | null;
  let states: State[] = Array.from({ length: budget + 1 }, () => null);
  states[0] = { score: 0, levels: [] };
  for (const key of keys) {
    const next: State[] = Array.from({ length: budget + 1 }, () => null);
    const levelNoise = Array.from({ length: 17 }, () => (rng() - 0.5) * (2.2 + (variant % 9) * 0.08));
    for (let used = 0; used <= budget; used += 1) {
      const state = states[used];
      if (!state) continue;
      for (let level = 0; level <= 16; level += 1) {
        const cost = trainingTotalCost(level);
        if (used + cost > budget) break;
        const score = state.score + utilityForLevel(result, key, level, combinedWeights, levelNoise[level]);
        const previous = next[used + cost];
        if (!previous || score > previous.score) next[used + cost] = { score, levels: [...state.levels, level] };
      }
    }
    states = next;
  }
  const selected = states[budget] ?? states.map((state, cost) => ({ state, cost })).filter((item) => item.state).sort((a, b) => b.cost - a.cost)[0]?.state;
  if (!selected) return emptyTraining();
  const plan = emptyTraining();
  keys.forEach((key, index) => { plan[key] = selected.levels[index] ?? 0; });
  return normalizeTrainingPlan(plan);
}

function weightedPlanScore(plan: TrainingPlan, weights: Partial<Record<TrainingKey, number>>, keys: TrainingKey[]) {
  let weighted = 0;
  let total = 0;
  for (const key of keys) {
    const weight = Math.max(0, Number(weights[key] ?? 0));
    if (!weight) continue;
    const level = Number(plan[key] ?? 0);
    const response = 100 * (1 - Math.exp(-level / 5.2));
    weighted += response * weight;
    total += weight;
  }
  return total ? clamp(weighted / total) : 70;
}

function thresholdFit(result: AnalysisResult, plan: TrainingPlan) {
  const goals = result.cardDna?.individualGoals ?? [];
  if (!goals.length) return 78;
  let weighted = 0;
  let total = 0;
  for (const goal of goals) {
    if (!activeKeys(result.bestPosition.code).includes(goal.training)) continue;
    const estimated = goal.current + Number(plan[goal.training] ?? 0);
    let score = 70;
    if (estimated < goal.functionalMin) score = 45 - (goal.functionalMin - estimated) * 5;
    else if (estimated < goal.personalizedIdeal) score = 72 + (estimated - goal.functionalMin) * 3;
    else if (estimated <= goal.recommendedCeiling) score = 94 + Math.min(6, estimated - goal.personalizedIdeal);
    else score = 88 - (estimated - goal.recommendedCeiling) * 6;
    const priorityWeight = goal.priority === 'proteger' ? 1.35 : goal.priority === 'corrigir' ? 1.25 : goal.priority === 'especializar' ? 1.15 : 1;
    weighted += clamp(score, 20, 100) * priorityWeight;
    total += priorityWeight;
  }
  return total ? clamp(weighted / total) : 78;
}

function efficiencyScore(result: AnalysisResult, plan: TrainingPlan) {
  const used = trainingPlanTotalCost(plan);
  if (used !== result.trainingPointsTotal) return clamp(72 - Math.abs(result.trainingPointsTotal - used) * 8);
  let penalty = 0;
  for (const key of activeKeys(result.bestPosition.code)) {
    const cap = capFor(result, key);
    penalty += Math.max(0, Number(plan[key] ?? 0) - cap) * 5.5;
    const marginal = result.marginalReturn.find((item) => item.training === key);
    if (marginal?.returnLabel === 'baixo' && Number(plan[key] ?? 0) >= marginal.currentLevel + 2) penalty += 4;
  }
  return clamp(100 - penalty);
}

function identityScore(result: AnalysisResult, plan: TrainingPlan, reference: TrainingPlan) {
  const base = result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? 78;
  const distance = planDistance(plan, reference);
  return clamp(base - Math.max(0, distance - 8) * 1.6, 35, 100);
}

function onlineRobustness(result: AnalysisResult, plan: TrainingPlan) {
  const defensive = ['CB', 'LB', 'RB', 'DMF', 'GK'].includes(result.bestPosition.code);
  const weights: Partial<Record<TrainingKey, number>> = result.bestPosition.code === 'GK'
    ? { gk1: 8.7, gk2: 10, gk3: 9.2, aerialStrength: 5.7, lowerBodyStrength: 4.5 }
    : defensive
      ? { passing: 7.4, dexterity: 5.2, lowerBodyStrength: 6.8, defending: 10.5, aerialStrength: 5.8 }
      : { passing: 8.2, dexterity: 8.5, lowerBodyStrength: 7.2, dribbling: 5.4, shooting: 5.5 };
  const base = weightedPlanScore(plan, weights, activeKeys(result.bestPosition.code));
  const extremeDribblePenalty = !defensive && plan.dribbling >= 13 && plan.passing <= 4 ? 7 : 0;
  return clamp(base - extremeDribblePenalty);
}

function professionalCloseness(result: AnalysisResult, plan: TrainingPlan) {
  const reference = result.competitiveFusion?.finalTraining;
  if (!reference || !(result.competitiveFusion?.exactCardCount ?? 0)) return null;
  return clamp(100 - planDistance(plan, reference) * 4.1);
}

function learningBonus(result: AnalysisResult, plan: TrainingPlan) {
  const patterns = result.unifiedIntelligence?.learning.patterns ?? [];
  if (!patterns.length) return 0;
  return clamp(patterns.reduce((sum, pattern) => sum + Number(plan[pattern.training] ?? 0) * pattern.rate / 500, 0), 0, 6);
}

function scoreQuick(result: AnalysisResult, plan: TrainingPlan, roleWeights: Partial<Record<TrainingKey, number>>, tacticalWeights: Partial<Record<TrainingKey, number>>, reference: TrainingPlan) {
  const keys = activeKeys(result.bestPosition.code);
  const roleFit = weightedPlanScore(plan, roleWeights, keys);
  const tacticalFit = weightedPlanScore(plan, tacticalWeights, keys);
  const threshold = thresholdFit(result, plan);
  const efficiency = efficiencyScore(result, plan);
  const identity = identityScore(result, plan, reference);
  const robustness = onlineRobustness(result, plan);
  const manager = managerFit(result);
  const pro = professionalCloseness(result, plan);
  return clamp(
    roleFit * 0.19 + tacticalFit * (0.12 + managerTacticalTrust(result) * 0.10) + threshold * 0.18 + efficiency * 0.16 + identity * 0.09 + robustness * 0.09 + manager * 0.01 + (pro ?? 75) * 0.04 + learningBonus(result, plan)
  );
}

function scoreFull(result: AnalysisResult, candidate: QuickCandidate, roleWeights: Partial<Record<TrainingKey, number>>, tacticalWeights: Partial<Record<TrainingKey, number>>, reference: TrainingPlan): FullCandidate {
  const keys = activeKeys(result.bestPosition.code);
  const roleFit = weightedPlanScore(candidate.plan, roleWeights, keys);
  const tacticalFit = weightedPlanScore(candidate.plan, tacticalWeights, keys);
  const manager = managerFit(result);
  const threshold = thresholdFit(result, candidate.plan);
  const pointEfficiency = efficiencyScore(result, candidate.plan);
  const identityPreservation = identityScore(result, candidate.plan, reference);
  const online = onlineRobustness(result, candidate.plan);
  const skills = buildPersonalizedSkillPlan(result, candidate.plan);
  const skillSynergy = skillPlanScore(skills);
  const pro = professionalCloseness(result, candidate.plan);
  const score = clamp(
    roleFit * 0.18 + tacticalFit * (0.11 + managerTacticalTrust(result) * 0.11) + manager * 0.01 + threshold * 0.15 + pointEfficiency * 0.15 + skillSynergy * 0.12 + identityPreservation * 0.07 + online * 0.08 + (pro ?? 75) * 0.03 + learningBonus(result, candidate.plan)
  );
  return {
    ...candidate,
    score,
    skillScore: skillSynergy,
    dimensions: { roleFit, tacticalFit, managerFit: manager, thresholdFit: threshold, pointEfficiency, skillSynergy, identityPreservation, onlineRobustness: online }
  };
}

function candidateMap(result: AnalysisResult, roleWeights: Partial<Record<TrainingKey, number>>, tacticalWeights: Partial<Record<TrainingKey, number>>, reference: TrainingPlan) {
  const map = new Map<string, QuickCandidate>();
  const add = (plan: TrainingPlan, source: string) => {
    const normalized = normalizeTrainingPlan(plan);
    if (trainingPlanTotalCost(normalized) > result.trainingPointsTotal) return;
    const key = signature(normalized);
    const quickScore = scoreQuick(result, normalized, roleWeights, tacticalWeights, reference);
    const current = map.get(key);
    if (!current || quickScore > current.quickScore) map.set(key, { plan: normalized, source, quickScore });
  };
  add(result.training, 'Ficha integrada v31');
  if (result.unifiedIntelligence) add(result.unifiedIntelligence.finalTraining, 'Vencedora da inteligência integrada');
  if (result.competitiveFusion) add(result.competitiveFusion.finalTraining, 'Consenso profissional auditado');
  add(result.errorTolerance.conservative, 'Cenário conservador');
  add(result.errorTolerance.probable, 'Cenário provável');
  add(result.errorTolerance.optimistic, 'Cenário agressivo controlado');
  for (const variant of result.buildVariants) add(variant.training, variant.title);
  for (const build of result.metaBuildUniverse?.topBuilds.slice(0, 12) ?? []) add(build.training, `Universo meta: ${build.title}`);
  const merged = mergeWeights(
    { values: POSITION_WEIGHTS[result.bestPosition.code], factor: 0.42 },
    { values: roleWeights, factor: 0.92 },
    { values: tacticalWeights, factor: 1.15 },
    { values: learnedWeights(result), factor: 0.55 }
  );
  const seed = hash(`${result.parsed.internalId}|${result.bestPosition.code}|${result.tacticalProfile.style}|${result.parsed.playstyle ?? ''}`);
  for (let index = 0; index < SEARCH_VARIANTS; index += 1) add(allocateExact(result, merged, index, seed), `Busca competitiva ${index + 1}`);
  return Array.from(map.values());
}

function tacticalContext(result: AnalysisResult) {
  const manager = result.tacticalProfile.managerName ? ` • técnico ${result.tacticalProfile.managerName}` : '';
  const collective = result.tacticalProfile.style === 'AUTO' ? 'estilo coletivo automático' : result.tacticalProfile.style.replaceAll('_', ' ').toLowerCase();
  return `posição universal • ${collective}${manager}`;
}

function gameplayChanges(winner: TrainingPlan, reference: TrainingPlan) {
  const changes: string[] = [];
  const delta = (key: TrainingKey) => Number(winner[key] ?? 0) - Number(reference[key] ?? 0);
  if (delta('passing') > 0) changes.push('Circulação mais limpa e menor tempo de execução do passe sob pressão.');
  if (delta('dexterity') > 0) changes.push('Resposta corporal mais rápida para girar, arrancar e atacar espaço.');
  if (delta('shooting') > 0) changes.push('Finalização mais consistente nas chances de maior valor.');
  if (delta('dribbling') > 0) changes.push('Primeiro domínio e condução mais seguros no duelo curto.');
  if (delta('defending') > 0) changes.push('Leitura defensiva, interceptação e recuperação mais fortes.');
  if (delta('lowerBodyStrength') > 0) changes.push('Mais sustentação de velocidade e resistência durante a partida.');
  if (delta('aerialStrength') > 0) changes.push('Maior presença física e aérea sem abandonar a função principal.');
  return changes.slice(0, 5);
}

function compareScore(result: AnalysisResult, plan: TrainingPlan | null | undefined, roleWeights: Partial<Record<TrainingKey, number>>, tacticalWeights: Partial<Record<TrainingKey, number>>, reference: TrainingPlan) {
  if (!plan) return null;
  const candidate: QuickCandidate = { plan: normalizeTrainingPlan(plan), source: 'comparação', quickScore: 0 };
  return scoreFull(result, candidate, roleWeights, tacticalWeights, reference).score;
}

function buildWarnings(result: AnalysisResult) {
  const warnings: string[] = [];
  if (!result.parsed.playstyle) warnings.push('Confirme o Estilo de Jogo oficial; sem ele o motor usa posição, atributos e habilidades, mas perde precisão comportamental.');
  if (result.tacticalProfile.style === 'AUTO') warnings.push('Escolha o estilo coletivo do técnico para concluir a calibração tática.');
  if (!result.tacticalProfile.managerName && !result.tacticalProfile.managerId) warnings.push('Selecione o técnico e a proficiência para medir o encaixe completo.');
  if ((result.competitiveFusion?.exactCardCount ?? 0) === 0) warnings.push('Nenhuma ficha profissional auditável da carta exata foi registrada; o motor próprio permanece como fonte principal.');
  if ((result.unifiedIntelligence?.learning.samples ?? 0) < 5) warnings.push('Registre partidas reais para o app aprender como esta carta responde no seu aparelho, conexão e forma de jogar.');
  if (result.validation.level !== 'safe') warnings.push('Existem dados da carta que ainda precisam de confirmação antes de tratar a ficha como definitiva.');
  return warnings.slice(0, 6);
}

export function applySupremeGameplayEngine(result: AnalysisResult): AnalysisResult {
  const cacheKey = cardAnalysisInputFingerprint(result, `supreme:${signature(result.training)}`);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const role = roleProfile(result);
  const styleWeights = STYLE_WEIGHTS[result.tacticalProfile.style] ?? {};
  const tacticalTrust = managerTacticalTrust(result);
  const tacticalWeights = mergeWeights(
    { values: POSITION_WEIGHTS[result.bestPosition.code], factor: 1 - 0.55 * tacticalTrust },
    { values: styleWeights, factor: 0.55 * tacticalTrust }
  );
  const reference = result.unifiedIntelligence?.finalTraining ?? result.training;
  const candidates = candidateMap(result, role.weights, tacticalWeights, reference);
  const finalists = candidates.sort((left, right) => right.quickScore - left.quickScore).slice(0, FINALISTS)
    .map((candidate) => scoreFull(result, candidate, role.weights, tacticalWeights, reference))
    .sort((left, right) => right.score - left.score || right.dimensions.pointEfficiency - left.dimensions.pointEfficiency);
  // A ficha final precisa consumir exatamente o orçamento informado. Planos
  // incompletos continuam disponíveis para comparação, mas nunca vencem uma
  // alternativa válida que use todos os pontos sem ultrapassar o limite.
  const exactBudgetFinalists = finalists.filter((item) => trainingPlanTotalCost(item.plan) === result.trainingPointsTotal);
  const winner = exactBudgetFinalists[0] ?? finalists[0] ?? scoreFull(result, { plan: reference, source: 'Ficha atual', quickScore: 0 }, role.weights, tacticalWeights, reference);
  const runnerUp = finalists.find((item) => signature(item.plan) !== signature(winner.plan) && planDistance(item.plan, winner.plan) <= 8) ?? finalists[1] ?? winner;
  const currentScore = compareScore(result, reference, role.weights, tacticalWeights, reference) ?? winner.score;
  const autoScore = compareScore(result, result.parsed.autoTrainingPlan, role.weights, tacticalWeights, reference);
  const professionalReferenceScore = compareScore(result, result.competitiveFusion?.exactCardCount ? result.competitiveFusion.finalTraining : null, role.weights, tacticalWeights, reference);
  const skills = buildPersonalizedSkillPlan(result, winner.plan);
  const used = trainingPlanTotalCost(winner.plan);
  const reasons = [
    `${role.label}: distribuição calibrada para o comportamento real do Estilo de Jogo na posição ${result.bestPosition.label}.`,
    `Contexto tático aplicado: ${tacticalContext(result)}.`,
    `Orçamento auditado: ${used}/${result.trainingPointsTotal} pontos, com retorno marginal e limites de excesso verificados.`,
    ...gameplayChanges(winner.plan, reference)
  ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 7);
  const analysis: SupremeGameplayAnalysis = {
    engineVersion: ENGINE_VERSION,
    mode: 'Otimização competitiva personalizada',
    candidatesEvaluated: SEARCH_VARIANTS + candidates.length,
    validCandidates: candidates.length,
    finalists: finalists.length,
    finalTraining: winner.plan,
    winnerScore: winner.score,
    currentScore,
    autoScore,
    professionalReferenceScore,
    potentialEdgeVsCurrent: clamp(Math.max(0, winner.score - currentScore), 0, 20),
    potentialEdgeVsAuto: autoScore == null ? null : clamp(Math.max(0, winner.score - autoScore), 0, 25),
    potentialEdgeVsProfessional: professionalReferenceScore == null ? null : clamp(winner.score - professionalReferenceScore, -20, 20),
    dimensions: winner.dimensions,
    roleLabel: role.label,
    tacticalContext: tacticalContext(result),
    reasons,
    warnings: buildWarnings(result),
    guardrails: [
      'A posição escolhida pelo usuário permanece soberana.',
      'O Estilo de Jogo oficial da carta é tratado como comportamento, não apenas como nome.',
      'A posição escolhida, o Estilo de Jogo da carta, o estilo coletivo, o técnico e a proficiência alteram os pesos; a formação não limita a ficha.',
      'Nenhum plano pode ultrapassar o orçamento real ou usar grupos de goleiro em jogador de linha.',
      'O motor penaliza excesso acima da faixa útil e evita gastar pontos apenas para aumentar overall.',
      'Referências de pro players têm peso limitado e só entram quando a carta exata é auditada.',
      'A vantagem mostrada é uma estimativa do motor; resultado em campo depende de comando, conexão, carta e execução do usuário.'
    ],
    summary: `O Motor Supremo v31.82 comparou ${candidates.length} distribuições únicas, refinou ${finalists.length} finalistas e escolheu a ficha de maior encaixe para ${role.label} e ${result.bestPosition.label}, com rendimento universal entre formações.`
  };

  const differences = TRAINING_KEYS.filter((key) => winner.plan[key] !== runnerUp.plan[key]).map((key) => ({ key, label: TRAINING_LABELS[key], a: winner.plan[key], b: runnerUp.plan[key] }));
  const recommendedSkills = skills.map((item) => item.name);
  const updatedUnified = result.unifiedIntelligence ? {
    ...result.unifiedIntelligence,
    engineVersion: '31.82-unified-intelligence-full-audit-1',
    finalTraining: winner.plan,
    skillPlan: skills,
    simulation: {
      ...result.unifiedIntelligence.simulation,
      generatedCandidates: result.unifiedIntelligence.simulation.generatedCandidates + SEARCH_VARIANTS,
      validCandidates: candidates.length,
      finalists: finalists.length,
      winnerScore: winner.score,
      runnerUpScore: runnerUp.score,
      scoreGap: clamp(winner.score - runnerUp.score, 0, 100),
      exactBudget: used === result.trainingPointsTotal,
      evaluationDimensions: ['posição escolhida', 'Estilo de Jogo oficial', 'versatilidade entre formações e estilo do técnico', 'proficiência do técnico', 'faixas úteis de atributos', 'retorno por ponto', 'habilidades', 'robustez online', 'partidas reais'],
      abTest: {
        available: differences.length > 0 && signature(winner.plan) !== signature(runnerUp.plan),
        minimumMatchesPerVariant: 5,
        variantA: winner.plan,
        variantB: runnerUp.plan,
        differences,
        instruction: 'Teste as duas fichas com a mesma posição, técnico e estilo coletivo. Registre passe, giro, finalização, físico e posicionamento por pelo menos 5 partidas em cada variante.'
      }
    },
    gameplayChanges: gameplayChanges(winner.plan, reference),
    safeguards: [...analysis.guardrails, ...result.unifiedIntelligence.safeguards].filter((item, index, all) => all.indexOf(item) === index).slice(0, 10),
    summary: analysis.summary
  } : result.unifiedIntelligence;

  const finalResult: AnalysisResult = {
    ...result,
    training: winner.plan,
    trainingCost: trainingPlanCost(winner.plan),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    trainingComparison: result.trainingComparison.map((item) => ({ ...item, recommended: winner.plan[item.key], difference: winner.plan[item.key] - item.auto })),
    recommendedSkills,
    skillRecommendations: [
      ...skills.map((item) => ({ name: item.name, tier: item.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const, reason: `${item.gameplayImpact} ${item.reasons[0] ?? ''}`.trim() })),
      ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !recommendedSkills.includes(item.name))
    ],
    buildName: 'Ficha Elite Suprema — Precisão v31.30',
    buildVariants: [{
      kind: 'competitive',
      title: 'Ficha Elite Suprema — Precisão v31.30',
      positionLabel: result.bestPosition.label,
      training: winner.plan,
      pointsUsed: used,
      note: analysis.summary,
      qualityScore: winner.score,
      efficiencyScore: winner.dimensions.pointEfficiency,
      balanceScore: clamp((winner.dimensions.roleFit + winner.dimensions.tacticalFit + winner.dimensions.identityPreservation) / 3),
      adaptationLabel: winner.score >= 92 ? 'elite' : winner.score >= 86 ? 'muito alta' : winner.score >= 78 ? 'alta' : 'controlada',
      highlights: reasons.slice(0, 4),
      risks: analysis.warnings.slice(0, 3),
      verdict: `Melhor distribuição encontrada para ${role.label}; vantagem estimada de ${analysis.potentialEdgeVsCurrent} ponto(s) sobre a ficha integrada anterior.`,
      simulationsTested: analysis.candidatesEvaluated
    }],
    recommendationExplanation: [analysis.summary, ...reasons, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    unifiedIntelligence: updatedUnified,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      engineVersion: '31.30-deep-card-3',
      candidatesEvaluated: analysis.candidatesEvaluated,
      validCandidates: analysis.validCandidates,
      winnerScore: winner.score,
      winnerSource: winner.source,
      finalTraining: winner.plan,
      skillPlan: skills.map((item) => ({ name: item.name, priority: item.priority === 'essencial' ? 'máxima' as const : item.priority === 'alta' ? 'alta' as const : 'útil' as const, reason: `${item.gameplayImpact} ${item.reasons[0] ?? ''}`.trim() })),
      reasons,
      warnings: analysis.warnings,
      summary: analysis.summary
    } : result.deepCardIntelligence,
    supremeGameplay: analysis
  };
  cache.set(cacheKey, finalResult);
  while (cache.size > 20) cache.delete(cache.keys().next().value as string);
  return finalResult;
}
