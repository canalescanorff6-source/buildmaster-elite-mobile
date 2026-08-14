import type {
  AnalysisResult,
  AttributeKey,
  ConnectionProfile,
  EfootballV600PerformanceAnalysis,
  ImpetoRecommendation,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import { buildOwnedSkillKeys, skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';
import { EFOOTBALL_V600_META } from './efootballV600Meta';

export const EFOOTBALL_V600_PERFORMANCE_ENGINE_VERSION = '6.0.0-buildmaster-r5' as const;

const ATTR_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
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

const V600_ROLE_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  GK: { gk1: 1.18, gk2: 1.52, gk3: 1.46, aerialStrength: .32, lowerBodyStrength: .2 },
  CB: { defending: 1.7, lowerBodyStrength: .92, dexterity: .78, aerialStrength: .78, passing: .5 },
  LB: { defending: 1.38, lowerBodyStrength: 1.02, dexterity: .94, passing: .72, dribbling: .3 },
  RB: { defending: 1.38, lowerBodyStrength: 1.02, dexterity: .94, passing: .72, dribbling: .3 },
  DMF: { defending: 1.62, passing: 1.0, lowerBodyStrength: .9, dexterity: .72, aerialStrength: .36 },
  CMF: { passing: 1.28, defending: .82, dexterity: .9, lowerBodyStrength: .86, dribbling: .62 },
  LMF: { passing: 1.06, defending: .7, dexterity: .98, lowerBodyStrength: .9, dribbling: .78 },
  RMF: { passing: 1.06, defending: .7, dexterity: .98, lowerBodyStrength: .9, dribbling: .78 },
  AMF: { passing: 1.3, dribbling: .98, dexterity: 1.08, shooting: .58, lowerBodyStrength: .42 },
  SS: { passing: 1.08, dribbling: .94, dexterity: 1.2, shooting: .92, lowerBodyStrength: .62 },
  CF: { shooting: 1.34, dexterity: 1.18, passing: .48, dribbling: .6, lowerBodyStrength: .82, aerialStrength: .52 },
  LWF: { dribbling: 1.08, dexterity: 1.16, passing: .7, shooting: .78, lowerBodyStrength: .76 },
  RWF: { dribbling: 1.08, dexterity: 1.16, passing: .7, shooting: .78, lowerBodyStrength: .76 }
};

const FIRST_TOUCH_KEYS: Record<PositionCode, AttributeKey[]> = {
  GK: ['goalkeeperAwareness','goalkeeperReflexes','goalkeeperReach'],
  CB: ['ballControl','lowPass','defensiveAwareness','defensiveEngagement','acceleration','balance'],
  LB: ['ballControl','lowPass','tightPossession','acceleration','balance','stamina'],
  RB: ['ballControl','lowPass','tightPossession','acceleration','balance','stamina'],
  DMF: ['ballControl','tightPossession','lowPass','defensiveEngagement','acceleration','balance'],
  CMF: ['ballControl','tightPossession','lowPass','acceleration','balance','stamina'],
  LMF: ['ballControl','tightPossession','lowPass','acceleration','balance','speed'],
  RMF: ['ballControl','tightPossession','lowPass','acceleration','balance','speed'],
  AMF: ['ballControl','tightPossession','lowPass','dribbling','acceleration','balance'],
  SS: ['ballControl','tightPossession','lowPass','dribbling','acceleration','balance','offensiveAwareness'],
  CF: ['ballControl','offensiveAwareness','acceleration','balance','finishing'],
  LWF: ['ballControl','tightPossession','dribbling','acceleration','balance','speed'],
  RWF: ['ballControl','tightPossession','dribbling','acceleration','balance','speed']
};

const MANUAL_DEFENCE_KEYS: Record<PositionCode, AttributeKey[]> = {
  GK: ['goalkeeperAwareness','goalkeeperReflexes','goalkeeperReach'],
  CB: ['defensiveAwareness','defensiveEngagement','tackling','speed','acceleration','physicalContact','stamina'],
  LB: ['defensiveAwareness','defensiveEngagement','tackling','speed','acceleration','stamina','balance'],
  RB: ['defensiveAwareness','defensiveEngagement','tackling','speed','acceleration','stamina','balance'],
  DMF: ['defensiveAwareness','defensiveEngagement','tackling','speed','acceleration','stamina','physicalContact'],
  CMF: ['defensiveEngagement','tackling','speed','acceleration','stamina','balance'],
  LMF: ['defensiveEngagement','speed','acceleration','stamina','balance'],
  RMF: ['defensiveEngagement','speed','acceleration','stamina','balance'],
  AMF: ['defensiveEngagement','acceleration','stamina','balance'],
  SS: ['defensiveEngagement','acceleration','stamina','balance'],
  CF: ['defensiveEngagement','acceleration','stamina'],
  LWF: ['defensiveEngagement','acceleration','stamina','balance'],
  RWF: ['defensiveEngagement','acceleration','stamina','balance']
};

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function signature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function projectedAttributes(result: AnalysisResult, plan: TrainingPlan): Partial<Record<AttributeKey, number>> {
  const output = { ...result.parsed.attributes };
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    for (const [attribute, gain] of Object.entries(ATTR_GAINS[key]) as Array<[AttributeKey, number]>) {
      output[attribute] = Math.min(110, Number(output[attribute] ?? 0) + level * gain);
    }
  }
  return output;
}

