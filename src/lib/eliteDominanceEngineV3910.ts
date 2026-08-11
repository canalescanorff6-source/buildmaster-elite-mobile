import type {
  AnalysisResult,
  EliteDominanceCandidateV3910,
  EliteDominanceV3910Analysis,
  ImpetoRecommendation,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision,
  UniversalPositionPerformanceV3910
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { fitTrainingToExactBudget } from '../modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  emptyTraining,
  normalizeTrainingPlan,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import {
  evaluateTrainingPlanWithMaxMatchV3860,
  maxMatchImpetoCombinationsForTrainingV3860
} from './maxMatchPerformanceEngineV3860';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import {
  filterComplementaryAdditionalSkills,
  skillIdentityKey
} from './officialSkillIdentity';

export const ELITE_DOMINANCE_V3910_VERSION = '39.10.0' as const;

const LINE_KEYS: TrainingKey[] = [
  'shooting',
  'passing',
  'dribbling',
  'dexterity',
  'lowerBodyStrength',
  'aerialStrength',
  'defending'
];

const GK_KEYS: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

const POSITION_GROUP_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 1.35, dexterity: 1.05, lowerBodyStrength: .82, dribbling: .46, aerialStrength: .5, passing: .22 },
  SS: { dribbling: 1.05, dexterity: 1.05, shooting: .92, passing: .78, lowerBodyStrength: .5, aerialStrength: .14 },
  LWF: { dribbling: 1.18, dexterity: 1.1, lowerBodyStrength: .78, shooting: .76, passing: .48 },
  RWF: { dribbling: 1.18, dexterity: 1.1, lowerBodyStrength: .78, shooting: .76, passing: .48 },
  LMF: { passing: .98, lowerBodyStrength: .9, dexterity: .78, dribbling: .66, defending: .55, shooting: .2 },
  RMF: { passing: .98, lowerBodyStrength: .9, dexterity: .78, dribbling: .66, defending: .55, shooting: .2 },
  AMF: { passing: 1.2, dribbling: 1.0, dexterity: .9, shooting: .55, lowerBodyStrength: .34 },
  CMF: { passing: 1.08, lowerBodyStrength: .84, dexterity: .7, defending: .68, dribbling: .58, shooting: .24 },
  DMF: { defending: 1.25, passing: .86, lowerBodyStrength: .82, aerialStrength: .48, dexterity: .45, dribbling: .3 },
  CB: { defending: 1.38, aerialStrength: .96, lowerBodyStrength: .8, dexterity: .48, passing: .34 },
  LB: { defending: 1.02, lowerBodyStrength: .95, dexterity: .78, passing: .68, dribbling: .44, aerialStrength: .24 },
  RB: { defending: 1.02, lowerBodyStrength: .95, dexterity: .78, passing: .68, dribbling: .44, aerialStrength: .24 },
  GK: { gk2: 1.25, gk3: 1.18, gk1: 1.05, aerialStrength: .3, lowerBodyStrength: .18 }
};

type CandidateSeed = {
  id: string;
  title: string;
  source: string;
  training: TrainingPlan;
};

type AggregatedSkill = {
  decision: UnifiedSkillDecision;
  weightedScore: number;
  supportWeight: number;
  totalWeight: number;
  positions: Set<PositionCode>;
  reasons: Set<string>;
};

type AggregatedImpeto = {
  item: ImpetoRecommendation;
  weightedScore: number;
  totalWeight: number;
  weakestGain: number;
  positions: Set<PositionCode>;
  evidence: Set<string>;
};

function clamp(value: number, min = 0, max = 98): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.round(Math.max(min, Math.min(max, safe)) * 10) / 10;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function weightedAverage(entries: Array<{ value: number; weight: number }>): number {
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  return total ? entries.reduce((sum, item) => sum + item.value * item.weight, 0) / total : 0;
}

