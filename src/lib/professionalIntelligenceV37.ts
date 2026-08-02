import type {
  AnalysisResult,
  AttributeKey,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { ATTRIBUTE_PT, POSITION_PT } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import {
  TRAINING_KEYS,
  normalizeTrainingPlan,
  trainingLevelCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import type { CardRegistryEntry, MatchValidationRecord } from './appEvolution';

export const PROFESSIONAL_INTELLIGENCE_VERSION = '37.00.0';

export type CompatibilityLevel = 'excelente' | 'muito boa' | 'utilizável' | 'situacional' | 'não recomendada';
export type PositionCompatibilityEntry = {
  position: PositionCode;
  label: string;
  score: number;
  level: CompatibilityLevel;
  natural: boolean;
  selected: boolean;
  permitted: boolean;
  cardRating: number | null;
  strengths: string[];
  limitations: string[];
  reason: string;
};

export type PositionCompatibilityMatrix = {
  engineVersion: string;
  entries: PositionCompatibilityEntry[];
  selected: PositionCompatibilityEntry;
  natural: PositionCompatibilityEntry;
  alternatives: PositionCompatibilityEntry[];
  warning: string | null;
  summary: string;
};

export type ScenarioProfileId = 'MAIN' | 'ALTERNATIVE' | 'EXPERIMENTAL' | 'RANKED' | 'DELAY' | 'POSSESSION' | 'QUICK_COUNTER' | 'BALANCED';
export type ScenarioGameplayProfile = {
  id: ScenarioProfileId;
  label: string;
  objective: string;
  score: number;
  compatibility: number;
  training: TrainingPlan;
  exactBudget: boolean;
  pointsUsed: number;
  priorities: string[];
  tradeOffs: string[];
  recommendedSkills: string[];
  evidence: string[];
};

export type ScenarioGameplayAnalysis = {
  engineVersion: string;
  profiles: ScenarioGameplayProfile[];
  primaryId: ScenarioProfileId;
  summary: string;
  safeguards: string[];
};

export type SkillPriorityItem = {
  name: string;
  priority: number;
  classification: 'obrigatória' | 'principal' | 'reserva' | 'opcional' | 'não compensa';
  reason: string;
};

export type AdditionalSkillMatrix = {
  engineVersion: string;
  topFive: SkillPriorityItem[];
  reserves: SkillPriorityItem[];
  mandatory: SkillPriorityItem | null;
  optional: SkillPriorityItem | null;
  avoid: SkillPriorityItem[];
  synergies: string[];
  officialOnly: boolean;
  summary: string;
};

export type PersonalGameplayLearning = {
  engineVersion: string;
  sampleCount: number;
  confidence: 'sem dados' | 'inicial' | 'moderada' | 'alta';
  identity: string;
  tendencies: Array<{ label: string; score: number; evidence: string }>;
  repeatedProblems: Array<{ label: string; count: number }>;
  recommendations: string[];
  learnedWeights: Partial<Record<TrainingKey, number>>;
  summary: string;
};

export type MatchEvidenceLoop = {
  samples: number;
  confidence: 'baixa' | 'média' | 'alta';
  verdict: string;
  correction: string | null;
  preserve: string[];
  evidence: string[];
};

export type CardKnowledgeSummary = {
  versionsForPlayer: number;
  exactVersionKnown: boolean;
  status: 'confirmada' | 'revisar' | 'nova';
  latestVersion: string;
  source: string;
  summary: string;
};

export type ProfessionalIntelligenceReport = {
  engineVersion: string;
  positionMatrix: PositionCompatibilityMatrix;
  scenarios: ScenarioGameplayAnalysis;
  skills: AdditionalSkillMatrix;
  learning: PersonalGameplayLearning;
  evidenceLoop: MatchEvidenceLoop;
  cardKnowledge: CardKnowledgeSummary;
  activeCapabilities: string[];
  nextActions: string[];
};

const ALL_POSITIONS: PositionCode[] = ['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'];
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const attribute = (result: AnalysisResult, key: AttributeKey) => Number(result.parsed.attributes[key] ?? 60);
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const POSITION_ATTRIBUTES: Record<PositionCode, AttributeKey[]> = {
  CF: ['offensiveAwareness', 'finishing', 'ballControl', 'acceleration', 'kickingPower'],
  SS: ['offensiveAwareness', 'ballControl', 'dribbling', 'tightPossession', 'lowPass', 'finishing', 'acceleration'],
  LWF: ['ballControl', 'dribbling', 'tightPossession', 'speed', 'acceleration', 'lowPass', 'finishing'],
  RWF: ['ballControl', 'dribbling', 'tightPossession', 'speed', 'acceleration', 'lowPass', 'finishing'],
  LMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'stamina', 'defensiveEngagement'],
  RMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'stamina', 'defensiveEngagement'],
  AMF: ['ballControl', 'tightPossession', 'lowPass', 'loftedPass', 'dribbling', 'offensiveAwareness'],
  CMF: ['ballControl', 'lowPass', 'loftedPass', 'stamina', 'defensiveEngagement', 'tightPossession'],
  DMF: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'physicalContact', 'stamina', 'lowPass'],
  CB: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'physicalContact', 'jump', 'speed'],
  LB: ['defensiveAwareness', 'defensiveEngagement', 'speed', 'stamina', 'lowPass', 'loftedPass'],
  RB: ['defensiveAwareness', 'defensiveEngagement', 'speed', 'stamina', 'lowPass', 'loftedPass'],
  GK: ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach', 'jump']
};

