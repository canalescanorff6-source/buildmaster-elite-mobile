import type {
  AnalysisResult,
  ImpetoRecommendation,
  Objective,
  PositionCode,
  PowerBuildCandidate,
  PowerBuildEngineV3850Analysis,
  PowerBuildScoreDimensions,
  PowerImpetoDecision,
  PowerSkillDecision,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { buildPersonalizedSkillPlan, skillPlanScore } from './skillIntelligenceV31';
import { filterComplementaryAdditionalSkills, skillIdentityKey } from './officialSkillIdentity';
import {
  TRAINING_KEYS,
  emptyTraining,
  normalizeTrainingPlan,
  trainingLevelCost,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import { TRAINING_LABELS } from './trainingEngine';
import { fitTrainingToExactBudget } from '../modules/builds/trainingOptimizer';
import { buildStructuralPrecisionAnalysis, mergeStructuralValidation } from './structuralPrecisionV3740';

export const POWER_BUILD_ENGINE_V3850_VERSION = '38.50.0' as const;

const IMPROVEMENTS = [
  'Pontuação principal baseada em ações reais da função, sem usar GER como objetivo.',
  'Orçamento de progressão fechado exatamente, sem pontos invisíveis ou excedentes.',
  'Pisos funcionais diferentes para cada posição e estilo oficial.',
  'Tetos de retorno para impedir investimento caro depois da faixa útil.',
  'Retorno marginal calculado nível por nível com o custo progressivo real.',
  'Penalidade de saturação quando um bloco recebe pontos além do que ativa em campo.',
  'Penalidade de desperdício em grupos incompatíveis com a posição escolhida.',
  'Proteção das maiores forças naturais e do DNA específico da versão da carta.',
  'Correção seletiva de fraquezas sem transformar todas as cartas no mesmo molde.',
  'Posição escolhida pelo usuário permanece travada durante toda a otimização.',
  'Estilo de jogo oficial altera pisos, pesos, tetos e frequência esperada das ações.',
  'Objetivo competitivo altera a distribuição sem perseguir aumento visual de overall.',
  'Perfil de conexão e delay favorece resposta, passe curto e estabilidade de controle.',
  'Modo ranqueado recebe proteção contra fichas frágeis que funcionam apenas offline.',
  'Modelo físico participa apenas quando altura, contato, salto e função justificam.',
  'Habilidades especiais já existentes recebem suporte de treino para ativarem mais vezes.',
  'Top 5 usa somente habilidades oficiais adicionais e nunca repete habilidade possuída.',
  'Cada habilidade recebe frequência de ativação, cobertura funcional e risco de redundância.',
  'Pacote de cinco habilidades é avaliado como conjunto, não como cinco escolhas isoladas.',
  'Diversidade funcional impede cinco habilidades da mesma categoria sem necessidade real.',
  'Complementos como passe de primeira + passe em profundidade recebem bônus de combinação.',
  'Habilidades incompatíveis com goleiro ou jogador de linha permanecem bloqueadas.',
  'Ímpeto é calculado depois da ficha e das habilidades, usando a combinação final.',
  'Ímpeto perde nota quando reforça atributos já saturados pela progressão.',
  'Ímpeto ganha nota quando cobre uma lacuna decisiva sem descaracterizar a carta.',
  'Comparação simultânea de fichas recomendada, segura, agressiva, identidade e robustez.',
  'Tolerância à leitura incerta aproxima a vencedora da variante conservadora quando necessário.',
  'Anticlone mede distância do molde genérico e recompensa individualidade útil.',
  'Auditoria explica ganhos, trocas, pisos não atingidos e qualquer ponto potencialmente desperdiçado.',
  'A ficha final só é aprovada quando posição, orçamento, habilidades e Ímpeto terminam reconciliados.'
] as const;

type RoleShape = {
  weights: Partial<Record<TrainingKey, number>>;
  floors: Partial<Record<TrainingKey, number>>;
  caps: Partial<Record<TrainingKey, number>>;
};

type CandidateSeed = { id: string; title: string; source: string; training: TrainingPlan };

type EvaluatedCandidate = PowerBuildCandidate & {
  skillPlan: PowerSkillDecision[];
  impetoPlan: PowerImpetoDecision[];
};

const BASE_ROLE_SHAPES: Record<PositionCode, RoleShape> = {
  GK: { weights: { gk1: 1.35, gk2: 1.5, gk3: 1.45, aerialStrength: .55, lowerBodyStrength: .35 }, floors: { gk1: 8, gk2: 9, gk3: 8, aerialStrength: 2 }, caps: { gk1: 12, gk2: 12, gk3: 12, aerialStrength: 6, lowerBodyStrength: 5 } },
  CB: { weights: { defending: 1.55, aerialStrength: 1.18, lowerBodyStrength: .82, dexterity: .48, passing: .42 }, floors: { defending: 10, aerialStrength: 4, lowerBodyStrength: 5, dexterity: 2 }, caps: { defending: 15, aerialStrength: 10, lowerBodyStrength: 9, dexterity: 7, passing: 7, dribbling: 3, shooting: 0 } },
  LB: { weights: { defending: 1.12, lowerBodyStrength: 1.0, dexterity: .82, passing: .78, dribbling: .48, aerialStrength: .32 }, floors: { defending: 6, lowerBodyStrength: 6, dexterity: 4, passing: 4 }, caps: { defending: 12, lowerBodyStrength: 11, dexterity: 10, passing: 10, dribbling: 8, aerialStrength: 6, shooting: 4 } },
  RB: { weights: { defending: 1.12, lowerBodyStrength: 1.0, dexterity: .82, passing: .78, dribbling: .48, aerialStrength: .32 }, floors: { defending: 6, lowerBodyStrength: 6, dexterity: 4, passing: 4 }, caps: { defending: 12, lowerBodyStrength: 11, dexterity: 10, passing: 10, dribbling: 8, aerialStrength: 6, shooting: 4 } },
  DMF: { weights: { defending: 1.45, passing: .92, lowerBodyStrength: .82, dexterity: .58, aerialStrength: .52, dribbling: .28 }, floors: { defending: 10, passing: 4, lowerBodyStrength: 5, dexterity: 3 }, caps: { defending: 15, passing: 10, lowerBodyStrength: 10, dexterity: 8, aerialStrength: 8, dribbling: 6, shooting: 3 } },
  CMF: { weights: { passing: 1.12, lowerBodyStrength: .88, dribbling: .8, dexterity: .78, defending: .68, shooting: .36 }, floors: { passing: 6, lowerBodyStrength: 5, dexterity: 4, dribbling: 3, defending: 3 }, caps: { passing: 12, lowerBodyStrength: 11, dexterity: 10, dribbling: 10, defending: 11, shooting: 7, aerialStrength: 6 } },
  LMF: { weights: { passing: 1.0, lowerBodyStrength: .92, dribbling: .84, dexterity: .78, defending: .48, shooting: .32 }, floors: { passing: 5, lowerBodyStrength: 5, dribbling: 4, dexterity: 4 }, caps: { passing: 11, lowerBodyStrength: 11, dribbling: 11, dexterity: 11, defending: 8, shooting: 7, aerialStrength: 5 } },
  RMF: { weights: { passing: 1.0, lowerBodyStrength: .92, dribbling: .84, dexterity: .78, defending: .48, shooting: .32 }, floors: { passing: 5, lowerBodyStrength: 5, dribbling: 4, dexterity: 4 }, caps: { passing: 11, lowerBodyStrength: 11, dribbling: 11, dexterity: 11, defending: 8, shooting: 7, aerialStrength: 5 } },
  AMF: { weights: { passing: 1.28, dribbling: 1.08, dexterity: .98, shooting: .64, lowerBodyStrength: .4 }, floors: { passing: 6, dribbling: 5, dexterity: 5, shooting: 2 }, caps: { passing: 13, dribbling: 12, dexterity: 11, shooting: 9, lowerBodyStrength: 8, aerialStrength: 0, defending: 0 } },
  SS: { weights: { dribbling: 1.08, dexterity: 1.08, shooting: 1.0, passing: .82, lowerBodyStrength: .62, aerialStrength: .28 }, floors: { dribbling: 4, dexterity: 6, shooting: 5, passing: 3, lowerBodyStrength: 3 }, caps: { dribbling: 12, dexterity: 12, shooting: 12, passing: 10, lowerBodyStrength: 10, aerialStrength: 7, defending: 3 } },
  CF: { weights: { shooting: 1.5, dexterity: 1.12, lowerBodyStrength: .92, aerialStrength: .72, dribbling: .46, passing: .24 }, floors: { shooting: 7, dexterity: 5, lowerBodyStrength: 5 }, caps: { shooting: 14, dexterity: 12, lowerBodyStrength: 11, aerialStrength: 11, dribbling: 8, passing: 6, defending: 0 } },
  LWF: { weights: { dribbling: 1.24, dexterity: 1.12, shooting: .92, lowerBodyStrength: .76, passing: .52 }, floors: { dribbling: 6, dexterity: 6, shooting: 4, lowerBodyStrength: 4 }, caps: { dribbling: 13, dexterity: 12, shooting: 11, lowerBodyStrength: 11, passing: 9, aerialStrength: 5, defending: 0 } },
  RWF: { weights: { dribbling: 1.24, dexterity: 1.12, shooting: .92, lowerBodyStrength: .76, passing: .52 }, floors: { dribbling: 6, dexterity: 6, shooting: 4, lowerBodyStrength: 4 }, caps: { dribbling: 13, dexterity: 12, shooting: 11, lowerBodyStrength: 11, passing: 9, aerialStrength: 5, defending: 0 } }
};

const CATEGORY_ROLE: Record<UnifiedSkillDecision['category'], string> = {
  finalização: 'converter chances e ampliar repertório de chute',
  passe: 'acelerar tabelas, triangulações e criação',
  drible: 'ganhar o primeiro duelo e proteger a condução',
  defesa: 'cortar linhas, recuperar e proteger a estrutura',
  aérea: 'vencer disputas e aproveitar bolas altas',
  físico: 'sustentar contato, pressão e repetição de ações',
  goleiro: 'defender e iniciar a construção com segurança',
  mental: 'aumentar consistência em momentos decisivos'
};

const IMPETO_ATTRIBUTE_TO_GROUP: Array<[RegExp, TrainingKey]> = [
  [/talento de go|firmeza do go|defesa do go/i, 'gk1'],
  [/reflexos do go/i, 'gk2'],
  [/alcance do go/i, 'gk3'],
  [/finaliza|bola parada|curva/i, 'shooting'],
  [/passe rasteiro|passe alto/i, 'passing'],
  [/controle de bola|drible|conducao firme|condução firme/i, 'dribbling'],
  [/talento ofensivo|aceleracao|aceleração|equilibrio|equilíbrio/i, 'dexterity'],
  [/velocidade|forca do chute|força do chute|resistencia|resistência/i, 'lowerBodyStrength'],
  [/cabec|cabeç|salto|contato fisico|contato físico/i, 'aerialStrength'],
  [/talento defensivo|desarme|dedicacao defensiva|dedicação defensiva|agressividade/i, 'defending']
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function copyShape(position: PositionCode): RoleShape {
  const base = BASE_ROLE_SHAPES[position];
  return { weights: { ...base.weights }, floors: { ...base.floors }, caps: { ...base.caps } };
}

function add(shape: RoleShape, key: TrainingKey, weight = 0, floor = 0, cap = 0) {
  shape.weights[key] = Math.max(0, Number(shape.weights[key] ?? 0) + weight);
  if (floor) shape.floors[key] = Math.max(Number(shape.floors[key] ?? 0), floor);
  if (cap) shape.caps[key] = Math.max(Number(shape.caps[key] ?? 0), cap);
}

function adjustedRoleShape(result: AnalysisResult): RoleShape {
  const shape = copyShape(result.bestPosition.code);
  const style = normalizeText(result.parsed.playstyle);
  const objective: Objective = result.objective ?? 'COMPETITIVE';

  if (/armador|orquestrador|criativo|classico/.test(style)) {
    add(shape, 'passing', .28, 6, 13);
    add(shape, 'dribbling', .12, 4, 11);
  }
  if (/infiltra|artilheiro|homem de area/.test(style)) {
    add(shape, 'shooting', .24, 6, 14);
    add(shape, 'dexterity', .2, 6, 12);
  }
  if (/pivo|puxa marcacao/.test(style)) {
    add(shape, 'lowerBodyStrength', .24, 6, 11);
    add(shape, 'aerialStrength', .2, 5, 11);
    add(shape, 'passing', .12, 3, 8);
  }
  if (/primeiro volante|destruidor|defensivo|defensor criativo/.test(style)) {
    add(shape, 'defending', .3, 9, 15);
    add(shape, 'lowerBodyStrength', .14, 5, 10);
  }
  if (/meia versatil/.test(style)) {
    add(shape, 'lowerBodyStrength', .2, 6, 11);
    add(shape, 'defending', .14, 4, 11);
    add(shape, 'passing', .1, 5, 11);
  }
  if (/lateral movel|ala produtivo/.test(style)) {
    add(shape, 'dribbling', .18, 5, 12);
    add(shape, 'dexterity', .16, 5, 12);
    add(shape, 'lowerBodyStrength', .14, 5, 11);
  }

  if (objective === 'FINISHER') add(shape, 'shooting', .26, 7, 14);
  if (objective === 'CREATOR' || objective === 'POSSESSION') add(shape, 'passing', .25, 6, 13);
  if (objective === 'DRIBBLER') add(shape, 'dribbling', .28, 6, 13);
  if (objective === 'PRESSING') {
    add(shape, 'lowerBodyStrength', .2, 6, 11);
    if (result.bestPosition.code !== 'CF') add(shape, 'defending', .14, 4, 12);
  }
  if (objective === 'DEFENSIVE') add(shape, 'defending', .28, 8, 15);
  if (objective === 'AERIAL') add(shape, 'aerialStrength', .28, 6, 12);
  if (objective === 'QUICK_COUNTER') {
    add(shape, 'dexterity', .22, 6, 12);
    add(shape, 'lowerBodyStrength', .14, 5, 11);
  }

  const connection = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const mode = result.tacticalProfile.gameplayMode ?? 'UNIVERSAL';
  if (connection === 'HIGH_DELAY') {
    add(shape, 'passing', .18, result.bestPosition.code === 'GK' ? 0 : 4, 12);
    add(shape, 'dexterity', .22, result.bestPosition.code === 'GK' ? 0 : 5, 12);
    add(shape, 'lowerBodyStrength', .12, 4, 11);
  }
  if (mode === 'RANKED') {
    add(shape, 'dexterity', .1, result.bestPosition.code === 'GK' ? 0 : 4, 12);
    add(shape, 'lowerBodyStrength', .1, 4, 11);
  }

  return shape;
}

function allowedKeys(position: PositionCode): TrainingKey[] {
  return position === 'GK'
    ? ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength']
    : ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
}

function priorityFromShape(shape: RoleShape, position: PositionCode) {
  return allowedKeys(position).sort((left, right) => Number(shape.weights[right] ?? 0) - Number(shape.weights[left] ?? 0));
}

function sanitizeForPosition(plan: TrainingPlan, position: PositionCode) {
  const clean = normalizeTrainingPlan(plan);
  const allowed = new Set(allowedKeys(position));
  for (const key of TRAINING_KEYS) if (!allowed.has(key)) clean[key] = 0;
  return clean;
}

function exactPlan(plan: TrainingPlan, result: AnalysisResult, priority: TrainingKey[]) {
  return fitTrainingToExactBudget(sanitizeForPosition(plan, result.bestPosition.code), priority, result.trainingPointsTotal, result.bestPosition.code);
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key]}`).join('|');
}

function seedFromShape(shape: RoleShape, boosts: TrainingKey[] = []) {
  const plan = emptyTraining();
  for (const [rawKey, rawFloor] of Object.entries(shape.floors)) {
    const key = rawKey as TrainingKey;
    plan[key] = Math.max(0, Math.round(Number(rawFloor ?? 0)));
  }
  boosts.forEach((key, index) => { plan[key] = Math.min(16, plan[key] + Math.max(1, 3 - index)); });
  return plan;
}

function collectCandidateSeeds(result: AnalysisResult, shape: RoleShape, priority: TrainingKey[]): CandidateSeed[] {
  const seeds: CandidateSeed[] = [];
  const addSeed = (id: string, title: string, source: string, training?: TrainingPlan | null) => {
    if (!training) return;
    seeds.push({ id, title, source, training });
  };

  addSeed('current', 'Ficha atual reconciliada', 'motor atual', result.training);
  addSeed('advanced-winner', 'Vencedora conjunta anterior', 'Motor Avançado v37.50', result.advancedMotorV3750?.winner.training);
  result.advancedMotorV3750?.alternatives.forEach((item, index) => addSeed(`advanced-${index}`, item.title, 'alternativas v37.50', item.training));
  result.buildVariants.forEach((item, index) => addSeed(`variant-${index}`, item.title, 'variantes da ficha', item.training));
  result.calibrationV32?.profiles.forEach((item, index) => addSeed(`calibration-${index}`, `Calibração ${item.label}`, 'calibração por modo', item.training));
  addSeed('calibration-final', 'Calibração final', 'calibração v32', result.calibrationV32?.finalTraining);
  addSeed('supreme', 'Motor supremo', 'otimização competitiva', result.supremeGameplay?.finalTraining);
  addSeed('unified', 'Inteligência unificada', 'simulação profunda', result.unifiedIntelligence?.finalTraining);
  addSeed('tolerance-safe', 'Leitura conservadora', 'tolerância a erro', result.errorTolerance?.conservative);
  addSeed('tolerance-probable', 'Leitura provável', 'tolerância a erro', result.errorTolerance?.probable);
  addSeed('tolerance-aggressive', 'Leitura otimista', 'tolerância a erro', result.errorTolerance?.optimistic);
  result.gameplayDna?.profiles.slice(0, 5).forEach((item, index) => addSeed(`dna-${index}`, `DNA ${item.label}`, 'perfil de gameplay', item.training));

  addSeed('threshold-first', 'Pisos funcionais primeiro', 'novo motor v38.50', seedFromShape(shape));
  addSeed('role-specialist', 'Especialista da função', 'novo motor v38.50', seedFromShape(shape, priority.slice(0, 3)));

  const responseKeys: TrainingKey[] = result.bestPosition.code === 'GK'
    ? ['gk2', 'gk3', 'lowerBodyStrength']
    : ['dexterity', 'passing', 'lowerBodyStrength', 'dribbling'];
  addSeed('ranked-robust', 'Robusta para ranqueada e delay', 'novo motor v38.50', seedFromShape(shape, responseKeys));

  const identityBoosts = (result.cardDna?.individualGoals ?? [])
    .filter((item) => item.priority === 'especializar' || item.priority === 'proteger')
    .sort((left, right) => right.personalizedIdeal - left.personalizedIdeal)
    .map((item) => item.training);
  addSeed('identity-first', 'DNA preservado', 'novo motor v38.50', seedFromShape(shape, identityBoosts.slice(0, 4)));

  const specialBoosts = (result.cardDna?.skillSynergies ?? [])
    .filter((item) => item.expectedFrequency !== 'baixa')
    .sort((left, right) => right.activationScore - left.activationScore)
    .flatMap((item) => item.trainingGroups)
    .filter((key, index, all) => all.indexOf(key) === index);
  addSeed('special-skills', 'Ativação de habilidades especiais', 'novo motor v38.50', seedFromShape(shape, specialBoosts.slice(0, 4)));

  return seeds;
}

function weightedRatio(plan: TrainingPlan, targets: Partial<Record<TrainingKey, number>>, weights: Partial<Record<TrainingKey, number>>) {
  let score = 0;
  let total = 0;
  for (const key of TRAINING_KEYS) {
    const target = Number(targets[key] ?? 0);
    const weight = Number(weights[key] ?? 0);
    if (target <= 0 || weight <= 0) continue;
    score += Math.min(1, Number(plan[key] ?? 0) / target) * weight;
    total += weight;
  }
  return total ? clamp(score / total * 100) : 75;
}

function marginalUtility(plan: TrainingPlan, shape: RoleShape) {
  let actual = 0;
  let ideal = 0;
  let saturationPenalty = 0;
  let wastePenalty = 0;

  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    const floor = Number(shape.floors[key] ?? 0);
    const cap = Math.max(floor, Number(shape.caps[key] ?? (floor || 1)));
    const weight = Number(shape.weights[key] ?? 0);
    for (let current = 1; current <= Math.max(level, cap); current += 1) {
      const cost = trainingLevelCost(current);
      const phase = current <= floor ? 1.35 : current <= cap ? .82 : .18;
      const gain = weight * phase / Math.max(1, cost);
      if (current <= level) actual += gain;
      if (current <= cap) ideal += gain;
      if (current <= level && current > cap) saturationPenalty += cost * Math.max(.5, weight) * 2.2;
    }
    if (weight < .3 && level >= 4) wastePenalty += (level - 3) * 2.2;
  }

  return {
    score: clamp(ideal ? actual / ideal * 100 : 70),
    saturationPenalty: clamp(saturationPenalty, 0, 40),
    wastePenalty: clamp(wastePenalty, 0, 35)
  };
}

function responseKeys(result: AnalysisResult): TrainingKey[] {
  if (result.bestPosition.code === 'GK') return ['gk2', 'gk3', 'lowerBodyStrength'];
  const keys: TrainingKey[] = ['dexterity', 'lowerBodyStrength'];
  if (['AMF', 'CMF', 'DMF', 'SS', 'LMF', 'RMF'].includes(result.bestPosition.code)) keys.push('passing');
  if (['AMF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF'].includes(result.bestPosition.code)) keys.push('dribbling');
  if (result.tacticalProfile.connectionProfile === 'HIGH_DELAY') keys.push('passing');
  return Array.from(new Set(keys));
}

function subsetScore(plan: TrainingPlan, shape: RoleShape, keys: TrainingKey[]) {
  const targets = Object.fromEntries(keys.map((key) => [key, Math.max(Number(shape.floors[key] ?? 0), Math.min(Number(shape.caps[key] ?? 10), 9))])) as Partial<Record<TrainingKey, number>>;
  const weights = Object.fromEntries(keys.map((key) => [key, Math.max(.6, Number(shape.weights[key] ?? .6))])) as Partial<Record<TrainingKey, number>>;
  return weightedRatio(plan, targets, weights);
}

function identityScore(result: AnalysisResult, plan: TrainingPlan, shape: RoleShape) {
  const goals = result.cardDna?.individualGoals ?? [];
  if (!goals.length) return weightedRatio(plan, shape.floors, shape.weights);
  let total = 0;
  let weightTotal = 0;
  for (const goal of goals) {
    const weight = goal.priority === 'especializar' ? 1.5 : goal.priority === 'proteger' ? 1.25 : goal.priority === 'corrigir' ? 1.05 : .65;
    const target = goal.priority === 'especializar'
      ? Math.max(Number(shape.floors[goal.training] ?? 0), Math.min(12, Number(result.training[goal.training] ?? 0)))
      : Math.max(1, Number(shape.floors[goal.training] ?? 0));
    total += Math.min(1, Number(plan[goal.training] ?? 0) / target) * weight;
    weightTotal += weight;
  }
  return clamp(total / Math.max(1, weightTotal) * 100);
}

function specialSkillActivationScore(result: AnalysisResult, plan: TrainingPlan, shape: RoleShape) {
  const synergies = (result.cardDna?.skillSynergies ?? []).slice(0, 8);
  if (!synergies.length) return 78;
  let total = 0;
  let weightTotal = 0;
  for (const item of synergies) {
    const support = item.trainingGroups.length
      ? item.trainingGroups.reduce((sum, key) => sum + Math.min(1, Number(plan[key] ?? 0) / Math.max(1, Number(shape.floors[key] ?? 5))), 0) / item.trainingGroups.length
      : .65;
    const frequencyWeight = item.expectedFrequency === 'alta' ? 1.35 : item.expectedFrequency === 'média' ? 1 : .55;
    total += (item.activationScore * .62 + support * 100 * .38) * frequencyWeight;
    weightTotal += frequencyWeight;
  }
  return clamp(total / Math.max(1, weightTotal));
}

function conservativeSafety(result: AnalysisResult, plan: TrainingPlan) {
  const confidence = Number(result.structuralPrecision?.criticalConfidence ?? result.parsed.confidence);
  if (confidence >= 85) return 100;
  const conservative = result.errorTolerance?.conservative ?? result.training;
  const distance = TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(plan[key] ?? 0) - Number(conservative[key] ?? 0)), 0);
  return clamp(100 - distance * (confidence < 60 ? 3.2 : 2));
}

function onlineRobustness(result: AnalysisResult, plan: TrainingPlan, shape: RoleShape) {
  if (result.tacticalProfile.gameplayMode !== 'RANKED' && result.tacticalProfile.connectionProfile !== 'HIGH_DELAY') {
    return clamp((subsetScore(plan, shape, responseKeys(result)) + weightedRatio(plan, shape.floors, shape.weights)) / 2);
  }
  return subsetScore(plan, shape, responseKeys(result));
}

function planSpreadPenalty(result: AnalysisResult, plan: TrainingPlan) {
  const active = allowedKeys(result.bestPosition.code).filter((key) => Number(plan[key] ?? 0) >= 3).length;
  const tolerated = result.bestPosition.code === 'GK' ? 5 : 6;
  return Math.max(0, active - tolerated) * 5;
}

function normalizedAttribute(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function impetoGroups(item: ImpetoRecommendation, position: PositionCode) {
  const groups: TrainingKey[] = [];
  for (const attribute of item.attributes) {
    const normalized = normalizedAttribute(attribute);
    const match = IMPETO_ATTRIBUTE_TO_GROUP.find(([pattern]) => pattern.test(normalized));
    if (match) groups.push(match[1]);
  }
  const unique = groups.filter((key, index, all) => all.indexOf(key) === index);
  if (position === 'GK') return unique.filter((key) => ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'].includes(key));
  return unique.filter((key) => !key.startsWith('gk'));
}

function skillCategoryGroup(category: UnifiedSkillDecision['category']): TrainingKey[] {
  if (category === 'finalização') return ['shooting', 'dexterity'];
  if (category === 'passe') return ['passing', 'dribbling'];
  if (category === 'drible') return ['dribbling', 'dexterity'];
  if (category === 'defesa') return ['defending', 'lowerBodyStrength'];
  if (category === 'aérea') return ['aerialStrength', 'lowerBodyStrength'];
  if (category === 'físico') return ['lowerBodyStrength', 'aerialStrength'];
  if (category === 'goleiro') return ['gk1', 'gk2', 'gk3'];
  return ['dexterity', 'lowerBodyStrength'];
}

function scoreImpetos(result: AnalysisResult, plan: TrainingPlan, shape: RoleShape, skills: UnifiedSkillDecision[]): PowerImpetoDecision[] {
  const skillGroups = skills.flatMap((item) => skillCategoryGroup(item.category));
  const candidates = result.recommendedImpetos.length ? result.recommendedImpetos : [{ name: 'Sem Ímpeto definido', tier: 'evitar' as const, attributes: [], reason: 'Nenhum Ímpeto seguro foi reconhecido.' }];
  const decisions = candidates.map((item) => {
    const groups = impetoGroups(item, result.bestPosition.code);
    const roleFit = groups.length
      ? clamp(groups.reduce((sum, key) => sum + Math.min(1, Number(shape.weights[key] ?? 0) / 1.2), 0) / groups.length * 100)
      : 30;
    const attributeCoverage = groups.length
      ? clamp(groups.reduce((sum, key) => sum + Math.min(1, Number(plan[key] ?? 0) / Math.max(1, Number(shape.floors[key] ?? 5))), 0) / groups.length * 100)
      : 35;
    const buildSynergy = groups.length
      ? clamp(groups.reduce((sum, key) => sum + Math.min(1, Number(plan[key] ?? 0) / Math.max(1, Number(shape.caps[key] ?? 10))), 0) / groups.length * 100)
      : 35;
    const skillSynergy = groups.length
      ? clamp(groups.filter((key) => skillGroups.includes(key)).length / groups.length * 100)
      : 25;
    const saturationPenalty = clamp(groups.reduce((sum, key) => sum + Math.max(0, Number(plan[key] ?? 0) - Number(shape.caps[key] ?? 10)) * 5, 0), 0, 35);
    const legacy = clamp(Number(item.score ?? (item.tier === 'ideal' ? 82 : item.tier === 'alternativo' ? 68 : 30)));
    const incompatible = result.bestPosition.code === 'GK'
      ? groups.some((key) => !key.startsWith('gk') && key !== 'aerialStrength' && key !== 'lowerBodyStrength')
      : groups.some((key) => key.startsWith('gk'));
    const performanceScore = clamp(roleFit * .3 + attributeCoverage * .22 + buildSynergy * .22 + skillSynergy * .12 + legacy * .14 - saturationPenalty - (incompatible ? 55 : 0));
    const cleanReason = item.reason
      .replace(/\s*Nota final calculada depois da ficha e do Top 5:\s*\d+\/100\.\s*$/i, '')
      .trim();
    return {
      ...item,
      tier: 'alternativo' as const,
      score: performanceScore,
      confidence: clamp((performanceScore + Number(result.parsed.confidence)) / 2),
      official: true,
      evidence: [`Apoia ${groups.map((key) => TRAINING_LABELS[key]).join(', ') || 'nenhum grupo confirmado'}.`, `Compatibilidade com a função: ${roleFit}/100.`, `Cobertura da ficha: ${attributeCoverage}/100.`],
      warnings: saturationPenalty ? [`Perde ${saturationPenalty} ponto(s) por reforçar grupo já saturado.`] : [],
      reason: `${cleanReason} Nota final calculada depois da ficha e do Top 5: ${performanceScore}/100.`,
      performanceScore,
      roleFit,
      attributeCoverage,
      buildSynergy,
      skillSynergy,
      saturationPenalty,
      supportedGroups: groups
    } satisfies PowerImpetoDecision;
  }).sort((left, right) => right.performanceScore - left.performanceScore || left.saturationPenalty - right.saturationPenalty);

  return decisions.map((item, index) => ({ ...item, tier: index === 0 ? 'ideal' : index < 5 ? 'alternativo' : 'evitar' }));
}

function powerSkills(result: AnalysisResult, plan: TrainingPlan): PowerSkillDecision[] {
  const decisions = buildPersonalizedSkillPlan(result, plan, { label: 'desempenho real v38.50' });
  const safeNames = filterComplementaryAdditionalSkills(
    [...decisions.map((item) => item.name), ...result.recommendedSkills],
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5,
    result.parsed.additionalSkills ?? []
  );
  const redundancyEdges = result.advancedMotorV3750?.skillGraph.edges.filter((edge) => edge.relation === 'redundância') ?? [];
  return safeNames.map((name, index) => {
    const decision = decisions.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name));
    const fallback: UnifiedSkillDecision = decision ?? {
      name,
      score: Math.max(60, 82 - index * 4),
      priority: index === 0 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
      category: 'mental',
      gameplayImpact: 'Complementa a função sem repetir habilidade já existente.',
      reasons: ['Mantida pelo filtro oficial e complementar da carta.'],
      supportedBy: [],
      identityBoost: 0
    };
    const redundancyPenalty = redundancyEdges
      .filter((edge) => {
        const from = result.advancedMotorV3750?.skillGraph.nodes.find((node) => node.id === edge.from)?.name;
        const to = result.advancedMotorV3750?.skillGraph.nodes.find((node) => node.id === edge.to)?.name;
        return skillIdentityKey(from ?? '') === skillIdentityKey(name) || skillIdentityKey(to ?? '') === skillIdentityKey(name);
      })
      .reduce((sum, edge) => sum + Math.round(edge.weight / 12), 0);
    const score = clamp(fallback.score - redundancyPenalty);
    return {
      ...fallback,
      score,
      priority: index === 0 || score >= 88 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
      activationFrequency: score >= 88 ? 'muito alta' : score >= 76 ? 'alta' : 'média',
      coverageRole: CATEGORY_ROLE[fallback.category],
      redundancyPenalty
    };
  });
}

function candidateDimensions(result: AnalysisResult, plan: TrainingPlan, shape: RoleShape, skills: PowerSkillDecision[], impetos: PowerImpetoDecision[]): { dimensions: PowerBuildScoreDimensions; saturationPenalty: number; wastePenalty: number; thresholdsMet: number; thresholdsTotal: number } {
  const utility = marginalUtility(plan, shape);
  const floorEntries = Object.entries(shape.floors).filter(([, value]) => Number(value) > 0) as Array<[TrainingKey, number]>;
  const thresholdsMet = floorEntries.filter(([key, floor]) => Number(plan[key] ?? 0) >= floor).length;
  const roleExecution = weightedRatio(plan, shape.caps, shape.weights);
  const functionalThresholds = weightedRatio(plan, shape.floors, shape.weights);
  const responsiveness = subsetScore(plan, shape, responseKeys(result));
  const identityPreservation = identityScore(result, plan, shape);
  const specialSkillActivation = specialSkillActivationScore(result, plan, shape);
  const skillCoverage = skillPlanScore(skills);
  const impetoSynergy = impetos[0]?.performanceScore ?? 35;
  const online = onlineRobustness(result, plan, shape);
  const spreadPenalty = planSpreadPenalty(result, plan);
  const antiOverallWaste = clamp(100 - utility.saturationPenalty - utility.wastePenalty - spreadPenalty);
  const exactBudget = trainingPlanTotalCost(plan) === result.trainingPointsTotal ? 100 : 0;
  const confidenceSafety = conservativeSafety(result, plan);
  return {
    dimensions: {
      roleExecution,
      functionalThresholds,
      pointEfficiency: clamp(utility.score - utility.saturationPenalty * .7 - utility.wastePenalty * .8),
      responsiveness,
      identityPreservation,
      specialSkillActivation,
      skillCoverage,
      impetoSynergy,
      onlineRobustness: online,
      antiOverallWaste,
      exactBudget,
      confidenceSafety
    },
    saturationPenalty: utility.saturationPenalty,
    wastePenalty: clamp(utility.wastePenalty + spreadPenalty),
    thresholdsMet,
    thresholdsTotal: floorEntries.length
  };
}

function finalPerformanceScore(dimensions: PowerBuildScoreDimensions) {
  return clamp(
    dimensions.roleExecution * .17
    + dimensions.functionalThresholds * .13
    + dimensions.pointEfficiency * .13
    + dimensions.responsiveness * .08
    + dimensions.identityPreservation * .1
    + dimensions.specialSkillActivation * .07
    + dimensions.skillCoverage * .09
    + dimensions.impetoSynergy * .08
    + dimensions.onlineRobustness * .06
    + dimensions.antiOverallWaste * .06
    + dimensions.exactBudget * .02
    + dimensions.confidenceSafety * .01
  );
}

function candidateNarrative(dimensions: PowerBuildScoreDimensions, thresholdsMet: number, thresholdsTotal: number, saturationPenalty: number, wastePenalty: number) {
  const ranking = Object.entries(dimensions)
    .filter(([key]) => key !== 'exactBudget')
    .sort((left, right) => right[1] - left[1]);
  const strengths = ranking.slice(0, 4).map(([key, value]) => {
    const labels: Partial<Record<keyof PowerBuildScoreDimensions, string>> = {
      roleExecution: 'execução da função', functionalThresholds: 'pisos funcionais', pointEfficiency: 'eficiência dos pontos', responsiveness: 'resposta em campo', identityPreservation: 'preservação do DNA', specialSkillActivation: 'ativação de habilidades especiais', skillCoverage: 'cobertura do Top 5', impetoSynergy: 'sinergia do Ímpeto', onlineRobustness: 'robustez online', antiOverallWaste: 'controle antidesperdício', confidenceSafety: 'segurança da leitura'
    };
    return `${labels[key as keyof PowerBuildScoreDimensions] ?? key}: ${value}/100`;
  });
  const tradeOffs: string[] = [];
  if (thresholdsMet < thresholdsTotal) tradeOffs.push(`${thresholdsTotal - thresholdsMet} piso(s) funcional(is) ainda abaixo da referência.`);
  if (saturationPenalty) tradeOffs.push(`Saturação estimada: -${saturationPenalty}.`);
  if (wastePenalty) tradeOffs.push(`Desperdício potencial: -${wastePenalty}.`);
  if (!tradeOffs.length) tradeOffs.push('Nenhum desperdício estrutural relevante detectado.');
  return { strengths, tradeOffs };
}

function evaluateCandidate(result: AnalysisResult, seed: CandidateSeed, shape: RoleShape, priority: TrainingKey[]): EvaluatedCandidate {
  const training = exactPlan(seed.training, result, priority);
  const skills = powerSkills(result, training);
  const impetos = scoreImpetos(result, training, shape, skills);
  const metrics = candidateDimensions(result, training, shape, skills, impetos);
  const performanceScore = finalPerformanceScore(metrics.dimensions);
  const narrative = candidateNarrative(metrics.dimensions, metrics.thresholdsMet, metrics.thresholdsTotal, metrics.saturationPenalty, metrics.wastePenalty);
  return {
    id: `${seed.id}-${signature(training)}`,
    title: seed.title,
    source: seed.source,
    training,
    pointsUsed: trainingPlanTotalCost(training),
    exactBudget: trainingPlanTotalCost(training) === result.trainingPointsTotal,
    performanceScore,
    dimensions: metrics.dimensions,
    thresholdsMet: metrics.thresholdsMet,
    thresholdsTotal: metrics.thresholdsTotal,
    saturationPenalty: metrics.saturationPenalty,
    wastePenalty: metrics.wastePenalty,
    strengths: narrative.strengths,
    tradeOffs: narrative.tradeOffs,
    skillPlan: skills,
    impetoPlan: impetos
  };
}

export function buildPowerBuildEngineV3850(result: AnalysisResult): PowerBuildEngineV3850Analysis {
  const shape = adjustedRoleShape(result);
  const priority = priorityFromShape(shape, result.bestPosition.code);
  const seeds = collectCandidateSeeds(result, shape, priority);
  const unique = new Map<string, CandidateSeed>();
  for (const seed of seeds) {
    const training = exactPlan(seed.training, result, priority);
    const key = signature(training);
    if (!unique.has(key)) unique.set(key, { ...seed, training });
  }
  const evaluated = Array.from(unique.values())
    .map((seed) => evaluateCandidate(result, seed, shape, priority))
    .sort((left, right) => right.performanceScore - left.performanceScore || left.saturationPenalty - right.saturationPenalty || left.wastePenalty - right.wastePenalty);
  const fallback = evaluateCandidate(result, { id: 'fallback', title: 'Ficha segura', source: 'fallback v38.50', training: result.training }, shape, priority);
  const winner = evaluated[0] ?? fallback;
  const finalists = (evaluated.length ? evaluated : [fallback]).slice(0, 5).map(({ skillPlan: _skillPlan, impetoPlan: _impetoPlan, ...candidate }) => candidate);
  const confidence = clamp(
    Number(result.structuralPrecision?.criticalConfidence ?? result.parsed.confidence) * .4
    + winner.performanceScore * .45
    + winner.dimensions.confidenceSafety * .15
  );
  return {
    engineVersion: POWER_BUILD_ENGINE_V3850_VERSION,
    philosophy: 'DESEMPENHO_REAL_SEM_FOCO_EM_OVERALL',
    improvements: [...IMPROVEMENTS],
    candidatesEvaluated: evaluated.length || 1,
    finalists,
    winner: finalists[0] ?? fallback,
    skills: winner.skillPlan,
    impetos: winner.impetoPlan,
    confidence,
    decision: winner.exactBudget && confidence >= 60 ? 'aprovada' : 'revisar',
    guardrails: [
      'Nenhuma dimensão do novo motor lê GER/overall para escolher a ficha vencedora.',
      'A posição selecionada pelo usuário é soberana e os grupos incompatíveis são zerados.',
      'O custo progressivo é recalculado depois de cada ajuste e precisa fechar o orçamento.',
      'Habilidades nativas, especiais e adicionais já instaladas são removidas do Top 5.',
      'Ímpeto é escolhido somente depois da ficha e das cinco habilidades definitivas.',
      'Baixa confiança de OCR aproxima a decisão da variante conservadora em vez de inventar precisão.'
    ],
    summary: `${winner.title} venceu com ${winner.performanceScore}/100 em desempenho funcional, ${winner.dimensions.pointEfficiency}/100 em eficiência de pontos e ${winner.dimensions.antiOverallWaste}/100 no controle antidesperdício.`
  };
}

export function applyPowerBuildEngineV3850(result: AnalysisResult): AnalysisResult {
  const analysis = buildPowerBuildEngineV3850(result);
  const training = normalizeTrainingPlan(analysis.winner.training);
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = trainingPlanTotalCost(training);
  const recommendedSkills = analysis.skills.map((item) => item.name);
  const skillRecommendations = [
    ...analysis.skills.map((item) => ({
      name: item.name,
      tier: item.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const,
      reason: `${item.gameplayImpact} Frequência ${item.activationFrequency}; cobre ${item.coverageRole}.`
    })),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !recommendedSkills.some((name) => skillIdentityKey(name) === skillIdentityKey(item.name)))
  ];
  const recommendedImpetos = analysis.impetos.map((item) => ({
    name: item.name,
    tier: item.tier,
    attributes: item.attributes,
    reason: item.reason,
    score: item.performanceScore,
    confidence: item.confidence,
    official: item.official,
    evidence: item.evidence,
    warnings: item.warnings
  }));
  const structuralPrecision = buildStructuralPrecisionAnalysis(result.parsed, training, result.trainingPointsTotal, result.bestPosition.code);
  const baseValidation = { ...result.validation, issues: result.validation.issues.filter((item) => !/^STRUCTURAL_|^FIELD_/.test(item.code)) };
  const validation = mergeStructuralValidation(baseValidation, structuralPrecision);
  const auto = result.parsed.autoTrainingPlan ?? emptyTraining();
  const trainingComparison = TRAINING_KEYS.map((key) => ({ key, label: TRAINING_LABELS[key], auto: Number(auto[key] ?? 0), recommended: Number(training[key] ?? 0), difference: Number(training[key] ?? 0) - Number(auto[key] ?? 0) }));
  const winnerVariant = {
    kind: 'competitive' as const,
    title: `Potência funcional v38.50 — ${analysis.winner.title}`,
    positionLabel: result.bestPosition.label,
    training,
    pointsUsed: trainingPointsUsed,
    note: analysis.summary,
    qualityScore: analysis.winner.performanceScore,
    adaptationLabel: 'Desempenho real sem foco em overall',
    highlights: analysis.winner.strengths,
    risks: analysis.winner.tradeOffs,
    efficiencyScore: analysis.winner.dimensions.pointEfficiency,
    balanceScore: analysis.winner.dimensions.functionalThresholds,
    verdict: analysis.decision === 'aprovada' ? 'Ficha aprovada pelo motor funcional v38.50.' : 'Revise os dados críticos antes de aplicar.',
    tradeOffs: analysis.winner.tradeOffs,
    simulationsTested: analysis.candidatesEvaluated
  };
  return {
    ...result,
    training,
    trainingCost,
    trainingPointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - trainingPointsUsed,
    trainingComparison,
    buildVariants: [winnerVariant, ...result.buildVariants.filter((item) => signature(item.training) !== signature(training))].slice(0, 8),
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos,
    structuralPrecision,
    validation,
    powerBuildV3850: analysis,
    advancedOptimizer: {
      ...result.advancedOptimizer,
      combinationsTested: Math.max(result.advancedOptimizer.combinationsTested, analysis.candidatesEvaluated),
      winnerTitle: winnerVariant.title,
      winnerScore: analysis.winner.performanceScore,
      efficiencyScore: analysis.winner.dimensions.pointEfficiency,
      wasteScore: 100 - analysis.winner.dimensions.antiOverallWaste,
      unusedPoints: Math.max(0, result.trainingPointsTotal - trainingPointsUsed),
      usefulInvestment: analysis.winner.strengths,
      detectedWaste: analysis.winner.tradeOffs,
      decisionReasons: [analysis.summary, ...result.advancedOptimizer.decisionReasons].slice(0, 8),
      positionPreserved: true,
      budgetRespected: trainingPointsUsed === result.trainingPointsTotal
    },
    errorTolerance: { ...result.errorTolerance, probable: training },
    recommendationExplanation: [
      `Motor funcional v38.50: ${analysis.winner.title} venceu sem usar GER como critério.`,
      `Eficiência ${analysis.winner.dimensions.pointEfficiency}/100; identidade ${analysis.winner.dimensions.identityPreservation}/100; Top 5 ${analysis.winner.dimensions.skillCoverage}/100.`,
      `Ímpeto final: ${analysis.impetos[0]?.name ?? 'revisar'} (${analysis.impetos[0]?.performanceScore ?? 0}/100).`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 16),
    deepAnalysis: {
      ...result.deepAnalysis,
      safeguards: [...analysis.guardrails, ...result.deepAnalysis.safeguards].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
      pointRationale: [analysis.summary, ...result.deepAnalysis.pointRationale].slice(0, 8)
    },
    note: `${result.note} ${analysis.summary}`
  };
}
