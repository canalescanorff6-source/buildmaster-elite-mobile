import type {
  AnalysisResult,
  AttributeKey,
  CardFirstAiV3880Analysis,
  CardFirstCandidateV3880,
  CardFirstConversionClass,
  CardFirstDimensionId,
  CardFirstDimensionScore,
  ImpetoRecommendation,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { ATTRIBUTE_PT, POSITION_PT } from './analyzerDomain';
import { fitTrainingToExactBudget } from '../modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  emptyTraining,
  trainingPlanCost,
  trainingPlanTotalCost,
  trainingTotalCost
} from './trainingPlanCore';
import { TRAINING_LABELS } from './trainingEngine';
import {
  buildPersonalizedSkillPlan,
  type AdditionalSkillProfileOptions
} from './skillIntelligenceV31';
import { filterComplementaryAdditionalSkills, skillIdentityKey } from './officialSkillIdentity';
import { evaluateTrainingPlanProgressionOnlyV3860 } from './maxMatchPerformanceEngineV3860';

export const CARD_FIRST_AI_V3880_VERSION = '38.80.0' as const;

const CARD_FIRST_IMPROVEMENTS = [
  'A posição escolhida virou restrição de uso, e não molde principal da ficha.',
  'A posição original da carta participa da identidade, mas não obriga uma ficha genérica.',
  'Atributos reais da versão lida possuem peso maior que a posição final.',
  'Estilo de jogo oficial altera o arquétipo individual da carta.',
  'Habilidades nativas funcionam como evidência do comportamento real esperado.',
  'Habilidades especiais recebem grupos de ativação próprios.',
  'Duas cartas usadas como SA podem receber fichas, habilidades e Ímpetos diferentes.',
  'Conversões CA para SA preservam finalização e movimento quando esse for o DNA dominante.',
  'Conversões MAT para SA preservam criação, controle e tabela quando esse for o DNA dominante.',
  'O motor identifica arquétipo principal e secundário antes de distribuir pontos.',
  'O motor mede criação, controle, finalização, movimento, defesa, físico, jogo aéreo e resistência.',
  'O alvo tático é adaptado ao arquétipo, em vez de apagar a identidade da carta.',
  'A busca começa com sementes de identidade, adaptação, habilidade especial e robustez.',
  'A busca compara redistribuições locais em todos os grupos permitidos.',
  'Todas as candidatas são ajustadas ao orçamento exato antes da avaliação.',
  'A identidade responde pela maior parte da nota final.',
  'A função escolhida possui peso limitado para impedir clonagem por posição.',
  'A robustez em partida entra como validação, não como fonte da personalidade da carta.',
  'O motor penaliza investimento alto em grupo que não combina com o DNA lido.',
  'O motor protege os dois grupos que mais representam a carta.',
  'A distância do modelo genérico da posição é auditada.',
  'O motor evita corrigir toda fraqueza até transformar a carta em outro jogador.',
  'O Top adicional é montado por categorias derivadas do DNA individual.',
  'O catálogo da posição continua sendo usado apenas como trava de compatibilidade.',
  'Habilidades já possuídas continuam bloqueadas.',
  'O Ímpeto é recalculado depois da ficha e das habilidades.',
  'O Ímpeto prioriza lacunas importantes que restaram na versão específica da carta.',
  'Áreas já saturadas recebem penalidade no ranking de Ímpetos.',
  'A conversão é classificada como natural, compatível, reinterpretada, arriscada ou extrema.',
  'Conversões arriscadas são permitidas, mas ficam claramente sinalizadas.',
  'O perfil anti-delay preserva o DNA em vez de aplicar a mesma receita para todos.',
  'O resultado mostra o que veio da carta e o que veio da função escolhida.',
  'A saída pública continua limitada a três fichas aplicáveis.',
  'A mesma carta, com os mesmos dados, produz resultado determinístico.',
  'Cartas diferentes na mesma posição recebem assinaturas diferentes quando o DNA é diferente.',
  'Nenhuma dimensão de decisão usa GER ou Overall.'
] as const;

type DimensionDefinition = {
  id: CardFirstDimensionId;
  label: string;
  attributes: Array<[AttributeKey, number]>;
};

type GroupWeights = Partial<Record<TrainingKey, number>>;
type CandidateSeed = { id: string; title: string; source: string; weights: GroupWeights; training?: TrainingPlan };

type ImpetoLike = ImpetoRecommendation & {
  supportedGroups?: TrainingKey[];
  performanceScore?: number;
  attributeCoverage?: number;
  buildSynergy?: number;
  skillSynergy?: number;
  saturationPenalty?: number;
};

const DIMENSIONS: DimensionDefinition[] = [
  { id: 'CREATION', label: 'Criação', attributes: [['lowPass', .36], ['loftedPass', .23], ['ballControl', .18], ['curl', .1], ['tightPossession', .08], ['placeKicking', .05]] },
  { id: 'CONTROL', label: 'Controle e condução', attributes: [['ballControl', .25], ['tightPossession', .25], ['dribbling', .23], ['balance', .15], ['acceleration', .08], ['lowPass', .04]] },
  { id: 'FINISHING', label: 'Finalização', attributes: [['finishing', .38], ['offensiveAwareness', .26], ['kickingPower', .17], ['curl', .08], ['heading', .06], ['balance', .05]] },
  { id: 'MOVEMENT', label: 'Movimento', attributes: [['offensiveAwareness', .25], ['acceleration', .24], ['speed', .2], ['balance', .12], ['stamina', .12], ['ballControl', .07]] },
  { id: 'DEFENDING', label: 'Defesa', attributes: [['defensiveAwareness', .28], ['defensiveEngagement', .24], ['tackling', .24], ['aggression', .13], ['speed', .06], ['physicalContact', .05]] },
  { id: 'PHYSICAL', label: 'Físico', attributes: [['physicalContact', .31], ['balance', .24], ['speed', .14], ['acceleration', .12], ['jump', .1], ['stamina', .09]] },
  { id: 'AERIAL', label: 'Jogo aéreo', attributes: [['heading', .34], ['jump', .28], ['physicalContact', .2], ['offensiveAwareness', .09], ['defensiveAwareness', .09]] },
  { id: 'ENDURANCE', label: 'Resistência competitiva', attributes: [['stamina', .42], ['balance', .19], ['speed', .14], ['acceleration', .13], ['physicalContact', .07], ['defensiveEngagement', .05]] },
  { id: 'GOALKEEPING', label: 'Goleiro', attributes: [['goalkeeperAwareness', .24], ['goalkeeperReflexes', .23], ['goalkeeperReach', .21], ['goalkeeperParrying', .18], ['goalkeeperCatching', .14]] }
];