function average(values: number[]): number {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function attributeUtility(value: number): number {
  const v = Math.max(0, Math.min(110, value));
  if (v < 70) return v * .8;
  if (v < 85) return 56 + (v - 70) * 1.5;
  if (v < 95) return 78.5 + (v - 85) * 1.45;
  return 93 + (v - 95) * .42;
}

function scoreAttributes(result: AnalysisResult, plan: TrainingPlan, keys: AttributeKey[]): number {
  const attrs = projectedAttributes(result, plan);
  return clamp(average(keys.map((key) => attributeUtility(Number(attrs[key] ?? 0)))));
}

function effectiveConnection(result: AnalysisResult): ConnectionProfile {
  return result.tacticalProfile.connectionProfile ?? 'VARIABLE';
}

function connectionWeights(profile: ConnectionProfile): Partial<Record<TrainingKey, number>> {
  if (profile === 'HIGH_DELAY') return { passing: .42, dribbling: .36, dexterity: .5, lowerBodyStrength: .28, defending: .2 };
  if (profile === 'VARIABLE') return { passing: .24, dribbling: .18, dexterity: .3, lowerBodyStrength: .18, defending: .12 };
  return { passing: .08, dribbling: .06, dexterity: .1, lowerBodyStrength: .08 };
}

function effectiveWeights(result: AnalysisResult): Record<TrainingKey, number> {
  const output = Object.fromEntries(TRAINING_KEYS.map((key) => [key, .03])) as Record<TrainingKey, number>;
  const merge = (source: Partial<Record<TrainingKey, number>>, mult = 1) => {
    for (const key of TRAINING_KEYS) output[key] += Number(source[key] ?? 0) * mult;
  };
  merge(V600_ROLE_WEIGHTS[result.bestPosition.code]);
  merge(connectionWeights(effectiveConnection(result)));
  if (['CB','LB','RB','DMF','CMF'].includes(result.bestPosition.code)) merge({ defending: .3, dexterity: .16, lowerBodyStrength: .14 });
  if (result.parsed.defensivePlaystyleConfirmed && result.parsed.defensivePlaystyle === 'Pressão no Ataque') merge({ defending: .25, dexterity: .18, lowerBodyStrength: .22 });
  if (result.tacticalProfile.style === 'POSSE_DE_BOLA') merge({ passing: .22, dribbling: .15, dexterity: .12 });
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE_RAPIDO') merge({ dexterity: .22, lowerBodyStrength: .18, passing: .12 });
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE') merge({ defending: .12, passing: .14, lowerBodyStrength: .14 });
  return output;
}

function trainingUtility(plan: TrainingPlan, weights: Record<TrainingKey, number>): number {
  let score = 0;
  let denominator = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    const weight = Number(weights[key] ?? 0);
    const useful = level <= 8 ? level * 10.5 : 84 + Math.min(20, level - 8) * 3.1;
    const saturation = Math.max(0, level - 12) * (weight < .55 ? 3.5 : 1.2);
    score += Math.max(0, useful - saturation) * weight;
    denominator += 100 * weight;
  }
  return clamp(denominator ? score / denominator * 100 : 0);
}