const POSITION_FOCUS: Record<PositionCode, string[]> = {
  CF: ['movimentação ofensiva', 'finalização', 'domínio para concluir'],
  SS: ['criação curta', 'drible entre linhas', 'finalização de apoio'],
  LWF: ['ruptura pelo lado', 'drible', 'aceleração'],
  RWF: ['ruptura pelo lado', 'drible', 'aceleração'],
  LMF: ['amplitude', 'passe', 'resistência'],
  RMF: ['amplitude', 'passe', 'resistência'],
  AMF: ['último passe', 'controle', 'mobilidade'],
  CMF: ['circulação', 'equilíbrio', 'resistência'],
  DMF: ['posicionamento', 'interceptação', 'saída segura'],
  CB: ['cobertura', 'duelo', 'jogo aéreo'],
  LB: ['cobertura lateral', 'velocidade funcional', 'passe'],
  RB: ['cobertura lateral', 'velocidade funcional', 'passe'],
  GK: ['reflexo', 'alcance', 'segurança']
};

function compatibilityLevel(score: number): CompatibilityLevel {
  if (score >= 90) return 'excelente';
  if (score >= 82) return 'muito boa';
  if (score >= 72) return 'utilizável';
  if (score >= 58) return 'situacional';
  return 'não recomendada';
}

function positionAttributeFit(result: AnalysisResult, position: PositionCode) {
  return average(POSITION_ATTRIBUTES[position].map((key) => attribute(result, key)));
}

export function buildPositionCompatibilityMatrix(result: AnalysisResult): PositionCompatibilityMatrix {
  const permitted = new Set(result.permittedPositions.map((item) => item.code));
  const avoided = new Set(result.avoidPositions.map((item) => item.code));
  const native = new Set([result.parsed.mainPosition, ...result.parsed.positions]);
  const scoreMap = new Map(result.positionScores.map((item) => [item.code, item]));
  const entries = ALL_POSITIONS.map((position): PositionCompatibilityEntry => {
    const reported = scoreMap.get(position);
    const attrFit = positionAttributeFit(result, position);
    const cardRating = Number.isFinite(reported?.cardRating) ? Number(reported?.cardRating) : Number.isFinite(result.parsed.positionRatings[position]) ? Number(result.parsed.positionRatings[position]) : null;
    const ratingFit = cardRating == null ? attrFit : Math.min(100, cardRating);
    const isNatural = native.has(position);
    const isSelected = result.bestPosition.code === position;
    const isPermitted = permitted.has(position) || isNatural || isSelected;
    let score = average([
      Number(reported?.score ?? attrFit),
      attrFit,
      ratingFit
    ]);
    if (isNatural) score += 5;
    if (isSelected) score += 3;
    if (isPermitted) score += 3;
    if (avoided.has(position)) score -= 24;
    if (result.parsed.mainPosition === 'GK' && position !== 'GK') score = Math.min(score, 24);
    if (result.parsed.mainPosition !== 'GK' && position === 'GK') score = Math.min(score, 18);
    score = clamp(score);
    const level = compatibilityLevel(score);
    const keyAttributes = POSITION_ATTRIBUTES[position]
      .map((key) => ({ key, value: attribute(result, key) }))
      .sort((left, right) => right.value - left.value);
    const strengths = keyAttributes.slice(0, 3).map((item) => `${ATTRIBUTE_PT[item.key]} ${Math.round(item.value)}`);
    const limitations = keyAttributes.filter((item) => item.value < 72).slice(0, 3).map((item) => `${ATTRIBUTE_PT[item.key]} abaixo do piso ideal`);
    if (avoided.has(position)) limitations.unshift('O motor já classificou esta conversão como incompatível.');
    if (!isPermitted) limitations.unshift('A posição não foi confirmada como permitida nesta carta.');
    return {
      position,
      label: POSITION_PT[position],
      score,
      level,
      natural: isNatural,
      selected: isSelected,
      permitted: isPermitted,
      cardRating,
      strengths,
      limitations: limitations.length ? limitations : ['Nenhuma limitação crítica detectada para esta função.'],
      reason: `${POSITION_FOCUS[position].join(', ')} • compatibilidade calculada por posição, atributos e permissões da carta.`
    };
  }).sort((left, right) => right.score - left.score || Number(right.selected) - Number(left.selected));

  const selected = entries.find((item) => item.position === result.bestPosition.code) ?? entries[0];
  const natural = entries.find((item) => item.position === result.parsed.mainPosition) ?? entries[0];
  const alternatives = entries.filter((item) => !item.selected && !item.natural && item.level !== 'não recomendada').slice(0, 4);
  const warning = selected.score < 72
    ? `A posição escolhida ${selected.label} é ${selected.level}. O app entrega a melhor adaptação possível, mas não promete comportamento que a base da carta não sustenta.`
    : null;
  return {
    engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION,
    entries,
    selected,
    natural,
    alternatives,
    warning,
    summary: `Posição natural ${natural.label} ${natural.score}% • escolhida ${selected.label} ${selected.score}% • ${alternatives.length} alternativa(s) competitivas.`
  };
}

