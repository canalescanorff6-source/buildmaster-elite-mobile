import type {
  AnalysisResult,
  AttributeKey,
  MaximumPerformanceAlternativeV4040,
  MaximumPerformanceV4040Analysis,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingLevelCost, trainingPlanTotalCost } from './trainingPlanCore';
import { EFOOTBALL_META_RUNTIME_V4040 } from './efootballMetaRuntimeV4040';

export const MAXIMUM_PERFORMANCE_V4040_VERSION = '40.40.0' as const;

const TRAINING_ATTRIBUTE_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
  shooting: { finishing: 1, placeKicking: 1, curl: 1 },
  passing: { lowPass: 1, loftedPass: 1 },
  dribbling: { ballControl: 1, dribbling: 1, tightPossession: 1 },
  dexterity: { offensiveAwareness: 1, acceleration: 1, balance: 1 },
  lowerBodyStrength: { speed: 1, kickingPower: 1, stamina: 1 },
  aerialStrength: { heading: 1, jump: 1, physicalContact: 1 },
  defending: { defensiveAwareness: 1, defensiveEngagement: 1, tackling: 1, aggression: 1 },
  gk1: { goalkeeperAwareness: 1, goalkeeperCatching: 1 },
  gk2: { goalkeeperParrying: 1, goalkeeperReflexes: 1 },
  gk3: { goalkeeperReach: 1, jump: 1 }
};

const POSITION_RESPONSE: Record<PositionCode, AttributeKey[]> = {
  CF: ['offensiveAwareness', 'finishing', 'ballControl', 'acceleration', 'speed', 'balance', 'kickingPower'],
  SS: ['offensiveAwareness', 'ballControl', 'dribbling', 'tightPossession', 'lowPass', 'acceleration', 'balance', 'finishing'],
  LWF: ['ballControl', 'dribbling', 'tightPossession', 'speed', 'acceleration', 'balance', 'finishing'],
  RWF: ['ballControl', 'dribbling', 'tightPossession', 'speed', 'acceleration', 'balance', 'finishing'],
  LMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'acceleration', 'stamina', 'balance', 'defensiveEngagement'],
  RMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'acceleration', 'stamina', 'balance', 'defensiveEngagement'],
  AMF: ['ballControl', 'tightPossession', 'lowPass', 'dribbling', 'offensiveAwareness', 'acceleration', 'balance', 'finishing'],
  CMF: ['ballControl', 'lowPass', 'loftedPass', 'tightPossession', 'stamina', 'balance', 'defensiveEngagement', 'speed'],
  DMF: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'lowPass', 'physicalContact', 'stamina', 'speed', 'balance'],
  CB: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'physicalContact', 'speed', 'acceleration', 'jump', 'heading'],
  LB: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'speed', 'acceleration', 'stamina', 'lowPass', 'balance'],
  RB: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'speed', 'acceleration', 'stamina', 'lowPass', 'balance'],
  GK: ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach', 'jump']
};

const PROFILE_TRAINING: Record<string, Partial<Record<TrainingKey, number>>> = {
  FINISHER: { shooting: 1.35, dexterity: 1.05, lowerBodyStrength: .62, dribbling: .3 },
  CREATOR: { passing: 1.28, dribbling: .9, dexterity: .52 },
  DRIBBLER: { dribbling: 1.35, dexterity: 1.0, lowerBodyStrength: .46 },
  QUICK_COUNTER: { dexterity: 1.05, lowerBodyStrength: 1.12, shooting: .42, dribbling: .36 },
  POSSESSION: { passing: 1.05, dribbling: 1.0, dexterity: .54, lowerBodyStrength: .3 },
  PRESSING: { defending: .92, lowerBodyStrength: .92, dexterity: .48 },
  DEFENSIVE: { defending: 1.38, lowerBodyStrength: .68, aerialStrength: .42 },
  AERIAL: { aerialStrength: 1.35, lowerBodyStrength: .72, shooting: .28 },
  GOALKEEPER: { gk2: 1.3, gk3: 1.18, gk1: 1.05, aerialStrength: .24 }
};

type CandidateMetrics = {
  total: number;
  ranked: number;
  events: number;
  friends: number;
  response: number;
  dna: number;
  efficiency: number;
  profileFit: number;
};

