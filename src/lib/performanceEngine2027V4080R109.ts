import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import {
  scorePerformancePlan2027R108,
  type PerformanceEngine2027R108
} from './performanceEngine2027V4080R108';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const PERFORMANCE_ENGINE_2027_R109_VERSION = '40.80-r109-extreme-position-execution-layer' as const;
// BM_R114_R109_RESPONSE_GUARD: adaptação posicional não pode sacrificar a resposta real do núcleo.

export type PerformanceEngine2027R109 = {
  version: typeof PERFORMANCE_ENGINE_2027_R109_VERSION;
  authority: 'SPECIALIST_READ_ONLY';
  model: 'EXTREME_CORE_PLUS_POSITION_EXECUTION';
  naturalPosition: PositionCode;
  selectedPosition: PositionCode;
  coreTraining: TrainingPlan;
  appliedTraining: TrainingPlan;
  adaptationApplied: boolean;
  exactBudget: boolean;
  corePreservation: number;
  positionUtilityBefore: number;
  positionUtilityAfter: number;
  positionGain: number;
  extremeScoreBefore: number;
  extremeScoreAfter: number;
  extremeScoreDrop: number;
  directionAlignment: number;
  guards: {
    overallIgnored: true;
    formationIndependent: true;
    coreNeverRewritten: true;
    exactBudget: boolean;
    minimumCorePreservation: boolean;
    selectedPositionImproved: boolean;
    extremeLossControlled: boolean;
  };
};

type Enriched = AnalysisResult & {
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceEngine2027R108?: PerformanceEngine2027R108;
  adaptivePositionV3930?: {
    coreTraining?: TrainingPlan;
    adaptedTraining?: TrainingPlan;
    selectedPosition?: PositionCode;
  };
};

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  GK: { gk1: 1.45, gk2: 1.75, gk3: 1.65, aerialStrength: .3, lowerBodyStrength: .12 },
  CB: { defending: 1.72, aerialStrength: 1.13, lowerBodyStrength: 1.0, dexterity: .52, passing: .34 },
  LB: { defending: 1.28, lowerBodyStrength: 1.17, dexterity: 1.0, passing: .82, dribbling: .48, aerialStrength: .25 },
  RB: { defending: 1.28, lowerBodyStrength: 1.17, dexterity: 1.0, passing: .82, dribbling: .48, aerialStrength: .25 },
  DMF: { defending: 1.58, lowerBodyStrength: 1.12, passing: 1.08, dexterity: .56, aerialStrength: .54, dribbling: .28 },
  CMF: { passing: 1.56, lowerBodyStrength: 1.12, dribbling: .9, dexterity: .9, defending: .82, shooting: .34, aerialStrength: .2 },
  LMF: { passing: 1.22, lowerBodyStrength: 1.16, dribbling: 1.08, dexterity: 1.0, defending: .56, shooting: .3 },
  RMF: { passing: 1.22, lowerBodyStrength: 1.16, dribbling: 1.08, dexterity: 1.0, defending: .56, shooting: .3 },
  AMF: { passing: 1.58, dribbling: 1.48, dexterity: 1.28, shooting: .66, lowerBodyStrength: .38 },
  SS: { dexterity: 1.48, dribbling: 1.32, shooting: 1.17, passing: .82, lowerBodyStrength: .68, aerialStrength: .18 },
  CF: { shooting: 1.65, dexterity: 1.42, lowerBodyStrength: 1.0, aerialStrength: .57, dribbling: .5, passing: .24 },
  LWF: { dribbling: 1.58, dexterity: 1.43, lowerBodyStrength: 1.06, shooting: .92, passing: .48 },
  RWF: { dribbling: 1.58, dexterity: 1.43, lowerBodyStrength: 1.06, shooting: .92, passing: .48 }
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round1 = (value: number) => Math.round(value * 10) / 10;

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function levelDistance(left: TrainingPlan, right: TrainingPlan) {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(left[key] ?? 0) - Number(right[key] ?? 0)), 0);
}

function totalLevels(plan: TrainingPlan) {
  return TRAINING_KEYS.reduce((sum, key) => sum + Number(plan[key] ?? 0), 0);
}

function corePreservation(core: TrainingPlan, candidate: TrainingPlan) {
  const denominator = Math.max(1, totalLevels(core));
  return round1(clamp(100 - (levelDistance(core, candidate) / denominator) * 100));
}

function positionUtility(plan: TrainingPlan, position: PositionCode) {
  const weights = POSITION_WEIGHTS[position];
  const entries = Object.entries(weights) as Array<[TrainingKey, number]>;
  const maximum = entries.reduce((sum, [, weight]) => sum + 16 * weight, 0);
  if (!maximum) return 0;
  const value = entries.reduce((sum, [key, weight]) => sum + Number(plan[key] ?? 0) * weight, 0);
  return round1(clamp((value / maximum) * 100));
}