function clonePlan(plan: TrainingPlan) {
  return normalizeTrainingPlan({ ...plan });
}

function nextLevelCost(plan: TrainingPlan, key: TrainingKey) {
  return trainingLevelCost((plan[key] ?? 0) + 1);
}

function rebalancePlan(base: TrainingPlan, budget: number, increase: TrainingKey[], decrease: TrainingKey[]): TrainingPlan {
  const plan = clonePlan(base);
  const originalCost = trainingPlanTotalCost(plan);
  const target = Math.max(0, budget || originalCost);
  let freed = 0;
  for (const key of decrease) {
    if ((plan[key] ?? 0) <= 1 || increase.includes(key)) continue;
    const current = plan[key] ?? 0;
    const refund = trainingLevelCost(current);
    plan[key] = current - 1;
    freed += refund;
    if (freed >= 3) break;
  }
  let guard = 0;
  while (trainingPlanTotalCost(plan) < target && guard < 240) {
    guard += 1;
    const remaining = target - trainingPlanTotalCost(plan);
    const candidates = [...increase, ...TRAINING_KEYS.filter((key) => !increase.includes(key))]
      .filter((key) => (plan[key] ?? 0) < 16)
      .map((key) => ({ key, cost: nextLevelCost(plan, key) }))
      .filter((item) => item.cost <= remaining)
      .sort((left, right) => left.cost - right.cost || increase.indexOf(left.key) - increase.indexOf(right.key));
    if (!candidates.length) break;
    plan[candidates[0].key] += 1;
  }
  while (trainingPlanTotalCost(plan) > target && guard < 480) {
    guard += 1;
    const candidates = [...decrease, ...TRAINING_KEYS]
      .filter((key) => (plan[key] ?? 0) > 0)
      .map((key) => ({ key, refund: trainingLevelCost(plan[key]) }))
      .sort((left, right) => right.refund - left.refund);
    if (!candidates.length) break;
    plan[candidates[0].key] -= 1;
  }
  return normalizeTrainingPlan(plan);
}