function standardDeviation(values: number[]): number {
  if (!values.length) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function trainingSignature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function allowedKeys(result: AnalysisResult): TrainingKey[] {
  return result.parsed.mainPosition === 'GK' ? GK_KEYS : LINE_KEYS;
}

function attributeAverage(result: AnalysisResult, keys: Array<keyof AnalysisResult['parsed']['attributes']>): number {
  return average(keys.map((key) => Number(result.parsed.attributes[key] ?? 0)));
}

/**
 * Prioridade construída apenas a partir da versão da carta. A posição que o
 * usuário selecionou para a escalação nunca entra neste cálculo.
 */
function universalTrainingPriority(result: AnalysisResult): TrainingKey[] {
  if (result.parsed.mainPosition === 'GK') return [...GK_KEYS];
  const style = normalize(result.parsed.playstyle);
  const scores: Record<TrainingKey, number> = {
    shooting: attributeAverage(result, ['finishing', 'offensiveAwareness', 'kickingPower', 'curl']),
    passing: attributeAverage(result, ['lowPass', 'loftedPass', 'ballControl', 'curl']),
    dribbling: attributeAverage(result, ['ballControl', 'dribbling', 'tightPossession', 'balance']),
    dexterity: attributeAverage(result, ['offensiveAwareness', 'acceleration', 'balance']),
    lowerBodyStrength: attributeAverage(result, ['speed', 'stamina', 'physicalContact', 'balance']),
    aerialStrength: attributeAverage(result, ['heading', 'jump', 'physicalContact']),
    defending: attributeAverage(result, ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression']),
    gk1: 0,
    gk2: 0,
    gk3: 0
  };
  const boost = (key: TrainingKey, amount: number) => { scores[key] += amount; };
  if (/armador|orquestrador|classico|criativo/.test(style)) { boost('passing', 13); boost('dribbling', 5); }
  if (/infiltra|artilheiro|homem de area/.test(style)) { boost('shooting', 11); boost('dexterity', 9); }
  if (/meia versatil/.test(style)) { boost('lowerBodyStrength', 10); boost('passing', 7); boost('defending', 5); }
  if (/primeiro volante|destruidor|defensor criativo|lateral defensivo/.test(style)) { boost('defending', 14); boost('lowerBodyStrength', 7); }
  if (/pivo|puxa marcacao|atacante pivo/.test(style)) { boost('aerialStrength', 9); boost('lowerBodyStrength', 8); boost('passing', 4); }
  if (/lateral movel|ala produtivo|perito em cruzamento/.test(style)) { boost('lowerBodyStrength', 8); boost('passing', 7); boost('dribbling', 5); }
  return [...LINE_KEYS].sort((left, right) => scores[right] - scores[left] || left.localeCompare(right));
}

function positionFamiliarity(result: AnalysisResult, position: PositionCode): number {
  if (position === result.parsed.mainPosition) return 100;
  const rating = Number(result.parsed.positionRatings[position] ?? 0);
  if (rating > 0) return clamp(rating, 50, 99);
  if (result.parsed.positions.includes(position)) return 84;
  return 60;
}

function compatiblePositions(result: AnalysisResult): Array<{ position: PositionCode; familiarity: number; weight: number }> {
  const all = [result.parsed.mainPosition, ...result.parsed.positions]
    .filter((position, index, values) => values.indexOf(position) === index)
    .filter((position) => result.parsed.mainPosition === 'GK' ? position === 'GK' : position !== 'GK');
  const sorted = all
    .map((position) => ({ position, familiarity: positionFamiliarity(result, position) }))
    .sort((left, right) => {
      if (left.position === result.parsed.mainPosition) return -1;
      if (right.position === result.parsed.mainPosition) return 1;
      return right.familiarity - left.familiarity || left.position.localeCompare(right.position);
    })
    .slice(0, 7);
  return sorted.map((item) => ({
    ...item,
    weight: item.position === result.parsed.mainPosition
      ? 1.42
      : item.familiarity >= 95
        ? 1.22
        : item.familiarity >= 85
          ? 1
          : item.familiarity >= 75
            ? .82
            : .64
  }));
}

function canonicalEngineResult(result: AnalysisResult): AnalysisResult {
  const canonicalTraining = result.canonicalCardV3890?.training ?? result.cardFirstV3880?.winner.training ?? result.training;
  const canonicalSkills = result.canonicalCardV3890?.skills ?? result.cardFirstV3880?.skillPlan.map((item) => item.name) ?? result.recommendedSkills;
  const canonicalImpetos = result.canonicalCardV3890?.impetos ?? result.cardFirstV3880?.impetoPlan ?? result.recommendedImpetos;
  return {
    ...result,
    objective: 'COMPETITIVE',
    bestPosition: {
      code: result.parsed.mainPosition,
      label: POSITION_PT[result.parsed.mainPosition],
      score: 100
    },
    tacticalProfile: {
      formation: 'AUTO',
      style: 'AUTO',
      gameplayMode: 'UNIVERSAL',
      connectionProfile: 'VARIABLE',
      controlProfile: 'AUTO',
      managerId: null,
      managerName: null,
      managerProficiency: null,
      managerBooster: null
    },
    training: { ...canonicalTraining },
    recommendedSkills: [...canonicalSkills],
    recommendedImpetos: canonicalImpetos.map((item) => ({ ...item })),
    buildVariants: [],
    cardDna: undefined,
    gameplayDna: undefined,
    advancedMotorV3750: undefined,
    powerBuildV3850: undefined,
    maxMatchV3860: undefined,
    supremeV3870: undefined,
    globalProV3900: result.globalProV3900,
    eliteDominanceV3910: undefined
  };
}

function resultForPosition(base: AnalysisResult, position: PositionCode): AnalysisResult {
  return {
    ...base,
    bestPosition: { code: position, label: POSITION_PT[position], score: 100 },
    tacticalProfile: {
      ...base.tacticalProfile,
      formation: 'AUTO',
      style: 'AUTO',
      gameplayMode: 'UNIVERSAL',
      connectionProfile: 'VARIABLE',
      controlProfile: 'AUTO'
    }
  };
}

function exactPlan(result: AnalysisResult, plan: TrainingPlan, priority: TrainingKey[]): TrainingPlan {
  const clean = normalizeTrainingPlan(plan);
  const allowed = new Set(allowedKeys(result));
  for (const key of TRAINING_KEYS) if (!allowed.has(key)) clean[key] = 0;
  return fitTrainingToExactBudget(clean, priority, result.trainingPointsTotal, result.parsed.mainPosition);
}

function seedFromPriority(result: AnalysisResult, priority: TrainingKey[], profile: 'balanced' | 'identity' | 'robust'): TrainingPlan {
  const plan = emptyTraining();
  const levels = profile === 'identity'
    ? [11, 10, 8, 6, 4, 2, 0]
    : profile === 'robust'
      ? [10, 9, 8, 7, 5, 3, 1]
      : [10, 9, 8, 6, 5, 3, 1];
  priority.forEach((key, index) => { plan[key] = levels[index] ?? 0; });
  return exactPlan(result, plan, priority);
}

function collectSeeds(result: AnalysisResult, priority: TrainingKey[]): CandidateSeed[] {
  const seeds: CandidateSeed[] = [];
  const unique = new Set<string>();
  const add = (id: string, title: string, source: string, plan?: TrainingPlan | null) => {
    if (!plan) return;
    const training = exactPlan(result, plan, priority);
    if (trainingPlanTotalCost(training) !== result.trainingPointsTotal) return;
    const signature = trainingSignature(training);
    if (unique.has(signature)) return;
    unique.add(signature);
    seeds.push({ id, title, source, training });
  };

  add('canonical-v3890', 'Receita canônica v38.90', 'identidade canônica da carta', result.canonicalCardV3890?.training);
  add('card-first-winner', 'Vencedora da IA por Carta', 'IA por Carta v38.80', result.cardFirstV3880?.winner.training);
  result.cardFirstV3880?.finalists.slice(0, 5).forEach((item, index) => add(`card-first-${index}`, item.title, 'finalistas canônicas v38.80', item.training));
  add('dna-identity', 'DNA individual concentrado', 'síntese determinística v39.10', seedFromPriority(result, priority, 'identity'));
  add('universal-balanced', 'Envelope universal equilibrado', 'síntese determinística v39.10', seedFromPriority(result, priority, 'balanced'));
  add('universal-robust', 'Envelope universal robusto', 'síntese determinística v39.10', seedFromPriority(result, priority, 'robust'));

  const baseSeeds = [...seeds].slice(0, 8);
  const keys = allowedKeys(result);
  const receivers = priority.slice(0, Math.min(5, priority.length));
  for (const [seedIndex, seed] of baseSeeds.entries()) {
    for (const donor of keys) {
      if (seed.training[donor] <= 0) continue;
      for (const receiver of receivers) {
        if (donor === receiver) continue;
        for (const delta of [1, 2]) {
          const mutated = { ...seed.training };
          mutated[donor] = Math.max(0, mutated[donor] - delta);
          mutated[receiver] = Math.min(16, mutated[receiver] + delta);
          add(
            `local-${seedIndex}-${donor}-${receiver}-${delta}`,
            `Redistribuição universal ${donor} → ${receiver}`,
            'busca local determinística v39.10',
            mutated
          );
        }
      }
    }
  }
  return seeds;
}

function quickPositionScore(plan: TrainingPlan, position: PositionCode): number {
  const weights = POSITION_GROUP_WEIGHTS[position];
  let score = 0;
  let total = 0;
  for (const [rawKey, rawWeight] of Object.entries(weights)) {
    const key = rawKey as TrainingKey;
    const weight = Number(rawWeight ?? 0);
    const target = weight >= 1.2 ? 11 : weight >= .9 ? 10 : weight >= .65 ? 8 : weight >= .4 ? 6 : 4;
    const level = Number(plan[key] ?? 0);
    const coverage = Math.min(1, level / Math.max(1, target));
    const overspend = Math.max(0, level - target - 2) * 1.4;
    score += Math.max(20, coverage * 100 - overspend) * weight;
    total += weight;
  }
  return total ? clamp(score / total) : 50;
}

function identityFit(plan: TrainingPlan, canonical: TrainingPlan, priority: TrainingKey[]): number {
  let distance = 0;
  let maxDistance = 0;
  priority.forEach((key, index) => {
    const weight = Math.max(.45, 1.35 - index * .12);
    distance += Math.abs(Number(plan[key] ?? 0) - Number(canonical[key] ?? 0)) * weight;
    maxDistance += 16 * weight;
  });
  return clamp(100 - (distance / Math.max(1, maxDistance)) * 100, 0, 100);
}

function quickCandidateScore(
  result: AnalysisResult,
  seed: CandidateSeed,
  positions: Array<{ position: PositionCode; familiarity: number; weight: number }>,
  canonical: TrainingPlan,
  priority: TrainingKey[]
): number {
  const scores = positions.map((item) => ({ value: quickPositionScore(seed.training, item.position), weight: item.weight }));
  const avg = weightedAverage(scores);
  const worst = Math.min(...scores.map((item) => item.value));
  const natural = quickPositionScore(seed.training, result.parsed.mainPosition);
  const identity = identityFit(seed.training, canonical, priority);
  return clamp(avg * .42 + worst * .24 + natural * .18 + identity * .16);
}

function verdict(score: number): UniversalPositionPerformanceV3910['verdict'] {
  if (score >= 88) return 'elite';
  if (score >= 78) return 'forte';
  if (score >= 66) return 'situacional';
  return 'inadequada';
}

function evaluateAcrossPositions(
  base: AnalysisResult,
  training: TrainingPlan,
  positions: Array<{ position: PositionCode; familiarity: number; weight: number }>
): UniversalPositionPerformanceV3910[] | null {
  const output: UniversalPositionPerformanceV3910[] = [];
  for (const item of positions) {
    const positioned = resultForPosition(base, item.position);
    const candidate = evaluateTrainingPlanWithMaxMatchV3860(positioned, training, {
      id: `v3910-${item.position}`,
      title: `Avaliação universal ${POSITION_PT[item.position]}`,
      source: 'Motor Dominante Universal v39.10'
    });
    if (!candidate) return null;
    output.push({
      position: item.position,
      label: POSITION_PT[item.position],
      familiarity: item.familiarity,
      weight: item.weight,
      performanceScore: candidate.performanceScore,
      worstScenario: candidate.worstScenario,
      consistency: candidate.consistency,
      pointEfficiency: candidate.dimensions.pointEfficiency,
      tightSpaceControl: candidate.tightSpaceControl,
      transitionImpact: candidate.transitionImpact,
      duelReliability: candidate.duelReliability,
      verdict: verdict(candidate.performanceScore)
    });
  }
  return output;
}

function candidateFromEvaluation(
  result: AnalysisResult,
  seed: CandidateSeed,
  positionScores: UniversalPositionPerformanceV3910[],
  canonical: TrainingPlan,
  priority: TrainingKey[]
): EliteDominanceCandidateV3910 {
  const weightedPerformance = weightedAverage(positionScores.map((item) => ({ value: item.performanceScore, weight: item.weight })));
  const worstPosition = Math.min(...positionScores.map((item) => item.performanceScore));
  const natural = positionScores.find((item) => item.position === result.parsed.mainPosition)?.performanceScore ?? weightedPerformance;
  const scenarioFloor = Math.min(...positionScores.map((item) => item.worstScenario));
  const consistency = clamp(100 - standardDeviation(positionScores.map((item) => item.performanceScore)) * 3.2, 0, 100);
  const efficiency = weightedAverage(positionScores.map((item) => ({ value: item.pointEfficiency, weight: item.weight })));
  const identity = identityFit(seed.training, canonical, priority);
  const universalScore = clamp(
    weightedPerformance * .32
    + worstPosition * .2
    + scenarioFloor * .16
    + natural * .12
    + consistency * .09
    + efficiency * .06
    + identity * .05
  );
  const weak = [...positionScores].sort((left, right) => left.performanceScore - right.performanceScore)[0];
  const strong = [...positionScores].sort((left, right) => right.performanceScore - left.performanceScore)[0];
  return {
    id: seed.id,
    title: seed.title,
    source: seed.source,
    training: { ...seed.training },
    exactBudget: trainingPlanTotalCost(seed.training) === result.trainingPointsTotal,
    universalScore,
    averagePositionScore: clamp(weightedPerformance),
    worstPositionScore: clamp(worstPosition),
    naturalPositionScore: clamp(natural),
    scenarioFloor: clamp(scenarioFloor),
    crossPositionConsistency: consistency,
    pointEfficiency: clamp(efficiency),
    identityFit: identity,
    proChallengeScore: null,
    proMargin: null,
    positionScores,
    reasons: [
      `Média ponderada de ${positionScores.length} posição(ões) próprias da carta: ${Math.round(weightedPerformance)}.`,
      `Pior posição protegida em ${Math.round(worstPosition)} e pior cenário em ${Math.round(scenarioFloor)}.`,
      `Aderência ao DNA canônico: ${Math.round(identity)}; eficiência dos pontos: ${Math.round(efficiency)}.`,
      `Melhor encaixe universal no modelo: ${strong.label}; maior risco residual: ${weak.label}.`
    ],
    tradeOffs: weak.performanceScore < 70
      ? [`A posição ${weak.label} continua situacional; a receita não sacrifica o DNA inteiro para corrigir uma adaptação fraca.`]
      : ['A receita prioriza repetibilidade entre posições e pode abrir mão de um pico isolado em apenas uma função.']
  };
}

function uniqueProTrainings(result: AnalysisResult): TrainingPlan[] {
  const references = result.globalProV3900?.references ?? [];
  const seen = new Set<string>();
  const output: TrainingPlan[] = [];
  for (const reference of references) {
    if (!reference.exactCard || reference.evidenceLevel !== 'FICHA_COMPLETA') continue;
    if (reference.trainingPointsTotal !== null && reference.trainingPointsTotal !== result.trainingPointsTotal) continue;
    if (trainingPlanTotalCost(reference.training) !== result.trainingPointsTotal) continue;
    const signature = trainingSignature(reference.training);
    if (seen.has(signature)) continue;
    seen.add(signature);
    output.push({ ...reference.training });
    if (output.length >= 10) break;
  }
  return output;
}

function evaluateProChallenge(
  base: AnalysisResult,
  positions: Array<{ position: PositionCode; familiarity: number; weight: number }>,
  plans: TrainingPlan[]
): Array<{ training: TrainingPlan; score: number; worst: number }> {
  return plans.flatMap((training) => {
    const scores = evaluateAcrossPositions(base, training, positions);
    if (!scores) return [];
    return [{
      training,
      score: clamp(weightedAverage(scores.map((item) => ({ value: item.performanceScore, weight: item.weight }))) * .72 + Math.min(...scores.map((item) => item.performanceScore)) * .28),
      worst: Math.min(...scores.map((item) => item.performanceScore))
    }];
  }).sort((left, right) => right.score - left.score || right.worst - left.worst);
}

function buildUniversalSkillPlan(
  result: AnalysisResult,
  base: AnalysisResult,
  training: TrainingPlan,
  positions: Array<{ position: PositionCode; familiarity: number; weight: number }>
): UnifiedSkillDecision[] {
  const aggregated = new Map<string, AggregatedSkill>();
  const totalPositionWeight = positions.reduce((sum, item) => sum + item.weight, 0);
  for (const position of positions) {
    const positioned = resultForPosition(base, position.position);
    const decisions = buildPersonalizedSkillPlan(positioned, training);
    for (const decision of decisions) {
      const key = skillIdentityKey(decision.name);
      const current = aggregated.get(key) ?? {
        decision: { ...decision, supportedBy: [], reasons: [] },
        weightedScore: 0,
        supportWeight: 0,
        totalWeight: totalPositionWeight,
        positions: new Set<PositionCode>(),
        reasons: new Set<string>()
      };
      current.weightedScore += decision.score * position.weight;
      current.supportWeight += position.weight;
      current.positions.add(position.position);
      decision.reasons.forEach((reason) => current.reasons.add(reason));
      if (decision.score > current.decision.score) current.decision = { ...decision };
      aggregated.set(key, current);
    }
  }

  for (const decision of result.cardFirstV3880?.skillPlan ?? []) {
    const key = skillIdentityKey(decision.name);
    const current = aggregated.get(key) ?? {
      decision: { ...decision },
      weightedScore: 0,
      supportWeight: 0,
      totalWeight: totalPositionWeight,
      positions: new Set<PositionCode>(),
      reasons: new Set<string>()
    };
    current.weightedScore += decision.score * .75;
    current.supportWeight += .75;
    decision.reasons.forEach((reason) => current.reasons.add(reason));
    aggregated.set(key, current);
  }

  const ranked = [...aggregated.values()].map((entry) => {
    const coverage = entry.supportWeight / Math.max(.1, entry.totalWeight);
    const score = clamp(entry.weightedScore / Math.max(.1, entry.supportWeight) * .82 + coverage * 18 + entry.decision.identityBoost * .08, 0, 100);
    return {
      ...entry.decision,
      score,
      priority: score >= 88 ? 'essencial' as const : score >= 78 ? 'alta' as const : 'complementar' as const,
      supportedBy: [...entry.positions].map((position) => POSITION_PT[position]),
      reasons: [
        `Cobertura universal em ${entry.positions.size}/${positions.length} posição(ões) próprias da carta.`,
        ...[...entry.reasons]
      ].slice(0, 4)
    };
  }).sort((left, right) => right.score - left.score || right.identityBoost - left.identityBoost || left.name.localeCompare(right.name, 'pt-BR'));

  const selected: UnifiedSkillDecision[] = [];
  const categories = new Map<UnifiedSkillDecision['category'], number>();
  for (const decision of ranked) {
    if (selected.length >= 5) break;
    const categoryCount = categories.get(decision.category) ?? 0;
    if (categoryCount >= 2 && ranked.some((item) => !selected.includes(item) && (categories.get(item.category) ?? 0) < 2)) continue;
    selected.push(decision);
    categories.set(decision.category, categoryCount + 1);
  }
  // A diversidade é preferência, não motivo para devolver quatro opções quando
  // ainda existem habilidades oficiais seguras. O segundo passe é estável.
  for (const decision of ranked) {
    if (selected.length >= 5) break;
    if (selected.some((item) => skillIdentityKey(item.name) === skillIdentityKey(decision.name))) continue;
    selected.push(decision);
  }
  const filteredNames = filterComplementaryAdditionalSkills(
    selected.map((item) => item.name),
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5,
    result.parsed.additionalSkills ?? []
  );
  return filteredNames.map((name, index) => {
    const decision = selected.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name)) ?? ranked.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name));
    return decision ?? {
      name,
      score: Math.max(60, 82 - index * 4),
      priority: index === 0 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
      category: 'mental',
      gameplayImpact: 'Complemento oficial preservado pela auditoria universal.',
      reasons: ['Mantida pelo filtro oficial e sem duplicar habilidades da carta.'],
      supportedBy: [POSITION_PT[result.parsed.mainPosition]],
      identityBoost: 0
    };
  });
}