function directionalIntent(result: Enriched, core: TrainingPlan, selected: PositionCode) {
  const adaptive = result.adaptivePositionV3930;
  if (!adaptive?.adaptedTraining || adaptive.selectedPosition !== selected) return new Map<TrainingKey, number>();
  const referenceCore = adaptive.coreTraining ?? core;
  const direction = new Map<TrainingKey, number>();
  for (const key of TRAINING_KEYS) {
    const delta = Number(adaptive.adaptedTraining[key] ?? 0) - Number(referenceCore[key] ?? 0);
    direction.set(key, Math.sign(delta));
  }
  return direction;
}

function alignmentScore(core: TrainingPlan, candidate: TrainingPlan, intent: Map<TrainingKey, number>) {
  let relevant = 0;
  let aligned = 0;
  for (const key of TRAINING_KEYS) {
    const wanted = Number(intent.get(key) ?? 0);
    if (!wanted) continue;
    relevant += 1;
    const actual = Math.sign(Number(candidate[key] ?? 0) - Number(core[key] ?? 0));
    if (actual === wanted) aligned += 1;
    else if (actual === 0) aligned += .35;
  }
  return relevant ? round1((aligned / relevant) * 100) : 50;
}

function protectedCoreKeys(core: TrainingPlan) {
  return [...TRAINING_KEYS]
    .sort((left, right) => Number(core[right] ?? 0) - Number(core[left] ?? 0) || left.localeCompare(right))
    .slice(0, 2);
}

function candidateLevels(core: TrainingPlan, key: TrainingKey, protectedKeys: Set<TrainingKey>, selected: PositionCode) {
  const center = Number(core[key] ?? 0);
  const weight = Number(POSITION_WEIGHTS[selected][key] ?? 0);
  const down = protectedKeys.has(key) ? 1 : 2;
  const up = weight >= .8 ? 3 : 2;
  const minimum = Math.max(0, center - down);
  const maximum = Math.min(16, center + up);
  const values: number[] = [];
  for (let level = minimum; level <= maximum; level += 1) values.push(level);
  if (!values.includes(center)) values.push(center);
  return values.sort((a, b) => a - b);
}

function candidateObjective(
  key: TrainingKey,
  level: number,
  coreLevel: number,
  selected: PositionCode,
  intent: Map<TrainingKey, number>
) {
  const weight = Number(POSITION_WEIGHTS[selected][key] ?? 0);
  const delta = level - coreLevel;
  const wanted = Number(intent.get(key) ?? 0);
  const directionBonus = wanted && Math.sign(delta) === wanted ? Math.min(2, Math.abs(delta)) * .18 : 0;
  const unrelatedPenalty = weight < .2 && delta > 0 ? delta * .8 : 0;
  return level * weight + directionBonus - Math.abs(delta) * .055 - unrelatedPenalty;
}

function buildCandidates(result: Enriched, identity: CanonicalCardIdentityR60, core: TrainingPlan) {
  const selected = identity.attackPosition;
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(core));
  const coreLevels = totalLevels(core);
  const maxDistance = Math.max(4, Math.min(10, Math.floor(coreLevels * .24)));
  const protectedKeys = new Set(protectedCoreKeys(core));
  const intent = directionalIntent(result, core, selected);

  type Node = { score: number; plan: TrainingPlan };
  let states = new Map<string, Node>();
  states.set('0|0', { score: 0, plan: Object.fromEntries(TRAINING_KEYS.map((key) => [key, 0])) as TrainingPlan });

  for (const key of TRAINING_KEYS) {
    const next = new Map<string, Node>();
    const coreLevel = Number(core[key] ?? 0);
    const values = candidateLevels(core, key, protectedKeys, selected);
    for (const [stateKey, node] of states.entries()) {
      const [spentRaw, distanceRaw] = stateKey.split('|').map(Number);
      for (const level of values) {
        const spent = spentRaw + trainingTotalCost(level);
        if (spent > budget) continue;
        const distance = distanceRaw + Math.abs(level - coreLevel);
        if (distance > maxDistance) continue;
        const plan = { ...node.plan, [key]: level };
        const score = node.score + candidateObjective(key, level, coreLevel, selected, intent);
        const keyState = `${spent}|${distance}`;
        const previous = next.get(keyState);
        if (!previous || score > previous.score + 1e-9 || (Math.abs(score - previous.score) < 1e-9 && signature(plan) < signature(previous.plan))) {
          next.set(keyState, { score, plan });
        }
      }
    }
    states = next;
  }

  const output: TrainingPlan[] = [];
  for (let distance = 1; distance <= maxDistance; distance += 1) {
    const node = states.get(`${budget}|${distance}`);
    if (node) output.push(clone(node.plan));
  }
  return { candidates: output, intent };
}