type Candidate = { plan: TrainingPlan; metrics: CandidateMetrics; signature: string };

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function average(values: number[]): number {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function signature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function distance(left: TrainingPlan, right: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(left[key] ?? 0) - Number(right[key] ?? 0)), 0);
}

function projectedAttributes(result: AnalysisResult, plan: TrainingPlan): Partial<Record<AttributeKey, number>> {
  const projected = { ...result.parsed.attributes };
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    for (const [attribute, gain] of Object.entries(TRAINING_ATTRIBUTE_GAINS[key]) as Array<[AttributeKey, number]>) {
      projected[attribute] = Math.min(110, Number(projected[attribute] ?? 0) + level * gain);
    }
  }
  return projected;
}

// Curva interna contínua. Não é tratada como threshold oficial da Konami.
function functionalUtility(value: number): number {
  const v = Math.max(0, Math.min(110, value));
  if (v < 70) return v * .78;
  if (v < 85) return 54.6 + (v - 70) * 1.55;
  if (v < 95) return 77.85 + (v - 85) * 1.55;
  return 93.35 + (v - 95) * .44;
}

function responseScore(result: AnalysisResult, plan: TrainingPlan): number {
  const projected = projectedAttributes(result, plan);
  const keys = POSITION_RESPONSE[result.bestPosition.code];
  return clamp(average(keys.map((key) => functionalUtility(Number(projected[key] ?? 0)))));
}

function trainingWeights(result: AnalysisResult): Record<TrainingKey, number> {
  const weights = Object.fromEntries(TRAINING_KEYS.map((key) => [key, .05])) as Record<TrainingKey, number>;
  const add = (source: Partial<Record<TrainingKey, number>>, mult = 1) => {
    for (const key of TRAINING_KEYS) weights[key] += Number(source[key] ?? 0) * mult;
  };
  const functional = result.performanceFunctionV3940?.finalTraining;
  if (functional) {
    const total = Math.max(1, TRAINING_KEYS.reduce((sum, key) => sum + Number(functional[key] ?? 0), 0));
    add(Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(functional[key] ?? 0) / total * 4])) as Partial<Record<TrainingKey, number>>, 1);
  }
  result.adaptiveMaximumV4030?.profiles.forEach((profile, index) => add(PROFILE_TRAINING[profile.id] ?? {}, index === 0 ? 1 : index === 1 ? .42 : .2));
  if (result.tacticalProfile.style === 'POSSE_DE_BOLA') add({ passing: .38, dribbling: .34, dexterity: .18 });
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE') add({ passing: .2, lowerBodyStrength: .32, dexterity: .22 });
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE_RAPIDO') add({ lowerBodyStrength: .42, dexterity: .38, shooting: .18, dribbling: .12 });
  if (result.bestPosition.code !== 'GK') add({ dexterity: .12, lowerBodyStrength: .12 });
  return weights;
}

function profileFit(plan: TrainingPlan, weights: Record<TrainingKey, number>): number {
  let weighted = 0;
  let denominator = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    const usefulLevel = Math.min(level, 10) + Math.max(0, Math.min(3, level - 10)) * .55 + Math.max(0, level - 13) * .2;
    const weight = Math.max(0, weights[key]);
    weighted += usefulLevel * weight;
    denominator += 13 * weight;
  }
  return denominator ? clamp(weighted / denominator * 100) : 0;
}

function efficiencyScore(plan: TrainingPlan, weights: Record<TrainingKey, number>, position: PositionCode): number {
  let penalty = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    if (weights[key] < .22 && level > 4) penalty += (level - 4) * 2.2;
    if (level > 12) penalty += (level - 12) * (weights[key] >= .9 ? .55 : 1.45);
    if (position !== 'GK' && key.startsWith('gk')) penalty += level * 7;
    if (position === 'GK' && ['shooting', 'passing', 'dribbling', 'defending'].includes(key)) penalty += level * 3.5;
  }
  return clamp(100 - penalty);
}

function dnaPreservation(seed: TrainingPlan, plan: TrainingPlan): number {
  const totalLevels = Math.max(1, TRAINING_KEYS.reduce((sum, key) => sum + Number(seed[key] ?? 0), 0));
  return clamp(100 - distance(seed, plan) / totalLevels * 92);
}