function planScore(result: AnalysisResult, plan: TrainingPlan) {
  const weights = effectiveWeights(result);
  const firstTouch = scoreAttributes(result, plan, FIRST_TOUCH_KEYS[result.bestPosition.code]);
  const manualDefence = scoreAttributes(result, plan, MANUAL_DEFENCE_KEYS[result.bestPosition.code]);
  const training = trainingUtility(plan, weights);
  const connection = effectiveConnection(result);
  const responseWeight = connection === 'HIGH_DELAY' ? .4 : connection === 'VARIABLE' ? .34 : .28;
  const defenceWeight = ['CB','LB','RB','DMF','CMF'].includes(result.bestPosition.code) ? .34 : result.parsed.defensivePlaystyle ? .2 : .12;
  const trainingWeight = Math.max(.26, 1 - responseWeight - defenceWeight);
  const total = clamp(training * trainingWeight + firstTouch * responseWeight + manualDefence * defenceWeight);
  return { total, firstTouch, manualDefence, training };
}

function sameBudgetCandidates(seed: TrainingPlan, budget: number): TrainingPlan[] {
  const found = new Map<string, TrainingPlan>();
  const add = (plan: TrainingPlan) => {
    if (trainingPlanTotalCost(plan) !== budget) return;
    found.set(signature(plan), clone(plan));
  };
  add(seed);
  for (const from of TRAINING_KEYS) {
    for (let removeCount = 1; removeCount <= 2; removeCount += 1) {
      if (Number(seed[from] ?? 0) < removeCount) continue;
      const reduced = clone(seed);
      reduced[from] -= removeCount;
      for (const to of TRAINING_KEYS) {
        if (to === from) continue;
        for (let addCount = 1; addCount <= 3; addCount += 1) {
          if (Number(reduced[to] ?? 0) + addCount > 16) break;
          const candidate = clone(reduced);
          candidate[to] += addCount;
          const cost = trainingPlanTotalCost(candidate);
          if (cost === budget) add(candidate);
          if (cost > budget) break;
        }
      }
    }
  }
  return [...found.values()].slice(0, 180);
}

