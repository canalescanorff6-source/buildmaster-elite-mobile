import type {
  AdaptiveMaximumProfileV4030,
  AdaptiveMaximumV4030Analysis,
  AnalysisResult,
  AttributeKey,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingLevelCost, trainingPlanTotalCost } from './trainingPlanCore';
import { skillIdentityKey } from './officialSkillIdentity';
import { EFOOTBALL_META_RUNTIME_V4030 } from './efootballMetaRuntimeV4030';

export const ADAPTIVE_MAXIMUM_V4030_VERSION = '40.30.0' as const;

type DimensionKey = 'creation' | 'control' | 'finishing' | 'movement' | 'defending' | 'physical' | 'aerial' | 'endurance' | 'goalkeeping';
type Dimensions = Record<DimensionKey, number>;
type ProfileId = AdaptiveMaximumProfileV4030['id'];

type ProfileBlueprint = {
  id: ProfileId;
  label: string;
  dimensions: Partial<Record<DimensionKey, number>>;
  training: Partial<Record<TrainingKey, number>>;
  positions: PositionCode[];
};

const PROFILE_BLUEPRINTS: ProfileBlueprint[] = [
  { id: 'FINISHER', label: 'Finalização decisiva', dimensions: { finishing: 1.35, movement: 1.0, control: .35 }, training: { shooting: 1.25, dexterity: .9, lowerBodyStrength: .45, dribbling: .28 }, positions: ['CF', 'SS', 'LWF', 'RWF', 'AMF'] },
  { id: 'CREATOR', label: 'Criação e último passe', dimensions: { creation: 1.35, control: 1.0, movement: .35 }, training: { passing: 1.2, dribbling: .72, dexterity: .48 }, positions: ['SS', 'AMF', 'CMF', 'DMF', 'LWF', 'RWF', 'LMF', 'RMF'] },
  { id: 'DRIBBLER', label: 'Controle e 1 contra 1', dimensions: { control: 1.4, movement: .8, creation: .25 }, training: { dribbling: 1.22, dexterity: .86, lowerBodyStrength: .38 }, positions: ['SS', 'AMF', 'LWF', 'RWF', 'LMF', 'RMF', 'CF'] },
  { id: 'QUICK_COUNTER', label: 'Transição e verticalidade', dimensions: { movement: 1.35, finishing: .7, control: .45, endurance: .35 }, training: { dexterity: .92, lowerBodyStrength: 1.02, shooting: .42, dribbling: .3 }, positions: ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'LMF', 'RMF', 'LB', 'RB'] },
  { id: 'POSSESSION', label: 'Posse e resistência à pressão', dimensions: { creation: 1.1, control: 1.2, endurance: .45 }, training: { passing: .96, dribbling: .84, dexterity: .46, lowerBodyStrength: .34 }, positions: ['SS', 'AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB', 'LWF', 'RWF'] },
  { id: 'PRESSING', label: 'Pressão e recuperação', dimensions: { defending: .95, endurance: 1.15, movement: .72, physical: .55 }, training: { defending: .72, lowerBodyStrength: .88, dexterity: .34 }, positions: ['CF', 'SS', 'AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB', 'CB'] },
  { id: 'DEFENSIVE', label: 'Defesa e cobertura', dimensions: { defending: 1.45, physical: .72, endurance: .45 }, training: { defending: 1.28, lowerBodyStrength: .62, aerialStrength: .36 }, positions: ['CB', 'DMF', 'CMF', 'LB', 'RB', 'LMF', 'RMF'] },
  { id: 'AERIAL', label: 'Duelo físico e jogo aéreo', dimensions: { aerial: 1.4, physical: .95, finishing: .25 }, training: { aerialStrength: 1.25, lowerBodyStrength: .64, shooting: .25 }, positions: ['CF', 'CB', 'DMF', 'LB', 'RB', 'GK'] },
  { id: 'GOALKEEPER', label: 'Goleiro completo', dimensions: { goalkeeping: 1.6, aerial: .45, physical: .25 }, training: { gk2: 1.2, gk3: 1.1, gk1: 1.0, aerialStrength: .24 }, positions: ['GK'] }
];

