import type { AnalysisResult, PositionCode, TacticalStyle } from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { analysisUsagePositionR138 } from './analysisUsagePositionR138';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import {
  canonicalizePlayerPlaystyle,
  getPlayerStyleMeta2026,
  normalizeFormationCoachStyle,
  type CanonicalPlayerPlaystyle,
  type FormationCoachStyle
} from './efootball2026Playstyles';
import {
  FORMATION_BLUEPRINTS,
  FORMATION_ROLE_CATALOG,
  type FormationBlueprint,
  type FormationRoleId,
  type FormationSlot
} from './formationRoleEngine';

export const GAMEPLAY_SCOUTING_R454_VERSION = '40.80-r454-gameplay-scouting-contextual-v1' as const;
export const GAMEPLAY_SCOUTING_GAME_VERSION_R454 = '6.0.0' as const;

export type GameplayScoutingSourceTypeR454 =
  | 'OFFICIAL'
  | 'DATABASE'
  | 'REVIEWER'
  | 'COMMUNITY'
  | 'USER_GAMEPLAY';

export type GameplayScoutingConfidenceR454 = 'ALTA' | 'MEDIA' | 'BAIXA';
export type GameplayScoutingStatusR454 = 'SCOUTING_PENDENTE' | 'SCOUTING_PARCIAL' | 'SCOUTING_VALIDADO';
export type StyleActivationR454 = 'ATIVO' | 'INATIVO' | 'DESCONHECIDO';
export type TacticalFitLabelR454 = 'EXCELENTE' | 'MUITO_BOM' | 'BOM' | 'MEDIO' | 'FRACO';

export type GameplayScoutingClaimR454 = {
  key: string;
  value: string;
};

export type GameplayScoutingEvidenceR454 = {
  id: string;
  type: GameplayScoutingSourceTypeR454;
  sourceName: string;
  sourceUrl?: string | null;
  gameVersion: string;
  observedAt: string;
  confidence: GameplayScoutingConfidenceR454;
  note?: string;
  claims?: GameplayScoutingClaimR454[];
};

export type GameplayScoutingConflictR454 = {
  key: string;
  values: Array<{ sourceId: string; sourceName: string; value: string }>;
  status: 'SOURCE_CONFLICT';
  decision: 'REVIEW_REQUIRED';
};

export type TacticalFitContextR454 = {
  formationId: string;
  targetPosition: PositionCode;
  teamStyle: TacticalStyle;
  slotId?: string | null;
  partners?: AnalysisResult[];
  coachName?: string | null;
};

export type TacticalFitR454 = {
  version: typeof GAMEPLAY_SCOUTING_R454_VERSION;
  cardId: string;
  formationId: string;
  slotId: string | null;
  targetPosition: PositionCode;
  targetPositionLabel: string;
  teamStyle: FormationCoachStyle;
  score: number;
  label: TacticalFitLabelR454;
  recommendedRole: FormationRoleId | null;
  styleActivation: StyleActivationR454;
  styleName: string | null;
  dimensions: {
    function: number;
    position: number;
    role: number;
    style: number;
    synergy: number;
  };
  reasons: string[];
  warnings: string[];
};

export type GameplayScoutingRecordR454 = {
  version: typeof GAMEPLAY_SCOUTING_R454_VERSION;
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
  bestRoles: string[];
  acceptableRoles: string[];
  badRoles: string[];
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
  confidence: GameplayScoutingConfidenceR454;
  status: GameplayScoutingStatusR454;
  conflicts: GameplayScoutingConflictR454[];
  sources: GameplayScoutingEvidenceR454[];
  testedByUser: boolean;
  lastReviewed: string | null;
};