function evaluate(result: AnalysisResult, seed: TrainingPlan, plan: TrainingPlan, weights: Record<TrainingKey, number>): CandidateMetrics {
  const response = responseScore(result, plan);
  const dna = dnaPreservation(seed, plan);
  const efficiency = efficiencyScore(plan, weights, result.bestPosition.code);
  const fit = profileFit(plan, weights);
  const mobility = clamp(((Number(plan.dexterity ?? 0) + Number(plan.lowerBodyStrength ?? 0)) / 26) * 100);
  const technical = clamp(((Number(plan.passing ?? 0) + Number(plan.dribbling ?? 0)) / 26) * 100);
  const defensive = clamp(((Number(plan.defending ?? 0) + Number(plan.aerialStrength ?? 0)) / 26) * 100);
  const tactical = result.tacticalProfile.style === 'POSSE_DE_BOLA' ? technical : result.tacticalProfile.style === 'CONTRA_ATAQUE_RAPIDO' ? mobility : clamp((mobility + technical) / 2);
  const positionSupport = ['CB', 'DMF', 'LB', 'RB'].includes(result.bestPosition.code) ? defensive : response;
  const ranked = clamp(response * .37 + fit * .25 + tactical * .14 + positionSupport * .08 + efficiency * .1 + dna * .06);
  const events = clamp(response * .34 + fit * .27 + tactical * .11 + efficiency * .14 + dna * .14);
  const friends = clamp(response * .3 + fit * .24 + tactical * .1 + efficiency * .12 + dna * .24);
  const total = clamp(ranked * .38 + events * .18 + friends * .12 + response * .13 + fit * .09 + efficiency * .06 + dna * .04);
  return { total, ranked, events, friends, response, dna, efficiency, profileFit: fit };
}

function sameBudgetNeighbors(plan: TrainingPlan): TrainingPlan[] {
  const output: TrainingPlan[] = [];
  const seen = new Set<string>();
  for (const donor of TRAINING_KEYS) {
    const donorLevel = Number(plan[donor] ?? 0);
    for (let remove = 1; remove <= Math.min(2, donorLevel); remove += 1) {
      const refund = Array.from({ length: remove }, (_, index) => trainingLevelCost(donorLevel - index)).reduce((sum, value) => sum + value, 0);
      for (const receiver of TRAINING_KEYS) {
        if (receiver === donor) continue;
        const receiverLevel = Number(plan[receiver] ?? 0);
        for (let add = 1; add <= Math.min(3, 16 - receiverLevel); add += 1) {
          const cost = Array.from({ length: add }, (_, index) => trainingLevelCost(receiverLevel + index + 1)).reduce((sum, value) => sum + value, 0);
          if (cost !== refund) continue;
          const next = clone(plan);
          next[donor] -= remove;
          next[receiver] += add;
          const key = signature(next);
          if (!seen.has(key)) { seen.add(key); output.push(next); }
        }
      }
    }
  }
  return output;
}

function searchCandidates(result: AnalysisResult, seed: TrainingPlan, weights: Record<TrainingKey, number>): Candidate[] {
  const budget = trainingPlanTotalCost(seed);
  const maxDistance = result.adaptivePositionV3930?.adaptationMode === 'NATURAL' ? 6 : 8;
  const all = new Map<string, Candidate>();
  let beam: TrainingPlan[] = [clone(seed)];
  for (let depth = 0; depth <= 4; depth += 1) {
    const next: Candidate[] = [];
    for (const plan of beam) {
      const pool = depth === 0 ? [plan, ...sameBudgetNeighbors(plan)] : sameBudgetNeighbors(plan);
      for (const candidatePlan of pool) {
        if (trainingPlanTotalCost(candidatePlan) !== budget || distance(seed, candidatePlan) > maxDistance) continue;
        const key = signature(candidatePlan);
        if (all.has(key)) continue;
        const candidate = { plan: candidatePlan, metrics: evaluate(result, seed, candidatePlan, weights), signature: key };
        all.set(key, candidate);
        next.push(candidate);
      }
    }
    beam = next.sort((a, b) => b.metrics.total - a.metrics.total || a.signature.localeCompare(b.signature)).slice(0, 72).map((item) => item.plan);
    if (!beam.length || all.size >= 480) break;
  }
  return [...all.values()].sort((a, b) => b.metrics.total - a.metrics.total || a.signature.localeCompare(b.signature)).slice(0, 480);
}

