import type { AnalysisResult, AttributeKey, PositionCode, TacticalStyle } from '@/lib/analyzerDomain';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import { inspectPlaystyleActivationR124 } from '@/lib/efootball2027PhaseCatalogR124';

export const GAMEPLAY_SCOUTING_R454_VERSION = '40.80-r454-gameplay-scouting-v1' as const;
export const GAMEPLAY_SCOUTING_STORAGE_KEY_R454 = 'buildmaster_gameplay_scouting_r454' as const;

export type GameplayScoutingSourceTypeR454 =
  | 'OFFICIAL'
  | 'DATABASE'
  | 'REVIEWER'
  | 'COMMUNITY'
  | 'USER_GAMEPLAY';

export type GameplayScoutingConfidenceR454 = 'ALTA' | 'MEDIA' | 'BAIXA';
export type GameplayScoutingStatusR454 = 'READY' | 'SCOUTING_PENDENTE' | 'SOURCE_CONFLICT';
export type TacticalFitLabelR454 = 'EXCELENTE' | 'MUITO_BOM' | 'BOM' | 'MEDIO' | 'FRACO' | 'INCOMPATIVEL';

export type GameplayScoutingSourceR454 = {
  id: string;
  type: GameplayScoutingSourceTypeR454;
  label: string;
  url?: string | null;
  gameVersion: string;
  observedAt: string;
  confidence: GameplayScoutingConfidenceR454;
  note?: string | null;
};

export type GameplayScoutingConflictR454 = {
  id: string;
  field: string;
  sourceA: string;
  sourceB: string;
  valueA: string;
  valueB: string;
  adoptedDecision?: string | null;
  reason?: string | null;
  confidence: GameplayScoutingConfidenceR454;
};

export type UserGameplayFeedbackR454 = {
  id: string;
  createdAt: string;
  gameVersion: string;
  note: string;
  tags: Array<
    | 'PESADO'
    | 'INTERCEPTA_MUITO'
    | 'BUILD_NAO_FUNCIONOU'
    | 'DUPLA_FUNCIONOU'
    | 'SOME_DO_JOGO'
    | 'OUTRO'
  >;
};

export type GameplayScoutingRoleR454 = {
  id: string;
  position: PositionCode;
  label: string;
  function: string;
  fit: TacticalFitLabelR454;
  reason: string;
};

export type GameplayScoutingRecordR454 = {
  version: typeof GAMEPLAY_SCOUTING_R454_VERSION;
  status: GameplayScoutingStatusR454;
  cardId: string;
  playerName: string;
  playerVersion: string;
  cardType: string;
  gameVersion: string;
  mainPosition: PositionCode;
  testedPositions: PositionCode[];
  fullPositions: PositionCode[];
  partialPositions: PositionCode[];
  activePlaystyle: string | null;
  inactivePlaystyles: string[];
  offBallBehaviour: string[];
  buildUpBehaviour: string[];
  pressResistance: string[];
  passingBehaviour: string[];
  dribblingBehaviour: string[];
  finishingBehaviour: string[];
  defensiveBehaviour: string[];
  transitionBehaviour: string[];
  bodyProfile: string[];
  height: number | null;
  dominantFoot: string | null;
  physicalProfile: string[];
  playerIdNotes: string[];
  animationNotes: string[];
  bestRoles: GameplayScoutingRoleR454[];
  acceptableRoles: GameplayScoutingRoleR454[];
  badRoles: GameplayScoutingRoleR454[];
  bestFormations: string[];
  badFormations: string[];
  bestPartners: string[];
  badPartners: string[];
  recommendedBuilds: string[];
  recommendedSkills: string[];
  formationSynergies: string[];
  coachSynergies: string[];
  playstyleSynergies: string[];
  strengths: string[];
  weaknesses: string[];
  sourceLinks: string[];
  sourceTypes: GameplayScoutingSourceTypeR454[];
  sources: GameplayScoutingSourceR454[];
  conflicts: GameplayScoutingConflictR454[];
  confidence: GameplayScoutingConfidenceR454;
  testedByUser: boolean;
  userFeedback: UserGameplayFeedbackR454[];
  lastReviewed: string | null;
};

export type TacticalFitContextR454 = {
  position: PositionCode;
  formationId?: string | null;
  slotLabel?: string | null;
  teamStyle?: TacticalStyle | null;
  desiredFunctions?: string[];
  partnerResults?: AnalysisResult[];
};

