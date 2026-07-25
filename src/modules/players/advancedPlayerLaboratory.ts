import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from '@/lib/analyzer';
import { TRAINING_LABELS, type BuildVariant } from '@/lib/trainingEngine';
import { trainingPlanPoints } from '@/lib/precisionBuildEngine';
import { fitTrainingToBudget } from '@/modules/builds/trainingOptimizer';

export const ADVANCED_PLAYER_LAB_VERSION = '29.40.0';

export const PLAYER_LAB_TRAINING_KEYS: TrainingKey[] = [
  'shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength',
  'aerialStrength', 'defending', 'gk1', 'gk2', 'gk3'
];

export type PlayerLabProfileId = 'competitive' | 'balanced' | 'offensive' | 'personalized';

export type PlayerLabProfile = {
  id: PlayerLabProfileId;
  title: string;
  purpose: string;
  training: TrainingPlan;
  pointsUsed: number;
  pointsRemaining: number;
  score: number;
  efficiency: number;
  balance: number;
  highlights: string[];
  tradeOffs: string[];
  warnings: string[];
};

export type PlayerLabRadarAxis = {
  id: 'defense' | 'buildup' | 'creation' | 'mobility' | 'finishing' | 'physical';
  label: string;
  value: number;
};

export type PlayerLabThreshold = {
  training: TrainingKey;
  label: string;
  currentLevel: number;
  nextPointCost: number;
  returnLabel: 'alto' | 'médio' | 'baixo';
  status: 'investir' | 'manter' | 'evitar';
  note: string;
};

export type PlayerLabSkillImpact = {
  name: string;
  status: 'ativada' | 'favorecida' | 'sem suporte';
  supportedGroups: TrainingKey[];
  note: string;
};

export type PlayerLabTacticalUse = {
  starterScore: number;
  benchScore: number;
  verdict: 'titular' | 'reserva de impacto' | 'depende do plano';
  mainPosition: string;
  alternativePositions: Array<{ code: PositionCode; label: string; score: number }>;
  styleFits: Array<{ id: string; label: string; score: number; note: string }>;
  functionLabel: string;
};

export type PlayerLabSnapshot = {
  id: string;
  playerId: string;
  playerName: string;
  createdAt: string;
  label: string;
  favorite: boolean;
  selectedProfiles: PlayerLabProfileId[];
  customTraining: TrainingPlan;
  customPointsUsed: number;
  rulePackVersion: string;
};

export type AdvancedPlayerLaboratoryReport = {
  version: string;
  playerId: string;
  playerName: string;
  profiles: PlayerLabProfile[];
  radar: PlayerLabRadarAxis[];
  thresholds: PlayerLabThreshold[];
  skillImpacts: PlayerLabSkillImpact[];
  tacticalUse: PlayerLabTacticalUse;
  safeguards: string[];
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function zeroPlan(): TrainingPlan {
  return {
    shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0,
    aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
  };
}

export function normalizePlayerLabPlan(plan: Partial<TrainingPlan> | null | undefined): TrainingPlan {
  const next = zeroPlan();
  for (const key of PLAYER_LAB_TRAINING_KEYS) next[key] = Math.max(0, Math.min(16, Math.round(Number(plan?.[key] ?? 0))));
  return next;
}

function positionPriorities(position: PositionCode, mode: PlayerLabProfileId): TrainingKey[] {
  const goalkeeper: TrainingKey[] = ['gk2', 'gk1', 'gk3', 'aerialStrength', 'lowerBodyStrength'];
  if (position === 'GK') return goalkeeper;
  const role: Partial<Record<PositionCode, TrainingKey[]>> = {
    CF: ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'],
    SS: ['dexterity', 'shooting', 'dribbling', 'passing', 'lowerBodyStrength'],
    LWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
    RWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
    AMF: ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'],
    CMF: ['passing', 'lowerBodyStrength', 'defending', 'dribbling', 'dexterity'],
    DMF: ['defending', 'passing', 'lowerBodyStrength', 'aerialStrength', 'dexterity'],
    CB: ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'],
    LB: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'dribbling'],
    RB: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'dribbling'],
    LMF: ['passing', 'lowerBodyStrength', 'dribbling', 'dexterity', 'defending'],
    RMF: ['passing', 'lowerBodyStrength', 'dribbling', 'dexterity', 'defending']
  };
  const base = role[position] ?? ['passing', 'dexterity', 'lowerBodyStrength', 'dribbling', 'defending', 'shooting'];
  if (mode === 'offensive') return [...new Set<TrainingKey>(['shooting', 'dribbling', 'dexterity', ...base])];
  if (mode === 'balanced') return [...new Set<TrainingKey>([...base.slice(0, 3), 'passing', 'defending', 'lowerBodyStrength', ...base])];
  return base;
}

