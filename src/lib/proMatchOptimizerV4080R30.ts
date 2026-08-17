import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  PositionCode,
  ProMatchOptimizerR30Analysis,
  ProMatchOptimizerR30Candidate,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';
import { enforceHardTrainingIdentity, fitTrainingToExactBudget, trainingTemplate } from '@/modules/builds/trainingOptimizer';

export const PRO_MATCH_OPTIMIZER_R30_VERSION = '40.80-r30' as const;

const GROUP_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
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

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<AttributeKey, number>>> = {
  CF: { offensiveAwareness: 1.55, finishing: 1.5, acceleration: 1.0, kickingPower: .85, ballControl: .72, balance: .72, speed: .62, dribbling: .55, physicalContact: .42 },
  SS: { offensiveAwareness: 1.2, ballControl: 1.15, tightPossession: 1.1, acceleration: 1.0, finishing: .95, dribbling: .9, lowPass: .82, balance: .82 },
  LWF: { dribbling: 1.25, acceleration: 1.2, speed: 1.12, ballControl: 1.08, tightPossession: 1.0, balance: .85, finishing: .72, lowPass: .52 },
  RWF: { dribbling: 1.25, acceleration: 1.2, speed: 1.12, ballControl: 1.08, tightPossession: 1.0, balance: .85, finishing: .72, lowPass: .52 },
  AMF: { lowPass: 1.3, ballControl: 1.2, tightPossession: 1.18, dribbling: 1.0, acceleration: .82, offensiveAwareness: .8, balance: .78, finishing: .48 },
  CMF: { lowPass: 1.25, ballControl: 1.0, stamina: .95, tightPossession: .82, balance: .78, defensiveEngagement: .7, acceleration: .62, loftedPass: .58 },
  LMF: { lowPass: 1.05, stamina: 1.0, speed: .95, acceleration: .9, ballControl: .88, dribbling: .78, balance: .7, defensiveEngagement: .46 },
  RMF: { lowPass: 1.05, stamina: 1.0, speed: .95, acceleration: .9, ballControl: .88, dribbling: .78, balance: .7, defensiveEngagement: .46 },
  DMF: { defensiveAwareness: 1.4, defensiveEngagement: 1.32, tackling: 1.28, lowPass: .98, stamina: .85, physicalContact: .82, ballControl: .55, speed: .5 },
  CB: { defensiveAwareness: 1.55, tackling: 1.42, defensiveEngagement: 1.35, physicalContact: 1.05, speed: .82, acceleration: .68, jump: .65, lowPass: .42 },
  LB: { defensiveAwareness: 1.15, tackling: 1.05, speed: 1.02, acceleration: .95, stamina: .9, lowPass: .62, loftedPass: .56, balance: .58 },
  RB: { defensiveAwareness: 1.15, tackling: 1.05, speed: 1.02, acceleration: .95, stamina: .9, lowPass: .62, loftedPass: .56, balance: .58 },
  GK: { goalkeeperReflexes: 1.55, goalkeeperReach: 1.42, goalkeeperAwareness: 1.38, goalkeeperParrying: 1.18, goalkeeperCatching: .92, jump: .55 }
};


function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function projectedAttribute(result: AnalysisResult, plan: TrainingPlan, key: AttributeKey) {
  const base = Number(result.parsed.attributes[key] ?? 0);
  let gain = 0;
  for (const trainingKey of TRAINING_KEYS) {
    if (GROUP_GAINS[trainingKey][key]) gain += Number(plan[trainingKey] ?? 0) * Number(GROUP_GAINS[trainingKey][key] ?? 0);
  }
  return base + gain;
}

function weightedRoleScore(result: AnalysisResult, plan: TrainingPlan): number {
  const weights = POSITION_WEIGHTS[result.bestPosition.code];
  let weighted = 0;
  let total = 0;
  for (const [key, weight] of Object.entries(weights) as Array<[AttributeKey, number]>) {
    weighted += projectedAttribute(result, plan, key) * weight;
    total += weight;
  }
  return total ? clamp((weighted / total - 55) * 2.15) : 0;
}