function buildUniversalImpetos(
  base: AnalysisResult,
  training: TrainingPlan,
  positions: Array<{ position: PositionCode; familiarity: number; weight: number }>
): ImpetoRecommendation[] {
  const aggregated = new Map<string, AggregatedImpeto>();
  for (const position of positions) {
    const positioned = resultForPosition(base, position.position);
    const combinations = maxMatchImpetoCombinationsForTrainingV3860(positioned, training);
    for (const combination of combinations) {
      const key = normalize(combination.impeto.name);
      const current = aggregated.get(key) ?? {
        item: { ...combination.impeto },
        weightedScore: 0,
        totalWeight: 0,
        weakestGain: 0,
        positions: new Set<PositionCode>(),
        evidence: new Set<string>()
      };
      current.weightedScore += combination.score * position.weight;
      current.totalWeight += position.weight;
      current.weakestGain += combination.weakestScenarioGain * position.weight;
      current.positions.add(position.position);
      current.evidence.add(combination.reason);
      aggregated.set(key, current);
    }
  }
  return [...aggregated.values()]
    .map((entry) => {
      const score = clamp(entry.weightedScore / Math.max(.1, entry.totalWeight));
      const gain = clamp(entry.weakestGain / Math.max(.1, entry.totalWeight), 0, 100);
      return {
        ...entry.item,
        score,
        confidence: clamp(62 + entry.positions.size / Math.max(1, positions.length) * 30 + gain * .08, 0, 98),
        tier: 'alternativo' as const,
        reason: `Avaliado após a ficha final em ${entry.positions.size}/${positions.length} posição(ões); ganho médio no elo fraco ${Math.round(gain)}.`,
        evidence: [...entry.evidence].slice(0, 3),
        official: entry.item.official ?? true
      };
    })
    .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0) || left.name.localeCompare(right.name, 'pt-BR'))
    .map((item, index) => ({ ...item, tier: index === 0 ? 'ideal' as const : index < 5 ? 'alternativo' as const : 'evitar' as const }));
}