const DIMENSION_TO_GROUPS: Record<CardFirstDimensionId, GroupWeights> = {
  CREATION: { passing: 1, dribbling: .2 },
  CONTROL: { dribbling: .78, dexterity: .16, passing: .06 },
  FINISHING: { shooting: .76, dexterity: .16, aerialStrength: .08 },
  MOVEMENT: { dexterity: .48, lowerBodyStrength: .38, shooting: .08, dribbling: .06 },
  DEFENDING: { defending: .82, lowerBodyStrength: .12, aerialStrength: .06 },
  PHYSICAL: { lowerBodyStrength: .62, aerialStrength: .24, dexterity: .14 },
  AERIAL: { aerialStrength: .78, lowerBodyStrength: .14, shooting: .04, defending: .04 },
  ENDURANCE: { lowerBodyStrength: .58, dexterity: .2, defending: .12, dribbling: .1 },
  GOALKEEPING: { gk1: .32, gk2: .36, gk3: .32 }
};

const TARGET_CONSTRAINTS: Record<PositionCode, GroupWeights> = {
  CF: { shooting: 1, dexterity: .72, lowerBodyStrength: .62, aerialStrength: .36, dribbling: .28, passing: .16 },
  SS: { shooting: .64, passing: .62, dribbling: .66, dexterity: .82, lowerBodyStrength: .44, aerialStrength: .12, defending: .08 },
  LWF: { shooting: .46, passing: .46, dribbling: .9, dexterity: .92, lowerBodyStrength: .72, defending: .08 },
  RWF: { shooting: .46, passing: .46, dribbling: .9, dexterity: .92, lowerBodyStrength: .72, defending: .08 },
  LMF: { passing: .76, dribbling: .58, dexterity: .62, lowerBodyStrength: .8, defending: .52, shooting: .16 },
  RMF: { passing: .76, dribbling: .58, dexterity: .62, lowerBodyStrength: .8, defending: .52, shooting: .16 },
  AMF: { passing: 1, dribbling: .82, dexterity: .62, shooting: .46, lowerBodyStrength: .24, defending: .06 },
  CMF: { passing: .9, dribbling: .48, dexterity: .5, lowerBodyStrength: .76, defending: .74, shooting: .18, aerialStrength: .18 },
  DMF: { passing: .68, dribbling: .28, dexterity: .42, lowerBodyStrength: .7, defending: 1, aerialStrength: .38, shooting: .04 },
  CB: { passing: .28, dexterity: .38, lowerBodyStrength: .66, defending: 1, aerialStrength: .82, dribbling: .06 },
  LB: { passing: .62, dribbling: .44, dexterity: .68, lowerBodyStrength: .78, defending: .82, aerialStrength: .24, shooting: .06 },
  RB: { passing: .62, dribbling: .44, dexterity: .68, lowerBodyStrength: .78, defending: .82, aerialStrength: .24, shooting: .06 },
  GK: { gk1: .96, gk2: 1, gk3: .98, aerialStrength: .28, lowerBodyStrength: .16 }
};

const GROUP_ATTRIBUTE_EVIDENCE: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing', 'offensiveAwareness', 'kickingPower', 'curl'],
  passing: ['lowPass', 'loftedPass', 'ballControl', 'curl'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession', 'balance'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'stamina', 'physicalContact', 'balance'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach', 'goalkeeperAwareness']
};