function identityScore(result: AnalysisResult, plan: TrainingPlan): number {
  const style = normalize(result.parsed.playstyle);
  const p = result.bestPosition.code;
  let score = weightedRoleScore(result, plan);

  if (/artilheiro|goal poacher/.test(style) && p === 'CF') {
    score += plan.shooting * 1.4 + plan.dexterity * 1.05 + plan.lowerBodyStrength * .45 + plan.dribbling * .3 - plan.defending * 10;
    if (Number(result.parsed.attributes.heading ?? 0) < 78 && Number(result.parsed.attributes.physicalContact ?? 0) < 82) score -= plan.aerialStrength * .55;
  }
  if (/puxa marcacao|puxa marcação|deep lying forward/.test(style)) score += plan.passing * .8 + plan.dribbling * .75 + plan.dexterity * .55;
  if (/armador criativo|orquestrador|classico|clássico/.test(style)) score += plan.passing * 1.0 + plan.dribbling * .72;
  if (/primeiro volante|destruidor|defensor criativo|lateral defensivo/.test(style)) score += plan.defending * 1.0 + plan.lowerBodyStrength * .5;
  return clamp(score);
}

function scenarioScores(result: AnalysisResult, plan: TrainingPlan) {
  const score = (keys: AttributeKey[]) => {
    const vals = keys.map((key) => projectedAttribute(result, plan, key)).filter((v) => v > 0);
    return vals.length ? vals.reduce((sum, value) => sum + value, 0) / vals.length : 50;
  };
  const position = result.bestPosition.code;
  const attacking = ['CF','SS','LWF','RWF','AMF'].includes(position);
  const defensive = ['CB','DMF','LB','RB'].includes(position);
  return [
    weightedRoleScore(result, plan),
    score(['ballControl','tightPossession','acceleration','balance','lowPass']),
    score(['acceleration','speed','stamina']),
    attacking ? score(['offensiveAwareness','finishing','ballControl','acceleration']) : defensive ? score(['defensiveAwareness','tackling','defensiveEngagement','speed']) : score(['lowPass','ballControl','stamina','acceleration']),
    position === 'GK' ? score(['goalkeeperAwareness','goalkeeperReflexes','goalkeeperReach']) : score(['balance','physicalContact','stamina'])
  ].map((value) => clamp((value - 55) * 2.15));
}

function evaluateCandidate(result: AnalysisResult, id: string, label: string, source: ProMatchOptimizerR30Candidate['source'], training: TrainingPlan, baselineScore: number, gamerTag?: string | null): ProMatchOptimizerR30Candidate {
  const safe = enforceHardTrainingIdentity(training, result.bestPosition.code, result.parsed);
  const scenarios = scenarioScores(result, safe);
  const average = scenarios.reduce((sum, value) => sum + value, 0) / scenarios.length;
  const floor = Math.min(...scenarios);
  const spread = Math.max(...scenarios) - floor;
  const role = weightedRoleScore(result, safe);
  const identity = identityScore(result, safe);
  const score = clamp(average * .38 + floor * .28 + identity * .22 + role * .12 - spread * .08);
  return {
    id,
    label,
    source,
    gamerTag,
    training: safe,
    score: Math.round(score * 10) / 10,
    identityScore: Math.round(identity * 10) / 10,
    roleScore: Math.round(role * 10) / 10,
    scenarioFloor: Math.round(floor * 10) / 10,
    consistency: Math.round(clamp(100 - spread) * 10) / 10,
    exactBudget: trainingPlanTotalCost(safe) === result.trainingPointsTotal,
    improvementVsApp: Math.round((score - baselineScore) * 10) / 10,
    reasons: [
      `Função ${POSITION_PT[result.bestPosition.code]}: ${Math.round(role)}.`,
      `Identidade da carta: ${Math.round(identity)}.`,
      `Pior cenário protegido: ${Math.round(floor)}.`,
      `Consistência entre cenários: ${Math.round(clamp(100 - spread))}.`
    ]
  };
}