function dominates(a: Candidate, b: Candidate): boolean {
  const keys: Array<keyof CandidateMetrics> = ['ranked', 'events', 'friends', 'response', 'dna', 'efficiency'];
  return keys.every((key) => a.metrics[key] >= b.metrics[key]) && keys.some((key) => a.metrics[key] > b.metrics[key]);
}

function paretoFrontier(candidates: Candidate[]): Candidate[] {
  return candidates.filter((candidate, index) => !candidates.some((other, otherIndex) => otherIndex !== index && dominates(other, candidate)))
    .sort((a, b) => b.metrics.total - a.metrics.total || a.signature.localeCompare(b.signature));
}

function alternative(id: MaximumPerformanceAlternativeV4040['id'], label: string, candidate: Candidate): MaximumPerformanceAlternativeV4040 {
  return { id, label, training: candidate.plan, score: candidate.metrics.total, rankedScore: candidate.metrics.ranked, dnaPreservation: candidate.metrics.dna, efficiencyScore: candidate.metrics.efficiency };
}

function chooseAlternatives(frontier: Candidate[], winner: Candidate): MaximumPerformanceAlternativeV4040[] {
  const selected: MaximumPerformanceAlternativeV4040[] = [alternative('MAXIMO_COMPETITIVO', 'Máximo competitivo', winner)];
  const ranked = [...frontier].sort((a, b) => b.metrics.ranked - a.metrics.ranked || b.metrics.total - a.metrics.total)[0];
  const dna = [...frontier].sort((a, b) => b.metrics.dna - a.metrics.dna || b.metrics.total - a.metrics.total)[0];
  if (ranked && ranked.signature !== winner.signature) selected.push(alternative('RESPOSTA_ONLINE', 'Resposta online', ranked));
  if (dna && !selected.some((item) => signature(item.training) === dna.signature)) selected.push(alternative('DNA_PRESERVADO', 'DNA preservado', dna));
  return selected.slice(0, 3);
}

function skillPriority(decision: UnifiedSkillDecision): number {
  return decision.score + (decision.priority === 'essencial' ? 18 : decision.priority === 'alta' ? 9 : 3) + decision.identityBoost * .6;
}

function optimizedSkills(result: AnalysisResult) {
  const owned = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
  const output: string[] = [];
  let duplicatesBlocked = 0;
  const push = (name: string) => {
    const key = skillIdentityKey(name);
    if (!key) return;
    if (owned.has(key)) { duplicatesBlocked += 1; return; }
    if (output.some((item) => skillIdentityKey(item) === key)) return;
    if (output.length < 5) output.push(name);
  };
  const decisions = [...(result.performanceFunctionV3940?.finalSkills ?? [])].sort((a, b) => skillPriority(b) - skillPriority(a) || a.name.localeCompare(b.name));
  decisions.forEach((decision) => push(decision.name));
  result.recommendedSkills.forEach(push);
  return {
    finalSkills: output,
    slotsFilled: output.length,
    duplicatesBlocked,
    unique: new Set(output.map(skillIdentityKey)).size === output.length,
    sourcePolicy: 'Somente habilidades já existentes no catálogo/pipeline oficial do app; o motor não inventa nomes.'
  };
}

function confidence(result: AnalysisResult, winner: Candidate, runnerUp: Candidate | undefined) {
  const attrCount = Number(result.parsed.evidence.attributeCount ?? 0);
  const attributes = clamp(attrCount / 29 * 100);
  const baseConfidence = clamp(Number(result.parsed.confidence ?? 0));
  const locks = (result.parsed.evidence.positionLocked ? 1 : 0) + (result.parsed.evidence.playstyleLocked ? 1 : 0) + (result.parsed.manualConfirmed ? 1 : 0);
  const skillConfidence = clamp(Number(result.parsed.evidence.skillConfidence ?? (result.parsed.nativeSkills.length ? 78 : 45)));
  const dataQuality = clamp(baseConfidence * .4 + attributes * .28 + skillConfidence * .16 + (locks / 3 * 100) * .16);
  const gap = Math.max(0, winner.metrics.total - Number(runnerUp?.metrics.total ?? winner.metrics.total));
  const decisionMargin = clamp(40 + gap * 18);
  const score = clamp(dataQuality * .68 + decisionMargin * .22 + (winner.metrics.efficiency * .1));
  const level = score >= 86 ? 'ALTA' as const : score >= 70 ? 'MEDIA' as const : 'REVISAR' as const;
  return {
    score,
    level,
    dataQuality,
    decisionMargin,
    reasons: [
      `Qualidade dos dados da carta: ${Math.round(dataQuality)}/100.`,
      `Margem entre as melhores candidatas: ${gap.toFixed(1)} ponto(s).`,
      level === 'REVISAR' ? 'Confirme leitura/posição antes de gastar recursos.' : 'A recomendação tem evidência suficiente para uso como base, mantendo validação em partidas reais.'
    ]
  };
}