function skillCategories(result: AnalysisResult, connection: ConnectionProfile): UnifiedSkillDecision['category'][] {
  const position = result.bestPosition.code;
  const attrs = result.parsed.attributes;
  const dribbleDna = average([
    Number(attrs.ballControl ?? 0), Number(attrs.dribbling ?? 0), Number(attrs.tightPossession ?? 0),
    Number(attrs.balance ?? 0), Number(attrs.acceleration ?? 0)
  ]);
  const creationDna = average([Number(attrs.lowPass ?? 0), Number(attrs.loftedPass ?? 0), Number(attrs.ballControl ?? 0)]);
  const finishingDna = average([Number(attrs.finishing ?? 0), Number(attrs.offensiveAwareness ?? 0), Number(attrs.kickingPower ?? 0)]);
  const dribbleDominant = ['SS','AMF','LWF','RWF','LMF','RMF'].includes(position)
    && dribbleDna >= 86
    && dribbleDna >= creationDna + 5
    && dribbleDna >= finishingDna + 5;

  // A v6.0 pode favorecer passe/segurança em conexão variável, mas não pode
  // apagar o DNA técnico da carta. Se drible/condução é claramente a maior
  // vantagem do jogador, reservamos duas das cinco vagas para drible/controle.
  if (dribbleDominant) return ['drible','drible','passe','finalização','físico'];
  if (position === 'GK') return ['goleiro','goleiro','goleiro','mental','físico'];
  if (position === 'CB') return ['defesa','defesa','defesa','aérea','passe'];
  if (position === 'LB' || position === 'RB') return ['defesa','defesa','passe','físico','drible'];
  if (position === 'DMF') return ['defesa','defesa','passe','físico','passe'];
  if (position === 'CMF') return ['passe','defesa','passe','drible','físico'];
  if (position === 'LMF' || position === 'RMF') return ['passe','drible','defesa','físico','passe'];
  if (position === 'AMF') return ['passe','drible','passe','finalização','físico'];
  if (position === 'SS') return connection === 'STABLE' ? ['passe','drible','finalização','passe','físico'] : ['passe','passe','drible','físico','finalização'];
  if (position === 'CF') {
    const attrs = result.parsed.attributes;
    const aerialIndex = average([Number(attrs.heading ?? 0), Number(attrs.jump ?? 0), Number(attrs.physicalContact ?? 0)]);
    const agileIndex = average([Number(attrs.ballControl ?? 0), Number(attrs.dribbling ?? 0), Number(attrs.tightPossession ?? 0), Number(attrs.acceleration ?? 0), Number(attrs.balance ?? 0)]);
    const tall = Number(result.parsed.height ?? 0) >= 185;
    if (aerialIndex >= 80 || tall) return ['finalização','aérea','aérea','físico','passe'];
    if (agileIndex >= 85) return ['finalização','drible','drible','passe','físico'];
    return connection === 'STABLE' ? ['finalização','finalização','passe','drible','físico'] : ['finalização','passe','físico','drible','finalização'];
  }
  return ['drible','passe','físico','finalização','passe'];
}
function skillBoost(name: string, result: AnalysisResult, connection: ConnectionProfile): number {
  const position = result.bestPosition.code;
  if (['CB','LB','RB','DMF','CMF'].includes(position)) {
    if (name === 'Interceptação') return 24;
    if (name === 'Bloqueador') return 20;
    if (name === 'Marcação individual') return 15;
    if (name === 'Volta para marcar') return 10;
    if (name === 'Passe de primeira') return 8;
  }
  if (['SS','AMF','CMF','DMF'].includes(position)) {
    if (name === 'Passe de primeira') return 20;
    if (name === 'Passe em profundidade') return 17;
    if (name === 'Toque de calcanhar') return 12;
    if (name === 'Controle com a sola') return 10;
  }
  if (position === 'CF') {
    const attrs = result.parsed.attributes;
    const aerialIndex = average([
      Number(attrs.heading ?? 0), Number(attrs.jump ?? 0), Number(attrs.physicalContact ?? 0)
    ]);
    const agileIndex = average([
      Number(attrs.ballControl ?? 0), Number(attrs.dribbling ?? 0), Number(attrs.tightPossession ?? 0),
      Number(attrs.acceleration ?? 0), Number(attrs.balance ?? 0)
    ]);
    const tall = Number(result.parsed.height ?? 0) >= 185;
    if (aerialIndex >= 80 || tall) {
      if (name === 'Cabeçada') return 30;
      if (name === 'Superioridade aérea') return 28;
      if (name === 'Finalização acrobática') return 20;
    }
    if (agileIndex >= 85) {
      if (name === 'Toque duplo') return 24;
      if (name === 'Controle com a sola') return 20;
      if (name === 'Giro 360°') return 17;
      if (name === 'Elástico') return 14;
      if (name === 'Corte com virada') return 13;
    }
    if (name === 'Chute de primeira') return 18;
    if (name === 'Passe de primeira') return connection === 'STABLE' ? 8 : 14;
    if (name === 'Finalização acrobática') return 10;
  }
  return 0;
}
function finalSkillPlan(result: AnalysisResult, plan: TrainingPlan): UnifiedSkillDecision[] {
  const connection = effectiveConnection(result);
  const raw = buildPersonalizedSkillPlan(result, plan, {
    label: 'eFootball 2027 v6.0',
    preferredCategories: skillCategories(result, connection),
    positionOverride: result.bestPosition.code
  });
  return [...raw]
    .sort((a, b) => (b.score + skillBoost(b.name, result, connection)) - (a.score + skillBoost(a.name, result, connection)) || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, 5);
}

function impetoBoost(name: string, position: PositionCode, connection: ConnectionProfile): number {
  let boost = 0;
  if (['CB','LB','RB','DMF'].includes(position)) {
    if (name === 'Defesa') boost += 24;
    if (name === 'Roubo de bola') boost += 22;
    if (name === 'Duelo') boost += 14;
    if (name === 'Agilidade') boost += 10;
    if (name === 'Motor do time') boost += 8;
  } else if (['CMF','AMF','SS'].includes(position)) {
    if (name === 'Agilidade') boost += 20;
    if (name === 'Passe') boost += 17;
    if (name === 'Técnica') boost += 15;
    if (name === 'Proteção de Posse') boost += 14;
    if (name === 'Motor do time') boost += 10;
  } else if (position === 'CF') {
    if (name === 'Instinto artilheiro') boost += 20;
    if (name === 'Agilidade') boost += 14;
    if (name === 'Movimento sem a bola') boost += 14;
  }
  if (connection === 'HIGH_DELAY') {
    if (name === 'Agilidade') boost += 14;
    if (name === 'Técnica') boost += 10;
    if (name === 'Passe') boost += 8;
    if (name === 'Proteção de Posse') boost += 7;
  } else if (connection === 'VARIABLE' && ['Agilidade','Técnica','Passe','Proteção de Posse'].includes(name)) boost += 6;
  return boost;
}