const ROLE_BY_STYLE: Partial<Record<CanonicalPlayerPlaystyle, FormationRoleId>> = {
  'Goleiro Ofensivo': 'goleiro-ofensivo',
  'Goleiro Defensivo': 'goleiro-defensivo',
  'Atacante Surpresa': 'atacante-surpresa',
  'Defensor Criativo': 'defensor-criativo',
  'Lateral Ofensivo': 'lateral-ofensivo',
  'Lateral Atacante': 'lateral-atacante',
  'Perito em Cruzamento': 'perito-cruzamento',
  'Lateral Defensivo': 'lateral-defensivo',
  'Orquestrador': 'orquestrador',
  '1º Volante': 'primeiro-volante',
  'Meia versátil': 'meia-versatil',
  'Infiltração': 'infiltracao',
  'Clássico 10': 'classico-10',
  'Lateral Móvel': 'lateral-movel',
  'Ala Produtivo': 'ala-produtivo',
  'Armador Criativo': 'armador-criativo',
  'Atacante Pivô': 'atacante-pivo',
  'Pivô': 'pivo',
  'Homem de Área': 'homem-area',
  'Puxa Marcação': 'puxa-marcacao',
  'Artilheiro': 'artilheiro'
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function average(values: Array<number | null | undefined>, fallback = 50) {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!filtered.length) return fallback;
  return clamp(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function roleForPlaystyle(playstyle: CanonicalPlayerPlaystyle | null, position: PositionCode): FormationRoleId | null {
  if (!playstyle) return null;
  if (playstyle === 'Destruidor') return position === 'CB' ? 'zagueiro-destruidor' : 'volante-destruidor';
  return ROLE_BY_STYLE[playstyle] ?? null;
}

function styleActivation(playstyle: string | null | undefined, position: PositionCode): {
  status: StyleActivationR454;
  canonical: CanonicalPlayerPlaystyle | null;
  reason: string;
} {
  const canonical = canonicalizePlayerPlaystyle(playstyle);
  if (!canonical) {
    return { status: 'DESCONHECIDO', canonical: null, reason: 'O estilo não foi reconhecido no catálogo oficial do BuildMaster.' };
  }
  const meta = getPlayerStyleMeta2026(canonical, position);
  if (!meta) {
    return { status: 'DESCONHECIDO', canonical, reason: 'Não há regra de ativação cadastrada para esta combinação.' };
  }
  if (meta.preferredPositions.includes(position)) {
    return { status: 'ATIVO', canonical, reason: `${canonical} ativa em ${POSITION_PT[position]}.` };
  }
  return {
    status: 'INATIVO',
    canonical,
    reason: `${canonical} não ativa em ${POSITION_PT[position]}; a carta pode ser avaliada pelos atributos, mas o estilo deve ser mostrado como inativo.`
  };
}

function functionalScore(result: AnalysisResult, position: PositionCode) {
  const a = result.parsed.attributes ?? {};
  const valuesByPosition: Record<PositionCode, Array<number | null | undefined>> = {
    CF: [a.offensiveAwareness, a.finishing, a.ballControl, a.tightPossession, a.lowPass, a.acceleration, a.balance, a.physicalContact],
    SS: [a.offensiveAwareness, a.ballControl, a.tightPossession, a.lowPass, a.finishing, a.acceleration, a.balance],
    LWF: [a.ballControl, a.dribbling, a.tightPossession, a.speed, a.acceleration, a.finishing, a.lowPass],
    RWF: [a.ballControl, a.dribbling, a.tightPossession, a.speed, a.acceleration, a.finishing, a.lowPass],
    LMF: [a.lowPass, a.ballControl, a.tightPossession, a.speed, a.stamina, a.balance, a.defensiveEngagement],
    RMF: [a.lowPass, a.ballControl, a.tightPossession, a.speed, a.stamina, a.balance, a.defensiveEngagement],
    AMF: [a.offensiveAwareness, a.lowPass, a.ballControl, a.tightPossession, a.dribbling, a.balance, a.finishing],
    CMF: [a.lowPass, a.ballControl, a.tightPossession, a.stamina, a.balance, a.defensiveEngagement, a.offensiveAwareness],
    DMF: [a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.lowPass, a.ballControl, a.physicalContact, a.stamina],
    CB: [a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.speed, a.acceleration, a.physicalContact, a.heading, a.lowPass],
    LB: [a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.lowPass],
    RB: [a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.lowPass],
    GK: [a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach, a.jump]
  };
  return average(valuesByPosition[position], average(Object.values(result.teamMap?.sectorScores ?? {}).map(Number), 50));
}

function positionScore(result: AnalysisResult, target: PositionCode) {
  if (result.parsed.mainPosition === target) return 100;
  if ((result.parsed.positions ?? []).includes(target)) return 96;
  if ((result.permittedPositions ?? []).some((item) => item.code === target)) return 84;
  if (analysisUsagePositionR138(result) === target || result.bestPosition.code === target) return 80;
  return 42;
}

function slotForContext(context: TacticalFitContextR454): { formation: FormationBlueprint | null; slot: FormationSlot | null } {
  const formation = FORMATION_BLUEPRINTS.find((item) => item.id === context.formationId) ?? null;
  if (!formation) return { formation: null, slot: null };
  const slot = context.slotId
    ? formation.slots.find((item) => item.id === context.slotId) ?? null
    : formation.slots.find((item) => item.position === context.targetPosition || item.alternatives.includes(context.targetPosition)) ?? null;
  return { formation, slot };
}

function roleScore(role: FormationRoleId | null, slot: FormationSlot | null) {
  if (!slot || !role) return 66;
  if (slot.primaryRoles.includes(role)) return 100;
  if (slot.complementaryRoles.includes(role)) return 84;
  return 56;
}

function styleContextBonus(style: FormationCoachStyle, role: FormationRoleId | null) {
  if (!role) return 0;
  const preferred: Record<FormationCoachStyle, FormationRoleId[]> = {
    POSSE_DE_BOLA: ['armador-criativo', 'meia-versatil', 'defensor-criativo', 'primeiro-volante', 'orquestrador', 'infiltracao', 'artilheiro'],
    CONTRA_ATAQUE_RAPIDO: ['artilheiro', 'infiltracao', 'meia-versatil', 'primeiro-volante', 'zagueiro-destruidor', 'lateral-defensivo'],
    CONTRA_ATAQUE: ['primeiro-volante', 'lateral-defensivo', 'defensor-criativo', 'artilheiro', 'meia-versatil', 'pivo']
  };
  return preferred[style].includes(role) ? 8 : 0;
}

function partnerSynergy(role: FormationRoleId | null, partners: AnalysisResult[] = []) {
  let score = 72;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const partnerRoles = partners.map((partner) => {
    const position = analysisUsagePositionR138(partner);
    return roleForPlaystyle(canonicalizePlayerPlaystyle(partner.parsed.offensivePlaystyle ?? partner.parsed.playstyle), position);
  }).filter((item): item is FormationRoleId => Boolean(item));

  const has = (candidate: FormationRoleId) => partnerRoles.includes(candidate);
  const count = (candidate: FormationRoleId) => partnerRoles.filter((item) => item === candidate).length;

  if (role === 'armador-criativo' && has('infiltracao')) {
    score += 12;
    reasons.push('Armador Criativo + Infiltração cria complementaridade entre passe e ataque ao espaço.');
  }
  if (role === 'infiltracao' && has('armador-criativo')) {
    score += 12;
    reasons.push('Infiltração recebe suporte de um Armador Criativo próximo.');
  }
  if (role === 'puxa-marcacao' && has('artilheiro')) {
    score += 14;
    reasons.push('Puxa Marcação abre corredor para um Artilheiro atacar a última linha.');
  }
  if (role === 'artilheiro' && has('puxa-marcacao')) {
    score += 14;
    reasons.push('Artilheiro ganha espaço quando o parceiro Puxa Marcação sai da referência.');
  }
  if ((role === 'pivo' || role === 'atacante-pivo') && (has('artilheiro') || has('infiltracao'))) {
    score += 10;
    reasons.push('O apoio do pivô combina com um parceiro que ataca profundidade.');
  }
  if (role === 'armador-criativo' && count('armador-criativo') >= 1) {
    score -= 9;
    warnings.push('Dois Armadores Criativos próximos podem gerar movimentação redundante.');
  }
  if (role === 'zagueiro-destruidor' && count('zagueiro-destruidor') >= 1) {
    score -= 12;
    warnings.push('Evite dois zagueiros Destruidores juntos sem cobertura de um defensor mais posicional.');
  }
  if ((role === 'lateral-ofensivo' || role === 'lateral-atacante') && (has('lateral-ofensivo') || has('lateral-atacante'))) {
    score -= 10;
    warnings.push('Dois laterais de alta projeção aumentam o risco de transição defensiva.');
  }

  return { score: clamp(score), reasons, warnings };
}

function fitLabel(score: number): TacticalFitLabelR454 {
  if (score >= 88) return 'EXCELENTE';
  if (score >= 80) return 'MUITO_BOM';
  if (score >= 70) return 'BOM';
  if (score >= 58) return 'MEDIO';
  return 'FRACO';
}

export function evaluateContextualTacticalFitR454(result: AnalysisResult, context: TacticalFitContextR454): TacticalFitR454 {
  const cardId = cardIdentityFingerprintR126(result.parsed);
  const activation = styleActivation(result.parsed.offensivePlaystyle ?? result.parsed.playstyle, context.targetPosition);
  const role = roleForPlaystyle(activation.canonical, context.targetPosition);
  const { formation, slot } = slotForContext(context);
  const teamStyle = normalizeFormationCoachStyle(context.teamStyle);
  const functionDimension = functionalScore(result, context.targetPosition);
  const positionDimension = positionScore(result, context.targetPosition);
  const roleDimension = roleScore(role, slot);
  const styleDimension = activation.status === 'ATIVO' ? 100 : activation.status === 'INATIVO' ? 52 : 68;
  const synergy = partnerSynergy(role, context.partners);
  const styleBonus = styleContextBonus(teamStyle, role);
  const formationBonus = formation?.idealStyles.map(normalizeFormationCoachStyle).includes(teamStyle) ? 4 : 0;
  const score = clamp(
    functionDimension * 0.30 +
    positionDimension * 0.24 +
    roleDimension * 0.18 +
    styleDimension * 0.10 +
    synergy.score * 0.18 +
    styleBonus +
    formationBonus
  );

  const reasons = [
    `Função avaliada para ${POSITION_PT[context.targetPosition]} dentro de ${formation?.name ?? context.formationId}; GER/OVR não participa deste cálculo.`,
    activation.reason,
    role && slot?.primaryRoles.includes(role)
      ? `${FORMATION_ROLE_CATALOG[role].officialName} é função primária deste slot.`
      : role && slot?.complementaryRoles.includes(role)
        ? `${FORMATION_ROLE_CATALOG[role].officialName} é função complementar deste slot.`
        : role
          ? `${FORMATION_ROLE_CATALOG[role].officialName} exige adaptação neste slot.`
          : 'A função de estilo ainda precisa ser confirmada.',
    ...synergy.reasons
  ];
  const warnings = [...synergy.warnings];
  if (activation.status === 'INATIVO') warnings.push('ESTILO INATIVO NESTA POSIÇÃO');
  if (!formation) warnings.push('Formação não localizada no catálogo atual; o Fit usa somente contexto de posição e carta.');
  if (slot && slot.position !== context.targetPosition && !slot.alternatives.includes(context.targetPosition)) warnings.push('A posição alvo não pertence ao slot selecionado.');

  return {
    version: GAMEPLAY_SCOUTING_R454_VERSION,
    cardId,
    formationId: context.formationId,
    slotId: slot?.id ?? context.slotId ?? null,
    targetPosition: context.targetPosition,
    targetPositionLabel: POSITION_PT[context.targetPosition],
    teamStyle,
    score,
    label: fitLabel(score),
    recommendedRole: role,
    styleActivation: activation.status,
    styleName: activation.canonical,
    dimensions: {
      function: functionDimension,
      position: positionDimension,
      role: roleDimension,
      style: styleDimension,
      synergy: synergy.score
    },
    reasons,
    warnings
  };
}

export function detectGameplayScoutingConflictsR454(sources: GameplayScoutingEvidenceR454[]): GameplayScoutingConflictR454[] {
  const byKey = new Map<string, Array<{ sourceId: string; sourceName: string; value: string }>>();
  for (const source of sources) {
    for (const claim of source.claims ?? []) {
      const key = normalize(claim.key);
      const value = normalize(claim.value);
      if (!key || !value) continue;
      const bucket = byKey.get(key) ?? [];
      bucket.push({ sourceId: source.id, sourceName: source.sourceName, value: claim.value.trim() });
      byKey.set(key, bucket);
    }
  }
  const conflicts: GameplayScoutingConflictR454[] = [];
  for (const [key, values] of byKey) {
    if (new Set(values.map((item) => normalize(item.value))).size > 1) {
      conflicts.push({ key, values, status: 'SOURCE_CONFLICT', decision: 'REVIEW_REQUIRED' });
    }
  }
  return conflicts;
}

function sourceConfidence(sources: GameplayScoutingEvidenceR454[], conflicts: GameplayScoutingConflictR454[]): GameplayScoutingConfidenceR454 {
  const types = new Set(sources.filter((item) => item.type !== 'OFFICIAL').map((item) => item.type));
  if (conflicts.length) return types.size >= 3 ? 'MEDIA' : 'BAIXA';
  if (types.size >= 3) return 'ALTA';
  if (types.size >= 1) return 'MEDIA';
  return 'BAIXA';
}

function scoutingStatus(sources: GameplayScoutingEvidenceR454[], confidence: GameplayScoutingConfidenceR454): GameplayScoutingStatusR454 {
  const external = sources.filter((item) => item.type !== 'OFFICIAL');
  if (!external.length) return 'SCOUTING_PENDENTE';
  if (confidence === 'ALTA' && external.length >= 3) return 'SCOUTING_VALIDADO';
  return 'SCOUTING_PARCIAL';
}

function bestFormationNames(role: FormationRoleId | null, position: PositionCode) {
  if (!role) return [] as string[];
  return FORMATION_BLUEPRINTS
    .filter((formation) => formation.slots.some((slot) =>
      (slot.position === position || slot.alternatives.includes(position)) &&
      (slot.primaryRoles.includes(role) || slot.complementaryRoles.includes(role))
    ))
    .slice(0, 5)
    .map((formation) => formation.name);
}

function roleLabels(role: FormationRoleId | null) {
  if (!role) return { best: [] as string[], acceptable: [] as string[], bad: [] as string[] };
  const meta = FORMATION_ROLE_CATALOG[role];
  return {
    best: [meta.officialName],
    acceptable: unique(FORMATION_BLUEPRINTS.flatMap((formation) => formation.slots)
      .filter((slot) => slot.primaryRoles.includes(role))
      .flatMap((slot) => slot.complementaryRoles)
      .map((id) => FORMATION_ROLE_CATALOG[id].officialName)).slice(0, 4),
    bad: [] as string[]
  };
}

export function buildGameplayScoutingRecordR454(
  result: AnalysisResult,
  sources: GameplayScoutingEvidenceR454[] = [],
  gameVersion = GAMEPLAY_SCOUTING_GAME_VERSION_R454
): GameplayScoutingRecordR454 {
  const card = result.parsed;
  const cardId = cardIdentityFingerprintR126(card);
  const usagePosition = analysisUsagePositionR138(result);
  const canonical = canonicalizePlayerPlaystyle(card.offensivePlaystyle ?? card.playstyle);
  const activation = styleActivation(card.offensivePlaystyle ?? card.playstyle, usagePosition);
  const role = roleForPlaystyle(canonical, usagePosition);
  const officialEvidence: GameplayScoutingEvidenceR454 = {
    id: `official:${cardId}`,
    type: 'OFFICIAL',
    sourceName: 'Dados da carta lida pelo BuildMaster',
    gameVersion,
    observedAt: 'CURRENT_CARD_STATE',
    confidence: card.manualConfirmed ? 'ALTA' : 'MEDIA',
    claims: [
      { key: 'mainPosition', value: card.mainPosition },
      { key: 'playstyle', value: canonical ?? String(card.playstyle ?? '') },
      { key: 'dominantFoot', value: String(card.dominantFoot ?? '') }
    ]
  };
  const allSources = [officialEvidence, ...sources.filter((item) => item.id !== officialEvidence.id)];
  const conflicts = detectGameplayScoutingConflictsR454(allSources);
  const confidence = sourceConfidence(allSources, conflicts);
  const status = scoutingStatus(allSources, confidence);
  const roles = roleLabels(role);
  const styleMeta = canonical ? getPlayerStyleMeta2026(canonical, usagePosition) : null;
  const fullPositions = unique([card.mainPosition, ...(card.positions ?? [])]);
  const permitted = (result.permittedPositions ?? []).map((item) => item.code);
  const partialPositions = unique(permitted.filter((position) => !fullPositions.includes(position)));
  const dates = allSources.map((item) => item.observedAt).filter((value) => /^\d{4}-\d{2}-\d{2}/.test(value)).sort();

  return {
    version: GAMEPLAY_SCOUTING_R454_VERSION,
    cardId,
    playerName: card.playerName,
    playerVersion: card.specialTag || card.cardType || cardId,
    cardType: card.cardType || 'Não informado',
    gameVersion,
    mainPosition: card.mainPosition,
    testedPositions: unique([usagePosition]),
    fullPositions,
    partialPositions,
    activePlaystyle: activation.status === 'ATIVO' ? canonical : null,
    inactivePlaystyles: activation.status === 'INATIVO' && canonical ? [canonical] : [],
    offBallBehaviour: result.cardDna?.behavior.strongestBehaviors?.slice(0, 3) ?? [],
    buildUpBehaviour: result.usageTips?.filter((item) => /passe|sa[ií]da|apoio|constru/i.test(item)).slice(0, 3) ?? [],
    pressResistance: result.strengths?.filter((item) => /equil|controle|condu|press/i.test(item)).slice(0, 3) ?? [],
    passingBehaviour: result.strengths?.filter((item) => /passe|cria|assist/i.test(item)).slice(0, 3) ?? [],
    dribblingBehaviour: result.strengths?.filter((item) => /dribl|controle|condu/i.test(item)).slice(0, 3) ?? [],
    finishingBehaviour: result.strengths?.filter((item) => /final|chute|gol/i.test(item)).slice(0, 3) ?? [],
    defensiveBehaviour: result.strengths?.filter((item) => /defe|intercept|desarm|marca/i.test(item)).slice(0, 3) ?? [],
    transitionBehaviour: result.usageTips?.filter((item) => /transi|aceler|recom|perda/i.test(item)).slice(0, 3) ?? [],
    bodyProfile: [card.height ? `${card.height} cm` : '', card.weight ? `${card.weight} kg` : ''].filter(Boolean),
    height: card.height ?? null,
    dominantFoot: card.dominantFoot ?? null,
    physicalProfile: result.physicalEngine?.summary ? [result.physicalEngine.summary] : [],
    playerIdNotes: [`Card ID conceitual: ${cardId}`, 'A identidade da carta não usa GER/OVR.'],
    animationNotes: [],
    bestRoles: roles.best,
    acceptableRoles: roles.acceptable,
    badRoles: roles.bad,
    bestFormations: bestFormationNames(role, usagePosition),
    badFormations: [],
    bestPartners: role === 'armador-criativo' ? ['Infiltração'] : role === 'artilheiro' ? ['Puxa Marcação', 'Atacante Pivô'] : role === 'puxa-marcacao' ? ['Artilheiro'] : [],
    badPartners: role === 'armador-criativo' ? ['Outro Armador Criativo no mesmo corredor, sem ruptura'] : role === 'zagueiro-destruidor' ? ['Outro ZAG Destruidor sem cobertura'] : [],
    recommendedBuilds: unique([result.buildName, ...(result.buildVariants ?? []).map((item) => item.name)]).filter(Boolean).slice(0, 4),
    recommendedSkills: result.recommendedSkills.slice(0, 5),
    formationSynergies: bestFormationNames(role, usagePosition),
    coachSynergies: [],
    playstyleSynergies: styleMeta ? [styleMeta.advice] : [],
    strengths: result.strengths.slice(0, 6),
    weaknesses: result.weaknesses.slice(0, 6),
    sourceLinks: unique(allSources.map((item) => item.sourceUrl).filter((value): value is string => Boolean(value))),
    sourceTypes: unique(allSources.map((item) => item.type)),
    confidence,
    status,
    conflicts,
    sources: allSources,
    testedByUser: allSources.some((item) => item.type === 'USER_GAMEPLAY'),
    lastReviewed: dates.at(-1) ?? null
  };
}