function proStatus(margin: number | null, references: number): Pick<EliteDominanceV3910Analysis, 'proChallengeStatus' | 'proChallengeLabel'> {
  if (!references || margin === null) return {
    proChallengeStatus: 'sem_evidencia',
    proChallengeLabel: 'Sem ficha profissional exata suficiente para declarar comparação.'
  };
  if (margin >= 1.5) return {
    proChallengeStatus: 'supera_no_modelo',
    proChallengeLabel: `A receita ficou ${margin.toFixed(1)} ponto(s) acima da melhor ficha profissional no modelo interno.`
  };
  if (margin >= -1.5) return {
    proChallengeStatus: 'empata_no_modelo',
    proChallengeLabel: 'A receita ficou tecnicamente empatada com a melhor ficha profissional no modelo interno.'
  };
  return {
    proChallengeStatus: 'abaixo_no_modelo',
    proChallengeLabel: `A melhor ficha profissional ficou ${Math.abs(margin).toFixed(1)} ponto(s) acima no modelo interno; a receita própria foi mantida por identidade e estabilidade.`
  };
}

export function buildEliteDominanceV3910(result: AnalysisResult): EliteDominanceV3910Analysis {
  const base = canonicalEngineResult(result);
  const positions = compatiblePositions(result);
  const priority = universalTrainingPriority(result);
  const canonicalTraining = exactPlan(base, result.canonicalCardV3890?.training ?? result.cardFirstV3880?.winner.training ?? base.training, priority);
  const seeds = collectSeeds(base, priority);
  const quick = seeds
    .map((seed) => ({ seed, score: quickCandidateScore(base, seed, positions, canonicalTraining, priority) }))
    .sort((left, right) => right.score - left.score || left.seed.id.localeCompare(right.seed.id))
    .slice(0, 32);

  const evaluated: EliteDominanceCandidateV3910[] = [];
  for (const item of quick) {
    const scores = evaluateAcrossPositions(base, item.seed.training, positions);
    if (!scores) continue;
    evaluated.push(candidateFromEvaluation(base, item.seed, scores, canonicalTraining, priority));
  }
  evaluated.sort((left, right) =>
    right.universalScore - left.universalScore
    || right.worstPositionScore - left.worstPositionScore
    || right.scenarioFloor - left.scenarioFloor
    || right.identityFit - left.identityFit
    || left.id.localeCompare(right.id)
  );
  const rawWinner = evaluated[0] ?? candidateFromEvaluation(base, {
    id: 'canonical-fallback',
    title: 'Receita canônica de segurança',
    source: 'fallback determinístico',
    training: canonicalTraining
  }, evaluateAcrossPositions(base, canonicalTraining, positions) ?? [], canonicalTraining, priority);

  const proPlans = uniqueProTrainings(result);
  const proEvaluations = evaluateProChallenge(base, positions, proPlans);
  const proBestScore = proEvaluations[0]?.score ?? null;
  const margin = proBestScore === null ? null : clamp(rawWinner.universalScore - proBestScore, -100, 100);
  const status = proStatus(margin, proPlans.length);
  const finalists = evaluated.slice(0, 5).map((candidate) => ({
    ...candidate,
    proChallengeScore: proBestScore,
    proMargin: proBestScore === null ? null : clamp(candidate.universalScore - proBestScore, -100, 100)
  }));
  const winner = finalists[0] ?? { ...rawWinner, proChallengeScore: proBestScore, proMargin: margin };
  const skills = buildUniversalSkillPlan(result, base, winner.training, positions);
  const impetos = buildUniversalImpetos(base, winner.training, positions);
  const primaryImpeto = impetos[0]?.name ?? null;
  const canonicalId = result.canonicalCardV3890?.canonicalCardId ?? result.structuralPrecision?.canonical.canonicalId ?? result.parsed.internalId;
  const resultSignature = `dominant-v3910-${stableHash([
    canonicalId,
    trainingSignature(winner.training),
    skills.map((item) => skillIdentityKey(item.name)).join(','),
    normalize(primaryImpeto),
    positions.map((item) => `${item.position}:${Math.round(item.familiarity)}`).join('|')
  ].join('::'))}`;
  const cardConfidence = Number(result.structuralPrecision?.canonical.confidence ?? result.parsed.confidence ?? 0);
  const scoreGap = finalists.length > 1 ? winner.universalScore - finalists[1].universalScore : 4;
  const confidence = Math.round(clamp(
    cardConfidence * .45
    + winner.crossPositionConsistency * .2
    + winner.identityFit * .15
    + Math.min(100, 72 + scoreGap * 5) * .1
    + (winner.exactBudget ? 100 : 0) * .1,
    0,
    98
  ));
  const decision = winner.exactBudget && skills.length > 0 && winner.scenarioFloor >= 52 && cardConfidence >= 62 ? 'aprovada' : 'revisar';
  const summary = `${result.parsed.playerName}: receita universal ${resultSignature}, criada pela identidade da carta e testada em ${positions.length} posição(ões) próprias. ${status.proChallengeLabel}`;

  return {
    engineVersion: ELITE_DOMINANCE_V3910_VERSION,
    philosophy: 'UMA_CARTA_UMA_RECEITA_UNIVERSAL_DOMINANTE_SEM_OVERALL',
    canonicalCardId: canonicalId,
    resultSignature,
    selectedPositionAffectsOutput: false,
    selectedPositionLabel: result.bestPosition.label,
    compatiblePositions: winner.positionScores,
    candidatesGenerated: seeds.length,
    candidatesEvaluated: evaluated.length,
    fullFinalistsEvaluated: quick.length,
    winner,
    finalists,
    skills,
    impetos,
    primaryImpeto,
    proReferencesChallenged: proPlans.length,
    proBestScore,
    proMargin: margin,
    ...status,
    deterministicChecks: [
      'A posição selecionada para usar em campo não entra na assinatura nem na escolha da receita.',
      'A mesma versão da carta gera a mesma ficha, habilidades e Ímpeto dentro da mesma versão do motor.',
      'A receita é testada em todas as posições próprias lidas na carta, e não refeita para cada seleção.',
      'Fichas profissionais são adversários de benchmark; a base online não muda silenciosamente a receita.',
      'Não existe sorteio, relógio, nome do arquivo, formação, técnico ou conexão na decisão final.',
      'Overall/GER não participa de nenhuma nota da v39.10.'
    ],
    guardrails: [
      'Somente a versão exata, atributos, estilo, posições próprias, habilidades e orçamento da carta definem a receita.',
      'Uma adaptação fraca não pode destruir o DNA inteiro para aumentar uma nota genérica de posição.',
      'O orçamento exato é obrigatório para toda candidata finalista.',
      'As cinco habilidades são escolhidas em conjunto pela cobertura das posições próprias e nunca repetem habilidades já possuídas.',
      'O Ímpeto é calculado depois da ficha e das habilidades, medindo o elo fraco em todas as posições próprias.',
      '“Supera pro player” significa somente vantagem no modelo interno com ficha exata e verificável; não é promessa de resultado universal.',
      'A validação em partidas continua necessária porque conexão, atualização da Konami e execução do usuário alteram o resultado real.'
    ],
    confidence,
    decision,
    summary
  };
}