function findVariant(result: AnalysisResult, profile: PlayerLabProfileId): BuildVariant | null {
  if (!result.buildVariants.length) return null;
  if (profile === 'competitive') return result.buildVariants.find((item) => item.kind === 'competitive') ?? result.buildVariants[0] ?? null;
  if (profile === 'balanced') return result.buildVariants.find((item) => item.kind === 'safe') ?? result.buildVariants[1] ?? result.buildVariants[0] ?? null;
  if (profile === 'offensive') return result.buildVariants.find((item) => item.kind === 'alternative') ?? result.buildVariants[2] ?? result.buildVariants[0] ?? null;
  return null;
}

function buildProfile(result: AnalysisResult, id: PlayerLabProfileId, custom?: TrainingPlan): PlayerLabProfile {
  const source = findVariant(result, id);
  const budget = Math.max(0, result.trainingPointsTotal);
  const base = id === 'personalized'
    ? normalizePlayerLabPlan(custom ?? result.training)
    : normalizePlayerLabPlan(source?.training ?? result.training);
  const training = fitTrainingToBudget(base, positionPriorities(result.bestPosition.code, id), budget);
  const pointsUsed = trainingPlanPoints(training);
  const remaining = Math.max(0, budget - pointsUsed);
  const marginalWaste = result.marginalReturn.filter((item) => item.returnLabel === 'baixo' && training[item.training] >= item.currentLevel).length;
  const scoreBase = source?.qualityScore ?? result.bestPosition.score;
  const efficiency = clamp((source?.efficiencyScore ?? scoreBase) - remaining * 3 - marginalWaste * 2);
  const balance = clamp(source?.balanceScore ?? (100 - Math.max(...PLAYER_LAB_TRAINING_KEYS.map((key) => training[key])) * 2 + 28));
  const score = clamp(scoreBase * .55 + efficiency * .3 + balance * .15);
  const title: Record<PlayerLabProfileId, string> = {
    competitive: 'Competitiva', balanced: 'Equilibrada', offensive: 'Ofensiva', personalized: 'Personalizada'
  };
  const purpose: Record<PlayerLabProfileId, string> = {
    competitive: 'Maior rendimento para a função escolhida e partidas ranqueadas.',
    balanced: 'Preserva consistência, segurança e adaptação entre cenários.',
    offensive: 'Aumenta agressividade, criação e presença perto do gol.',
    personalized: 'Distribuição ajustada manualmente com orçamento real controlado.'
  };
  const highlights = PLAYER_LAB_TRAINING_KEYS
    .filter((key) => training[key] > 0)
    .sort((a, b) => training[b] - training[a])
    .slice(0, 3)
    .map((key) => `${TRAINING_LABELS[key]} +${training[key]}`);
  const warnings = [
    ...(remaining > 0 ? [`Ainda restam ${remaining} ponto(s) sem uso.`] : []),
    ...(marginalWaste > 0 ? [`${marginalWaste} grupo(s) alcançaram retorno marginal baixo.`] : []),
    ...(result.validation.level === 'blocked' ? ['A carta possui dados bloqueantes e deve ser revisada antes de salvar.'] : [])
  ];
  return {
    id, title: title[id], purpose: purpose[id], training, pointsUsed, pointsRemaining: remaining,
    score, efficiency, balance,
    highlights: source?.highlights?.slice(0, 3) ?? highlights,
    tradeOffs: source?.tradeOffs?.slice(0, 3) ?? source?.risks?.slice(0, 3) ?? [],
    warnings
  };
}