function planSignature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key]}`).join('|');
}

const SCENARIO_DEFINITIONS: Array<{
  id: Exclude<ScenarioProfileId, 'MAIN' | 'ALTERNATIVE' | 'EXPERIMENTAL'>;
  label: string;
  objective: string;
  increase: TrainingKey[];
  decrease: TrainingKey[];
  priorities: string[];
  tradeOffs: string[];
}> = [
  { id: 'RANKED', label: 'Ranqueada competitiva', objective: 'Resposta, segurança e consistência sob pressão.', increase: ['dexterity', 'lowerBodyStrength', 'passing', 'defending'], decrease: ['aerialStrength', 'dribbling'], priorities: ['resposta rápida', 'passe seguro', 'equilíbrio funcional'], tradeOffs: ['menos especialização estética em drible ou jogo aéreo'] },
  { id: 'DELAY', label: 'Partida com delay', objective: 'Reduzir peso percebido e ações que exigem janelas muito curtas.', increase: ['dexterity', 'passing', 'lowerBodyStrength'], decrease: ['dribbling', 'aerialStrength', 'shooting'], priorities: ['domínio simples', 'passe de primeira', 'aceleração funcional'], tradeOffs: ['menos dribles longos e menos pontos em ações de baixa frequência'] },
  { id: 'POSSESSION', label: 'Posse de bola', objective: 'Receber, girar e circular sem perder a identidade da carta.', increase: ['passing', 'dribbling', 'dexterity'], decrease: ['aerialStrength', 'shooting'], priorities: ['controle', 'passe', 'mobilidade entre linhas'], tradeOffs: ['pode perder parte da força de conclusão ou disputa aérea'] },
  { id: 'QUICK_COUNTER', label: 'Contra-ataque rápido', objective: 'Atacar espaço e decidir em menos toques.', increase: ['dexterity', 'lowerBodyStrength', 'shooting'], decrease: ['passing', 'aerialStrength'], priorities: ['arranque', 'movimentação', 'conclusão rápida'], tradeOffs: ['circulação longa e criação paciente recebem menos prioridade'] },
  { id: 'BALANCED', label: 'Equilibrada universal', objective: 'Manter piso funcional alto em qualquer modo.', increase: ['dexterity', 'passing', 'lowerBodyStrength', 'defending'], decrease: ['aerialStrength'], priorities: ['estabilidade', 'versatilidade', 'uso em vários modos'], tradeOffs: ['não maximiza uma única característica'] }
];

function scenarioBaseScore(result: AnalysisResult) {
  const dimensions = result.calibrationV32?.dimensions;
  if (!dimensions) return clamp(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 75);
  return clamp(average([
    dimensions.gameplayResponse,
    dimensions.functionalFloor,
    dimensions.pointEfficiency,
    dimensions.crossModeStability,
    dimensions.antiOverallWaste
  ]));
}

function scenarioSkills(result: AnalysisResult, profileIndex: number) {
  const profile = result.gameplayDna?.profiles[profileIndex];
  return (profile?.additionalSkills?.length ? profile.additionalSkills : result.recommendedSkills).slice(0, 5);
}

export function buildScenarioGameplayAnalysis(result: AnalysisResult): ScenarioGameplayAnalysis {
  const base = result.gameplayDna?.profiles[0]?.training ?? result.training;
  const budget = result.trainingPointsTotal || trainingPlanTotalCost(base);
  const quality = scenarioBaseScore(result);
  const dnaProfiles = result.gameplayDna?.profiles ?? [];
  const profiles: ScenarioGameplayProfile[] = [];
  const seen = new Set<string>();
  const addProfile = (profile: ScenarioGameplayProfile) => {
    const signature = `${profile.id}:${planSignature(profile.training)}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    profiles.push(profile);
  };

  const mainTraining = clonePlan(dnaProfiles[0]?.training ?? base);
  addProfile({
    id: 'MAIN',
    label: dnaProfiles[0]?.label ?? 'Principal recomendada',
    objective: dnaProfiles[0]?.description ?? 'Melhor desempenho global para a posição escolhida.',
    score: clamp(dnaProfiles[0]?.score ?? quality),
    compatibility: clamp(dnaProfiles[0]?.compatibility ?? result.bestPosition.score),
    training: mainTraining,
    exactBudget: trainingPlanTotalCost(mainTraining) === budget,
    pointsUsed: trainingPlanTotalCost(mainTraining),
    priorities: dnaProfiles[0]?.focus ?? ['DNA da carta', 'posição escolhida', 'gameplay real'],
    tradeOffs: dnaProfiles[0]?.limitations ?? ['Ficha principal equilibrada para o objetivo detectado.'],
    recommendedSkills: scenarioSkills(result, 0),
    evidence: ['Campeã do DNA da Carta.', 'Overall não participa do ranking.', 'Posição escolhida permanece soberana.']
  });

  (['ALTERNATIVE', 'EXPERIMENTAL'] as const).forEach((id, index) => {
    const source = dnaProfiles[index + 1];
    if (!source) return;
    const training = clonePlan(source.training);
    addProfile({
      id,
      label: source.label,
      objective: source.description,
      score: clamp(source.score),
      compatibility: clamp(source.compatibility),
      training,
      exactBudget: trainingPlanTotalCost(training) === budget,
      pointsUsed: trainingPlanTotalCost(training),
      priorities: source.focus,
      tradeOffs: source.limitations,
      recommendedSkills: source.additionalSkills.slice(0, 5),
      evidence: source.evidence.slice(0, 4)
    });
  });

  for (const definition of SCENARIO_DEFINITIONS) {
    const position = result.bestPosition.code;
    const increase = position === 'GK'
      ? ['gk1', 'gk2', 'gk3', 'aerialStrength'] as TrainingKey[]
      : definition.increase.filter((key) => !key.startsWith('gk'));
    const decrease = position === 'GK'
      ? ['shooting', 'passing', 'dribbling', 'defending'] as TrainingKey[]
      : definition.decrease;
    const training = rebalancePlan(mainTraining, budget, increase, decrease);
    const scenarioAdjustment = definition.id === 'RANKED' ? 2 : definition.id === 'BALANCED' ? 1 : 0;
    addProfile({
      id: definition.id,
      label: definition.label,
      objective: definition.objective,
      score: clamp(quality + scenarioAdjustment - (planSignature(training) === planSignature(mainTraining) ? 1 : 0)),
      compatibility: clamp(result.bestPosition.score),
      training,
      exactBudget: trainingPlanTotalCost(training) === budget,
      pointsUsed: trainingPlanTotalCost(training),
      priorities: definition.priorities,
      tradeOffs: definition.tradeOffs,
      recommendedSkills: result.recommendedSkills.slice(0, 5),
      evidence: [
        `Rebalanceada para ${definition.label.toLowerCase()}.`,
        `Orçamento ${trainingPlanTotalCost(training)}/${budget}.`,
        'A formação não interfere na distribuição individual.'
      ]
    });
  }

  return {
    engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION,
    profiles,
    primaryId: 'MAIN',
    summary: `${profiles.length} perfis disponíveis: principal, alternativas de DNA e contextos competitivos controlados.`,
    safeguards: [
      'Perfis de contexto não alteram o Estilo de Jogo oficial da carta.',
      'Nenhum perfil usa overall como objetivo.',
      'A posição escolhida e o orçamento real são preservados.',
      'Perfis de delay reduzem dependência de comandos com janela curta; não eliminam problemas de rede.'
    ]
  };
}

