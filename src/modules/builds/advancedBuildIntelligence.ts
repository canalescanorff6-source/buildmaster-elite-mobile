import type {
  AnalysisResult,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from '@/lib/analyzer';
import { TRAINING_LABELS } from '@/lib/trainingEngine';
import { fitTrainingToBudget } from '@/modules/builds/trainingOptimizer';
import {
  trainingGroupCost,
  trainingPlanPoints,
  type PrecisionProposal
} from '@/lib/precisionBuildEngine';
import {
  buildCreatorBuildConsensus,
  type CreatorBuildSource
} from '@/lib/creatorBuildResearch';
import {
  cardFingerprint,
  summarizeMatchValidation,
  type MatchValidationRecord
} from '@/lib/appEvolution';
import {
  buildCalibrationReport,
  type MatchFeedback
} from '@/lib/realMatchCalibration';

export const ADVANCED_BUILD_INTELLIGENCE_VERSION = '28.60.0';

export type TacticalRoleDefinition = {
  id: string;
  label: string;
  summary: string;
  priorities: TrainingKey[];
};

export type TacticalRoleEvaluation = TacticalRoleDefinition & {
  training: TrainingPlan;
  pointsUsed: number;
  exactBudget: boolean;
  fitScore: number;
  gains: string[];
  tradeOffs: string[];
  recommended: boolean;
};

export type PointInvestmentJustification = {
  training: TrainingKey;
  label: string;
  level: number;
  totalCost: number;
  priorityRank: number | null;
  returnLabel: 'alto' | 'médio' | 'baixo';
  wasteRisk: 'baixo' | 'atenção' | 'alto';
  supportedSkills: string[];
  reason: string;
  stopRule: string;
};

export type CreatorConsensusSnapshot = {
  sourceCount: number;
  exactCardCount: number;
  proSourceCount: number;
  confidence: number;
  confidenceLabel: string;
  totalCost: number;
  similarityScore: number;
  verdict: string;
  warnings: string[];
  differences: Array<{
    training: TrainingKey;
    label: string;
    appValue: number;
    consensusValue: number;
    difference: number;
    agreement: number;
    sampleCount: number;
  }>;
};

export type MatchLearningSnapshot = {
  sampleCount: number;
  confidence: 'baixa' | 'média' | 'alta';
  average: number;
  consistency: number;
  strongestAreas: string[];
  weakestAreas: string[];
  repeatedProblems: Array<{ tag: string; count: number }>;
  learnedPriorities: Array<{ training: TrainingKey; label: string; evidence: number; reason: string }>;
  recommendation: string;
  safeguards: string[];
};

export type AdvancedBuildIntelligenceReport = {
  version: string;
  identity: {
    fingerprint: string;
    label: string;
    uniquenessScore: number;
    cloneRisk: 'baixo' | 'médio' | 'alto';
    distinguishingFactors: string[];
  };
  selectedPosition: {
    code: PositionCode;
    label: string;
    score: number;
    preserved: boolean;
    explanation: string;
  };
  profileComparison: PrecisionProposal[];
  tacticalRoles: TacticalRoleEvaluation[];
  selectedRole: TacticalRoleEvaluation;
  pointJustifications: PointInvestmentJustification[];
  wasteAlerts: string[];
  creatorConsensus: CreatorConsensusSnapshot;
  matchLearning: MatchLearningSnapshot;
  skillActivation: Array<{
    name: string;
    status: string;
    score: number;
    supportedGroups: string[];
    note: string;
  }>;
  safeguards: string[];
};

export type AdvancedBuildIntelligenceInput = {
  selectedRoleId?: string | null;
  creatorSources?: CreatorBuildSource[];
  matchRecords?: MatchValidationRecord[];
  calibrationFeedbacks?: MatchFeedback[];
};

const LINE_KEYS: TrainingKey[] = [
  'shooting',
  'passing',
  'dribbling',
  'dexterity',
  'lowerBodyStrength',
  'aerialStrength',
  'defending'
];

const GOALKEEPER_KEYS: TrainingKey[] = [
  'gk1',
  'gk2',
  'gk3',
  'lowerBodyStrength',
  'aerialStrength'
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function activeKeys(position: PositionCode): TrainingKey[] {
  return position === 'GK' ? GOALKEEPER_KEYS : LINE_KEYS;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function roleDefinitions(position: PositionCode, result: AnalysisResult): TacticalRoleDefinition[] {
  const currentFunction = result.teamMap?.functionLabel || result.buildName;
  const role = (id: string, label: string, summary: string, priorities: TrainingKey[]): TacticalRoleDefinition => ({
    id,
    label,
    summary,
    priorities: unique(priorities)
  });

  if (position === 'GK') return [
    role('gk-security', 'Segurança debaixo das traves', 'Prioriza reflexos, firmeza e constância para reduzir rebotes e falhas curtas.', ['gk2', 'gk1', 'gk3', 'aerialStrength', 'lowerBodyStrength']),
    role('gk-cover', 'Cobertura e reposição', 'Aumenta alcance, reação fora da linha e capacidade de iniciar transições.', ['gk2', 'gk3', 'lowerBodyStrength', 'gk1', 'aerialStrength']),
    role('gk-aerial', 'Domínio aéreo', 'Reforça alcance, impulsão e segurança em cruzamentos e bolas altas.', ['gk3', 'aerialStrength', 'gk1', 'gk2', 'lowerBodyStrength'])
  ];

  if (position === 'CB') return [
    role('cb-cover', 'Defensor de cobertura', 'Protege profundidade, corrige deslocamentos e mantém o bloco compacto.', ['defending', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'passing']),
    role('cb-build', 'Construtor seguro', 'Defende sem abrir mão da primeira saída e do passe sob pressão.', ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'aerialStrength']),
    role('cb-physical', 'Dominante físico', 'Prioriza contato, jogo aéreo e imposição nos duelos da área.', ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'])
  ];

  if (position === 'LB' || position === 'RB') return [
    role('fb-defensive', 'Lateral defensivo', 'Fecha o corredor e evita transformar o lado do campo em uma avenida.', ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'aerialStrength', 'dribbling']),
    role('fb-buildup', 'Saída segura pelo lado', 'Mantém passe curto e apoio controlado sem abandonar a recomposição.', ['passing', 'defending', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength']),
    role('fb-support', 'Apoio ofensivo controlado', 'Avança com responsabilidade, priorizando passe e retorno em vez de ataque permanente.', ['passing', 'dexterity', 'lowerBodyStrength', 'defending', 'dribbling', 'aerialStrength'])
  ];

  if (position === 'DMF') return [
    role('dmf-anchor', 'Primeiro volante', 'Protege a frente da zaga, intercepta e oferece passe simples na saída.', ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'aerialStrength', 'dribbling']),
    role('dmf-cover', 'Cobertura e combate', 'Aumenta alcance defensivo e recuperação sem abandonar a zona central.', ['defending', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'passing', 'dribbling']),
    role('dmf-build', 'Volante de saída', 'Dá continuidade à posse com passe, controle e proteção contra pressão.', ['passing', 'dribbling', 'defending', 'lowerBodyStrength', 'dexterity', 'aerialStrength'])
  ];

  if (position === 'CMF') return [
    role('cmf-versatile', 'Meia versátil', 'Equilibra passe, cobertura, chegada e resistência durante toda a partida.', ['passing', 'lowerBodyStrength', 'defending', 'dexterity', 'dribbling', 'aerialStrength']),
    role('cmf-builder', 'Construtor de posse', 'Organiza a circulação e cria linhas curtas para escapar da pressão.', ['passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'defending', 'aerialStrength']),
    role('cmf-box', 'Área a área', 'Sustenta intensidade, retorno defensivo e presença em diferentes setores.', ['lowerBodyStrength', 'dexterity', 'defending', 'passing', 'dribbling', 'aerialStrength'])
  ];

  if (position === 'AMF') return [
    role('amf-creator', 'Criador central', 'Prioriza último passe, domínio e decisão entre as linhas.', ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength', 'defending']),
    role('amf-runner', 'Meia de infiltração', 'Ataca o espaço e chega para finalizar sem perder mobilidade curta.', ['dexterity', 'shooting', 'dribbling', 'passing', 'lowerBodyStrength', 'defending']),
    role('amf-control', 'Controle entrelinhas', 'Recebe sob pressão, gira e mantém a bola viva em espaços curtos.', ['dribbling', 'passing', 'dexterity', 'lowerBodyStrength', 'shooting', 'defending'])
  ];

  if (position === 'LMF' || position === 'RMF') return [
    role('wide-support', 'Apoio de corredor', 'Cria linha de passe, conduz e retorna para proteger o lado.', ['passing', 'lowerBodyStrength', 'dexterity', 'defending', 'dribbling', 'aerialStrength']),
    role('wide-balance', 'Equilíbrio lateral', 'Divide responsabilidade entre criação, recomposição e resistência.', ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength']),
    role('wide-acceleration', 'Aceleração externa', 'Ataca espaço pelo corredor e acelera a transição com controle.', ['dexterity', 'dribbling', 'lowerBodyStrength', 'passing', 'defending', 'aerialStrength'])
  ];

  if (position === 'LWF' || position === 'RWF') return [
    role('wing-creator', 'Ponta criador', 'Vence o primeiro duelo e transforma a vantagem em passe ou assistência.', ['dribbling', 'passing', 'dexterity', 'lowerBodyStrength', 'shooting', 'defending']),
    role('wing-finisher', 'Finalizador por dentro', 'Corta para zonas de chute e aumenta a presença perto da área.', ['shooting', 'dexterity', 'dribbling', 'lowerBodyStrength', 'passing', 'defending']),
    role('wing-one-v-one', 'Aceleração e um contra um', 'Prioriza explosão, condução e repetição de arrancadas pelo lado.', ['dribbling', 'dexterity', 'lowerBodyStrength', 'passing', 'shooting', 'defending'])
  ];

  if (position === 'SS') return [
    role('ss-support', 'Segundo atacante de apoio', 'Conecta meio e ataque com passe, domínio e aproximação.', ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength', 'aerialStrength']),
    role('ss-runner', 'Segundo atacante de infiltração', 'Ataca intervalos e chega à área com aceleração e finalização.', ['dexterity', 'shooting', 'dribbling', 'lowerBodyStrength', 'passing', 'aerialStrength']),
    role('ss-finisher', 'Segundo finalizador', 'Fica mais próximo do gol e reduz tarefas secundárias de criação.', ['shooting', 'dribbling', 'dexterity', 'lowerBodyStrength', 'passing', 'aerialStrength'])
  ];

  return [
    role('cf-finisher', 'Centroavante artilheiro', 'Prioriza movimentos de ruptura e conclusão rápida dentro da área.', ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing']),
    role('cf-pivot', 'Centroavante pivô', 'Protege a bola, aproxima os meias e oferece apoio de costas.', ['lowerBodyStrength', 'passing', 'aerialStrength', 'shooting', 'dexterity', 'dribbling']),
    role('cf-mobile', 'Centroavante móvel', `Aumenta mobilidade e participação sem abandonar a função atual: ${currentFunction}.`, ['dexterity', 'dribbling', 'shooting', 'lowerBodyStrength', 'passing', 'aerialStrength'])
  ];
}

function rolePlan(result: AnalysisResult, role: TacticalRoleDefinition): TrainingPlan {
  const keys = activeKeys(result.bestPosition.code);
  const priority = role.priorities.filter((key) => keys.includes(key));
  const remaining = keys.filter((key) => !priority.includes(key));
  const target: TrainingPlan = { ...result.training };

  priority.slice(0, 3).forEach((key, index) => {
    target[key] = Math.min(16, Number(target[key] ?? 0) + (index === 0 ? 2 : 1));
  });

  [...remaining].reverse().slice(0, 3).forEach((key, index) => {
    const reduction = index === 0 ? 2 : 1;
    target[key] = Math.max(0, Number(target[key] ?? 0) - reduction);
  });

  for (const key of keys) {
    if (!Number.isFinite(target[key])) target[key] = 0;
  }

  return fitTrainingToBudget(target, [...priority, ...remaining], result.trainingPointsTotal);
}

function roleFitScore(result: AnalysisResult, role: TacticalRoleDefinition, plan: TrainingPlan): number {
  const priorities = role.priorities.filter((key) => activeKeys(result.bestPosition.code).includes(key));
  const weighted = priorities.reduce((sum, key, index) => sum + Number(plan[key] ?? 0) * Math.max(1, 5 - index), 0);
  const maxWeighted = priorities.reduce((sum, _key, index) => sum + 16 * Math.max(1, 5 - index), 0) || 1;
  const positionScore = result.positionScores.find((item) => item.code === result.bestPosition.code)?.score ?? result.bestPosition.score;
  const identityScore = result.cardDna?.antiClone.identityContribution ?? result.playerIdentity?.individualityScore ?? 78;
  const exactBonus = trainingPlanPoints(plan) === result.trainingPointsTotal ? 8 : -10;
  return clamp((weighted / maxWeighted) * 45 + positionScore * 0.28 + identityScore * 0.19 + exactBonus, 1, 99);
}

function evaluateRoles(result: AnalysisResult, selectedRoleId?: string | null): TacticalRoleEvaluation[] {
  const definitions = roleDefinitions(result.bestPosition.code, result);
  const raw = definitions.map((role) => {
    const training = rolePlan(result, role);
    const pointsUsed = trainingPlanPoints(training);
    const gains = role.priorities.slice(0, 3).map((key) => `${TRAINING_LABELS[key]} recebe prioridade para ${role.label.toLocaleLowerCase('pt-BR')}.`);
    const lowPriority = activeKeys(result.bestPosition.code).filter((key) => !role.priorities.slice(0, 4).includes(key));
    const tradeOffs = lowPriority.slice(0, 2).map((key) => `${TRAINING_LABELS[key]} deixa de ser prioridade máxima nesta função.`);
    return {
      ...role,
      training,
      pointsUsed,
      exactBudget: pointsUsed === result.trainingPointsTotal,
      fitScore: roleFitScore(result, role, training),
      gains,
      tradeOffs,
      recommended: false
    };
  });
  const selected = raw.find((item) => item.id === selectedRoleId) ?? [...raw].sort((a, b) => b.fitScore - a.fitScore)[0];
  return raw.map((item) => ({ ...item, recommended: item.id === selected?.id }));
}

function profileComparison(result: AnalysisResult): PrecisionProposal[] {
  const variants = result.buildVariants.length ? result.buildVariants : [];
  const competitive = variants[0];
  const unused = variants.slice(1);
  const attackScore = (variant: typeof competitive) => {
    const scenarios = variant?.scenarioScores;
    if (!scenarios) return Number(variant?.qualityScore ?? 0);
    const attacking = ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(result.bestPosition.code);
    return attacking
      ? scenarios.counterAttack * 0.55 + scenarios.possession * 0.2 + Number(variant?.qualityScore ?? 0) * 0.25
      : scenarios.possession * 0.42 + scenarios.counterAttack * 0.25 + Number(variant?.qualityScore ?? 0) * 0.33;
  };
  const offensive = [...unused].sort((a, b) => attackScore(b) - attackScore(a))[0] ?? competitive;
  const balanced = unused.find((item) => item !== offensive)
    ?? [...variants].sort((a, b) => Number(b.balanceScore ?? 0) - Number(a.balanceScore ?? 0))[0]
    ?? competitive;

  const selectedPositionScore = result.positionScores.find((item) => item.code === result.bestPosition.code)?.score ?? result.bestPosition.score;
  const identityScore = clamp(result.cardDna?.antiClone.identityContribution ?? result.playerIdentity?.individualityScore ?? 82);
  const make = (
    id: PrecisionProposal['id'],
    title: string,
    subtitle: string,
    variant: typeof competitive,
    why: string
  ): PrecisionProposal => ({
    id,
    title,
    subtitle,
    training: variant?.training ?? result.training,
    pointsUsed: trainingPlanPoints(variant?.training ?? result.training),
    score: clamp(variant?.qualityScore ?? selectedPositionScore),
    identityScore,
    positionScore: clamp(selectedPositionScore),
    efficiencyScore: clamp(variant?.efficiencyScore ?? result.advancedOptimizer?.efficiencyScore ?? 84),
    strengths: (variant?.highlights ?? result.strengths).slice(0, 4),
    limitations: (variant?.risks ?? result.weaknesses).slice(0, 3),
    why: variant?.verdict ?? variant?.note ?? why
  });

  return [
    make('competitive', 'Ficha competitiva', 'Maior rendimento total para partidas difíceis.', competitive, 'Prioriza consistência, posição e retorno real dos pontos.'),
    make('offensive', 'Ficha ofensiva', 'Aumenta a principal arma de criação ou conclusão.', offensive, 'Reforça ações que geram vantagem ofensiva sem trocar a posição escolhida.'),
    make('balanced', 'Ficha equilibrada', 'Distribui responsabilidade e reduz oscilações.', balanced, 'Busca estabilidade entre força natural, correções e resistência em campo.')
  ];
}

function pointJustifications(result: AnalysisResult, role: TacticalRoleEvaluation): PointInvestmentJustification[] {
  const goals = new Map((result.cardDna?.individualGoals ?? []).map((item) => [item.training, item]));
  const returns = new Map((result.marginalReturn ?? []).map((item) => [item.training, item]));
  const skillGroups = new Map<TrainingKey, string[]>();
  for (const skill of result.cardDna?.skillSynergies ?? []) {
    for (const key of skill.trainingGroups) {
      skillGroups.set(key, unique([...(skillGroups.get(key) ?? []), skill.name]));
    }
  }

  return activeKeys(result.bestPosition.code)
    .filter((key) => Number(role.training[key] ?? 0) > 0)
    .map((key) => {
      const level = Number(role.training[key] ?? 0);
      const goal = goals.get(key);
      const marginal = returns.get(key);
      const rank = role.priorities.indexOf(key);
      const supportedSkills = skillGroups.get(key) ?? [];
      const overCeiling = Boolean(goal && level > goal.recommendedCeiling);
      const nearCeiling = Boolean(goal && level >= goal.recommendedCeiling);
      const returnLabel = marginal?.returnLabel ?? (rank >= 0 && rank <= 2 ? 'alto' : rank <= 4 ? 'médio' : 'baixo');
      const wasteRisk: PointInvestmentJustification['wasteRisk'] = overCeiling || (returnLabel === 'baixo' && rank < 0)
        ? 'alto'
        : nearCeiling || returnLabel === 'baixo'
          ? 'atenção'
          : 'baixo';
      const priorityText = rank >= 0
        ? `É a prioridade ${rank + 1} da função “${role.label}”.`
        : `É um grupo complementar para a posição ${result.bestPosition.label}.`;
      const goalText = goal?.reason ? ` ${goal.reason}` : '';
      const skillText = supportedSkills.length ? ` Sustenta ${supportedSkills.slice(0, 2).join(' e ')}.` : '';
      const stopRule = goal
        ? `Parar perto de +${goal.recommendedCeiling}; acima disso o retorno tende a cair.`
        : marginal?.recommendation ?? 'Parar quando o próximo nível custar mais do que a ação aparece em campo.';
      return {
        training: key,
        label: TRAINING_LABELS[key],
        level,
        totalCost: trainingGroupCost(level),
        priorityRank: rank >= 0 ? rank + 1 : null,
        returnLabel,
        wasteRisk,
        supportedSkills,
        reason: `${priorityText}${goalText}${skillText}`.trim(),
        stopRule
      };
    });
}

function creatorSnapshot(result: AnalysisResult, plan: TrainingPlan, sources?: CreatorBuildSource[]): CreatorConsensusSnapshot {
  const consensus = buildCreatorBuildConsensus(result, sources);
  const differences = consensus.blocks
    .filter((block) => block.sampleCount > 0)
    .map((block) => ({
      training: block.key,
      label: block.label,
      appValue: Number(plan[block.key] ?? 0),
      consensusValue: block.value,
      difference: Number(plan[block.key] ?? 0) - block.value,
      agreement: block.agreement,
      sampleCount: block.sampleCount
    }))
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  const similarityScore = differences.length
    ? clamp(differences.reduce((sum, item) => sum + Math.max(0, 100 - Math.abs(item.difference) * 14), 0) / differences.length)
    : 0;
  return {
    sourceCount: consensus.sourceCount,
    exactCardCount: consensus.exactCardCount,
    proSourceCount: consensus.proSourceCount,
    confidence: consensus.confidence,
    confidenceLabel: consensus.confidenceLabel,
    totalCost: consensus.totalCost,
    similarityScore,
    verdict: consensus.verdict,
    warnings: consensus.warnings,
    differences
  };
}

function matchLearningSnapshot(result: AnalysisResult, records: MatchValidationRecord[], feedbacks: MatchFeedback[]): MatchLearningSnapshot {
  const summary = summarizeMatchValidation(records);
  const calibration = buildCalibrationReport(result, feedbacks);
  const learnedPriorities = Object.entries(calibration.learnedWeights)
    .map(([key, evidence]) => ({
      training: key as TrainingKey,
      label: TRAINING_LABELS[key as TrainingKey],
      evidence: Number(evidence ?? 0),
      reason: calibration.corrections.find((item) => item.trainingGroups.includes(key as TrainingKey))?.reason
        ?? 'Prioridade identificada pelo padrão das partidas registradas.'
    }))
    .sort((a, b) => b.evidence - a.evidence);
  const sampleCount = Math.max(summary.totalMatches, calibration.sampleCount);
  const confidence: MatchLearningSnapshot['confidence'] = sampleCount >= 8 ? 'alta' : sampleCount >= 3 ? 'média' : 'baixa';
  const recommendation = calibration.corrections.length
    ? `${summary.recommendation} O aprendizado pós-jogo também encontrou ${calibration.corrections.length} correção(ões) recorrente(s).`
    : summary.recommendation;
  return {
    sampleCount,
    confidence,
    average: summary.average,
    consistency: summary.consistency,
    strongestAreas: summary.strongestAreas,
    weakestAreas: summary.weakestAreas,
    repeatedProblems: summary.repeatedProblems,
    learnedPriorities,
    recommendation,
    safeguards: calibration.safeguards
  };
}

function wasteAlerts(result: AnalysisResult, justifications: PointInvestmentJustification[]): string[] {
  const alerts: string[] = [];
  for (const item of justifications) {
    if (item.wasteRisk === 'alto') alerts.push(`${item.label} +${item.level}: risco alto de custo maior que o ganho prático. ${item.stopRule}`);
    else if (item.wasteRisk === 'atenção') alerts.push(`${item.label} +${item.level}: está perto do limite útil. ${item.stopRule}`);
  }
  for (const item of result.advancedOptimizer?.detectedWaste ?? []) alerts.push(item);
  for (const item of result.correctionLimit?.naturalLimits ?? []) alerts.push(item);
  return unique(alerts).slice(0, 8);
}

export function buildAdvancedBuildIntelligence(
  result: AnalysisResult,
  input: AdvancedBuildIntelligenceInput = {}
): AdvancedBuildIntelligenceReport {
  const tacticalRoles = evaluateRoles(result, input.selectedRoleId);
  const selectedRole = tacticalRoles.find((item) => item.recommended) ?? tacticalRoles[0];
  const justifications = pointJustifications(result, selectedRole);
  const fingerprint = result.cardDna?.antiClone.fingerprint || cardFingerprint(result);
  const uniquenessScore = clamp(result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? 76);
  const cloneRisk = result.cardDna?.antiClone.cloneRisk ?? (uniquenessScore >= 82 ? 'baixo' : uniquenessScore >= 65 ? 'médio' : 'alto');
  const positionScore = result.positionScores.find((item) => item.code === result.bestPosition.code)?.score ?? result.bestPosition.score;
  const creatorConsensus = creatorSnapshot(result, selectedRole.training, input.creatorSources);
  const matchLearning = matchLearningSnapshot(result, input.matchRecords ?? [], input.calibrationFeedbacks ?? []);
  const skillActivation = (result.cardDna?.skillSynergies ?? []).slice(0, 10).map((item) => ({
    name: item.name,
    status: item.status,
    score: item.activationScore,
    supportedGroups: item.trainingGroups.map((key) => TRAINING_LABELS[key]),
    note: `${item.recommendation}${item.wasteRisk ? ` Risco: ${item.wasteRisk}` : ''}`
  }));

  return {
    version: ADVANCED_BUILD_INTELLIGENCE_VERSION,
    identity: {
      fingerprint,
      label: result.cardDna?.identityLabel ?? result.playerIdentity?.profileLabel ?? `${result.parsed.playerName} • ${result.parsed.cardType}`,
      uniquenessScore,
      cloneRisk,
      distinguishingFactors: unique([
        ...(result.playerIdentity?.decisiveFactors ?? []),
        ...(result.cardDna?.protectedStrengths ?? []),
        result.parsed.playstyle ? `Estilo oficial preservado: ${result.parsed.playstyle}.` : 'Estilo não confirmado; nenhum nome foi inventado.'
      ]).slice(0, 6)
    },
    selectedPosition: {
      code: result.bestPosition.code,
      label: result.bestPosition.label,
      score: clamp(positionScore),
      preserved: result.advancedOptimizer?.positionPreserved !== false,
      explanation: `A posição ${result.bestPosition.label} continua sendo a decisão principal. As funções e perfis apenas mudam a prioridade dos pontos dentro dessa escolha.`
    },
    profileComparison: profileComparison(result),
    tacticalRoles,
    selectedRole,
    pointJustifications: justifications,
    wasteAlerts: wasteAlerts(result, justifications),
    creatorConsensus,
    matchLearning,
    skillActivation,
    safeguards: [
      'A posição escolhida pelo usuário nunca é trocada automaticamente.',
      'Os três perfis respeitam o mesmo orçamento real de pontos.',
      'Consenso de criadores só usa fontes compatíveis com a mesma carta e mostra a confiança.',
      'Partidas registradas aumentam evidência, mas não sobrescrevem a ficha sem decisão do usuário.',
      'Habilidades e estilos mantêm somente nomes oficiais já reconhecidos pelo app.'
    ]
  };
}