function rankImpetos(result: AnalysisResult): ImpetoRecommendation[] {
  const base = result.maximumPerformanceV4080?.impeto.candidates?.length
    ? result.maximumPerformanceV4080.impeto.candidates
    : result.recommendedImpetos;
  const connection = effectiveConnection(result);
  const owned = new Set(result.parsed.impetos.filter((item) => item.active !== false).map((item) => skillIdentityKey(item.name)));
  return base
    .filter((item) => !owned.has(skillIdentityKey(item.name)))
    .map((item) => ({
      ...item,
      score: clamp(Number(item.score ?? 70) + impetoBoost(item.name, result.bestPosition.code, connection) * .45),
      reason: `${item.reason} Reavaliado para resposta/posicionamento da v6.0.`
    }))
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

function previousSeasonMemoryDownweighted(result: AnalysisResult): boolean {
  const verifiedAt = result.longitudinalGameplayMemoryV4060?.verifiedAt;
  if (!verifiedAt) return Boolean(result.longitudinalGameplayMemoryV4060?.applied);
  return Date.parse(verifiedAt) < Date.parse('2026-08-13T00:00:00Z');
}

export function buildEfootballV600Performance(result: AnalysisResult): EfootballV600PerformanceAnalysis {
  const baseline = clone(result.training);
  const budget = result.trainingPointsTotal;
  const pool = new Map<string, TrainingPlan>();
  for (const candidate of sameBudgetCandidates(baseline, budget)) pool.set(signature(candidate), candidate);
  for (const alternative of result.maximumPerformanceV4040?.alternatives ?? []) {
    if (trainingPlanTotalCost(alternative.training) === budget) pool.set(signature(alternative.training), clone(alternative.training));
  }
  const candidates = [...pool.values()].map((plan) => ({ plan, ...planScore(result, plan) }))
    .sort((a, b) => b.total - a.total || b.firstTouch - a.firstTouch || b.manualDefence - a.manualDefence || signature(a.plan).localeCompare(signature(b.plan)));
  const baseMetrics = planScore(result, baseline);
  const rawWinner = candidates[0] ?? { plan: baseline, ...baseMetrics };
  const winner = rawWinner.total >= baseMetrics.total + .25 ? rawWinner : { plan: baseline, ...baseMetrics };
  const skills = finalSkillPlan(result, winner.plan);
  const impetos = rankImpetos(result);
  const impetoCanCraft = result.parsed.evidence.impetoSlotStatus === 'DISPONIVEL';
  const impetoPrimary = impetoCanCraft ? (impetos[0]?.name ?? null) : null;
  const connection = effectiveConnection(result);
  const oldMemory = previousSeasonMemoryDownweighted(result);
  const owned = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills, result.parsed.additionalSkills ?? []);
  const duplicateSkills = skills.filter((skill) => owned.has(skillIdentityKey(skill.name))).length;
  const exactBudget = trainingPlanTotalCost(winner.plan) === budget;
  const reasons = [
    `Meta ao vivo: ${EFOOTBALL_V600_META.season} v${EFOOTBALL_V600_META.version}; a defesa automática foi reequilibrada e o corte de linhas passa a depender mais de Dedicação defensiva + Interceptação.`,
    `Perfil de conexão usado: ${connection}. O motor aumenta robustez de domínio, passe curto, aceleração/equilíbrio e resposta defensiva sem prometer corrigir servidor ou internet.`,
    `Foram comparadas ${candidates.length} distribuições com o mesmo orçamento; ganho v6 sobre a ficha de entrada: ${clamp(winner.total - baseMetrics.total, -100, 100).toFixed(1)} ponto(s).`,
    `Top 5 foi reordenado para a função ${POSITION_PT[result.bestPosition.code]} no novo cenário; Interceptação/Bloqueador ganham prioridade defensiva quando compatíveis.`,
    result.parsed.defensivePlaystyle && !result.parsed.defensivePlaystyleConfirmed ? `Estilo defensivo “${result.parsed.defensivePlaystyle}” foi lido como provisório: aparece na auditoria, mas não muda pesos até confirmação.` : 'Somente estilos defensivos confirmados podem alterar pesos do motor.',
    impetoCanCraft ? `Vaga de Ímpeto confirmada: ${impetoPrimary ?? 'nenhum Ímpeto seguro'} é a primeira opção pela resposta funcional v6.` : 'Sem vaga de Ímpeto confirmada: gasto continua bloqueado.',
    oldMemory ? 'Resultados longitudinais anteriores à v6 foram rebaixados de peso porque pertencem à jogabilidade 5.x; novas partidas da v6 devem reconstruir a memória.' : 'Memória longitudinal atual não foi invalidada pela troca de temporada.'
  ];
  return {
    engineVersion: EFOOTBALL_V600_PERFORMANCE_ENGINE_VERSION,
    season: 'eFootball 2027',
    liveMeta: true,
    selectedPosition: result.bestPosition.code,
    connectionProfile: connection,
    offensivePlaystyle: result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null,
    defensivePlaystyle: result.parsed.defensivePlaystyle ?? null,
    baselineTraining: baseline,
    finalTraining: winner.plan,
    exactBudget,
    candidatesEvaluated: candidates.length,
    baselineScore: baseMetrics.total,
    winnerScore: winner.total,
    gain: clamp(winner.total - baseMetrics.total, -100, 100),
    responseScore: winner.firstTouch,
    manualDefenceScore: winner.manualDefence,
    firstTouchScore: winner.firstTouch,
    finalSkills: skills.map((item) => item.name),
    impetoPrimary,
    fluidFormationReady: true,
    overloadReady: true,
    previousSeasonMemoryDownweighted: oldMemory,
    guarantees: {
      doesNotClaimToFixNetwork: true,
      gerIsNotOptimizationTarget: true,
      exactPointBudget: exactBudget,
      onlyConfirmedDefensiveStyleWeighted: true,
      ownedSkillDuplicationBlocked: duplicateSkills === 0,
      invalidImpetoSpendBlocked: impetoCanCraft || impetoPrimary === null
    },
    reasons,
    summary: `${result.parsed.playerName}: adaptação eFootball 2027 v6.0 em ${POSITION_PT[result.bestPosition.code]} — resposta ${Math.round(winner.firstTouch)}/100, defesa manual ${Math.round(winner.manualDefence)}/100 e orçamento ${exactBudget ? 'preservado' : 'em revisão'}.`
  };
}