export function applyEliteDominanceV3910(result: AnalysisResult): AnalysisResult {
  const analysis = buildEliteDominanceV3910(result);
  const training = analysis.winner.training;
  const skills = analysis.skills.map((item) => item.name);
  const impetos = analysis.impetos;
  const pointsUsed = trainingPlanTotalCost(training);
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.10 — Motor Dominante Universal v39.10 — ${result.parsed.playerName}`,
    positionLabel: 'Receita única da carta para todas as posições próprias',
    training,
    pointsUsed,
    note: 'Ficha, habilidades e Ímpeto são travados pela identidade da carta. Trocar a posição selecionada não recalcula a receita.',
    qualityScore: analysis.winner.universalScore,
    adaptationLabel: 'UMA CARTA • UMA RECEITA • MÁXIMO DESEMPENHO UNIVERSAL',
    highlights: [
      `Assinatura ${analysis.resultSignature}.`,
      `${analysis.compatiblePositions.length} posição(ões) próprias testadas.`,
      `Pior posição protegida: ${Math.round(analysis.winner.worstPositionScore)}.`,
      analysis.proChallengeLabel,
      `Ímpeto principal: ${analysis.primaryImpeto ?? 'revisar leitura'}.`
    ],
    risks: analysis.decision === 'revisar'
      ? ['Confirme os campos críticos da carta e o orçamento antes de aplicar definitivamente.']
      : analysis.compatiblePositions.some((item) => item.verdict === 'inadequada')
        ? ['Existe posição própria com rendimento baixo; consulte o diagnóstico universal antes de escalar.']
        : [],
    efficiencyScore: analysis.winner.pointEfficiency,
    balanceScore: analysis.winner.crossPositionConsistency,
    verdict: analysis.summary,
    tradeOffs: analysis.winner.tradeOffs,
    simulationsTested: analysis.candidatesEvaluated * Math.max(1, analysis.compatiblePositions.length)
  };
  const skillRecommendations = [
    ...analysis.skills.map((skill) => ({
      name: skill.name,
      tier: skill.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const,
      reason: `${skill.gameplayImpact} ${skill.reasons[0] ?? ''}`.trim()
    })),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar')
  ];
  return {
    ...result,
    training,
    trainingCost: trainingPlanCost(training),
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    buildVariants: [variant],
    recommendedSkills: skills,
    skillRecommendations,
    recommendedImpetos: impetos,
    buildName: variant.title,
    recommendationExplanation: [
      analysis.summary,
      'A posição selecionada continua sendo usada somente para escalação e diagnóstico tático; ela não gera uma nova ficha.',
      'A vencedora foi escolhida por média, pior posição, pior cenário, consistência, eficiência e preservação do DNA.',
      ...analysis.winner.reasons,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 16),
    strengths: [
      'Receita única, determinística e exclusiva para esta versão da carta.',
      `Testada nas posições próprias: ${analysis.compatiblePositions.map((item) => item.label).join(', ')}.`,
      analysis.proChallengeLabel,
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    weaknesses: [
      ...(analysis.decision === 'revisar' ? ['A leitura ou o piso competitivo exige revisão antes de aplicar.'] : []),
      ...analysis.winner.tradeOffs,
      ...result.weaknesses
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 10),
    note: `${analysis.summary} As notas são comparações internas e não garantem vitória automática em partidas.`,
    eliteDominanceV3910: analysis
  };
}