const POSITION_BASE: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 1.28, dexterity: 1.0, lowerBodyStrength: .72, dribbling: .34, aerialStrength: .34 },
  SS: { shooting: .78, dribbling: .95, dexterity: .95, passing: .72, lowerBodyStrength: .4 },
  LWF: { dribbling: 1.08, dexterity: 1.0, lowerBodyStrength: .72, shooting: .62, passing: .36 },
  RWF: { dribbling: 1.08, dexterity: 1.0, lowerBodyStrength: .72, shooting: .62, passing: .36 },
  LMF: { passing: .85, lowerBodyStrength: .8, dribbling: .62, dexterity: .68, defending: .42 },
  RMF: { passing: .85, lowerBodyStrength: .8, dribbling: .62, dexterity: .68, defending: .42 },
  AMF: { passing: 1.08, dribbling: .92, dexterity: .78, shooting: .46, lowerBodyStrength: .28 },
  CMF: { passing: .98, lowerBodyStrength: .74, defending: .58, dribbling: .5, dexterity: .6 },
  DMF: { defending: 1.14, passing: .76, lowerBodyStrength: .76, aerialStrength: .34, dexterity: .34 },
  CB: { defending: 1.3, aerialStrength: .88, lowerBodyStrength: .72, dexterity: .34, passing: .22 },
  LB: { defending: .9, lowerBodyStrength: .86, dexterity: .66, passing: .58, dribbling: .32 },
  RB: { defending: .9, lowerBodyStrength: .86, dexterity: .66, passing: .58, dribbling: .32 },
  GK: { gk2: 1.18, gk3: 1.12, gk1: 1.0, aerialStrength: .28, lowerBodyStrength: .16 }
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function average(values: number[]): number {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function attrs(result: AnalysisResult, keys: AttributeKey[]): number {
  return average(keys.map((key) => Number(result.parsed.attributes[key] ?? 0)));
}

function dimensions(result: AnalysisResult): Dimensions {
  return {
    creation: clamp(attrs(result, ['lowPass', 'loftedPass', 'ballControl', 'curl'])),
    control: clamp(attrs(result, ['ballControl', 'dribbling', 'tightPossession', 'balance'])),
    finishing: clamp(attrs(result, ['finishing', 'offensiveAwareness', 'kickingPower', 'curl'])),
    movement: clamp(attrs(result, ['offensiveAwareness', 'speed', 'acceleration', 'stamina'])),
    defending: clamp(attrs(result, ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'])),
    physical: clamp(attrs(result, ['physicalContact', 'balance', 'speed', 'stamina'])),
    aerial: clamp(attrs(result, ['heading', 'jump', 'physicalContact'])),
    endurance: clamp(attrs(result, ['stamina', 'speed', 'balance'])),
    goalkeeping: clamp(attrs(result, ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach']))
  };
}

function normalize(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function playstyleBoost(profile: ProfileId, playstyle: string): number {
  const style = normalize(playstyle);
  if (!style) return 0;
  if (profile === 'FINISHER' && /(artilheiro|homem de area)/.test(style)) return 11;
  if (profile === 'CREATOR' && /(armador criativo|orquestrador|pivo|atacante pivo|classico)/.test(style)) return 10;
  if (profile === 'DRIBBLER' && /(armador criativo|ala produtivo|lateral movel)/.test(style)) return 7;
  if (profile === 'QUICK_COUNTER' && /(puxa marcacao|jogador de infiltracao|infiltracao|atacante surpresa|meia versatil)/.test(style)) return 9;
  if (profile === 'POSSESSION' && /(armador criativo|orquestrador|classico|primeiro volante)/.test(style)) return 8;
  if (profile === 'PRESSING' && /(o destruidor|destruidor|meia versatil|jogador de infiltracao|infiltracao)/.test(style)) return 9;
  if (profile === 'DEFENSIVE' && /(lateral defensivo|defensor criativo|primeiro volante|o destruidor|destruidor)/.test(style)) return 11;
  if (profile === 'AERIAL' && /(pivo|atacante pivo|homem de area)/.test(style)) return 8;
  if (profile === 'GOALKEEPER' && /goleiro/.test(style)) return 12;
  return 0;
}

function scoreProfile(result: AnalysisResult, blueprint: ProfileBlueprint, d: Dimensions): number {
  if (!blueprint.positions.includes(result.bestPosition.code)) return 0;
  const entries = Object.entries(blueprint.dimensions) as Array<[DimensionKey, number]>;
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  const raw = entries.reduce((sum, [key, weight]) => sum + d[key] * weight, 0) / totalWeight;
  return clamp(raw + playstyleBoost(blueprint.id, result.parsed.playstyle ?? ''), 0, 99);
}

function inferProfiles(result: AnalysisResult): AdaptiveMaximumProfileV4030[] {
  const d = dimensions(result);
  const ranked = PROFILE_BLUEPRINTS
    .map((blueprint) => ({ blueprint, score: scoreProfile(result, blueprint, d) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.blueprint.id.localeCompare(right.blueprint.id));
  return ranked.slice(0, 3).map(({ blueprint, score }, index) => ({
    id: blueprint.id,
    label: blueprint.label,
    score,
    rank: index + 1,
    reason: index === 0
      ? `É o perfil interno que melhor combina os atributos, o estilo e a função de ${POSITION_PT[result.bestPosition.code]}.`
      : 'Complementa o perfil principal sem substituir a identidade natural da carta.'
  }));
}

function emptyWeights(): Record<TrainingKey, number> {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function mergedWeights(result: AnalysisResult, profiles: AdaptiveMaximumProfileV4030[]): Record<TrainingKey, number> {
  const weights = emptyWeights();
  const add = (source: Partial<Record<TrainingKey, number>>, multiplier = 1) => {
    for (const key of TRAINING_KEYS) weights[key] += Number(source[key] ?? 0) * multiplier;
  };
  add(POSITION_BASE[result.bestPosition.code], 1.35);
  profiles.forEach((profile, index) => {
    const blueprint = PROFILE_BLUEPRINTS.find((item) => item.id === profile.id);
    if (blueprint) add(blueprint.training, index === 0 ? 1.0 : index === 1 ? .48 : .24);
  });

  // Contexto tático é ajuste fino. Ele nunca substitui o DNA da carta.
  if (result.tacticalProfile.style === 'POSSE_DE_BOLA') add({ passing: .34, dribbling: .28, dexterity: .14 }, 1);
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE') add({ passing: .2, lowerBodyStrength: .3, dexterity: .2 }, 1);
  if (result.tacticalProfile.style === 'CONTRA_ATAQUE_RAPIDO') add({ lowerBodyStrength: .38, dexterity: .32, shooting: .16, dribbling: .12 }, 1);

  // Robustez para partidas online: resposta e estabilidade ganham peso, mas só em grupos úteis da posição.
  if (result.bestPosition.code !== 'GK') {
    weights.dexterity += .12;
    weights.lowerBodyStrength += .12;
  }
  return weights;
}

function clone(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

function signature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function distance(a: TrainingPlan, b: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(a[key] ?? 0) - Number(b[key] ?? 0)), 0);
}

function generateNeighbors(seed: TrainingPlan): TrainingPlan[] {
  const output: TrainingPlan[] = [clone(seed)];
  const seen = new Set<string>([signature(seed)]);
  for (const donor of TRAINING_KEYS) {
    const donorLevel = Number(seed[donor] ?? 0);
    for (let remove = 1; remove <= Math.min(2, donorLevel); remove += 1) {
      const refund = Array.from({ length: remove }, (_, index) => trainingLevelCost(donorLevel - index)).reduce((sum, value) => sum + value, 0);
      for (const receiver of TRAINING_KEYS) {
        if (receiver === donor) continue;
        const receiverLevel = Number(seed[receiver] ?? 0);
        for (let add = 1; add <= Math.min(3, 16 - receiverLevel); add += 1) {
          const cost = Array.from({ length: add }, (_, index) => trainingLevelCost(receiverLevel + index + 1)).reduce((sum, value) => sum + value, 0);
          if (cost !== refund) continue;
          const next = clone(seed);
          next[donor] -= remove;
          next[receiver] += add;
          const key = signature(next);
          if (!seen.has(key)) { seen.add(key); output.push(next); }
        }
      }
    }
  }
  return output.slice(0, 96);
}

function weightedPlanScore(plan: TrainingPlan, weights: Record<TrainingKey, number>): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    const effective = Math.min(level, 10) + Math.max(0, level - 10) * .38;
    const weight = Math.max(0, weights[key]);
    weighted += (effective / 13) * 100 * weight;
    totalWeight += weight;
  }
  return totalWeight ? clamp(weighted / totalWeight) : 0;
}

function wastePenalty(plan: TrainingPlan, weights: Record<TrainingKey, number>, position: PositionCode): number {
  let penalty = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    if (weights[key] < .18 && level > 4) penalty += (level - 4) * 1.5;
    if (level > 12) penalty += (level - 12) * .8;
    if (position !== 'GK' && key.startsWith('gk') && level > 0) penalty += level * 4;
    if (position === 'GK' && ['shooting', 'dribbling', 'defending'].includes(key) && level > 0) penalty += level * 2;
  }
  return penalty;
}

function contextScores(plan: TrainingPlan, weights: Record<TrainingKey, number>, core: TrainingPlan, result: AnalysisResult) {
  const base = weightedPlanScore(plan, weights);
  const preserve = clamp(100 - distance(core, plan) * 4.3);
  const online = clamp(base * .74 + preserve * .2 + ((plan.dexterity + plan.lowerBodyStrength) / 28) * 100 * .06 - wastePenalty(plan, weights, result.bestPosition.code));
  const events = clamp(base * .82 + preserve * .18 - wastePenalty(plan, weights, result.bestPosition.code) * .8);
  const friends = clamp(base * .72 + preserve * .28 - wastePenalty(plan, weights, result.bestPosition.code) * .7);
  return { ranked: online, events, friends, average: clamp((online + events + friends) / 3) };
}

function candidateScore(plan: TrainingPlan, core: TrainingPlan, weights: Record<TrainingKey, number>, result: AnalysisResult): number {
  const contexts = contextScores(plan, weights, core, result);
  const preserve = clamp(100 - distance(core, plan) * 4.3);
  const exact = trainingPlanTotalCost(plan) === trainingPlanTotalCost(core) ? 100 : 0;
  return clamp(contexts.average * .66 + preserve * .2 + exact * .14);
}

function skillsIntegrity(result: AnalysisResult) {
  const owned = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
  const recommended = result.recommendedSkills.map(skillIdentityKey);
  return {
    duplicatesWithOwned: recommended.filter((key) => owned.has(key)).length,
    uniqueRecommended: new Set(recommended).size,
    fiveSlotsRespected: result.recommendedSkills.length <= 5
  };
}

export function buildAdaptiveMaximumV4030(result: AnalysisResult): AdaptiveMaximumV4030Analysis {
  const profiles = inferProfiles(result);
  const core = clone(result.performanceFunctionV3940?.finalTraining ?? result.training);
  const weights = mergedWeights(result, profiles);
  const candidates = result.objective === 'COMPETITIVE' ? generateNeighbors(core) : [core];
  const ranked = candidates
    .filter((plan) => trainingPlanTotalCost(plan) === trainingPlanTotalCost(core) && distance(core, plan) <= 6)
    .map((plan) => ({ plan, score: candidateScore(plan, core, weights, result), contexts: contextScores(plan, weights, core, result) }))
    .sort((left, right) => right.score - left.score || signature(left.plan).localeCompare(signature(right.plan)));
  const baseline = ranked.find((item) => signature(item.plan) === signature(core)) ?? { plan: core, score: candidateScore(core, core, weights, result), contexts: contextScores(core, weights, core, result) };
  const best = ranked[0] ?? baseline;
  const meaningful = result.objective === 'COMPETITIVE' && best.score >= baseline.score + .25;
  const winner = meaningful ? best : baseline;
  const changes = TRAINING_KEYS.filter((key) => Number(core[key] ?? 0) !== Number(winner.plan[key] ?? 0)).map((key) => ({ key, label: TRAINING_LABELS[key], from: Number(core[key] ?? 0), to: Number(winner.plan[key] ?? 0) }));
  const integrity = skillsIntegrity(result);
  const objectiveMode = result.objective === 'COMPETITIVE' ? 'ADAPTATIVO' as const : 'ESPECIALIZACAO_MANUAL' as const;
  const consistencyKey = [
    result.canonicalCardV3890?.canonicalCardId ?? result.adaptivePositionV3930?.canonicalCardId ?? result.parsed.internalId,
    result.bestPosition.code,
    result.objective ?? 'COMPETITIVE',
    profiles.map((item) => item.id).join('-'),
    signature(winner.plan)
  ].join('::');
  const reasons = [
    `Perfil interno principal: ${profiles[0]?.label ?? 'equilíbrio funcional'}; os demais perfis apenas complementam a decisão.`,
    `Foram avaliadas ${ranked.length} distribuições determinísticas com exatamente o mesmo orçamento da ficha-base.`,
    `Robustez estimada: ranqueada ${Math.round(winner.contexts.ranked)}/100, eventos ${Math.round(winner.contexts.events)}/100 e contra amigos ${Math.round(winner.contexts.friends)}/100.`,
    `A otimização não usa GER como objetivo e limita deslocamentos para preservar o DNA já consolidado pelos motores anteriores.`,
    EFOOTBALL_META_RUNTIME_V4030.speculativeWeightsApplied
      ? 'Há pesos experimentais da próxima versão.'
      : `Meta oficial: eFootball v${EFOOTBALL_META_RUNTIME_V4030.stableVersion}; este estágio legado não aplica pesos especulativos e delega os pesos confirmados da v6 ao motor dedicado.`
  ];
  return {
    engineVersion: ADAPTIVE_MAXIMUM_V4030_VERSION,
    mode: 'DESEMPENHO_MAXIMO_ADAPTATIVO',
    objectiveMode,
    deterministic: true,
    selectedPosition: result.bestPosition.code,
    selectedPositionLabel: POSITION_PT[result.bestPosition.code],
    profiles,
    baseTraining: core,
    finalTraining: winner.plan,
    exactBudget: trainingPlanTotalCost(winner.plan) === trainingPlanTotalCost(core),
    candidatesEvaluated: ranked.length,
    baselineScore: baseline.score,
    winnerScore: winner.score,
    contextScores: winner.contexts,
    changes,
    consistencyKey,
    skillIntegrity: integrity,
    metaRuntime: EFOOTBALL_META_RUNTIME_V4030,
    guarantees: {
      gerIsNotOptimizationTarget: true,
      noRandomness: true,
      exactPointBudget: trainingPlanTotalCost(winner.plan) === trainingPlanTotalCost(core),
      nativeSkillDuplicationBlocked: integrity.duplicatesWithOwned === 0,
      speculativeNextPatchWeightsBlocked: !EFOOTBALL_META_RUNTIME_V4030.speculativeWeightsApplied
    },
    reasons,
    summary: `${result.parsed.playerName}: Desempenho Máximo Adaptativo em ${POSITION_PT[result.bestPosition.code]} com ${profiles[0]?.label ?? 'perfil funcional'} e robustez média ${Math.round(winner.contexts.average)}/100.`
  };
}

export function applyAdaptiveMaximumV4030(result: AnalysisResult): AnalysisResult {
  const analysis = buildAdaptiveMaximumV4030(result);
  const training = analysis.finalTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const applied = analysis.objectiveMode === 'ADAPTATIVO';
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.30 — Motor Adaptativo por Carta v39.30 + Função Real v39.40 + Desempenho Máximo Adaptativo v40.30 — ${result.parsed.playerName}`,
    positionLabel: `${analysis.selectedPositionLabel} • ${analysis.profiles[0]?.label ?? 'Perfil funcional'}`,
    training,
    pointsUsed,
    note: analysis.summary,
    qualityScore: analysis.winnerScore,
    adaptationLabel: 'DNA + FUNÇÃO + META ATUAL + ROBUSTEZ • SEM CAÇAR GER',
    highlights: [
      `Perfil: ${analysis.profiles[0]?.label ?? 'adaptativo'}.`,
      `Robustez média: ${Math.round(analysis.contextScores.average)}/100.`,
      `${analysis.candidatesEvaluated} candidatas comparadas com orçamento idêntico.`,
      'Próxima versão do eFootball não altera pesos antes de validação.'
    ],
    risks: analysis.guarantees.nativeSkillDuplicationBlocked ? [] : ['Revisar inventário de habilidades antes de gastar recursos.'],
    efficiencyScore: analysis.winnerScore,
    balanceScore: analysis.contextScores.average,
    verdict: applied ? 'Ficha adaptativa escolhida pelo motor principal.' : 'Especialização manual preservada; o motor adaptativo atua apenas como auditor.',
    tradeOffs: [],
    simulationsTested: analysis.candidatesEvaluated
  };
  return {
    ...result,
    training: applied ? training : result.training,
    trainingPointsUsed: applied ? pointsUsed : result.trainingPointsUsed,
    trainingPointsRemaining: applied ? Math.max(0, result.trainingPointsTotal - pointsUsed) : result.trainingPointsRemaining,
    buildVariants: applied ? [variant] : result.buildVariants,
    buildName: applied ? variant.title : result.buildName,
    recommendationExplanation: [analysis.summary, ...analysis.reasons, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 24),
    strengths: [
      'O modo principal escolhe sozinho o subperfil funcional da carta e não exige que o usuário adivinhe se ela deve ser finalizadora, criadora ou dribladora.',
      'A mesma entrada produz a mesma receita: não há sorteio nem variação aleatória.',
      'Ranqueada, eventos e partidas contra amigos entram como teste de robustez da mesma ficha, sem criar três receitas incompatíveis.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 16),
    note: `${analysis.summary} O valor 99% é tratado como meta de consistência e auditoria do motor, não como promessa matemática de vitória ou ganho de desempenho.`,
    adaptiveMaximumV4030: analysis
  };
}