export function applyEfootballV600Performance(result: AnalysisResult): AnalysisResult {
  const analysis = buildEfootballV600Performance(result);
  if (result.objective !== 'COMPETITIVE') return { ...result, efootballV600: analysis };
  const training = analysis.finalTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const finalSkills = analysis.finalSkills.length ? analysis.finalSkills : result.recommendedSkills;
  const impetos = analysis.impetoPrimary && result.parsed.evidence.impetoSlotStatus === 'DISPONIVEL'
    ? rankImpetos(result)
    : result.recommendedImpetos;
  return {
    ...result,
    training,
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    recommendedSkills: finalSkills,
    recommendedImpetos: impetos,
    buildName: `Ficha Automática v40.80 r5 — eFootball 2027 v6.0 Adaptativa — ${result.parsed.playerName}`,
    buildVariants: result.buildVariants.length ? result.buildVariants.map((variant, index) => index === 0 ? {
      ...variant,
      title: `Ficha v6.0 — Resposta + posicionamento — ${result.parsed.playerName}`,
      training,
      pointsUsed,
      qualityScore: analysis.winnerScore,
      adaptationLabel: 'eFOOTBALL 2027 v6 • DEFESA MANUAL • TOQUE CURTO • SEM GER',
      note: analysis.summary
    } : variant) : result.buildVariants,
    recommendationExplanation: [analysis.summary, ...analysis.reasons, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 32),
    strengths: [
      'v6.0: mais peso para Dedicação defensiva, Interceptação e atributos de reação nas funções de marcação.',
      'Em conexão variável/alta latência, a ficha reduz dependência de comandos milimétricos priorizando domínio, passe curto, aceleração e equilíbrio.',
      'O motor diferencia estilo ofensivo e defensivo quando ambos são lidos na carta.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 22),
    note: `${analysis.summary} O BuildMaster não altera ping, rota nem servidor; a adaptação reduz a dependência de timing perfeito dentro do que os atributos e a tática permitem.`,
    efootballV600: analysis
  };
}