function trainingSignature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function averagePlans(left: TrainingPlan, right: TrainingPlan, rightWeight: number): TrainingPlan {
  const out = {} as TrainingPlan;
  for (const key of TRAINING_KEYS) out[key] = Math.round(Number(left[key] ?? 0) * (1 - rightWeight) + Number(right[key] ?? 0) * rightWeight);
  return out;
}

function mutateTargets(seed: TrainingPlan): TrainingPlan[] {
  const targets: TrainingPlan[] = [seed];
  const relevant = TRAINING_KEYS.filter((key) => Number(seed[key] ?? 0) > 0 || !key.startsWith('gk'));
  for (const up of relevant) {
    for (const down of relevant) {
      if (up === down || Number(seed[down] ?? 0) <= 0) continue;
      const copy = { ...seed };
      copy[up] = Math.min(16, Number(copy[up] ?? 0) + 1);
      copy[down] = Math.max(0, Number(copy[down] ?? 0) - 1);
      targets.push(copy);
      if (targets.length >= 80) return targets;
    }
  }
  return targets;
}

export function applyProMatchOptimizerV4080R30(result: AnalysisResult): AnalysisResult {
  const benchmark = result.globalProV3900;
  const priority = trainingTemplate(result.bestPosition.code, 'COMPETITIVE', result.parsed.attributes as Required<Attributes>, result.parsed).priority;
  const baselinePlan = fitTrainingToExactBudget(result.training, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed);
  const baselineRaw = evaluateCandidate(result, 'dna-app', 'Motor DNA Final', 'DNA_APP', baselinePlan, 0);
  const baselineScore = baselineRaw.score;
  const candidates: ProMatchOptimizerR30Candidate[] = [
    { ...baselineRaw, improvementVsApp: 0 }
  ];

  const exactRefs = (benchmark?.references ?? [])
    .filter((ref) => ref.exactCard && ref.trainingPointsTotal !== 0)
    .sort((a, b) => Number(b.testedInMatches) - Number(a.testedInMatches) || b.completeness - a.completeness || b.identityScore - a.identityScore)
    .slice(0, 8);

  for (const [index, ref] of exactRefs.entries()) {
    const exact = fitTrainingToExactBudget(ref.training, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed);
    candidates.push(evaluateCandidate(result, `pro-${index}`, `Referência Pro • ${ref.gamerTag}`, 'PRO_EXATO', exact, baselineScore, ref.gamerTag));
  }

  if (benchmark && benchmark.exactReferences > 0) {
    const consensus = fitTrainingToExactBudget(benchmark.proConsensusTraining, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed);
    candidates.push(evaluateCandidate(result, 'consenso-pro', 'Consenso das referências profissionais', 'CONSENSO_PRO', consensus, baselineScore));

    for (const weight of [.2, .35, .5]) {
      const hybridTarget = averagePlans(baselinePlan, consensus, weight);
      const hybrid = fitTrainingToExactBudget(hybridTarget, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed);
      candidates.push(evaluateCandidate(result, `hibrida-${weight}`, `Híbrida DNA + Pro ${Math.round(weight * 100)}%`, 'HIBRIDA', hybrid, baselineScore));
    }
  }

  const preWinner = [...candidates].sort((a, b) => b.score - a.score || b.scenarioFloor - a.scenarioFloor)[0] ?? candidates[0];
  const mutations = mutateTargets(preWinner.training);
  for (const [index, target] of mutations.entries()) {
    const exact = fitTrainingToExactBudget(target, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed);
    candidates.push(evaluateCandidate(result, `otimizada-${index}`, 'Otimização de retorno marginal', 'OTIMIZADA', exact, baselineScore));
  }

  const unique = new Map<string, ProMatchOptimizerR30Candidate>();
  for (const candidate of candidates) {
    if (!candidate.exactBudget) continue;
    const signature = trainingSignature(candidate.training);
    const current = unique.get(signature);
    if (!current || candidate.score > current.score) unique.set(signature, candidate);
  }
  const ranked = [...unique.values()].sort((a, b) => b.score - a.score || b.scenarioFloor - a.scenarioFloor || b.identityScore - a.identityScore);
  const winner = ranked[0] ?? candidates[0];
  const external = ranked.filter((item) => item.source === 'PRO_EXATO' || item.source === 'CONSENSO_PRO');
  const distinctPros = new Set(exactRefs.map((ref) => ref.gamerTag).filter(Boolean)).size;
  const confidence = exactRefs.length >= 5 ? 94 : exactRefs.length >= 3 ? 86 : exactRefs.length >= 1 ? 72 : 58;
  const analysis: ProMatchOptimizerR30Analysis = {
    engineVersion: PRO_MATCH_OPTIMIZER_R30_VERSION,
    philosophy: 'COMPARAR_PROS_EXATOS_OTIMIZAR_SEM_COPIAR_E_ESCOLHER_POR_DESEMPENHO_DE_PARTIDA',
    exactCardOnly: true,
    referencesAvailable: benchmark?.referencesFound ?? 0,
    verifiedProReferences: benchmark?.verifiedProReferences ?? 0,
    referencesUsed: exactRefs.length,
    distinctPros,
    confidence,
    confidenceLabel: exactRefs.length >= 3 ? 'alta' : exactRefs.length >= 1 ? 'media' : 'sem_evidencia',
    appBaselineScore: baselineScore,
    bestExternalScore: external[0]?.score ?? null,
    winnerScore: winner.score,
    improvementVsApp: winner.improvementVsApp,
    winner,
    finalists: ranked.slice(0, 5),
    proReferences: exactRefs.slice(0, 5).map((ref) => ({
      gamerTag: ref.gamerTag,
      score: evaluateCandidate(
        result,
        `ref-${ref.id}`,
        ref.gamerTag,
        'PRO_EXATO',
        fitTrainingToExactBudget(ref.training, priority, result.trainingPointsTotal, result.bestPosition.code, result.parsed),
        baselineScore,
        ref.gamerTag
      ).score,
      evidenceLevel: ref.evidenceLevel,
      completeness: ref.completeness,
      testedInMatches: ref.testedInMatches,
      training: ref.training
    })),
    summary: exactRefs.length
      ? `${exactRefs.length} referência(s) exata(s) foram comparadas com o Motor DNA. A vencedora foi ${winner.label} com ${winner.score}/100 e ganho de ${winner.improvementVsApp >= 0 ? '+' : ''}${winner.improvementVsApp} sobre a ficha-base.`
      : `Nenhuma ficha profissional exata está validada para esta versão da carta. O app manteve o Motor DNA e ainda executou otimização local de retorno marginal.`,
    warnings: exactRefs.length
      ? []
      : ['Sem benchmark profissional exato: o app não usa outra versão do mesmo jogador nem inventa uma build externa.']
  };

  return {
    ...result,
    training: winner.training,
    trainingPointsUsed: trainingPlanTotalCost(winner.training),
    trainingPointsRemaining: result.trainingPointsTotal - trainingPlanTotalCost(winner.training),
    proMatchOptimizerR30: analysis,
    recommendationExplanation: [
      `Benchmark Pro r30: ${analysis.summary}`,
      'O comparativo usa somente a mesma versão exata da carta; referências diferentes do jogador não entram como evidência.',
      'O melhor pro player não é copiado cegamente: a build profissional vira candidata, é comparada ao DNA e passa por otimização de retorno marginal.',
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 60)
  };
}