const SKILL_REASON: Record<string, string> = {
  'Toque duplo': 'Gera separação no 1 contra 1 e combina com cartas técnicas.',
  'Controle com a sola': 'Melhora giro e domínio em espaço curto.',
  'Passe de primeira': 'Acelera tabelas e reduz tempo de exposição sob pressão.',
  'Passe em profundidade': 'Aumenta qualidade das rupturas e assistências verticais.',
  'Passe na medida': 'Qualifica lançamentos e inversões.',
  'Chute de primeira': 'Permite concluir sem dominar.',
  'Precisão à distância': 'Aumenta ameaça fora da área.',
  'Interceptação': 'Melhora leitura e corte de linhas de passe.',
  'Bloqueador': 'Aumenta proteção contra chutes e passes decisivos.',
  'Marcação individual': 'Melhora acompanhamento do adversário direto.',
  'Volta para marcar': 'Ajuda recomposição de meias, pontas e atacantes de apoio.',
  'Superioridade aérea': 'Melhora disputa pelo alto em defesa e ataque.',
  'Espírito guerreiro': 'Sustenta execução sob pressão e cansaço.'
};

function officialSkillsOnly(items: string[]) {
  const official = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);
  return items.filter((item, index) => official.has(item) && items.indexOf(item) === index);
}