export type TacticalFitResultR454 = {
  score: number;
  label: TacticalFitLabelR454;
  position: PositionCode;
  formationId: string | null;
  teamStyle: TacticalStyle;
  activePlaystyle: boolean | null;
  scoutingStatus: GameplayScoutingStatusR454;
  reasons: string[];
  warnings: string[];
  guarantees: {
    overallExcluded: true;
    cardVersionIsolated: true;
    inactivePlaystyleFlagged: true;
    contextDependent: true;
  };
};

export type PairSynergyR454 = {
  score: number;
  label: 'FORTE' | 'BOA' | 'NEUTRA' | 'REDUNDANTE' | 'RUIM';
  reasons: string[];
  warnings: string[];
};

const POSITION_ATTRIBUTE_WEIGHTS_R454: Record<PositionCode, Partial<Record<AttributeKey, number>>> = {
  CF: { offensiveAwareness: 1.35, finishing: 1.3, ballControl: .7, tightPossession: .7, lowPass: .55, acceleration: .85, balance: .7, physicalContact: .6 },
  SS: { offensiveAwareness: 1.05, ballControl: 1, tightPossession: 1, lowPass: .95, dribbling: .75, finishing: .75, acceleration: .75, balance: .65 },
  LWF: { offensiveAwareness: .9, dribbling: 1.1, tightPossession: 1, acceleration: 1, speed: .9, lowPass: .7, finishing: .7 },
  RWF: { offensiveAwareness: .9, dribbling: 1.1, tightPossession: 1, acceleration: 1, speed: .9, lowPass: .7, finishing: .7 },
  LMF: { lowPass: 1, ballControl: .85, tightPossession: .75, stamina: .9, acceleration: .7, defensiveEngagement: .55 },
  RMF: { lowPass: 1, ballControl: .85, tightPossession: .75, stamina: .9, acceleration: .7, defensiveEngagement: .55 },
  AMF: { lowPass: 1.25, ballControl: 1.1, tightPossession: 1, offensiveAwareness: .85, dribbling: .7, acceleration: .65 },
  CMF: { lowPass: 1.2, ballControl: .85, tightPossession: .75, stamina: 1, defensiveEngagement: .7, balance: .55 },
  DMF: { defensiveAwareness: 1.25, defensiveEngagement: 1.15, tackling: 1, lowPass: .95, physicalContact: .75, stamina: .7, balance: .55 },
  CB: { defensiveAwareness: 1.3, defensiveEngagement: 1.15, tackling: 1.1, physicalContact: 1, jump: .8, speed: .65, lowPass: .5 },
  LB: { defensiveAwareness: .95, defensiveEngagement: .9, tackling: .8, speed: .85, stamina: .85, lowPass: .65 },
  RB: { defensiveAwareness: .95, defensiveEngagement: .9, tackling: .8, speed: .85, stamina: .85, lowPass: .65 },
  GK: { goalkeeperAwareness: 1.3, goalkeeperReflexes: 1.2, goalkeeperReach: 1.1, goalkeeperCatching: .85, goalkeeperParrying: .85 }
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function fitLabel(score: number): TacticalFitLabelR454 {
  if (score >= 90) return 'EXCELENTE';
  if (score >= 82) return 'MUITO_BOM';
  if (score >= 72) return 'BOM';
  if (score >= 60) return 'MEDIO';
  if (score >= 45) return 'FRACO';
  return 'INCOMPATIVEL';
}

function pairLabel(score: number): PairSynergyR454['label'] {
  if (score >= 84) return 'FORTE';
  if (score >= 72) return 'BOA';
  if (score >= 58) return 'NEUTRA';
  if (score >= 44) return 'REDUNDANTE';
  return 'RUIM';
}

function attributeFit(result: AnalysisResult, position: PositionCode) {
  const weights = POSITION_ATTRIBUTE_WEIGHTS_R454[position];
  let weighted = 0;
  let total = 0;
  for (const [key, weight] of Object.entries(weights) as Array<[AttributeKey, number]>) {
    const value = Number(result.parsed.attributes?.[key]);
    if (!Number.isFinite(value) || value <= 0) continue;
    weighted += value * weight;
    total += weight;
  }
  if (!total) return 60;
  return clamp(weighted / total);
}

function scoutingRoleMatch(record: GameplayScoutingRecordR454 | null | undefined, context: TacticalFitContextR454) {
  if (!record) return { score: 60, reason: 'Scouting externo ainda pendente para esta edição da carta.' };
  const all = [...record.bestRoles, ...record.acceptableRoles, ...record.badRoles];
  const matching = all.filter((role) => role.position === context.position);
  if (!matching.length) return { score: record.status === 'SCOUTING_PENDENTE' ? 60 : 58, reason: 'Scouting sem função confirmada para este slot.' };
  const best = matching.sort((a, b) => {
    const order: Record<TacticalFitLabelR454, number> = { EXCELENTE: 6, MUITO_BOM: 5, BOM: 4, MEDIO: 3, FRACO: 2, INCOMPATIVEL: 1 };
    return order[b.fit] - order[a.fit];
  })[0];
  const scoreMap: Record<TacticalFitLabelR454, number> = { EXCELENTE: 96, MUITO_BOM: 87, BOM: 77, MEDIO: 64, FRACO: 48, INCOMPATIVEL: 25 };
  return { score: scoreMap[best.fit], reason: `Scouting: ${best.function} — ${best.reason}` };
}

function activeStyleState(result: AnalysisResult, position: PositionCode) {
  const style = result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null;
  const activation = inspectPlaystyleActivationR124(style, 'OFFENSIVE', position);
  if (activation.status === 'LIKELY_ACTIVE') return { active: true as const, score: 100, message: activation.message };
  if (activation.status === 'LIKELY_INACTIVE') return { active: false as const, score: 38, message: activation.message };
  if (activation.status === 'CHECK_POSITION') return { active: null, score: 68, message: activation.message };
  return { active: null, score: 62, message: activation.message };
}

export function createPendingGameplayScoutingR454(result: AnalysisResult, gameVersion = '6.0.0'): GameplayScoutingRecordR454 {
  const parsed = result.parsed;
  return {
    version: GAMEPLAY_SCOUTING_R454_VERSION,
    status: 'SCOUTING_PENDENTE',
    cardId: cardIdentityFingerprintR126(parsed),
    playerName: parsed.playerName,
    playerVersion: parsed.specialTag || parsed.cardType || 'versao-nao-confirmada',
    cardType: parsed.cardType || 'nao-confirmado',
    gameVersion,
    mainPosition: parsed.mainPosition,
    testedPositions: [],
    fullPositions: [...new Set([parsed.mainPosition, ...(parsed.positions ?? [])])],
    partialPositions: [],
    activePlaystyle: parsed.offensivePlaystyle ?? parsed.playstyle ?? null,
    inactivePlaystyles: [],
    offBallBehaviour: [],
    buildUpBehaviour: [],
    pressResistance: [],
    passingBehaviour: [],
    dribblingBehaviour: [],
    finishingBehaviour: [],
    defensiveBehaviour: [],
    transitionBehaviour: [],
    bodyProfile: [],
    height: parsed.height ?? null,
    dominantFoot: parsed.dominantFoot ?? null,
    physicalProfile: [],
    playerIdNotes: [],
    animationNotes: [],
    bestRoles: [],
    acceptableRoles: [],
    badRoles: [],
    bestFormations: [],
    badFormations: [],
    bestPartners: [],
    badPartners: [],
    recommendedBuilds: [],
    recommendedSkills: [...(result.recommendedSkills ?? [])].slice(0, 5),
    formationSynergies: [],
    coachSynergies: [],
    playstyleSynergies: [],
    strengths: [...(result.strengths ?? [])],
    weaknesses: [...(result.weaknesses ?? [])],
    sourceLinks: [],
    sourceTypes: [],
    sources: [],
    conflicts: [],
    confidence: 'BAIXA',
    testedByUser: false,
    userFeedback: [],
    lastReviewed: null
  };
}

export function evaluateTacticalFitR454(
  result: AnalysisResult,
  context: TacticalFitContextR454,
  scouting?: GameplayScoutingRecordR454 | null
): TacticalFitResultR454 {
  const record = scouting ?? (result as AnalysisResult & { gameplayScoutingR454?: GameplayScoutingRecordR454 }).gameplayScoutingR454 ?? createPendingGameplayScoutingR454(result);
  const positionEvidence = context.position === result.parsed.mainPosition
    ? 100
    : result.parsed.positions?.includes(context.position)
      ? 86
      : result.permittedPositions?.some((item) => item.code === context.position)
        ? 72
        : 42;
  const attributes = attributeFit(result, context.position);
  const style = activeStyleState(result, context.position);
  const role = scoutingRoleMatch(record, context);
  const styleName = context.teamStyle ?? result.tacticalProfile?.style ?? 'AUTO';
  const formationBoost = context.formationId && record.bestFormations.includes(context.formationId) ? 8
    : context.formationId && record.badFormations.includes(context.formationId) ? -12 : 0;
  const styleText = normalize(styleName);
  const synergyBoost = record.playstyleSynergies.some((item) => normalize(item).includes(styleText)) ? 6 : 0;
  const roleText = normalize([...(context.desiredFunctions ?? [])].join(' '));
  const roleBoost = roleText && [...record.bestRoles, ...record.acceptableRoles].some((item) => roleText.includes(normalize(item.function)) || normalize(item.function).includes(roleText)) ? 6 : 0;
  const score = clamp(positionEvidence * .28 + attributes * .27 + style.score * .18 + role.score * .27 + formationBoost + synergyBoost + roleBoost);
  const reasons = [
    `Encaixe calculado para ${context.position}${context.slotLabel ? ` (${context.slotLabel})` : ''}, não como nota universal da carta.`,
    `Atributos funcionais do slot: ${attributes}/100.`,
    role.reason,
    style.message,
    context.formationId ? `Formação avaliada: ${context.formationId}.` : 'Formação não informada; sem bônus/penalidade específica.'
  ];
  const warnings: string[] = [];
  if (style.active === false) warnings.push('ESTILO INATIVO NESTA POSIÇÃO');
  if (record.status === 'SCOUTING_PENDENTE') warnings.push('SCOUTING PENDENTE — resultado usa somente evidência estrutural já disponível.');
  if (record.status === 'SOURCE_CONFLICT') warnings.push('SOURCE_CONFLICT — há divergência entre fontes de scouting.');
  if (positionEvidence < 55) warnings.push('Proficiência/posição insuficiente para tratar este slot como encaixe natural.');
  return {
    score,
    label: fitLabel(score),
    position: context.position,
    formationId: context.formationId ?? null,
    teamStyle: styleName,
    activePlaystyle: style.active,
    scoutingStatus: record.status,
    reasons,
    warnings,
    guarantees: {
      overallExcluded: true,
      cardVersionIsolated: true,
      inactivePlaystyleFlagged: true,
      contextDependent: true
    }
  };
}

function playstyleName(result: AnalysisResult) {
  return normalize(result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? '');
}

export function evaluatePairSynergyR454(
  left: AnalysisResult,
  right: AnalysisResult,
  context: { formationId?: string | null; teamStyle?: TacticalStyle | null } = {}
): PairSynergyR454 {
  const leftStyle = playstyleName(left);
  const rightStyle = playstyleName(right);
  const leftRole = normalize(left.teamMap?.functionLabel ?? left.buildName);
  const rightRole = normalize(right.teamMap?.functionLabel ?? right.buildName);
  let score = 64;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const has = (value: string, ...needles: string[]) => needles.some((needle) => value.includes(normalize(needle)));

  if ((has(leftStyle, 'armador criativo') && has(rightStyle, 'infiltracao')) || (has(rightStyle, 'armador criativo') && has(leftStyle, 'infiltracao'))) {
    score += 18;
    reasons.push('Armador Criativo + Infiltração combinam criação curta com ataque ao espaço.');
  }
  if ((has(leftStyle, 'puxa marcacao') && has(rightStyle, 'artilheiro')) || (has(rightStyle, 'puxa marcacao') && has(leftStyle, 'artilheiro'))) {
    score += 16;
    reasons.push('Puxa Marcação pode abrir corredor para o Artilheiro atacar a última linha.');
  }
  if ((has(leftStyle, 'homem de area') && (has(rightStyle, 'armador criativo', 'infiltracao'))) || (has(rightStyle, 'homem de area') && (has(leftStyle, 'armador criativo', 'infiltracao')))) {
    score += 12;
    reasons.push('Homem de Área recebe suporte complementar de um jogador que aproxima/cria.');
  }
  if (leftStyle && leftStyle === rightStyle) {
    score -= 13;
    warnings.push('Estilos idênticos podem gerar movimentação redundante neste par.');
  }
  if (leftRole && leftRole === rightRole) {
    score -= 8;
    warnings.push('Funções táticas iguais reduzem complementaridade.');
  }
  if (context.teamStyle === 'POSSE_DE_BOLA') {
    const leftPass = Number(left.parsed.attributes?.lowPass ?? 0);
    const rightPass = Number(right.parsed.attributes?.lowPass ?? 0);
    if (leftPass >= 80 && rightPass >= 80) {
      score += 7;
      reasons.push('A dupla sustenta circulação curta para Posse de Bola.');
    }
  }
  if (!reasons.length) reasons.push('Sem combinação especial confirmada; manter avaliação neutra e observar gameplay real.');
  score = clamp(score);
  return { score, label: pairLabel(score), reasons, warnings };
}

export function attachPendingGameplayScoutingR454(result: AnalysisResult): AnalysisResult {
  const current = (result as AnalysisResult & { gameplayScoutingR454?: GameplayScoutingRecordR454 }).gameplayScoutingR454;
  if (current?.cardId === cardIdentityFingerprintR126(result.parsed)) return result;
  return { ...result, gameplayScoutingR454: createPendingGameplayScoutingR454(result) } as AnalysisResult;
}