export function buildMaximumPerformanceV4040(result: AnalysisResult): MaximumPerformanceV4040Analysis {
  const seed = clone(result.adaptiveMaximumV4030?.finalTraining ?? result.performanceFunctionV3940?.finalTraining ?? result.training);
  const weights = trainingWeights(result);
  const candidates = result.objective === 'COMPETITIVE' ? searchCandidates(result, seed, weights) : [{ plan: seed, metrics: evaluate(result, seed, seed, weights), signature: signature(seed) }];
  const baseline = candidates.find((item) => item.signature === signature(seed)) ?? { plan: seed, metrics: evaluate(result, seed, seed, weights), signature: signature(seed) };
  const rawWinner = candidates[0] ?? baseline;
  const winner = result.objective === 'COMPETITIVE' && rawWinner.metrics.total >= baseline.metrics.total + .15 ? rawWinner : baseline;
  const runnerUp = candidates.find((item) => item.signature !== winner.signature);
  const frontier = paretoFrontier(candidates.slice(0, 180));
  const alternatives = chooseAlternatives(frontier, winner);
  const skills = optimizedSkills(result);
  const conf = confidence(result, winner, runnerUp);
  const changes = TRAINING_KEYS.filter((key) => Number(seed[key] ?? 0) !== Number(winner.plan[key] ?? 0)).map((key) => ({ key, label: TRAINING_LABELS[key], from: Number(seed[key] ?? 0), to: Number(winner.plan[key] ?? 0) }));
  const exactBudget = trainingPlanTotalCost(seed) === trainingPlanTotalCost(winner.plan);
  return {
    engineVersion: MAXIMUM_PERFORMANCE_V4040_VERSION,
    mode: 'PRECISAO_COMPETITIVA_99',
    deterministic: true,
    selectedPosition: result.bestPosition.code,
    selectedPositionLabel: POSITION_PT[result.bestPosition.code],
    baseTraining: seed,
    finalTraining: winner.plan,
    exactBudget,
    candidatesEvaluated: candidates.length,
    paretoCandidates: frontier.length,
    baselineScore: baseline.metrics.total,
    winnerScore: winner.metrics.total,
    scoreGap: Math.max(0, winner.metrics.total - Number(runnerUp?.metrics.total ?? winner.metrics.total)),
    contextScores: { ranked: winner.metrics.ranked, events: winner.metrics.events, friends: winner.metrics.friends, average: clamp((winner.metrics.ranked + winner.metrics.events + winner.metrics.friends) / 3) },
    responseScore: winner.metrics.response,
    dnaPreservation: winner.metrics.dna,
    efficiencyScore: winner.metrics.efficiency,
    profileFitScore: winner.metrics.profileFit,
    confidence: conf,
    alternatives,
    changes,
    skillPlan: skills,
    metaRuntime: EFOOTBALL_META_RUNTIME_V4040,
    guarantees: {
      gerIsNotOptimizationTarget: true,
      noRandomness: true,
      exactPointBudget: exactBudget,
      onlyExistingSkillNames: true,
      ownedSkillDuplicationBlocked: skills.finalSkills.every((name) => !new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey)).has(skillIdentityKey(name))),
      speculativeV600WeightsBlocked: !EFOOTBALL_META_RUNTIME_V4040.speculativeWeightsApplied
    },
    reasons: [
      `Busca multiobjetivo avaliou ${candidates.length} distribuições com orçamento idêntico e reteve ${frontier.length} soluções não dominadas na fronteira de Pareto.`,
      `A ficha vencedora equilibra resposta funcional, robustez em ranqueadas/eventos/amigos, preservação do DNA e eficiência de pontos.`,
      `Confiança da recomendação: ${Math.round(conf.score)}/100 (${conf.level}); isso mede qualidade da decisão do motor, não chance de vitória.`,
      `As 5 habilidades são reordenadas apenas a partir do catálogo já reconhecido pelo app e passam por bloqueio de duplicação com habilidades possuídas.`,
      `Meta estável v${EFOOTBALL_META_RUNTIME_V4040.stableVersion}; v${EFOOTBALL_META_RUNTIME_V4040.nextAnnouncedVersion} e o estilo ${EFOOTBALL_META_RUNTIME_V4040.announcedTeamPlaystyle} permanecem em observação sem pesos especulativos.`
    ],
    summary: `${result.parsed.playerName}: Precisão Competitiva v40.40 em ${POSITION_PT[result.bestPosition.code]} — ${Math.round(winner.metrics.ranked)}/100 ranqueada, ${Math.round(winner.metrics.response)}/100 resposta funcional e ${Math.round(conf.score)}/100 confiança da recomendação.`
  };
}