function radar(result: AnalysisResult): PlayerLabRadarAxis[] {
  const sectors = result.teamMap.sectorScores;
  const mobility = Math.round((sectors.aceleracao + sectors.cobertura) / 2);
  const physical = Math.round((sectors.fisico + sectors.jogoAereo) / 2);
  return [
    { id: 'defense', label: 'Defesa', value: clamp((sectors.marcacao + sectors.cobertura) / 2) },
    { id: 'buildup', label: 'Saída', value: clamp((sectors.saidaDeBola + sectors.passe) / 2) },
    { id: 'creation', label: 'Criação', value: clamp(sectors.criacao) },
    { id: 'mobility', label: 'Mobilidade', value: clamp(mobility) },
    { id: 'finishing', label: 'Finalização', value: clamp(sectors.finalizacao) },
    { id: 'physical', label: 'Físico', value: clamp(physical) }
  ];
}

function thresholdReport(result: AnalysisResult, profile: PlayerLabProfile): PlayerLabThreshold[] {
  return result.marginalReturn
    .filter((item) => profile.training[item.training] > 0 || item.returnLabel !== 'baixo')
    .map((item) => ({
      training: item.training,
      label: item.label,
      currentLevel: profile.training[item.training],
      nextPointCost: item.nextPointCost,
      returnLabel: item.returnLabel,
      status: (item.returnLabel === 'alto' ? 'investir' : item.returnLabel === 'baixo' ? 'evitar' : 'manter') as PlayerLabThreshold['status'],
      note: item.recommendation
    }))
    .slice(0, 8);
}

const SKILL_GROUPS: Array<{ pattern: RegExp; groups: TrainingKey[] }> = [
  { pattern: /passe|cruzamento|lançamento|calcanhar/i, groups: ['passing'] },
  { pattern: /chute|finaliza|cabeça|cavadinha|curva/i, groups: ['shooting', 'aerialStrength'] },
  { pattern: /drible|elástico|sola|toque duplo/i, groups: ['dribbling', 'dexterity'] },
  { pattern: /intercept|bloque|marcação|carrinho|volta para marcar/i, groups: ['defending', 'lowerBodyStrength'] },
  { pattern: /goleiro|pênalti|reposição/i, groups: ['gk1', 'gk2', 'gk3'] }
];

function skillImpacts(result: AnalysisResult, profile: PlayerLabProfile): PlayerLabSkillImpact[] {
  return [...new Set([...result.parsed.specialSkills, ...result.recommendedSkills])].slice(0, 8).map((name) => {
    const groups = SKILL_GROUPS.find((item) => item.pattern.test(name))?.groups ?? [];
    const active = groups.filter((group) => profile.training[group] >= 5);
    return {
      name,
      status: active.length === groups.length && groups.length ? 'ativada' : active.length ? 'favorecida' : 'sem suporte',
      supportedGroups: groups,
      note: groups.length
        ? `${active.length}/${groups.length} grupo(s) de progressão com suporte relevante.`
        : 'Habilidade preservada, mas sem vínculo direto com um grupo de progressão conhecido.'
    };
  });
}