export function buildAdditionalSkillMatrix(result: AnalysisResult): AdditionalSkillMatrix {
  const owned = new Set(result.parsed.nativeSkills.map(normalize));
  const top = officialSkillsOnly(result.recommendedSkills).filter((skill) => !owned.has(normalize(skill))).slice(0, 5);
  const alternatives = officialSkillsOnly(result.skillRecommendations
    .filter((item) => item.tier === 'alternativa')
    .map((item) => item.name))
    .filter((skill) => !owned.has(normalize(skill)) && !top.includes(skill));
  const pool = officialSkillsOnly([...alternatives, ...OFFICIAL_ADDITIONAL_SKILL_NAMES])
    .filter((skill) => !owned.has(normalize(skill)) && !top.includes(skill));
  const reserves = pool.slice(0, 3);
  const avoidNames = officialSkillsOnly(result.avoidSkills).filter((skill) => !top.includes(skill)).slice(0, 5);
  const topFive = top.map((name, index): SkillPriorityItem => ({
    name,
    priority: index + 1,
    classification: index === 0 ? 'obrigatória' : 'principal',
    reason: result.skillRecommendations.find((item) => item.name === name)?.reason ?? SKILL_REASON[name] ?? 'Complementa a posição, o DNA e a ficha escolhida.'
  }));
  const reserveItems = reserves.map((name, index): SkillPriorityItem => ({
    name,
    priority: topFive.length + index + 1,
    classification: index === 0 ? 'opcional' : 'reserva',
    reason: result.skillRecommendations.find((item) => item.name === name)?.reason ?? SKILL_REASON[name] ?? 'Alternativa oficial caso uma habilidade principal já esteja presente.'
  }));
  const avoid = avoidNames.map((name, index): SkillPriorityItem => ({
    name,
    priority: 90 + index,
    classification: 'não compensa',
    reason: result.skillRecommendations.find((item) => item.name === name)?.reason ?? 'Tem baixa ativação ou retorno menor para esta função.'
  }));
  const mandatory = topFive[0] ?? null;
  const optional = reserveItems[0] ?? topFive.at(-1) ?? null;
  const synergies = [
    topFive.length >= 2 ? `${topFive[0].name} + ${topFive[1].name}: combinação principal para o perfil escolhido.` : '',
    topFive.some((item) => /Passe/.test(item.name)) && topFive.some((item) => /Chute|Finalização|Cabeçada/.test(item.name)) ? 'Criação e conclusão ficaram equilibradas.' : '',
    topFive.some((item) => /Interceptação|Bloqueador|Marcação/.test(item.name)) ? 'A matriz defensiva prioriza ações que realmente ativam na posição.' : ''
  ].filter(Boolean);
  return {
    engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION,
    topFive,
    reserves: reserveItems,
    mandatory,
    optional,
    avoid,
    synergies,
    officialOnly: [...top, ...reserves, ...avoidNames].every((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number])),
    summary: `${topFive.length} principais • ${reserveItems.length} reservas • ${avoid.length} opções de baixo retorno. Todas filtradas pelo catálogo oficial.`
  };
}

function countTags(records: MatchValidationRecord[]) {
  const map = new Map<string, number>();
  records.flatMap((record) => record.tags || []).forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1));
  return [...map.entries()].sort((left, right) => right[1] - left[1]);
}

export function buildPersonalGameplayLearning(records: MatchValidationRecord[]): PersonalGameplayLearning {
  const valid = records.filter((record) => record && Number.isFinite(record.overallRating));
  if (!valid.length) {
    return {
      engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION,
      sampleCount: 0,
      confidence: 'sem dados',
      identity: 'Perfil ainda não aprendido',
      tendencies: [],
      repeatedProblems: [],
      recommendations: ['Registre pelo menos três partidas; oito ou mais aumentam a confiança.'],
      learnedWeights: {},
      summary: 'O app ainda não possui evidência suficiente para personalizar fichas pelo seu jeito de jogar.'
    };
  }
  const metrics = valid.reduce((acc, record) => {
    acc.goals += Number(record.metrics?.goals || 0);
    acc.assists += Number(record.metrics?.assists || 0);
    acc.passErrors += Number(record.metrics?.passErrors || 0);
    acc.tackles += Number(record.metrics?.tackles || 0);
    acc.interceptions += Number(record.metrics?.interceptions || 0);
    acc.ballLosses += Number(record.metrics?.ballLosses || 0);
    acc.dribbles += Number(record.metrics?.dribblesCompleted || 0);
    acc.shots += Number(record.metrics?.shots || 0);
    acc.passing += Number(record.passing || 0);
    acc.movement += Number(record.movement || 0);
    acc.finishing += Number(record.finishing || 0);
    acc.defending += Number(record.defending || 0);
    return acc;
  }, { goals: 0, assists: 0, passErrors: 0, tackles: 0, interceptions: 0, ballLosses: 0, dribbles: 0, shots: 0, passing: 0, movement: 0, finishing: 0, defending: 0 });
  const n = valid.length;
  const tendencies = [
    { label: 'Criação e passe', score: clamp((metrics.assists * 10 + (metrics.passing / n) * 16) - metrics.passErrors * 1.5), evidence: `${metrics.assists} assistência(s), ${metrics.passErrors} erro(s) de passe e média ${(metrics.passing / n).toFixed(1)}/5.` },
    { label: 'Drible e condução', score: clamp(metrics.dribbles * 5 + (metrics.movement / n) * 13 - metrics.ballLosses * 1.2), evidence: `${metrics.dribbles} drible(s) concluído(s) e ${metrics.ballLosses} perda(s) de bola.` },
    { label: 'Finalização', score: clamp(metrics.goals * 12 + (metrics.finishing / n) * 13 + metrics.shots * 1.5), evidence: `${metrics.goals} gol(s), ${metrics.shots} finalização(ões) e média ${(metrics.finishing / n).toFixed(1)}/5.` },
    { label: 'Recuperação defensiva', score: clamp((metrics.tackles + metrics.interceptions) * 5 + (metrics.defending / n) * 13), evidence: `${metrics.tackles} desarme(s), ${metrics.interceptions} interceptação(ões) e média ${(metrics.defending / n).toFixed(1)}/5.` }
  ].sort((left, right) => right.score - left.score);
  const top = tendencies[0];
  const tagCounts = countTags(valid);
  const repeatedProblems = tagCounts.filter(([, count]) => count >= 2).slice(0, 5).map(([label, count]) => ({ label, count }));
  const learnedWeights: Partial<Record<TrainingKey, number>> = {};
  if (top.label.includes('Criação')) learnedWeights.passing = 3;
  if (top.label.includes('Drible')) { learnedWeights.dribbling = 3; learnedWeights.dexterity = 2; }
  if (top.label.includes('Finalização')) { learnedWeights.shooting = 3; learnedWeights.dexterity = 2; }
  if (top.label.includes('defensiva')) { learnedWeights.defending = 3; learnedWeights.lowerBodyStrength = 2; }
  if (valid.filter((record) => record.connection === 'high_delay').length >= 2) { learnedWeights.passing = Math.max(learnedWeights.passing ?? 0, 2); learnedWeights.dexterity = Math.max(learnedWeights.dexterity ?? 0, 2); }
  const confidence: PersonalGameplayLearning['confidence'] = n >= 12 ? 'alta' : n >= 5 ? 'moderada' : 'inicial';
  const recommendations = [
    `Use ${top.label.toLowerCase()} como desempate entre duas fichas tecnicamente próximas.`,
    repeatedProblems[0] ? `O padrão “${repeatedProblems[0].label}” precisa ser testado com uma única mudança por vez.` : 'Nenhum problema recorrente forte foi confirmado.',
    valid.filter((record) => record.secondHalfDrop).length >= 2 ? 'A queda no segundo tempo apareceu repetidamente; preserve mais resistência e destreza.' : 'Ainda não há queda física recorrente confirmada.'
  ];
  return {
    engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION,
    sampleCount: n,
    confidence,
    identity: `Tendência principal: ${top.label}`,
    tendencies,
    repeatedProblems,
    recommendations,
    learnedWeights,
    summary: `${n} partida(s) formam um perfil ${confidence}. O aprendizado apenas desempata fichas; nunca altera a recomendação sem confirmação.`
  };
}