function clamp(value: number, min = 0, max = 98) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function hash(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function allowedKeys(position: PositionCode): TrainingKey[] {
  return position === 'GK'
    ? ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength']
    : ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
}

function attributeValues(result: AnalysisResult) {
  const present = Object.values(result.parsed.attributes).filter((value): value is number => Number.isFinite(value));
  const fallback = present.length ? Math.max(62, Math.min(80, average(present))) : 70;
  return Object.fromEntries((Object.keys(ATTRIBUTE_PT) as AttributeKey[]).map((key) => [key, Number(result.parsed.attributes[key] ?? fallback)])) as Record<AttributeKey, number>;
}

function dimensionScores(result: AnalysisResult): CardFirstDimensionScore[] {
  const attributes = attributeValues(result);
  const naturalPosition = result.parsed.mainPosition;
  const dimensions = DIMENSIONS.map((definition) => {
    const score = definition.attributes.reduce((sum, [key, weight]) => sum + attributes[key] * weight, 0);
    const evidence = [...definition.attributes]
      .sort((left, right) => attributes[right[0]] - attributes[left[0]])
      .slice(0, 3)
      .map(([key]) => `${ATTRIBUTE_PT[key]} ${Math.round(attributes[key])}`);
    return { id: definition.id, label: definition.label, score: clamp(score), rank: 0, evidence };
  });
  if (naturalPosition === 'GK') {
    for (const item of dimensions) if (item.id !== 'GOALKEEPING') item.score = clamp(item.score * .28);
  } else {
    const goalkeeper = dimensions.find((item) => item.id === 'GOALKEEPING');
    if (goalkeeper) goalkeeper.score = clamp(goalkeeper.score * .25);
  }
  return dimensions
    .sort((left, right) => right.score - left.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function styleSignals(result: AnalysisResult): GroupWeights {
  const style = normalizeText(result.parsed.playstyle);
  const signals: GroupWeights = {};
  const add = (entries: GroupWeights) => {
    for (const [key, value] of Object.entries(entries) as Array<[TrainingKey, number]>) signals[key] = Number(signals[key] ?? 0) + value;
  };
  if (/armador|criativo|orquestrador|classico|puxa marcacao/.test(style)) add({ passing: .9, dribbling: .45, dexterity: .22 });
  if (/artilheiro|homem de area/.test(style)) add({ shooting: 1, dexterity: .58, aerialStrength: .24 });
  if (/pivo|atacante pivo/.test(style)) add({ lowerBodyStrength: .82, passing: .5, aerialStrength: .4, shooting: .38 });
  if (/infiltracao|infiltracao|atacante surpresa/.test(style)) add({ dexterity: .9, shooting: .55, lowerBodyStrength: .38 });
  if (/meia versatil/.test(style)) add({ lowerBodyStrength: .82, dexterity: .55, passing: .42, defending: .38 });
  if (/primeiro volante/.test(style)) add({ defending: 1, passing: .42, lowerBodyStrength: .5 });
  if (/destruidor/.test(style)) add({ defending: 1, lowerBodyStrength: .58, aerialStrength: .28 });
  if (/defensor criativo/.test(style)) add({ defending: .86, passing: .54, aerialStrength: .3 });
  if (/lateral defensivo/.test(style)) add({ defending: .9, lowerBodyStrength: .52, passing: .28 });
  if (/lateral ofensivo|lateral atacante|lateral movel|ala produtivo|perito em cruzamento/.test(style)) add({ dexterity: .55, lowerBodyStrength: .62, passing: .58, dribbling: .4 });
  if (/goleiro ofensivo/.test(style)) add({ gk2: .72, gk3: .64, lowerBodyStrength: .18 });
  if (/goleiro defensivo/.test(style)) add({ gk1: .68, gk2: .82, gk3: .7 });
  return signals;
}

function skillSignals(result: AnalysisResult): GroupWeights {
  const skills = [...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(normalizeText);
  const signals: GroupWeights = {};
  const add = (key: TrainingKey, amount: number) => { signals[key] = Number(signals[key] ?? 0) + amount; };
  for (const skill of skills) {
    if (/chute|finaliza|efeito de longe|precisao a distancia|penalti/.test(skill)) add('shooting', .34);
    if (/passe|cruzamento|calcanhar|sem olhar|letra/.test(skill)) add('passing', .34);
    if (/toque duplo|controle com a sola|giro|elastico|pedalada|corte/.test(skill)) add('dribbling', .34);
    if (/intercept|bloque|marcacao|carrinho|afastamento|volta para marcar/.test(skill)) add('defending', .36);
    if (/cabec|superioridade aerea/.test(skill)) add('aerialStrength', .36);
    if (/espirito guerreiro|super substituto|lideranca/.test(skill)) add('lowerBodyStrength', .24);
    if (/goleiro|pegador de penalti|reposicao/.test(skill)) { add('gk1', .2); add('gk2', .2); add('gk3', .2); }
  }
  return signals;
}

function normalizedWeights(weights: GroupWeights, keys: TrainingKey[]) {
  const positive = keys.map((key) => Math.max(.01, Number(weights[key] ?? 0)));
  const total = positive.reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(keys.map((key, index) => [key, positive[index] / total])) as Record<TrainingKey, number>;
}

function cardIdentityWeights(result: AnalysisResult, dimensions: CardFirstDimensionScore[]): GroupWeights {
  const output: GroupWeights = {};
  const byId = new Map(dimensions.map((item) => [item.id, item.score]));
  for (const [dimension, groups] of Object.entries(DIMENSION_TO_GROUPS) as Array<[CardFirstDimensionId, GroupWeights]>) {
    const dimensionValue = Number(byId.get(dimension) ?? 0) / 100;
    for (const [group, weight] of Object.entries(groups) as Array<[TrainingKey, number]>) {
      output[group] = Number(output[group] ?? 0) + dimensionValue * weight;
    }
  }
  const style = styleSignals(result);
  const skills = skillSignals(result);
  const attributes = attributeValues(result);
  for (const key of allowedKeys(result.bestPosition.code)) {
    const groupEvidence = GROUP_ATTRIBUTE_EVIDENCE[key];
    const raw = average(groupEvidence.map((attribute) => attributes[attribute]));
    const relativeStrength = Math.max(0, (raw - 68) / 32);
    output[key] = Number(output[key] ?? 0)
      + Number(style[key] ?? 0) * .38
      + Number(skills[key] ?? 0) * .62
      + relativeStrength * .55;
  }
  const topDimensions = dimensions.slice(0, 2).map((item) => item.id);
  for (const dimension of topDimensions) {
    for (const [key, weight] of Object.entries(DIMENSION_TO_GROUPS[dimension]) as Array<[TrainingKey, number]>) {
      output[key] = Number(output[key] ?? 0) + weight * .34;
    }
  }
  return output;
}

function blendWeights(identity: GroupWeights, target: GroupWeights, robustness: GroupWeights, keys: TrainingKey[], blend: { card: number; target: number; robust: number }) {
  const identityNormalized = normalizedWeights(identity, keys);
  const targetNormalized = normalizedWeights(target, keys);
  const robustnessNormalized = normalizedWeights(robustness, keys);
  return Object.fromEntries(keys.map((key) => [key,
    identityNormalized[key] * blend.card
    + targetNormalized[key] * blend.target
    + robustnessNormalized[key] * blend.robust
  ])) as Record<TrainingKey, number>;
}

function robustnessWeights(result: AnalysisResult): GroupWeights {
  const connection = result.tacticalProfile.connectionProfile ?? 'STABLE';
  const style = result.tacticalProfile.style;
  const base: GroupWeights = result.bestPosition.code === 'GK'
    ? { gk1: .9, gk2: 1, gk3: .92, aerialStrength: .24, lowerBodyStrength: .18 }
    : { passing: .55, dribbling: .6, dexterity: .72, lowerBodyStrength: .78, defending: .34, shooting: .22, aerialStrength: .12 };
  if (connection === 'HIGH_DELAY') {
    base.passing = Number(base.passing ?? 0) + .24;
    base.dribbling = Number(base.dribbling ?? 0) + .24;
    base.dexterity = Number(base.dexterity ?? 0) + .18;
  }
  if (style === 'POSSE_DE_BOLA') {
    base.passing = Number(base.passing ?? 0) + .22;
    base.dribbling = Number(base.dribbling ?? 0) + .14;
  }
  if (style === 'CONTRA_ATAQUE_RAPIDO') {
    base.dexterity = Number(base.dexterity ?? 0) + .2;
    base.lowerBodyStrength = Number(base.lowerBodyStrength ?? 0) + .18;
  }
  return base;
}

function targetLevels(weights: GroupWeights, keys: TrainingKey[]) {
  const normalized = normalizedWeights(weights, keys);
  const maximum = Math.max(...keys.map((key) => normalized[key]));
  const plan = emptyTraining();
  for (const key of keys) {
    const relative = normalized[key] / Math.max(.01, maximum);
    plan[key] = Math.max(0, Math.min(14, Math.round(2 + relative * 9.5)));
  }
  return plan;
}

function exactPlan(result: AnalysisResult, weights: GroupWeights, source?: TrainingPlan) {
  const keys = allowedKeys(result.bestPosition.code);
  const priority = [...keys].sort((left, right) => Number(weights[right] ?? 0) - Number(weights[left] ?? 0));
  return fitTrainingToExactBudget(source ?? targetLevels(weights, keys), priority, result.trainingPointsTotal, result.bestPosition.code);
}

function broadZone(position: PositionCode) {
  if (position === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(position)) return 'DEF';
  if (['DMF', 'CMF', 'LMF', 'RMF'].includes(position)) return 'MID';
  return 'ATT';
}

function conversionClass(result: AnalysisResult): { classification: CardFirstConversionClass; score: number } {
  const natural = result.parsed.mainPosition;
  const target = result.bestPosition.code;
  if (natural === target) return { classification: 'NATURAL', score: 98 };
  const rating = Number(result.parsed.positionRatings[target] ?? 0);
  if (result.parsed.positions.includes(target) || rating >= 90) return { classification: 'COMPATIVEL', score: clamp(86 + Math.max(0, rating - 90) * .5) };
  if (broadZone(natural) === broadZone(target)) return { classification: 'REINTERPRETACAO', score: 72 };
  if (natural === 'GK' || target === 'GK') return { classification: 'EXTREMA', score: 18 };
  return { classification: 'ARRISCADA', score: 48 };
}

function archetypeScores(dimensions: CardFirstDimensionScore[], result: AnalysisResult) {
  const value = (id: CardFirstDimensionId) => Number(dimensions.find((item) => item.id === id)?.score ?? 0);
  const natural = result.parsed.mainPosition;
  const scores = [
    { id: 'CRIADOR', label: 'Criador técnico', score: value('CREATION') * .58 + value('CONTROL') * .32 + value('MOVEMENT') * .1 },
    { id: 'FINALIZADOR', label: 'Finalizador', score: value('FINISHING') * .62 + value('MOVEMENT') * .28 + value('CONTROL') * .1 },
    { id: 'CONDUTOR', label: 'Condutor e driblador', score: value('CONTROL') * .62 + value('MOVEMENT') * .28 + value('CREATION') * .1 },
    { id: 'BOX_TO_BOX', label: 'Meia de área a área', score: value('ENDURANCE') * .32 + value('MOVEMENT') * .23 + value('DEFENDING') * .22 + value('CREATION') * .13 + value('PHYSICAL') * .1 },
    { id: 'MARCADOR', label: 'Recuperador de bola', score: value('DEFENDING') * .56 + value('PHYSICAL') * .24 + value('ENDURANCE') * .2 },
    { id: 'AEREO', label: 'Referência física e aérea', score: value('AERIAL') * .5 + value('PHYSICAL') * .28 + value('FINISHING') * .22 },
    { id: 'CONSTRUTOR', label: 'Construtor de trás', score: value('DEFENDING') * .38 + value('CREATION') * .3 + value('PHYSICAL') * .18 + value('ENDURANCE') * .14 },
    { id: 'GOLEIRO', label: 'Goleiro especialista', score: value('GOALKEEPING') * (natural === 'GK' ? 1 : .2) }
  ];
  return scores.sort((left, right) => right.score - left.score);
}

function targetFunction(position: PositionCode, archetypeId: string) {
  const labels: Partial<Record<PositionCode, Record<string, string>>> = {
    SS: {
      CRIADOR: 'SA criador de conexão e tabela', FINALIZADOR: 'SA finalizador móvel', CONDUTOR: 'SA condutor entre linhas',
      BOX_TO_BOX: 'SA de pressão e chegada', MARCADOR: 'SA de pressão defensiva', AEREO: 'SA de apoio físico', CONSTRUTOR: 'SA de conexão segura'
    },
    AMF: {
      CRIADOR: 'MAT organizador central', FINALIZADOR: 'MAT de chegada e chute', CONDUTOR: 'MAT condutor', BOX_TO_BOX: 'MAT de pressão e infiltração',
      MARCADOR: 'MAT de pressão pós-perda', AEREO: 'MAT de apoio físico', CONSTRUTOR: 'MAT de circulação'
    },
    CMF: {
      CRIADOR: 'MLG organizador', FINALIZADOR: 'MLG de chegada', CONDUTOR: 'MLG condutor', BOX_TO_BOX: 'MLG área a área',
      MARCADOR: 'MLG recuperador', AEREO: 'MLG físico', CONSTRUTOR: 'MLG de saída'
    },
    CF: {
      CRIADOR: 'CA de apoio e criação', FINALIZADOR: 'CA finalizador', CONDUTOR: 'CA móvel e condutor', BOX_TO_BOX: 'CA de pressão',
      MARCADOR: 'CA de pressão defensiva', AEREO: 'CA referência aérea', CONSTRUTOR: 'CA de apoio seguro'
    }
  };
  return labels[position]?.[archetypeId] ?? `${POSITION_PT[position]} adaptado ao DNA ${archetypeId.toLowerCase().replaceAll('_', ' ')}`;
}

function planShares(plan: TrainingPlan, keys: TrainingKey[]) {
  const costs = Object.fromEntries(keys.map((key) => [key, trainingTotalCost(Number(plan[key] ?? 0))])) as Record<TrainingKey, number>;
  const total = Object.values(costs).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(keys.map((key) => [key, costs[key] / total])) as Record<TrainingKey, number>;
}

function distributionFit(plan: TrainingPlan, weights: GroupWeights, keys: TrainingKey[]) {
  const actual = planShares(plan, keys);
  const desired = normalizedWeights(weights, keys);
  const totalVariation = keys.reduce((sum, key) => sum + Math.abs(actual[key] - desired[key]), 0) / 2;
  return clamp(100 - totalVariation * 84);
}

function skillActivationFit(plan: TrainingPlan, signals: GroupWeights, identity: GroupWeights, keys: TrainingKey[]) {
  const actual = planShares(plan, keys);
  const combined = Object.fromEntries(keys.map((key) => [key, Number(signals[key] ?? 0) * .62 + Number(identity[key] ?? 0) * .38])) as Record<TrainingKey, number>;
  const desired = normalizedWeights(combined, keys);
  return clamp(keys.reduce((sum, key) => sum + Math.min(actual[key], desired[key]), 0) * 112);
}

function efficiencyScore(plan: TrainingPlan, identity: GroupWeights, keys: TrainingKey[]) {
  const desired = normalizedWeights(identity, keys);
  let penalty = 0;
  for (const key of keys) {
    const level = Number(plan[key] ?? 0);
    if (level > 12) penalty += (level - 12) * 3.2;
    if (desired[key] < .07 && level > 7) penalty += (level - 7) * 2.4;
    if (desired[key] < .04 && level > 4) penalty += (level - 4) * 3.1;
  }
  return clamp(96 - penalty);
}

function planDistance(left: TrainingPlan, right: TrainingPlan, keys: TrainingKey[]) {
  return keys.reduce((sum, key) => sum + Math.abs(Number(left[key] ?? 0) - Number(right[key] ?? 0)), 0);
}

function candidateReasons(identity: GroupWeights, dimensions: CardFirstDimensionScore[], targetLabel: string, keys: TrainingKey[]) {
  const topGroups = [...keys].sort((left, right) => Number(identity[right] ?? 0) - Number(identity[left] ?? 0)).slice(0, 3);
  return [
    `A ficha preserva ${topGroups.map((key) => TRAINING_LABELS[key]).join(', ')} como grupos centrais da versão lida.`,
    `Arquétipo derivado de ${dimensions.slice(0, 2).map((item) => item.label).join(' + ')}.`,
    `A posição final foi tratada como a função “${targetLabel}”, sem substituir o DNA original.`
  ];
}

function evaluateCandidate(
  result: AnalysisResult,
  seed: CandidateSeed,
  identity: GroupWeights,
  target: GroupWeights,
  robustWeights: GroupWeights,
  dimensions: CardFirstDimensionScore[],
  targetLabel: string,
  genericPositionPlan: TrainingPlan
): CardFirstCandidateV3880 | null {
  const keys = allowedKeys(result.bestPosition.code);
  const training = seed.training && trainingPlanTotalCost(seed.training) === result.trainingPointsTotal
    ? seed.training
    : seed.training
      ? exactPlan(result, seed.weights, seed.training)
      : exactPlan(result, seed.weights);
  if (trainingPlanTotalCost(training) !== result.trainingPointsTotal) return null;
  const identityFit = distributionFit(training, identity, keys);
  const targetFunctionFit = distributionFit(training, target, keys);
  const nativeSkillActivation = skillActivationFit(training, skillSignals(result), identity, keys);
  // Triagem rápida: a busca ampla usa a distribuição de robustez. Somente os
  // melhores finalistas passam novamente pelos cenários completos da v38.60.
  const robustness = distributionFit(training, robustWeights, keys);
  const pointEfficiency = efficiencyScore(training, identity, keys);
  const distance = planDistance(training, genericPositionPlan, keys);
  const antiCloneScore = clamp(64 + Math.min(30, distance * 3.2) + identityFit * .05);
  const score = clamp(
    identityFit * .46
    + nativeSkillActivation * .14
    + targetFunctionFit * .16
    + robustness * .14
    + pointEfficiency * .06
    + antiCloneScore * .04
  );
  return {
    id: seed.id,
    title: seed.title,
    source: seed.source,
    training,
    score,
    identityFit,
    targetFunctionFit,
    nativeSkillActivation,
    robustness,
    pointEfficiency,
    antiCloneScore,
    exactBudget: true,
    reasons: candidateReasons(identity, dimensions, targetLabel, keys),
    tradeOffs: [
      identityFit < 76 ? 'A função escolhida exige mais adaptação do que a identidade natural da carta.' : 'A identidade da carta permaneceu dominante.',
      targetFunctionFit < 70 ? 'A adaptação à posição deve ser validada em partidas antes de uso definitivo.' : 'A função escolhida atingiu piso competitivo sem impor um molde genérico.'
    ]
  };
}

function candidateSeeds(result: AnalysisResult, identity: GroupWeights, target: GroupWeights, robust: GroupWeights): CandidateSeed[] {
  const keys = allowedKeys(result.bestPosition.code);
  const style = styleSignals(result);
  const skills = skillSignals(result);
  const baseBlends = [
    { id: 'dna-puro', title: 'DNA dominante', source: 'atributos, estilo e habilidades da carta', weights: blendWeights(identity, target, robust, keys, { card: .78, target: .12, robust: .1 }) },
    { id: 'dna-funcao', title: 'DNA com adaptação funcional', source: 'identidade primeiro; função como restrição', weights: blendWeights(identity, target, robust, keys, { card: .66, target: .22, robust: .12 }) },
    { id: 'habilidades', title: 'Ativação das habilidades da carta', source: 'habilidades nativas e especiais', weights: blendWeights({ ...identity, ...mergeWeights(identity, skills, .75) }, target, robust, keys, { card: .7, target: .18, robust: .12 }) },
    { id: 'estilo', title: 'Estilo oficial preservado', source: 'estilo de jogo da versão lida', weights: blendWeights({ ...identity, ...mergeWeights(identity, style, .7) }, target, robust, keys, { card: .72, target: .18, robust: .1 }) },
    { id: 'robusta', title: 'Robusta para partidas', source: 'DNA preservado sob pressão e delay', weights: blendWeights(identity, target, robust, keys, { card: .6, target: .18, robust: .22 }) },
    { id: 'funcao', title: 'Adaptação controlada', source: 'maior adaptação sem apagar identidade', weights: blendWeights(identity, target, robust, keys, { card: .55, target: .32, robust: .13 }) }
  ];
  const seeds: CandidateSeed[] = [...baseBlends];
  if (result.supremeV3870?.winner.training) {
    seeds.push({ id: 'v3870', title: 'Referência v38.70', source: 'vencedora robusta anterior reavaliada por DNA', weights: baseBlends[1].weights, training: result.supremeV3870.winner.training });
  }
  const mutationBases = baseBlends.slice(0, 1);
  for (const base of mutationBases) {
    const baseTarget = targetLevels(base.weights, keys);
    const mutationTargets = [...keys].sort((left, right) => Number(base.weights[right] ?? 0) - Number(base.weights[left] ?? 0)).slice(0, 4);
    for (const from of keys) {
      for (const to of mutationTargets) {
        if (from === to || Number(baseTarget[from] ?? 0) <= 1 || Number(baseTarget[to] ?? 0) >= 15) continue;
        const mutated = { ...baseTarget, [from]: Number(baseTarget[from] ?? 0) - 1, [to]: Number(baseTarget[to] ?? 0) + 1 };
        seeds.push({
          id: `${base.id}-${from}-${to}`,
          title: `${base.title}: ajuste ${TRAINING_LABELS[from]} → ${TRAINING_LABELS[to]}`,
          source: `${base.source}; auditoria local`,
          weights: base.weights,
          training: mutated
        });
      }
    }
  }
  return seeds;
}

function mergeWeights(base: GroupWeights, boost: GroupWeights, factor: number) {
  const output: GroupWeights = {};
  for (const key of TRAINING_KEYS) output[key] = Number(base[key] ?? 0) + Number(boost[key] ?? 0) * factor;
  return output;
}

function skillCategories(dimensions: CardFirstDimensionScore[], archetypeId: string): UnifiedSkillDecision['category'][] {
  const order: UnifiedSkillDecision['category'][] = [];
  const push = (...categories: UnifiedSkillDecision['category'][]) => { for (const category of categories) if (order.length < 5) order.push(category); };
  if (archetypeId === 'CRIADOR') push('passe', 'passe', 'drible', 'mental', 'finalização');
  else if (archetypeId === 'FINALIZADOR') push('finalização', 'finalização', 'passe', 'drible', 'físico');
  else if (archetypeId === 'CONDUTOR') push('drible', 'drible', 'passe', 'finalização', 'físico');
  else if (archetypeId === 'BOX_TO_BOX') push('passe', 'defesa', 'físico', 'drible', 'mental');
  else if (archetypeId === 'MARCADOR' || archetypeId === 'CONSTRUTOR') push('defesa', 'defesa', 'passe', 'físico', 'aérea');
  else if (archetypeId === 'AEREO') push('aérea', 'finalização', 'físico', 'passe', 'mental');
  else if (archetypeId === 'GOLEIRO') push('goleiro', 'goleiro', 'goleiro', 'mental', 'físico');
  const top = dimensions.slice(0, 3).map((item) => item.id);
  for (const dimension of top) {
    if (order.length >= 5) break;
    if (dimension === 'CREATION') push('passe');
    if (dimension === 'CONTROL') push('drible');
    if (dimension === 'FINISHING') push('finalização');
    if (dimension === 'DEFENDING') push('defesa');
    if (dimension === 'AERIAL') push('aérea');
    if (dimension === 'PHYSICAL' || dimension === 'ENDURANCE') push('físico');
    if (dimension === 'GOALKEEPING') push('goleiro');
  }
  while (order.length < 5) order.push('mental');
  return order.slice(0, 5);
}

function buildCardFirstSkillPlan(result: AnalysisResult, training: TrainingPlan, dimensions: CardFirstDimensionScore[], archetypeId: string) {
  const options: AdditionalSkillProfileOptions = {
    label: `IA por Carta — ${archetypeId}`,
    preferredCategories: skillCategories(dimensions, archetypeId)
  };
  const plan = buildPersonalizedSkillPlan(result, training, options);
  const filtered = filterComplementaryAdditionalSkills(
    plan.map((item) => item.name),
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5,
    result.parsed.additionalSkills ?? []
  );
  return filtered.map((name, index) => {
    const item = plan.find((decision) => skillIdentityKey(decision.name) === skillIdentityKey(name));
    return item ? {
      ...item,
      priority: index < 2 ? 'essencial' as const : index < 4 ? 'alta' as const : 'complementar' as const,
      reasons: [`Escolhida pelo DNA ${archetypeId.toLowerCase()}, não por uma receita fixa de ${POSITION_PT[result.bestPosition.code]}.`, ...item.reasons].slice(0, 4)
    } : null;
  }).filter((item): item is UnifiedSkillDecision => Boolean(item));
}

function impetoGroups(candidate: ImpetoLike): TrainingKey[] {
  if (candidate.supportedGroups?.length) return candidate.supportedGroups;
  const text = normalizeText(`${candidate.name} ${(candidate.attributes ?? []).join(' ')}`);
  const groups: TrainingKey[] = [];
  const add = (key: TrainingKey) => { if (!groups.includes(key)) groups.push(key); };
  if (/finaliza|chute|ofensivo|curva/.test(text)) add('shooting');
  if (/passe|tecnica|técnica|controle/.test(text)) { add('passing'); add('dribbling'); }
  if (/drible|conducao|condução/.test(text)) add('dribbling');
  if (/veloc|acelera|destreza/.test(text)) { add('dexterity'); add('lowerBodyStrength'); }
  if (/fisic|físic|resistencia|resistência/.test(text)) add('lowerBodyStrength');
  if (/defesa|defensivo|desarme/.test(text)) add('defending');
  if (/aere|aére|cabec|salto/.test(text)) add('aerialStrength');
  if (/goleiro|reflex|alcance/.test(text)) { add('gk1'); add('gk2'); add('gk3'); }
  return groups;
}

function buildCardFirstImpetos(result: AnalysisResult, training: TrainingPlan, identity: GroupWeights): ImpetoRecommendation[] {
  const sources: ImpetoLike[] = [
    ...result.recommendedImpetos,
    ...(result.powerBuildV3850?.impetos ?? []),
    ...(result.maxMatchV3860?.impetoCombinations.map((item) => item.impeto) ?? []),
    ...result.parsed.impetos.map((item) => ({
      name: item.name,
      tier: 'alternativo' as const,
      attributes: [],
      reason: 'Ímpeto identificado na carta.'
    }))
  ];
  const unique = new Map<string, ImpetoLike>();
  for (const candidate of sources) {
    const key = normalizeText(candidate.name);
    if (key && !unique.has(key)) unique.set(key, candidate);
  }
  const keys = allowedKeys(result.bestPosition.code);
  const desired = normalizedWeights(identity, keys);
  const actual = planShares(training, keys);
  return [...unique.values()].map((candidate) => {
    const groups = impetoGroups(candidate).filter((key) => keys.includes(key));
    const coverage = groups.length ? average(groups.map((key) => desired[key] * 100)) : 38;
    const gap = groups.length ? average(groups.map((key) => Math.max(0, desired[key] - actual[key]) * 180)) : 8;
    const saturation = groups.length ? average(groups.map((key) => Math.max(0, actual[key] - desired[key] - .06) * 150)) : 0;
    const prior = Number(candidate.performanceScore ?? candidate.score ?? 60);
    const score = clamp(prior * .28 + coverage * .42 + gap * .3 - saturation * .22);
    return {
      ...candidate,
      score,
      tier: score >= 76 ? 'ideal' as const : score >= 58 ? 'alternativo' as const : 'evitar' as const,
      reason: `Recalculado depois da ficha IA por Carta: cobre ${groups.map((key) => TRAINING_LABELS[key]).join(', ') || 'uma lacuna geral'} com aderência ${Math.round(coverage)}/100 e risco de saturação ${Math.round(saturation)}/100.`,
      evidence: [
        ...(candidate.evidence ?? []),
        'A ordem foi definida pela versão específica da carta, pela ficha final e pelas habilidades escolhidas.'
      ]
    };
  }).sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0)).slice(0, 5)
    .map((item, index) => index === 0 && item.tier === 'evitar'
      ? { ...item, tier: 'alternativo' as const, reason: `${item.reason} Melhor opção disponível para esta carta entre os Ímpetos identificados.` }
      : item);
}

function differencesFromGeneric(winner: CardFirstCandidateV3880, generic: TrainingPlan, identity: GroupWeights, keys: TrainingKey[]) {
  return keys
    .map((key) => ({ key, delta: Number(winner.training[key] ?? 0) - Number(generic[key] ?? 0), identity: Number(identity[key] ?? 0) }))
    .filter((item) => item.delta !== 0)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 6)
    .map((item) => `${TRAINING_LABELS[item.key]} ${item.delta > 0 ? '+' : ''}${item.delta} em relação ao molde da posição, porque a identidade desse grupo foi ${item.identity.toFixed(2)}.`);
}

export function buildCardFirstAiV3880(result: AnalysisResult): CardFirstAiV3880Analysis {
  const dimensions = dimensionScores(result);
  const archetypes = archetypeScores(dimensions, result);
  const primary = archetypes[0];
  const secondary = archetypes[1];
  const targetLabel = targetFunction(result.bestPosition.code, primary.id);
  const conversion = conversionClass(result);
  const keys = allowedKeys(result.bestPosition.code);
  const identity = cardIdentityWeights(result, dimensions);
  const target = TARGET_CONSTRAINTS[result.bestPosition.code];
  const robust = robustnessWeights(result);
  const genericPositionPlan = exactPlan(result, target);
  const seeds = candidateSeeds(result, identity, target, robust);
  const uniquePlans = new Map<string, CandidateSeed>();
  for (const seed of seeds) {
    const plan = seed.training ? exactPlan(result, seed.weights, seed.training) : exactPlan(result, seed.weights);
    const key = signature(plan);
    if (!uniquePlans.has(key)) uniquePlans.set(key, { ...seed, training: plan });
  }
  const screened = [...uniquePlans.values()]
    .map((seed) => evaluateCandidate(result, seed, identity, target, robust, dimensions, targetLabel, genericPositionPlan))
    .filter((candidate): candidate is CardFirstCandidateV3880 => Boolean(candidate))
    .sort((left, right) => right.score - left.score || right.identityFit - left.identityFit || right.robustness - left.robustness);
  if (!screened.length) throw new Error('Motor IA por Carta v38.80 não encontrou candidata com orçamento exato.');
  const revalidated = screened.slice(0, 3).map((candidate) => {
    const match = evaluateTrainingPlanProgressionOnlyV3860(result, candidate.training, {
      id: `v3880-final-${candidate.id}`,
      title: candidate.title,
      source: `${candidate.source}; revalidação integral dos cenários`
    });
    if (!match) return candidate;
    const robustness = clamp(match.scenarioAverage * .55 + match.worstScenario * .45);
    return {
      ...candidate,
      robustness,
      score: clamp(
        candidate.identityFit * .46
        + candidate.nativeSkillActivation * .14
        + candidate.targetFunctionFit * .16
        + robustness * .14
        + candidate.pointEfficiency * .06
        + candidate.antiCloneScore * .04
      )
    };
  }).sort((left, right) => right.score - left.score || right.identityFit - left.identityFit || right.robustness - left.robustness);
  const candidates = [...revalidated, ...screened.filter((candidate) => !revalidated.some((item) => item.id === candidate.id))];
  const winner = candidates[0];
  const skills = buildCardFirstSkillPlan(result, winner.training, dimensions, primary.id);
  const impetos = buildCardFirstImpetos(result, winner.training, identity);
  const confidence = clamp(
    Number(result.parsed.confidence) * .28
    + winner.identityFit * .28
    + winner.targetFunctionFit * .14
    + winner.nativeSkillActivation * .12
    + winner.robustness * .12
    + conversion.score * .06
  );
  const decision = confidence >= 72 && conversion.classification !== 'EXTREMA' ? 'aprovada' : 'revisar';
  const fingerprint = result.cardDna?.antiClone.fingerprint
    ?? hash(`${result.parsed.internalId}|${result.parsed.playerName}|${result.parsed.cardType}|${result.parsed.mainPosition}|${result.parsed.playstyle}|${dimensions.map((item) => `${item.id}:${item.score}`).join('|')}`);
  const differences = differencesFromGeneric(winner, genericPositionPlan, identity, keys);
  return {
    engineVersion: CARD_FIRST_AI_V3880_VERSION,
    philosophy: 'CARTA_PRIMEIRO_POSICAO_COMO_RESTRICAO_SEM_OVERALL',
    cardFingerprint: fingerprint,
    originProfile: `${POSITION_PT[result.parsed.mainPosition]} • ${result.parsed.playstyle ?? 'estilo não identificado'} • ${primary.label}`,
    targetFunction: targetLabel,
    conversionClass: conversion.classification,
    conversionScore: conversion.score,
    archetype: primary.label,
    secondaryArchetype: secondary.label,
    dimensions,
    blendWeights: { cardIdentity: 66, targetFunction: 22, matchRobustness: 12 },
    candidatesGenerated: seeds.length,
    candidatesEvaluated: candidates.length,
    winner,
    finalists: candidates.slice(0, 8),
    skillPlan: skills,
    impetoPlan: impetos,
    differencesFromPositionTemplate: differences,
    guardrails: [
      ...CARD_FIRST_IMPROVEMENTS,
      `A identidade da carta responde por 66% da mistura principal; a função escolhida fica limitada a 22%.`,
      `Conversão classificada como ${conversion.classification.toLowerCase()} (${conversion.score}/100).`,
      'A posição escolhida pelo usuário continua preservada; o motor muda a interpretação da função, não a decisão do usuário.',
      'A validação em partidas permanece obrigatória porque conexão e atualizações do jogo podem alterar a execução.'
    ],
    confidence,
    decision,
    summary: `${result.parsed.playerName}: ${primary.label} adaptado como ${targetLabel}. A ficha venceu com ${winner.score}/100, identidade ${winner.identityFit}/100 e função ${winner.targetFunctionFit}/100; a posição foi usada como restrição, não como receita.`
  };
}

export function applyCardFirstAiV3880(result: AnalysisResult): AnalysisResult {
  const analysis = buildCardFirstAiV3880(result);
  const training = analysis.winner.training;
  const pointsUsed = trainingPlanTotalCost(training);
  const recommendedSkills = analysis.skillPlan.map((item) => item.name);
  const variants = analysis.finalists.slice(0, 3).map((candidate, index) => ({
    kind: index === 0 ? 'competitive' as const : 'alternative' as const,
    title: index === 0
      ? `Ficha Automática v40.00 — IA por Carta v38.80 — ${analysis.targetFunction}`
      : `Alternativa IA por Carta — ${candidate.title}`,
    positionLabel: result.bestPosition.label,
    training: candidate.training,
    pointsUsed: trainingPlanTotalCost(candidate.training),
    note: candidate.reasons.join(' '),
    qualityScore: candidate.score,
    adaptationLabel: index === 0 ? 'CARTA PRIMEIRO • SEM OVERALL' : 'VARIANTE POR DNA',
    highlights: [
      `Identidade ${candidate.identityFit}/100.`,
      `Função ${candidate.targetFunctionFit}/100.`,
      `Ativação das habilidades ${candidate.nativeSkillActivation}/100.`,
      `Robustez ${candidate.robustness}/100.`
    ],
    risks: candidate.tradeOffs,
    efficiencyScore: candidate.pointEfficiency,
    balanceScore: candidate.identityFit,
    verdict: analysis.summary,
    tradeOffs: candidate.tradeOffs,
    simulationsTested: analysis.candidatesEvaluated
  }));
  return {
    ...result,
    training,
    trainingCost: trainingPlanCost(training),
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - pointsUsed,
    buildVariants: variants,
    recommendedSkills,
    skillRecommendations: analysis.skillPlan.map((item, index) => ({
      name: item.name,
      tier: index < 2 ? 'essencial' as const : 'alternativa' as const,
      reason: `${item.gameplayImpact} ${item.reasons.join(' ')}`
    })),
    recommendedImpetos: analysis.impetoPlan,
    buildName: variants[0].title,
    recommendationExplanation: [
      analysis.summary,
      `Origem analisada: ${analysis.originProfile}.`,
      `Função final: ${analysis.targetFunction}.`,
      ...analysis.differencesFromPositionTemplate.slice(0, 3),
      ...result.recommendationExplanation
    ].slice(0, 12),
    strengths: [
      `DNA principal: ${analysis.archetype}; secundário: ${analysis.secondaryArchetype}.`,
      `A ficha preservou ${analysis.winner.identityFit}/100 da identidade medida.`,
      ...result.strengths
    ].slice(0, 10),
    weaknesses: [
      ...(analysis.conversionClass === 'ARRISCADA' || analysis.conversionClass === 'EXTREMA'
        ? [`Conversão ${analysis.conversionClass.toLowerCase()}: valide antes de aplicar definitivamente.`]
        : []),
      ...result.weaknesses
    ].slice(0, 8),
    note: `${analysis.summary} Compare o comportamento em pelo menos cinco partidas mantendo formação e técnico constantes.`,
    cardFirstV3880: analysis,
    advancedOptimizer: {
      ...result.advancedOptimizer,
      combinationsTested: Math.max(result.advancedOptimizer.combinationsTested, analysis.candidatesEvaluated),
      winnerTitle: variants[0].title,
      winnerScore: analysis.winner.score,
      efficiencyScore: analysis.winner.pointEfficiency,
      wasteScore: 100 - analysis.winner.pointEfficiency,
      unusedPoints: Math.max(0, result.trainingPointsTotal - pointsUsed),
      usefulInvestment: analysis.differencesFromPositionTemplate.slice(0, 8),
      detectedWaste: analysis.winner.tradeOffs.slice(0, 8),
      decisionReasons: [analysis.summary, ...analysis.winner.reasons, ...result.advancedOptimizer.decisionReasons].slice(0, 8),
      positionPreserved: true,
      budgetRespected: pointsUsed === result.trainingPointsTotal
    }
  };
}