function tacticalUse(result: AnalysisResult): PlayerLabTacticalUse {
  const starterScore = clamp(result.bestPosition.score * .55 + result.trainingPointsUsed / Math.max(1, result.trainingPointsTotal) * 25 + result.parsed.confidence * .2);
  const impactSignals = /super substituto|veloc|acelera|finaliza/i.test([...result.parsed.nativeSkills, ...result.recommendedSkills].join(' '));
  const benchScore = clamp(starterScore - 4 + (impactSignals ? 12 : 0));
  const verdict = starterScore >= 84 && starterScore >= benchScore ? 'titular' : benchScore >= 82 ? 'reserva de impacto' : 'depende do plano';
  const styleFits = [
    { id: 'possession', label: 'Posse de bola', score: clamp((result.teamMap.sectorScores.passe + result.teamMap.sectorScores.criacao + result.teamMap.sectorScores.saidaDeBola) / 3), note: 'Prioriza passe, apoio e circulação.' },
    { id: 'normal-counter', label: 'Contra-ataque normal', score: clamp((result.teamMap.sectorScores.cobertura + result.teamMap.sectorScores.aceleracao + result.teamMap.sectorScores.fisico) / 3), note: 'Equilibra recuperação, transição e segurança.' },
    { id: 'quick-counter', label: 'Contra-ataque rápido', score: clamp((result.teamMap.sectorScores.aceleracao + result.teamMap.sectorScores.finalizacao + result.teamMap.sectorScores.marcacao) / 3), note: 'Prioriza reação, ataque ao espaço e pressão.' }
  ].sort((a, b) => b.score - a.score);
  return {
    starterScore, benchScore, verdict,
    mainPosition: result.bestPosition.label,
    alternativePositions: result.positionScores.filter((item) => item.code !== result.bestPosition.code).slice(0, 4).map((item) => ({ code: item.code, label: item.label, score: item.score })),
    styleFits,
    functionLabel: result.teamMap.functionLabel || result.buildName
  };
}

export function buildAdvancedPlayerLaboratory(result: AnalysisResult, custom?: Partial<TrainingPlan> | null): AdvancedPlayerLaboratoryReport {
  const customPlan = normalizePlayerLabPlan(custom ?? result.training);
  const profiles: PlayerLabProfile[] = [
    buildProfile(result, 'competitive'),
    buildProfile(result, 'balanced'),
    buildProfile(result, 'offensive'),
    buildProfile(result, 'personalized', customPlan)
  ];
  const personalized = profiles[3];
  return {
    version: ADVANCED_PLAYER_LAB_VERSION,
    playerId: result.parsed.internalId,
    playerName: result.parsed.playerName,
    profiles,
    radar: radar(result),
    thresholds: thresholdReport(result, personalized),
    skillImpacts: skillImpacts(result, personalized),
    tacticalUse: tacticalUse(result),
    safeguards: [
      'A posição escolhida pelo usuário nunca é alterada pelo laboratório.',
      'O orçamento usa o custo progressivo real dos grupos e não apenas a soma dos níveis.',
      'Nenhuma versão salva substitui a ficha atual sem uma ação explícita.',
      'Os nomes de posições, estilos e habilidades são validados pela base de regras ativa.'
    ]
  };
}

export function createPlayerLabSnapshot(input: {
  result: AnalysisResult;
  label: string;
  favorite?: boolean;
  selectedProfiles?: PlayerLabProfileId[];
  customTraining: Partial<TrainingPlan>;
  rulePackVersion: string;
  now?: string;
}): PlayerLabSnapshot {
  const plan = normalizePlayerLabPlan(input.customTraining);
  return {
    id: `${input.result.parsed.internalId}-${Date.parse(input.now ?? new Date().toISOString()) || Date.now()}`,
    playerId: input.result.parsed.internalId,
    playerName: input.result.parsed.playerName,
    createdAt: input.now ?? new Date().toISOString(),
    label: input.label.trim() || 'Versão personalizada',
    favorite: Boolean(input.favorite),
    selectedProfiles: ([...new Set<PlayerLabProfileId>(input.selectedProfiles ?? ['competitive', 'balanced', 'personalized'])].slice(0, 4)) as PlayerLabProfileId[],
    customTraining: plan,
    customPointsUsed: trainingPlanPoints(plan),
    rulePackVersion: input.rulePackVersion
  };
}