export function buildMatchEvidenceLoop(result: AnalysisResult, records: MatchValidationRecord[]): MatchEvidenceLoop {
  const fingerprintRecords = records.filter((record) => record.playerName.toLowerCase() === result.parsed.playerName.toLowerCase() && record.targetPosition === result.bestPosition.code);
  const samples = fingerprintRecords.length;
  if (!samples) return { samples: 0, confidence: 'baixa', verdict: 'Esta ficha ainda não foi validada em partida.', correction: null, preserve: ['Ficha original preservada até existir evidência real.'], evidence: ['Registre gols, assistências, perdas, dribles, ações defensivas e sensação de delay.'] };
  const avg = (key: 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina') => fingerprintRecords.reduce((sum, record) => sum + Number(record[key] || 0), 0) / samples;
  const dimensions = [
    { label: 'passe', value: avg('passing'), correction: 'transferir um pequeno investimento para Passe' },
    { label: 'movimentação', value: avg('movement'), correction: 'reforçar Destreza ou Força nas pernas' },
    { label: 'finalização', value: avg('finishing'), correction: 'reforçar Finalização sem derrubar o piso de controle' },
    { label: 'defesa', value: avg('defending'), correction: 'reforçar Defesa e posicionamento' },
    { label: 'físico', value: avg('physical'), correction: 'reforçar contato, equilíbrio ou bola aérea' },
    { label: 'resistência', value: avg('stamina'), correction: 'reforçar Força nas pernas e resistência' }
  ].sort((left, right) => left.value - right.value);
  const worst = dimensions[0];
  const metrics = fingerprintRecords.reduce((acc, record) => {
    acc.losses += Number(record.metrics?.ballLosses || 0);
    acc.passErrors += Number(record.metrics?.passErrors || 0);
    acc.goals += Number(record.metrics?.goals || 0);
    acc.assists += Number(record.metrics?.assists || 0);
    acc.secondHalf += record.secondHalfDrop ? 1 : 0;
    return acc;
  }, { losses: 0, passErrors: 0, goals: 0, assists: 0, secondHalf: 0 });
  const confidence: MatchEvidenceLoop['confidence'] = samples >= 8 ? 'alta' : samples >= 3 ? 'média' : 'baixa';
  const correction = samples >= 3 && worst.value < 3.2 ? `Teste controlado: ${worst.correction}. Mude apenas um grupo e compare por pelo menos três partidas.` : null;
  return {
    samples,
    confidence,
    verdict: correction ? `${worst.label} é o ponto mais fraco confirmado (${worst.value.toFixed(1)}/5).` : `A ficha está estável; menor dimensão ${worst.label} ${worst.value.toFixed(1)}/5.`,
    correction,
    preserve: [
      metrics.goals + metrics.assists > 0 ? `Preservar produção ofensiva: ${metrics.goals} gol(s) e ${metrics.assists} assistência(s).` : 'Preservar os pontos fortes já confirmados antes de recalibrar.',
      'Posição escolhida, habilidades oficiais e DNA da carta não são trocados automaticamente.'
    ],
    evidence: [
      `${samples} partida(s) na posição ${POSITION_PT[result.bestPosition.code]}.`,
      `${metrics.passErrors} erro(s) de passe • ${metrics.losses} perda(s) de bola.`,
      `${metrics.secondHalf} relato(s) de queda no segundo tempo.`
    ]
  };
}

export function buildCardKnowledgeSummary(result: AnalysisResult, entries: CardRegistryEntry[]): CardKnowledgeSummary {
  const playerEntries = entries.filter((entry) => normalize(entry.playerName) === normalize(result.parsed.playerName));
  const exact = playerEntries.find((entry) => entry.fingerprint && entry.attributeSignature && entry.playstyle && normalize(entry.playstyle) === normalize(result.parsed.playstyle || 'Não informado') && entry.points === result.trainingPointsTotal);
  const latest = [...playerEntries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  return {
    versionsForPlayer: playerEntries.length,
    exactVersionKnown: Boolean(exact),
    status: exact?.status === 'confirmed' ? 'confirmada' : playerEntries.length ? 'revisar' : 'nova',
    latestVersion: exact?.cardVersion || latest?.cardVersion || 'sem versão registrada',
    source: exact?.sourceLabel || latest?.sourceLabel || 'nenhuma fonte confirmada',
    summary: exact
      ? `A versão atual coincide com um registro ${exact.status === 'confirmed' ? 'confirmado' : 'em revisão'}.`
      : playerEntries.length
        ? `Há ${playerEntries.length} versão(ões) de ${result.parsed.playerName}, mas esta leitura ainda precisa ser comparada.`
        : 'Esta versão ainda não faz parte do banco verificado desta conta.'
  };
}

export function buildProfessionalIntelligenceReport(result: AnalysisResult, input: { matches?: MatchValidationRecord[]; registry?: CardRegistryEntry[] } = {}): ProfessionalIntelligenceReport {
  const matches = input.matches ?? [];
  const registry = input.registry ?? [];
  const positionMatrix = buildPositionCompatibilityMatrix(result);
  const scenarios = buildScenarioGameplayAnalysis(result);
  const skills = buildAdditionalSkillMatrix(result);
  const learning = buildPersonalGameplayLearning(matches);
  const evidenceLoop = buildMatchEvidenceLoop(result, matches);
  const cardKnowledge = buildCardKnowledgeSummary(result, registry);
  const activeCapabilities = [
    'Ficha natural e posição escolhida',
    'Perfis de DNA e cenários competitivos',
    'Top 5 oficial + reservas e bloqueios',
    'Validação por partidas reais',
    'Banco verificado por versão',
    'OCR com confiança e confirmação',
    'Análise de elenco e conflitos',
    'Análise de vídeo com revisão humana',
    'Aprendizado pessoal controlado',
    'Regras atualizáveis e backup'
  ];
  const nextActions = [
    evidenceLoop.samples < 3 ? 'Registrar três partidas com esta ficha para iniciar a validação real.' : evidenceLoop.correction || 'Manter a ficha e aumentar a amostra em contextos diferentes.',
    cardKnowledge.exactVersionKnown ? 'Registro da carta está disponível para comparação futura.' : 'Confirmar esta versão no Registro de Cartas depois de revisar o print.',
    positionMatrix.warning || `A posição ${positionMatrix.selected.label} está classificada como ${positionMatrix.selected.level}.`
  ];
  return { engineVersion: PROFESSIONAL_INTELLIGENCE_VERSION, positionMatrix, scenarios, skills, learning, evidenceLoop, cardKnowledge, activeCapabilities, nextActions };
}