export function applyMaximumPerformanceV4040(result: AnalysisResult): AnalysisResult {
  const analysis = buildMaximumPerformanceV4040(result);
  const applied = result.objective === 'COMPETITIVE';
  const training = applied ? analysis.finalTraining : result.training;
  const pointsUsed = trainingPlanTotalCost(training);
  const variants = applied ? analysis.alternatives.map((item, index) => ({
    kind: index === 0 ? 'competitive' as const : 'alternative' as const,
    title: `Ficha Automática v40.40 — ${item.label} — ${result.parsed.playerName}`,
    positionLabel: `${analysis.selectedPositionLabel} • Precisão Competitiva`,
    training: item.training,
    pointsUsed: trainingPlanTotalCost(item.training),
    note: `${item.label}: score ${Math.round(item.score)}/100; ranqueada ${Math.round(item.rankedScore)}/100; DNA ${Math.round(item.dnaPreservation)}/100.`,
    qualityScore: item.score,
    adaptationLabel: 'PARETO • DNA • FUNÇÃO • ROBUSTEZ • SEM CAÇAR GER',
    highlights: [`Ranqueada ${Math.round(item.rankedScore)}/100`, `DNA ${Math.round(item.dnaPreservation)}/100`, `Eficiência ${Math.round(item.efficiencyScore)}/100`],
    risks: analysis.confidence.level === 'REVISAR' ? ['Confirme os campos lidos antes de aplicar recursos.'] : [],
    efficiencyScore: item.efficiencyScore,
    balanceScore: item.score,
    verdict: index === 0 ? 'Campeã multiobjetivo.' : 'Alternativa válida na fronteira de Pareto.',
    tradeOffs: [],
    simulationsTested: analysis.candidatesEvaluated
  })) : result.buildVariants;
  return {
    ...result,
    training,
    trainingPointsUsed: applied ? pointsUsed : result.trainingPointsUsed,
    trainingPointsRemaining: applied ? Math.max(0, result.trainingPointsTotal - pointsUsed) : result.trainingPointsRemaining,
    buildVariants: variants,
    buildName: applied ? `Ficha Automática v40.40 — Precisão Competitiva 99 — ${result.parsed.playerName}` : result.buildName,
    recommendedSkills: applied && analysis.skillPlan.finalSkills.length ? analysis.skillPlan.finalSkills : result.recommendedSkills,
    recommendationExplanation: [analysis.summary, ...analysis.reasons, ...analysis.confidence.reasons, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 28),
    strengths: [
      'O motor agora compara uma fronteira de Pareto em vez de escolher apenas pelo maior score único.',
      'A recomendação mostra confiança, margem da decisão e qualidade dos dados para evitar falsa precisão.',
      'As cinco habilidades adicionais são reordenadas sem inventar nomes e com bloqueio de duplicação com habilidades já possuídas.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    note: `${analysis.summary} A meta “99%” representa consistência, integridade e profundidade da otimização; desempenho real continua dependente de partida, conexão, adversário e execução do usuário.`,
    maximumPerformanceV4040: analysis
  };
}
