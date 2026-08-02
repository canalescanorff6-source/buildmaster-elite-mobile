import type {
  AdvancedBuildAlternative,
  AdvancedMotorV3750Analysis,
  AdvancedRoleOptimization,
  AnalysisResult,
  ImpetoRecommendation,
  JointBuildBoosterOption,
  PositionCode,
  SkillGraphEdge,
  SkillGraphNode,
  SkillSetComparison,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { buildPersonalizedSkillPlan, type AdditionalSkillProfileOptions } from './skillIntelligenceV31';
import { buildStructuralPrecisionAnalysis, mergeStructuralValidation } from './structuralPrecisionV3740';
import {
  TRAINING_KEYS,
  emptyTraining,
  normalizeTrainingPlan,
  trainingPlanCost,
  trainingPlanTotalCost,
  trainingTotalCost
} from './trainingPlanCore';
import { TRAINING_LABELS } from './trainingEngine';
import { filterComplementaryAdditionalSkills, skillIdentityKey } from './officialSkillIdentity';

export const ADVANCED_MOTOR_V3750_VERSION = '37.50.0' as const;

type SkillCategory = UnifiedSkillDecision['category'];

type RoleTemplate = {
  id: string;
  label: string;
  weights: Partial<Record<TrainingKey, number>>;
  categories: SkillCategory[];
  protectedGroups: TrainingKey[];
  correctionGroups: TrainingKey[];
};

const BASE_ROLE_TEMPLATES: Record<PositionCode, RoleTemplate> = {
  GK: { id: 'GK_BALANCED', label: 'Goleiro completo', weights: { gk1: 1.45, gk2: 1.35, gk3: 1.45, aerialStrength: .55, lowerBodyStrength: .35 }, categories: ['goleiro', 'goleiro', 'goleiro', 'mental', 'físico'], protectedGroups: ['gk1', 'gk2', 'gk3'], correctionGroups: ['aerialStrength', 'lowerBodyStrength'] },
  CB: { id: 'CB_DEFENDER', label: 'Zagueiro de imposição e cobertura', weights: { defending: 1.5, aerialStrength: 1.2, lowerBodyStrength: .78, dexterity: .48, passing: .38 }, categories: ['defesa', 'defesa', 'aérea', 'físico', 'passe'], protectedGroups: ['defending', 'aerialStrength'], correctionGroups: ['lowerBodyStrength', 'dexterity', 'passing'] },
  LB: { id: 'LB_BALANCED', label: 'Lateral equilibrado', weights: { defending: 1.08, lowerBodyStrength: .95, dexterity: .78, passing: .72, dribbling: .48, aerialStrength: .35 }, categories: ['defesa', 'passe', 'físico', 'drible', 'mental'], protectedGroups: ['defending', 'lowerBodyStrength'], correctionGroups: ['passing', 'dexterity'] },
  RB: { id: 'RB_BALANCED', label: 'Lateral equilibrado', weights: { defending: 1.08, lowerBodyStrength: .95, dexterity: .78, passing: .72, dribbling: .48, aerialStrength: .35 }, categories: ['defesa', 'passe', 'físico', 'drible', 'mental'], protectedGroups: ['defending', 'lowerBodyStrength'], correctionGroups: ['passing', 'dexterity'] },
  DMF: { id: 'DMF_ANCHOR', label: 'Primeiro volante de proteção', weights: { defending: 1.32, passing: .88, lowerBodyStrength: .78, dexterity: .58, aerialStrength: .48, dribbling: .32 }, categories: ['defesa', 'defesa', 'passe', 'físico', 'mental'], protectedGroups: ['defending', 'passing'], correctionGroups: ['lowerBodyStrength', 'dexterity'] },
  CMF: { id: 'CMF_BOX_TO_BOX', label: 'Meia versátil de duas áreas', weights: { passing: 1.05, lowerBodyStrength: .82, dribbling: .78, dexterity: .72, defending: .62, shooting: .42 }, categories: ['passe', 'drible', 'físico', 'defesa', 'mental'], protectedGroups: ['passing', 'lowerBodyStrength'], correctionGroups: ['dribbling', 'dexterity', 'defending'] },
  LMF: { id: 'LMF_CONNECTOR', label: 'Meia lateral de conexão', weights: { passing: 1.0, lowerBodyStrength: .88, dribbling: .8, dexterity: .72, defending: .45, shooting: .38 }, categories: ['passe', 'drible', 'físico', 'mental', 'defesa'], protectedGroups: ['passing', 'lowerBodyStrength'], correctionGroups: ['dribbling', 'dexterity'] },
  RMF: { id: 'RMF_CONNECTOR', label: 'Meia lateral de conexão', weights: { passing: 1.0, lowerBodyStrength: .88, dribbling: .8, dexterity: .72, defending: .45, shooting: .38 }, categories: ['passe', 'drible', 'físico', 'mental', 'defesa'], protectedGroups: ['passing', 'lowerBodyStrength'], correctionGroups: ['dribbling', 'dexterity'] },
  AMF: { id: 'AMF_CREATOR', label: 'Meia criador entrelinhas', weights: { passing: 1.22, dribbling: 1.08, dexterity: .92, shooting: .62, lowerBodyStrength: .42 }, categories: ['passe', 'passe', 'drible', 'finalização', 'mental'], protectedGroups: ['passing', 'dribbling'], correctionGroups: ['dexterity', 'shooting'] },
  SS: { id: 'SS_LINK', label: 'Segundo atacante associativo', weights: { dribbling: 1.04, dexterity: 1.02, shooting: .95, passing: .8, lowerBodyStrength: .58, aerialStrength: .25 }, categories: ['finalização', 'passe', 'drible', 'mental', 'físico'], protectedGroups: ['dribbling', 'dexterity'], correctionGroups: ['shooting', 'passing'] },
  CF: { id: 'CF_FINISHER', label: 'Centroavante finalizador', weights: { shooting: 1.4, dexterity: 1.1, lowerBodyStrength: .88, aerialStrength: .72, dribbling: .48, passing: .28 }, categories: ['finalização', 'finalização', 'físico', 'aérea', 'mental'], protectedGroups: ['shooting', 'dexterity'], correctionGroups: ['lowerBodyStrength', 'aerialStrength'] },
  LWF: { id: 'LWF_INSIDE', label: 'Atacante de lado por dentro', weights: { dribbling: 1.18, dexterity: 1.08, shooting: .9, lowerBodyStrength: .72, passing: .5 }, categories: ['drible', 'finalização', 'passe', 'mental', 'físico'], protectedGroups: ['dribbling', 'dexterity'], correctionGroups: ['shooting', 'lowerBodyStrength'] },
  RWF: { id: 'RWF_INSIDE', label: 'Atacante de lado por dentro', weights: { dribbling: 1.18, dexterity: 1.08, shooting: .9, lowerBodyStrength: .72, passing: .5 }, categories: ['drible', 'finalização', 'passe', 'mental', 'físico'], protectedGroups: ['dribbling', 'dexterity'], correctionGroups: ['shooting', 'lowerBodyStrength'] }
};

const COMPLEMENT_PAIRS: Array<[string, string, string]> = [
  ['Passe de primeira', 'Passe em profundidade', 'Tabela rápida com progressão vertical.'],
  ['Passe de primeira', 'Toque de calcanhar', 'Acelera combinações em espaço curto.'],
  ['Interceptação', 'Bloqueador', 'Cobre corte de linha e bloqueio da finalização.'],
  ['Marcação individual', 'Interceptação', 'Combina perseguição controlada com leitura de passe.'],
  ['Cabeçada', 'Superioridade aérea', 'Amplia aproveitamento ofensivo e defensivo pelo alto.'],
  ['Chute de primeira', 'Precisão à distância', 'Aumenta variedade de finalização sem domínio.'],
  ['Toque duplo', 'Controle com a sola', 'Une mudança curta de direção e domínio sob pressão.'],
  ['Reposição baixa do goleiro', 'Arremesso longo do goleiro', 'Oferece duas saídas rápidas de distribuição.']
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function allowedTrainingKeys(position: PositionCode): TrainingKey[] {
  return position === 'GK'
    ? ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength']
    : ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
}

function playstyleAdjustedRole(result: AnalysisResult): RoleTemplate {
  const base = BASE_ROLE_TEMPLATES[result.bestPosition.code];
  const weights = { ...base.weights };
  const style = normalizeText(result.parsed.playstyle);
  const increase = (key: TrainingKey, amount: number) => { weights[key] = Number(weights[key] ?? 0) + amount; };
  let id = base.id;
  let label = base.label;

  if (/armador|orquestrador|criativo|classico/.test(style)) {
    increase('passing', .22); increase('dribbling', .12);
    id = `${base.id}_CREATOR`; label = `${base.label} criativo`;
  }
  if (/infiltra|artilheiro|oportunista|prolifico/.test(style)) {
    increase('shooting', .2); increase('dexterity', .18);
    id = `${base.id}_RUNNER`; label = `${base.label} de infiltração`;
  }
  if (/destruidor|primeiro volante|defensivo/.test(style)) {
    increase('defending', .22); increase('lowerBodyStrength', .12);
    id = `${base.id}_DEFENSIVE`; label = `${base.label} defensivo`;
  }
  if (/homem de area|pivo|alvo/.test(style)) {
    increase('aerialStrength', .22); increase('lowerBodyStrength', .16); increase('passing', .06);
    id = `${base.id}_TARGET`; label = `${base.label} de referência`;
  }
  if (/goleiro ofensivo/.test(style)) {
    increase('gk1', .08); increase('lowerBodyStrength', .08);
    id = 'GK_SWEEPER'; label = 'Goleiro ofensivo de reação e saída';
  }
  if (/goleiro defensivo/.test(style)) {
    increase('gk2', .12); increase('gk3', .12);
    id = 'GK_SHOT_STOPPER'; label = 'Goleiro defensivo de proteção';
  }

  // A v37.50 é a autoridade final da ficha. Portanto, os pesos usados para
  // escolher a combinação vencedora também precisam preservar o contexto que
  // já foi calibrado na v32: modo, conexão e estilo de controle. Sem este bloco,
  // a última passagem podia convergir para a mesma ficha em ranqueado com delay
  // alto e em partida offline estável, apagando a adaptação feita antes.
  const mode = result.tacticalProfile.gameplayMode ?? 'UNIVERSAL';
  const connection = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const control = result.tacticalProfile.controlProfile ?? 'BALANCED';

  if (mode === 'RANKED') {
    increase('passing', .18);
    increase('dexterity', .16);
    increase('lowerBodyStrength', .1);
    id = `${id}_RANKED`;
  } else if (mode === 'OFFLINE') {
    increase('dribbling', .2);
    increase('shooting', .08);
    id = `${id}_OFFLINE`;
  }

  if (connection === 'HIGH_DELAY') {
    increase('passing', .42);
    increase('dexterity', .34);
    increase('lowerBodyStrength', .2);
    id = `${id}_DELAY`;
    label = `${label} adaptado ao delay`;
  } else if (connection === 'STABLE') {
    increase('dribbling', .14);
    increase('shooting', .06);
  }

  if (control === 'PASSING') {
    increase('passing', .38);
    increase('dexterity', .1);
    id = `${id}_PASSING`;
  } else if (control === 'DRIBBLE') {
    increase('dribbling', .38);
    increase('dexterity', .12);
    id = `${id}_DRIBBLE`;
  } else if (control === 'DIRECT') {
    increase('shooting', .18);
    increase('lowerBodyStrength', .14);
    id = `${id}_DIRECT`;
  }

  return { ...base, id, label, weights };
}

function roleAnalysis(result: AnalysisResult): AdvancedRoleOptimization {
  const role = playstyleAdjustedRole(result);
  const allowed = allowedTrainingKeys(result.bestPosition.code);
  const primaryGroups = [...allowed]
    .sort((left, right) => Number(role.weights[right] ?? 0) - Number(role.weights[left] ?? 0))
    .slice(0, 3);
  const functionScore = clamp(
    68
    + Number(result.bestPosition.score ?? 0) * .18
    + Number(result.structuralPrecision?.criticalConfidence ?? result.parsed.confidence) * .12
    + (result.tacticalProfile.style !== 'AUTO' ? 5 : 0)
  );
  return {
    roleId: role.id,
    roleLabel: role.label,
    position: result.bestPosition.code,
    functionScore,
    weights: role.weights,
    primaryGroups,
    protectedGroups: role.protectedGroups,
    correctionGroups: role.correctionGroups,
    reasons: [
      `A posição escolhida ${result.bestPosition.label} permanece autoritativa.`,
      result.parsed.playstyle ? `O estilo oficial ${result.parsed.playstyle} ajusta os pesos da função.` : 'Sem estilo confirmado: a otimização usa posição, atributos e contexto tático.',
      `Prioridades principais: ${primaryGroups.map((key) => TRAINING_LABELS[key]).join(', ')}.`
    ]
  };
}

function planSignature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key]}`).join('|');
}

function nextLevelCost(plan: TrainingPlan, key: TrainingKey) {
  const level = Number(plan[key] ?? 0);
  return trainingTotalCost(level + 1) - trainingTotalCost(level);
}

function previousLevelRefund(plan: TrainingPlan, key: TrainingKey) {
  const level = Number(plan[key] ?? 0);
  return level > 0 ? trainingTotalCost(level) - trainingTotalCost(level - 1) : 0;
}

function fitPlanExactly(seed: TrainingPlan, budget: number, position: PositionCode, weights: Partial<Record<TrainingKey, number>>) {
  const allowed = allowedTrainingKeys(position);
  const plan = normalizeTrainingPlan(seed);
  for (const key of TRAINING_KEYS) if (!allowed.includes(key)) plan[key] = 0;

  let guard = 0;
  while (trainingPlanTotalCost(plan) > budget && guard < 500) {
    guard += 1;
    const candidates = allowed
      .filter((key) => plan[key] > 0)
      .map((key) => ({ key, value: Number(weights[key] ?? 0), refund: previousLevelRefund(plan, key), level: plan[key] }))
      .sort((left, right) => left.value - right.value || right.refund - left.refund || right.level - left.level);
    if (!candidates.length) break;
    plan[candidates[0].key] -= 1;
  }

  guard = 0;
  while (trainingPlanTotalCost(plan) < budget && guard < 800) {
    guard += 1;
    const remaining = budget - trainingPlanTotalCost(plan);
    const candidates = allowed
      .filter((key) => plan[key] < 16 && nextLevelCost(plan, key) <= remaining)
      .map((key) => {
        const saturation = Math.max(0, plan[key] - 8) * .07;
        return { key, utility: Number(weights[key] ?? .1) - saturation, cost: nextLevelCost(plan, key), level: plan[key] };
      })
      .sort((left, right) => right.utility - left.utility || left.cost - right.cost || left.level - right.level);
    if (candidates.length) {
      plan[candidates[0].key] += 1;
      continue;
    }
    const removable = allowed
      .filter((key) => plan[key] > 0)
      .map((key) => ({ key, value: Number(weights[key] ?? 0), refund: previousLevelRefund(plan, key) }))
      .sort((left, right) => left.value - right.value || right.refund - left.refund)[0];
    if (!removable) break;
    plan[removable.key] -= 1;
  }
  return plan;
}

function buildGreedyRolePlan(budget: number, role: AdvancedRoleOptimization) {
  return fitPlanExactly(emptyTraining(), budget, role.position, role.weights);
}

function blendPlans(left: TrainingPlan, right: TrainingPlan) {
  const result = emptyTraining();
  for (const key of TRAINING_KEYS) result[key] = Math.round((Number(left[key] ?? 0) + Number(right[key] ?? 0)) / 2);
  return result;
}

function robustWeights(role: AdvancedRoleOptimization) {
  const weights = { ...role.weights };
  const boost = (key: TrainingKey, value: number) => { weights[key] = Number(weights[key] ?? 0) + value; };
  if (role.position === 'GK') { boost('gk2', .18); boost('gk3', .18); boost('aerialStrength', .1); }
  else if (['CB', 'DMF', 'LB', 'RB'].includes(role.position)) { boost('defending', .16); boost('lowerBodyStrength', .14); boost('dexterity', .08); }
  else { boost('dexterity', .16); boost('lowerBodyStrength', .14); boost('passing', .08); }
  return weights;
}

function planBalance(plan: TrainingPlan, position: PositionCode) {
  const active = allowedTrainingKeys(position).map((key) => plan[key]).filter((value) => value > 0);
  if (!active.length) return 0;
  const average = active.reduce((sum, value) => sum + value, 0) / active.length;
  const deviation = active.reduce((sum, value) => sum + Math.abs(value - average), 0) / active.length;
  return clamp(98 - deviation * 6 - Math.max(0, active.length - 6) * 2);
}

function planRoleFit(plan: TrainingPlan, role: AdvancedRoleOptimization) {
  const allowed = allowedTrainingKeys(role.position);
  const totalWeight = allowed.reduce((sum, key) => sum + Number(role.weights[key] ?? 0), 0) || 1;
  const weighted = allowed.reduce((sum, key) => sum + Number(plan[key] ?? 0) * Number(role.weights[key] ?? 0), 0);
  const maxLevel = Math.max(1, ...allowed.map((key) => Number(plan[key] ?? 0)));
  return clamp(58 + (weighted / (totalWeight * maxLevel)) * 39);
}

function planEfficiency(plan: TrainingPlan, role: AdvancedRoleOptimization, budget: number) {
  const exact = trainingPlanTotalCost(plan) === budget;
  const waste = allowedTrainingKeys(role.position).reduce((sum, key) => {
    const level = Number(plan[key] ?? 0);
    const weight = Number(role.weights[key] ?? 0);
    return sum + (weight < .45 ? Math.max(0, level - 5) * 2.5 : 0) + Math.max(0, level - 12) * 2;
  }, 0);
  return clamp((exact ? 94 : 70) - waste);
}

function buildAlternatives(result: AnalysisResult, role: AdvancedRoleOptimization): AdvancedBuildAlternative[] {
  const budget = result.trainingPointsTotal;
  // A calibração v32 já incorpora modo, conexão e controle. Como o Motor v37.50
  // roda duas vezes para reconciliar habilidades, a segunda passagem não pode
  // usar como semente apenas o vencedor genérico da primeira. O plano calibrado
  // permanece a referência contextual e mantém a operação idempotente.
  const contextualTraining = result.calibrationV32?.finalTraining ?? result.training;
  const rolePlan = buildGreedyRolePlan(budget, role);
  const robustPlan = fitPlanExactly(contextualTraining, budget, role.position, robustWeights(role));
  const identitySeed = result.buildVariants.find((item) => /identidade/i.test(item.title))?.training ?? result.errorTolerance?.conservative ?? contextualTraining;
  const adaptationSeed = result.buildVariants.find((item) => /adapta/i.test(item.title))?.training ?? result.errorTolerance?.optimistic ?? rolePlan;
  const seeds: Array<{ title: string; strategy: AdvancedBuildAlternative['strategy']; plan: TrainingPlan; strengths: string[]; tradeOffs: string[] }> = [
    { title: 'Ficha recomendada v37.50', strategy: 'recomendada', plan: contextualTraining, strengths: ['Mantém a ficha final já calibrada por modo, conexão e controle.', 'Serve como referência para as demais simulações.'], tradeOffs: ['Pode não maximizar uma função isolada.'] },
    { title: `Especialista — ${role.roleLabel}`, strategy: 'função', plan: rolePlan, strengths: [`Maximiza as exigências de ${role.roleLabel}.`, `Prioriza ${role.primaryGroups.map((key) => TRAINING_LABELS[key]).join(', ')}.`], tradeOffs: ['Aceita menor equilíbrio para aumentar especialização.'] },
    { title: 'Ficha identidade da carta', strategy: 'identidade', plan: identitySeed, strengths: ['Protege os diferenciais naturais da versão da carta.', 'Evita transformar o jogador em um molde genérico da posição.'], tradeOffs: ['Pode preservar uma limitação difícil de corrigir.'] },
    { title: 'Ficha equilíbrio competitivo', strategy: 'equilíbrio', plan: blendPlans(contextualTraining, adaptationSeed), strengths: ['Distribui risco entre técnica, físico e função.', 'Boa opção para diferentes ritmos de partida.'], tradeOffs: ['Não entrega o pico máximo de uma única característica.'] },
    { title: 'Ficha robusta para partida real', strategy: 'robustez', plan: robustPlan, strengths: ['Valoriza resposta, resistência e estabilidade.', 'Reduz dependência de uma única ação de jogo.'], tradeOffs: ['Pode ceder alguns pontos de especialização técnica.'] }
  ];

  const unique = new Set<string>();
  const alternatives = seeds
    .map((seed, index) => {
      const weights = seed.strategy === 'robustez' ? robustWeights(role) : role.weights;
      const training = fitPlanExactly(seed.plan, budget, role.position, weights);
      const signature = planSignature(training);
      if (unique.has(signature)) {
        const mutated = { ...training };
        const ordered = [...allowedTrainingKeys(role.position)].sort((left, right) => Number(role.weights[right] ?? 0) - Number(role.weights[left] ?? 0));
        const high = ordered[index % ordered.length];
        const low = [...ordered].reverse().find((key) => mutated[key] > 0) ?? ordered[ordered.length - 1];
        mutated[low] = Math.max(0, mutated[low] - 1);
        mutated[high] = Math.min(16, mutated[high] + 1);
        Object.assign(training, fitPlanExactly(mutated, budget, role.position, weights));
      }
      unique.add(planSignature(training));
      const roleFit = planRoleFit(training, role);
      const efficiency = planEfficiency(training, role, budget);
      const balance = planBalance(training, role.position);
      const overallScore = clamp(roleFit * .48 + efficiency * .32 + balance * .2);
      return {
        id: `build-${index + 1}-${stableHash(planSignature(training))}`,
        title: seed.title,
        strategy: seed.strategy,
        training,
        pointsUsed: trainingPlanTotalCost(training),
        exactBudget: trainingPlanTotalCost(training) === budget,
        roleFit,
        efficiency,
        balance,
        overallScore,
        strengths: seed.strengths,
        tradeOffs: seed.tradeOffs
      } satisfies AdvancedBuildAlternative;
    })
    .filter((item, index, all) => all.findIndex((other) => planSignature(other.training) === planSignature(item.training)) === index)
    .sort((left, right) => right.overallScore - left.overallScore);

  return alternatives.slice(0, 5);
}

function preferredCategoriesFor(strategy: AdvancedBuildAlternative['strategy'], role: RoleTemplate): SkillCategory[] {
  if (strategy === 'função') return role.categories;
  if (strategy === 'identidade') return [role.categories[0], role.categories[1], 'mental', role.categories[2], role.categories[3]];
  if (strategy === 'robustez') return role.id.startsWith('GK') ? ['goleiro', 'goleiro', 'mental', 'físico', 'goleiro'] : ['físico', 'mental', role.categories[0], role.categories[1], 'defesa'];
  if (strategy === 'equilíbrio') return [role.categories[0], role.categories[1], role.categories[2], 'mental', 'físico'];
  return role.categories;
}

function complementRelation(left: string, right: string) {
  const leftKey = skillIdentityKey(left);
  const rightKey = skillIdentityKey(right);
  return COMPLEMENT_PAIRS.find(([a, b]) => {
    const aKey = skillIdentityKey(a);
    const bKey = skillIdentityKey(b);
    return (leftKey === aKey && rightKey === bKey) || (leftKey === bKey && rightKey === aKey);
  });
}

function skillSetMetrics(decisions: UnifiedSkillDecision[], role: RoleTemplate) {
  const categories = decisions.map((item) => item.category);
  const uniqueCategories = new Set(categories).size;
  let complementCount = 0;
  let redundancyPenalty = 0;
  for (let left = 0; left < decisions.length; left += 1) {
    for (let right = left + 1; right < decisions.length; right += 1) {
      if (complementRelation(decisions[left].name, decisions[right].name)) complementCount += 1;
      if (decisions[left].category === decisions[right].category) redundancyPenalty += 3;
    }
  }
  const roleHits = categories.filter((category) => role.categories.includes(category)).length;
  const coverageScore = clamp(58 + uniqueCategories * 8 + Math.min(10, decisions.length * 2));
  const synergyScore = clamp((decisions.reduce((sum, item) => sum + item.score, 0) / Math.max(1, decisions.length)) + complementCount * 4);
  const roleFit = clamp(58 + roleHits * 7 + decisions.filter((item) => item.priority === 'essencial').length * 3);
  return { coverageScore, synergyScore, roleFit, redundancyPenalty };
}

function buildSkillSets(result: AnalysisResult, alternatives: AdvancedBuildAlternative[], role: RoleTemplate): SkillSetComparison[] {
  const sets: SkillSetComparison[] = alternatives.map((alternative, index) => {
    const preferredCategories = preferredCategoriesFor(alternative.strategy, role);
    // A ficha recomendada preserva o blueprint dinâmico do motor oficial de
    // habilidades. Ele detecta DNA dominante (drible, criação, finalização,
    // defesa etc.) melhor do que um molde fixo por posição.
    const options: AdditionalSkillProfileOptions = alternative.strategy === 'recomendada'
      ? { label: alternative.title }
      : { label: alternative.title, preferredCategories };
    const decisions = buildPersonalizedSkillPlan({ ...result, training: alternative.training }, alternative.training, options).slice(0, 5);
    const metrics = skillSetMetrics(decisions, role);
    const overallScore = clamp(metrics.coverageScore * .25 + metrics.synergyScore * .35 + metrics.roleFit * .4 - metrics.redundancyPenalty);
    return {
      id: `skills-${index + 1}-${stableHash(decisions.map((item) => skillIdentityKey(item.name)).join('|'))}`,
      title: `Conjunto ${index + 1} — ${alternative.strategy}`,
      linkedBuildId: alternative.id,
      skills: decisions.map((item) => item.name),
      decisions,
      coverageScore: metrics.coverageScore,
      synergyScore: metrics.synergyScore,
      roleFit: metrics.roleFit,
      redundancyPenalty: metrics.redundancyPenalty,
      overallScore,
      reasons: [
        `Vinculado à ${alternative.title}.`,
        `Cobre ${new Set(decisions.map((item) => item.category)).size} categoria(s) funcionais.`,
        `${decisions.filter((item) => item.priority === 'essencial').length} habilidade(s) com prioridade essencial.`
      ],
      warnings: decisions.length === 5 ? [] : [`Foram encontradas ${decisions.length}/5 habilidades oficiais disponíveis sem repetição.`]
    };
  });

  return sets
    .filter((item, index, all) => all.findIndex((other) => other.skills.map(skillIdentityKey).sort().join('|') === item.skills.map(skillIdentityKey).sort().join('|')) === index)
    .sort((left, right) => right.overallScore - left.overallScore)
    .slice(0, 5);
}

function buildSkillGraph(skillSets: SkillSetComparison[], role: RoleTemplate) {
  const nodeMap = new Map<string, SkillGraphNode>();
  const edgeMap = new Map<string, SkillGraphEdge>();
  for (const set of skillSets) {
    for (const decision of set.decisions) {
      const id = skillIdentityKey(decision.name);
      const current = nodeMap.get(id);
      nodeMap.set(id, {
        id,
        name: decision.name,
        category: decision.category,
        score: Math.max(current?.score ?? 0, decision.score),
        appearsInSets: (current?.appearsInSets ?? 0) + 1,
        essentialForRole: role.categories.slice(0, 3).includes(decision.category)
      });
    }
    for (let left = 0; left < set.decisions.length; left += 1) {
      for (let right = left + 1; right < set.decisions.length; right += 1) {
        const a = set.decisions[left];
        const b = set.decisions[right];
        const pairKey = [skillIdentityKey(a.name), skillIdentityKey(b.name)].sort().join('::');
        const complement = complementRelation(a.name, b.name);
        const relation: SkillGraphEdge['relation'] = complement ? 'complemento' : a.category === b.category ? 'redundância' : 'complemento';
        const weight = complement ? 92 : a.category === b.category ? 58 : 68;
        const reason = complement?.[2] ?? (a.category === b.category ? `As duas habilidades disputam espaço na categoria ${a.category}.` : `Cobrem ações diferentes dentro do mesmo conjunto funcional.`);
        const existing = edgeMap.get(pairKey);
        if (!existing || weight > existing.weight) edgeMap.set(pairKey, { from: skillIdentityKey(a.name), to: skillIdentityKey(b.name), relation, weight, reason });
      }
    }
  }
  const nodes = [...nodeMap.values()].sort((left, right) => right.appearsInSets - left.appearsInSets || right.score - left.score).slice(0, 18);
  const nodeIds = new Set(nodes.map((item) => item.id));
  const edges = [...edgeMap.values()].filter((item) => nodeIds.has(item.from) && nodeIds.has(item.to)).sort((left, right) => right.weight - left.weight).slice(0, 30);
  return { nodes, edges };
}

function boosterTrainingGroups(booster: ImpetoRecommendation): TrainingKey[] {
  const text = normalizeText(`${booster.name} ${booster.attributes.join(' ')}`);
  const groups = new Set<TrainingKey>();
  if (/chute|finaliza|curva|bola parada|ofensivo|artilheiro|precisao/.test(text)) groups.add('shooting');
  if (/passe|cria|cruzamento|volante criativo|motor do time/.test(text)) groups.add('passing');
  if (/drible|conducao|tecnica|posse|fantasista/.test(text)) groups.add('dribbling');
  if (/agilidade|acelera|movimento sem a bola|instinto/.test(text)) groups.add('dexterity');
  if (/velocidade|resistencia|forca do chute|transicao/.test(text)) groups.add('lowerBodyStrength');
  if (/aereo|salto|contato|fisicalidade|duelo|forca/.test(text)) groups.add('aerialStrength');
  if (/defesa|bloqueio|roubo|desarme|reconstrucao|guardiao/.test(text)) groups.add('defending');
  if (/goleiro|defesaca|guardiao/.test(text)) { groups.add('gk1'); groups.add('gk2'); groups.add('gk3'); }
  return [...groups];
}

function boosterCandidates(result: AnalysisResult): ImpetoRecommendation[] {
  const combined: ImpetoRecommendation[] = [...result.recommendedImpetos];
  for (const owned of result.parsed.impetos.filter((item) => item.active !== false)) {
    if (!combined.some((item) => skillIdentityKey(item.name) === skillIdentityKey(owned.name))) {
      combined.push({ name: owned.name, tier: 'alternativo', attributes: [], reason: 'Ímpeto já identificado na carta; comparado com as opções recomendadas.', score: 68, confidence: result.structuralPrecision?.fields.find((item) => item.key === 'impetos')?.confidence ?? 65, official: true });
    }
  }
  return combined
    .filter((item, index, all) => all.findIndex((other) => skillIdentityKey(other.name) === skillIdentityKey(item.name)) === index)
    .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))
    .slice(0, 7);
}

function contextCriticalGroups(result: AnalysisResult): TrainingKey[] {
  const groups = new Set<TrainingKey>();
  const mode = result.tacticalProfile.gameplayMode ?? 'UNIVERSAL';
  const connection = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const control = result.tacticalProfile.controlProfile ?? 'BALANCED';
  if (mode === 'RANKED') { groups.add('dexterity'); groups.add('lowerBodyStrength'); }
  if (mode === 'OFFLINE') { groups.add('dribbling'); groups.add('shooting'); }
  if (connection === 'HIGH_DELAY') { groups.add('passing'); groups.add('dexterity'); groups.add('lowerBodyStrength'); }
  if (connection === 'STABLE' && control === 'DRIBBLE') groups.add('dribbling');
  if (control === 'PASSING') { groups.add('passing'); groups.add('dexterity'); }
  if (control === 'DRIBBLE') { groups.add('dribbling'); groups.add('dexterity'); }
  if (control === 'DIRECT') { groups.add('shooting'); groups.add('lowerBodyStrength'); }
  return [...groups].filter((key) => allowedTrainingKeys(result.bestPosition.code).includes(key));
}

function contextMismatchPenalty(result: AnalysisResult, plan: TrainingPlan) {
  const reference = result.calibrationV32?.finalTraining;
  if (!reference) return 0;
  return contextCriticalGroups(result).reduce((sum, key) => {
    const deficit = Math.max(0, Number(reference[key] ?? 0) - Number(plan[key] ?? 0));
    return sum + deficit * 2;
  }, 0);
}

function jointOptions(result: AnalysisResult, alternatives: AdvancedBuildAlternative[], skillSets: SkillSetComparison[], role: AdvancedRoleOptimization): JointBuildBoosterOption[] {
  const boosters = boosterCandidates(result);
  const options: JointBuildBoosterOption[] = [];
  for (const alternative of alternatives) {
    const set = skillSets.find((item) => item.linkedBuildId === alternative.id) ?? skillSets[0];
    if (!set) continue;
    for (const booster of boosters) {
      const groups = boosterTrainingGroups(booster).filter((key) => allowedTrainingKeys(role.position).includes(key));
      const weightedSupport = groups.reduce((sum, key) => sum + Number(alternative.training[key] ?? 0) * Number(role.weights[key] ?? .2), 0);
      const possibleSupport = Math.max(1, groups.reduce((sum, key) => sum + 10 * Number(role.weights[key] ?? .2), 0));
      const boosterSynergy = groups.length ? clamp(58 + (weightedSupport / possibleSupport) * 38) : 58;
      const saturationPenalty = groups.reduce((sum, key) => sum + Math.max(0, Number(alternative.training[key] ?? 0) - 11) * 3, 0);
      const boosterScore = clamp(Number(booster.score ?? (booster.tier === 'ideal' ? 86 : booster.tier === 'alternativo' ? 72 : 48)));
      const contextPenalty = contextMismatchPenalty(result, alternative.training);
      const overallScore = clamp(alternative.overallScore * .38 + set.overallScore * .3 + boosterScore * .2 + boosterSynergy * .12 - saturationPenalty - contextPenalty);
      options.push({
        rank: 0,
        buildId: alternative.id,
        buildTitle: alternative.title,
        boosterName: booster.name,
        boosterTier: booster.tier,
        training: alternative.training,
        skills: set.skills,
        buildScore: alternative.overallScore,
        skillSetScore: set.overallScore,
        boosterScore,
        boosterSynergy,
        saturationPenalty,
        overallScore,
        reason: `${groups.length
          ? `${booster.name} reforça ${groups.map((key) => TRAINING_LABELS[key]).join(', ')} dentro da ficha ${alternative.title}.`
          : `${booster.name} foi mantido como alternativa, mas a sinergia estrutural precisa de validação em partida.`}${contextPenalty ? ` Penalidade contextual de ${contextPenalty} ponto(s) por ficar abaixo da referência de modo, conexão ou controle.` : ''}`
      });
    }
  }
  return options
    .sort((left, right) => right.overallScore - left.overallScore || left.saturationPenalty - right.saturationPenalty)
    .slice(0, 12)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function buildAdvancedMotorV3750(result: AnalysisResult): AdvancedMotorV3750Analysis {
  const role = roleAnalysis(result);
  const roleTemplate = playstyleAdjustedRole(result);
  const alternatives = buildAlternatives(result, role);
  const skillSets = buildSkillSets(result, alternatives, roleTemplate);
  const skillGraph = buildSkillGraph(skillSets, roleTemplate);
  const joint = jointOptions(result, alternatives, skillSets, role);
  const fallbackAlternative = alternatives[0];
  const fallbackSet = skillSets[0];
  const winner = joint[0] ?? {
    rank: 1,
    buildId: fallbackAlternative.id,
    buildTitle: fallbackAlternative.title,
    boosterName: result.recommendedImpetos[0]?.name ?? 'Sem Ímpeto definido',
    boosterTier: result.recommendedImpetos[0]?.tier ?? 'alternativo',
    training: fallbackAlternative.training,
    skills: fallbackSet?.skills ?? result.recommendedSkills.slice(0, 5),
    buildScore: fallbackAlternative.overallScore,
    skillSetScore: fallbackSet?.overallScore ?? 70,
    boosterScore: Number(result.recommendedImpetos[0]?.score ?? 55),
    boosterSynergy: 55,
    saturationPenalty: 0,
    overallScore: fallbackAlternative.overallScore,
    reason: 'Combinação de segurança usada porque não havia Ímpeto suficiente para comparar.'
  } satisfies JointBuildBoosterOption;
  const confidence = clamp(
    Number(result.structuralPrecision?.criticalConfidence ?? result.parsed.confidence) * .5
    + role.functionScore * .2
    + winner.overallScore * .3
  );
  return {
    engineVersion: ADVANCED_MOTOR_V3750_VERSION,
    role,
    alternatives,
    skillGraph,
    skillSets,
    jointOptions: joint,
    winner,
    confidence,
    safeguards: [
      'A posição escolhida pelo usuário permanece travada em todas as alternativas.',
      'Todas as fichas candidatas recalculam o custo progressivo e fecham o orçamento exatamente.',
      'Cada conjunto usa apenas habilidades oficiais compatíveis e não repete habilidades já existentes.',
      'Ficha, conjunto de cinco habilidades e Ímpeto são avaliados na mesma pontuação final.',
      'Saturação excessiva reduz a nota do Ímpeto para evitar desperdício de Booster.'
    ]
  };
}

export function applyAdvancedMotorV3750(result: AnalysisResult): AnalysisResult {
  const analysis = buildAdvancedMotorV3750(result);
  const winner = analysis.winner;
  const winnerSet = analysis.skillSets.find((item) => item.linkedBuildId === winner.buildId) ?? analysis.skillSets[0];
  const training = normalizeTrainingPlan(winner.training);
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = trainingPlanTotalCost(training);
  const recommendedSkills = filterComplementaryAdditionalSkills(
    [
      ...(winnerSet?.skills ?? winner.skills),
      ...result.recommendedSkills,
      ...result.skillRecommendations.filter((item) => item.tier !== 'evitar').map((item) => item.name)
    ],
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5,
    result.parsed.additionalSkills ?? []
  );
  const decisionMap = new Map((winnerSet?.decisions ?? []).map((item) => [skillIdentityKey(item.name), item]));
  const skillRecommendations = [
    ...recommendedSkills.map((name) => {
      const decision = decisionMap.get(skillIdentityKey(name));
      return {
        name,
        tier: decision?.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const,
        reason: decision ? `${decision.gameplayImpact} ${decision.reasons[0] ?? ''}`.trim() : 'Selecionada pelo conjunto vencedor do Motor Avançado v37.50.'
      };
    }),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !recommendedSkills.some((name) => skillIdentityKey(name) === skillIdentityKey(item.name)))
  ];
  const recommendedImpetos = [...result.recommendedImpetos]
    .map((item) => skillIdentityKey(item.name) === skillIdentityKey(winner.boosterName) ? { ...item, tier: 'ideal' as const, score: Math.max(Number(item.score ?? 0), winner.boosterScore), reason: `${winner.reason} ${item.reason}`.trim() } : item)
    .sort((left, right) => skillIdentityKey(left.name) === skillIdentityKey(winner.boosterName) ? -1 : skillIdentityKey(right.name) === skillIdentityKey(winner.boosterName) ? 1 : Number(right.score ?? 0) - Number(left.score ?? 0));
  const structuralPrecision = buildStructuralPrecisionAnalysis(result.parsed, training, result.trainingPointsTotal, result.bestPosition.code);
  const baseValidation = {
    ...result.validation,
    issues: result.validation.issues.filter((item) => !/^STRUCTURAL_|^FIELD_/.test(item.code))
  };
  const validation = mergeStructuralValidation(baseValidation, structuralPrecision);
  return {
    ...result,
    training,
    trainingCost,
    trainingPointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - trainingPointsUsed,
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos,
    structuralPrecision,
    validation,
    advancedMotorV3750: analysis,
    recommendationExplanation: [
      `Motor v37.50: ${winner.buildTitle} + ${winner.boosterName} venceu com ${winner.overallScore}/100.`,
      `Função otimizada: ${analysis.role.roleLabel}.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14)
  };
}