export function applyPerformanceEngine2027R109(input: AnalysisResult): AnalysisResult {
  const result = input as Enriched;
  const identity = result.canonicalCardIdentity2027R60;
  const extreme = result.performanceEngine2027R108;
  if (!identity || !extreme) return input;

  const core = clone(extreme.winner.training);
  const selected = identity.attackPosition;
  const natural = identity.naturalPosition;
  const budget = Number(input.trainingPointsTotal ?? trainingPlanTotalCost(core));
  const beforeUtility = positionUtility(core, selected);
  const samePosition = selected === natural;
  const goalkeeperFamilyMismatch = (selected === 'GK') !== (natural === 'GK');

  let winner = clone(core);
  let afterUtility = beforeUtility;
  let preservation = 100;
  let scoreAfter = extreme.winner.totalScore;
  let drop = 0;
  let alignment = 100;
  let adaptationApplied = false;

  if (!samePosition && !goalkeeperFamilyMismatch) {
    const generated = buildCandidates(result, identity, core);
    const ranked = generated.candidates
      .map((candidate) => {
        const exact = trainingPlanTotalCost(candidate) === budget;
        const preserve = corePreservation(core, candidate);
        const selectedUtility = positionUtility(candidate, selected);
        const positionGain = selectedUtility - beforeUtility;
        const extremeCandidate = scorePerformancePlan2027R108(input, identity, candidate, 'EXTREME_DNA');
        const extremeDrop = extreme.winner.totalScore - extremeCandidate.totalScore;
        const direction = alignmentScore(core, candidate, generated.intent);
        const composite = extremeCandidate.totalScore * .66 + selectedUtility * .23 + preserve * .08 + direction * .03;
        return { candidate, exact, preserve, selectedUtility, positionGain, extremeCandidate, extremeDrop, direction, composite };
      })
      .filter((item) =>
        item.exact &&
        item.preserve >= 72 &&
        item.positionGain >= .15 &&
        item.extremeDrop <= 4.5 &&
        item.extremeCandidate.responseScore >= Math.max(70, extreme.winner.responseScore - 2) &&
        item.extremeCandidate.synergyScore >= Math.max(70, extreme.winner.synergyScore - 2) &&
        levelDistance(core, item.candidate) > 0
      )
      .sort((left, right) =>
        right.composite - left.composite ||
        right.positionGain - left.positionGain ||
        right.preserve - left.preserve ||
        signature(left.candidate).localeCompare(signature(right.candidate))
      );

    const best = ranked[0];
    if (best) {
      winner = clone(best.candidate);
      afterUtility = best.selectedUtility;
      preservation = best.preserve;
      scoreAfter = best.extremeCandidate.totalScore;
      drop = round1(Math.max(0, best.extremeDrop));
      alignment = best.direction;
      adaptationApplied = signature(winner) !== signature(core);
    }
  }

  const exactBudget = trainingPlanTotalCost(winner) === budget;
  const positionGain = round1(afterUtility - beforeUtility);
  const analysis: PerformanceEngine2027R109 = {
    version: PERFORMANCE_ENGINE_2027_R109_VERSION,
    authority: 'SPECIALIST_READ_ONLY',
    model: 'EXTREME_CORE_PLUS_POSITION_EXECUTION',
    naturalPosition: natural,
    selectedPosition: selected,
    coreTraining: core,
    appliedTraining: winner,
    adaptationApplied,
    exactBudget,
    corePreservation: preservation,
    positionUtilityBefore: beforeUtility,
    positionUtilityAfter: afterUtility,
    positionGain,
    extremeScoreBefore: extreme.winner.totalScore,
    extremeScoreAfter: scoreAfter,
    extremeScoreDrop: drop,
    directionAlignment: alignment,
    guards: {
      overallIgnored: true,
      formationIndependent: true,
      coreNeverRewritten: true,
      exactBudget,
      minimumCorePreservation: preservation >= 72,
      selectedPositionImproved: !adaptationApplied || positionGain >= .15,
      extremeLossControlled: drop <= 4.5
    }
  };

  return {
    ...input,
    performanceEngine2027R109: analysis,
    recommendationExplanation: [
      adaptationApplied
        ? `Extreme Position r109: núcleo r108 preservado ${preservation}% e execução ${natural} → ${selected} melhorou +${positionGain} sem perseguir overall.`
        : `Extreme Position r109: ${samePosition ? 'posição natural mantida' : 'nenhuma troca segura superou o núcleo'}; ficha r108 preservada sem perseguir overall.`,
      adaptationApplied
        ? `Impacto extremo preservado: ${scoreAfter}/100 (queda controlada ${drop}); alinhamento posicional ${alignment}/100.`
        : `Núcleo Extreme permanece ${extreme.winner.totalScore}/100.`,
      ...input.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 112)
  } as AnalysisResult & { performanceEngine2027R109: PerformanceEngine2027R109 };
}
