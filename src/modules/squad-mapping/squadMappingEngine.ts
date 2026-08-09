import type { AnalysisResult, AttributeKey, PositionCode } from '@/modules/analysis';
import { FORMATION_BLUEPRINTS, type FormationBlueprint, type FormationRoleId, type FormationSlot } from '@/lib/formationRoleEngine';
import {
  canonicalizePlayerPlaystyle,
  getPlayerStyleMeta2026,
  normalizeFormationCoachStyle,
  type FormationCoachStyle
} from '@/lib/efootball2026Playstyles';

export const SQUAD_MAPPING_VERSION = '39.50-mapeamento-total-elenco-1';

export type SquadMappingPlayer = {
  id: string;
  name: string;
  cardLabel: string;
  cardFingerprint: string;
  mainPosition: PositionCode;
  positions: PositionCode[];
  trainedPositions: PositionCode[];
  playstyle: string;
  overall: number | null;
  confidence: number;
  status: 'pronto' | 'revisar';
  portrait: string | null;
  sourceFileName: string;
  sourceHash: string;
  imageRef: string | null;
  imageBytes: number;
  imageStored: boolean;
  attributes: Partial<Record<AttributeKey, number>>;
  positionRatings: Partial<Record<PositionCode, number>>;
  skills: string[];
  impetos: string[];
  height: number | null;
  weight: number | null;
  age: number | null;
  level: number | null;
  physicalModel: Record<string, number>;
  profileCoverage: number;
  linkedHistoryId: string | null;
  locked: boolean;
  excluded: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type SquadMappingPreferences = {
  avoidWingers: boolean;
  avoidWideMidfielders: boolean;
  avoidCrossing: boolean;
  favorCentralTriangles: boolean;
  favorShortPassing: boolean;
  favorDribbling: boolean;
  allowIntelligentAdaptations: boolean;
  prioritizeFullProfiles: boolean;
  benchSize: 11;
  reserveGoalkeepers: 0 | 1;
  coachStyle: FormationCoachStyle;
};

export type MappingAdaptationMode = 'natural' | 'trained' | 'compatible' | 'intelligent' | 'experimental';

export type MappingSlotPick = {
  slot: FormationSlot;
  player: SquadMappingPlayer | null;
  score: number;
  positionFit: number;
  styleFit: number;
  attributeFit: number;
  skillFit: number;
  physicalFit: number;
  adaptationFit: number;
  collectiveFit: number;
  linkedPerformance: number | null;
  adaptationMode: MappingAdaptationMode;
  roleLabel: string;
  reasons: string[];
  warnings: string[];
};

export type MappingBenchPick = {
  player: SquadMappingPlayer;
  score: number;
  coverage: PositionCode[];
  bestRole: string;
  reason: string;
};

export type MappingSubstitutionPlan = {
  scenario: 'vencendo' | 'empatando' | 'perdendo';
  title: string;
  instructions: string[];
  options: Array<{ playerId: string; playerName: string; role: string; reason: string }>;
};

export type MappingFormationResult = {
  formation: FormationBlueprint;
  lineup: MappingSlotPick[];
  bench: MappingBenchPick[];
  globalScore: number;
  lineupAverage: number;
  formationProfileScore: number;
  styleScore: number;
  triangleScore: number;
  coverageScore: number;
  collectiveScore: number;
  adaptedStarters: number;
  warnings: string[];
  strengths: string[];
  substitutions: MappingSubstitutionPlan[];
};

export type FormationTrial = {
  id: string;
  formationId: string;
  formationName: string;
  lineupPlayerIds: string[];
  startedAt: string;
  targetDays: 7 | 14 | 21;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  note: string;
  status: 'ativo' | 'concluido';
  updatedAt: string;
};

export type MappingState = {
  version: string;
  players: SquadMappingPlayer[];
  selectedFormationId: string;
  preferences: SquadMappingPreferences;
  pins: Record<string, string>;
  trials: FormationTrial[];
  updatedAt: string;
};

export const DEFAULT_MAPPING_PREFERENCES: SquadMappingPreferences = {
  avoidWingers: true,
  avoidWideMidfielders: true,
  avoidCrossing: true,
  favorCentralTriangles: true,
  favorShortPassing: true,
  favorDribbling: true,
  allowIntelligentAdaptations: true,
  prioritizeFullProfiles: true,
  benchSize: 11,
  reserveGoalkeepers: 0,
  coachStyle: 'POSSE_DE_BOLA'
};

export function createEmptyMappingState(): MappingState {
  return {
    version: SQUAD_MAPPING_VERSION,
    players: [],
    selectedFormationId: 'AUTO',
    preferences: { ...DEFAULT_MAPPING_PREFERENCES },
    pins: {},
    trials: [],
    updatedAt: new Date().toISOString()
  };
}

const ROLE_BY_STYLE: Partial<Record<string, FormationRoleId>> = {
  'Goleiro Ofensivo': 'goleiro-ofensivo',
  'Goleiro Defensivo': 'goleiro-defensivo',
  'Atacante Surpresa': 'atacante-surpresa',
  'Defensor Criativo': 'defensor-criativo',
  'Destruidor': 'zagueiro-destruidor',
  'Lateral Ofensivo': 'lateral-ofensivo',
  'Lateral Atacante': 'lateral-atacante',
  'Perito em Cruzamento': 'perito-cruzamento',
  'Lateral Defensivo': 'lateral-defensivo',
  'Orquestrador': 'orquestrador',
  '1º Volante': 'primeiro-volante',
  'Primeiro volante': 'primeiro-volante',
  'O destruidor': 'volante-destruidor',
  'Meia versátil': 'meia-versatil',
  'Jogador de infiltração': 'infiltracao',
  'Infiltração': 'infiltracao',
  'Clássico nº 10': 'classico-10',
  'Clássico 10': 'classico-10',
  'Lateral móvel': 'lateral-movel',
  'Lateral Móvel': 'lateral-movel',
  'Ala produtivo': 'ala-produtivo',
  'Ala Produtivo': 'ala-produtivo',
  'Armador criativo': 'armador-criativo',
  'Armador Criativo': 'armador-criativo',
  'Atacante pivô': 'atacante-pivo',
  'Atacante Pivô': 'atacante-pivo',
  'Pivô': 'pivo',
  'Homem de área': 'homem-area',
  'Homem de Área': 'homem-area',
  'Puxa marcação': 'puxa-marcacao',
  'Puxa Marcação': 'puxa-marcacao',
  'Artilheiro': 'artilheiro'
};

const WING = new Set<PositionCode>(['LWF', 'RWF']);
const WIDE_MID = new Set<PositionCode>(['LMF', 'RMF']);
const CENTRAL = new Set<PositionCode>(['DMF', 'CMF', 'AMF', 'SS', 'CF']);
const DEFENSIVE = new Set<PositionCode>(['GK', 'CB', 'LB', 'RB', 'DMF']);
const ATTACKING = new Set<PositionCode>(['AMF', 'SS', 'CF', 'LWF', 'RWF']);
const VERTICAL_STYLES = new Set(['Meia versátil', 'Jogador de infiltração', 'Infiltração', 'O destruidor', 'Destruidor']);
const CONTROL_STYLES = new Set(['Orquestrador', 'Armador criativo', 'Armador Criativo', 'Clássico nº 10', 'Clássico 10', 'Primeiro volante', '1º Volante']);

const ATTRIBUTE_WEIGHTS: Record<PositionCode, Partial<Record<AttributeKey, number>>> = {
  GK: { goalkeeperAwareness: 1.35, goalkeeperReflexes: 1.3, goalkeeperReach: 1.2, goalkeeperParrying: 1.05, goalkeeperCatching: 1, jump: .4 },
  CB: { defensiveAwareness: 1.25, tackling: 1.2, defensiveEngagement: 1.1, aggression: .8, physicalContact: 1, speed: .65, acceleration: .35, jump: .7, heading: .65, lowPass: .35 },
  LB: { defensiveAwareness: .85, tackling: .85, defensiveEngagement: .8, speed: 1, acceleration: .85, stamina: 1.05, lowPass: .55, loftedPass: .65, ballControl: .45, physicalContact: .4 },
  RB: { defensiveAwareness: .85, tackling: .85, defensiveEngagement: .8, speed: 1, acceleration: .85, stamina: 1.05, lowPass: .55, loftedPass: .65, ballControl: .45, physicalContact: .4 },
  DMF: { defensiveAwareness: 1.1, tackling: 1, defensiveEngagement: 1, aggression: .7, lowPass: .85, ballControl: .55, tightPossession: .45, physicalContact: .7, stamina: .9, speed: .35 },
  CMF: { lowPass: 1.05, ballControl: .85, tightPossession: .85, stamina: 1, defensiveEngagement: .55, tackling: .45, dribbling: .55, acceleration: .55, balance: .55, offensiveAwareness: .4 },
  LMF: { lowPass: .75, loftedPass: .65, ballControl: .8, tightPossession: .75, dribbling: .75, speed: .85, acceleration: .8, stamina: .95, defensiveEngagement: .35 },
  RMF: { lowPass: .75, loftedPass: .65, ballControl: .8, tightPossession: .75, dribbling: .75, speed: .85, acceleration: .8, stamina: .95, defensiveEngagement: .35 },
  AMF: { lowPass: 1.05, ballControl: 1, tightPossession: .95, dribbling: .8, offensiveAwareness: .75, acceleration: .65, finishing: .5, balance: .55 },
  LWF: { dribbling: 1, ballControl: .9, tightPossession: .8, speed: 1, acceleration: 1, offensiveAwareness: .75, finishing: .75, lowPass: .45, curl: .4 },
  RWF: { dribbling: 1, ballControl: .9, tightPossession: .8, speed: 1, acceleration: 1, offensiveAwareness: .75, finishing: .75, lowPass: .45, curl: .4 },
  SS: { offensiveAwareness: 1, ballControl: .9, tightPossession: .85, lowPass: .8, dribbling: .7, acceleration: .8, finishing: .8, balance: .55 },
  CF: { offensiveAwareness: 1.2, finishing: 1.2, acceleration: .75, speed: .65, physicalContact: .7, ballControl: .55, heading: .55, jump: .45, kickingPower: .45 }
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizedText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniquePositions(player: SquadMappingPlayer) {
  return Array.from(new Set([player.mainPosition, ...player.positions, ...player.trainedPositions]));
}

function positionLine(position: PositionCode) {
  if (position === 'GK') return 'gk';
  if (['CB', 'LB', 'RB'].includes(position)) return 'defesa';
  if (['DMF', 'CMF', 'LMF', 'RMF'].includes(position)) return 'meio';
  return 'ataque';
}

function attributeValue(player: SquadMappingPlayer, key: AttributeKey) {
  const value = player.attributes[key];
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, 1, 110) : null;
}

function normalizedAttribute(value: number) {
  return clamp(((value - 45) / 55) * 100);
}

function attributeFit(player: SquadMappingPlayer, slot: FormationSlot) {
  const weights = ATTRIBUTE_WEIGHTS[slot.position];
  let sum = 0;
  let total = 0;
  let found = 0;
  for (const [key, weight] of Object.entries(weights) as Array<[AttributeKey, number]>) {
    const value = attributeValue(player, key);
    if (value === null) continue;
    sum += normalizedAttribute(value) * weight;
    total += weight;
    found += 1;
  }
  if (!found || !total) return player.profileCoverage >= 55 ? 45 : 54;
  const coverage = clamp((found / Math.max(1, Object.keys(weights).length)) * 100);
  return Math.round(clamp((sum / total) * .88 + coverage * .12));
}

function skillFit(player: SquadMappingPlayer, slot: FormationSlot) {
  if (!player.skills.length) return 54;
  const skills = player.skills.map(normalizedText);
  const categories: Record<'defense' | 'pass' | 'control' | 'finish' | 'aerial' | 'speed', string[]> = {
    defense: ['interceptacao', 'bloqueador', 'marcacao individual', 'carrinho', 'espirito guerreiro', 'volta para marcar', 'sombra veloz'],
    pass: ['passe de primeira', 'passe em profundidade', 'passe na medida', 'passe de ruptura', 'passe sem olhar', 'cruzamento preciso'],
    control: ['controle de sola', 'duplo contato', 'corte atras e giro', 'giro de 360', 'finta de corpo', 'toque de calcanhar'],
    finish: ['chute de primeira', 'precisao a distancia', 'efeito de longe', 'finalizacao acrobatica', 'chute ascendente', 'chute com o peito do pe', 'foguete rasante'],
    aerial: ['cabecada', 'superioridade aerea', 'finalizacao acrobatica'],
    speed: ['sombra veloz', 'arrancada', 'pique em velocidade']
  };
  const wanted = slot.position === 'GK' || ['CB', 'LB', 'RB', 'DMF'].includes(slot.position)
    ? ['defense', ...(slot.position === 'CB' ? ['aerial'] : ['pass'])]
    : ['CMF', 'LMF', 'RMF', 'AMF'].includes(slot.position)
      ? ['pass', 'control', 'defense']
      : slot.position === 'CF'
        ? ['finish', 'aerial', 'control']
        : ['finish', 'control', 'pass', 'speed'];
  let matches = 0;
  for (const category of wanted) {
    const terms = categories[category as keyof typeof categories];
    if (skills.some((skill) => terms.some((term) => skill.includes(term)))) matches += 1;
  }
  const diversity = new Set(wanted.filter((category) => {
    const terms = categories[category as keyof typeof categories];
    return skills.some((skill) => terms.some((term) => skill.includes(term)));
  })).size;
  return Math.round(clamp(45 + matches * 9 + diversity * 4 + Math.min(8, player.skills.length * .6)));
}

function physicalFit(player: SquadMappingPlayer, slot: FormationSlot) {
  if (slot.position === 'GK') return player.mainPosition === 'GK' ? 80 : 5;
  const speed = attributeValue(player, 'speed') ?? 70;
  const acceleration = attributeValue(player, 'acceleration') ?? 70;
  const stamina = attributeValue(player, 'stamina') ?? 70;
  const contact = attributeValue(player, 'physicalContact') ?? 70;
  const jump = attributeValue(player, 'jump') ?? 70;
  const height = player.height ?? 175;
  if (slot.position === 'CB') {
    const aerial = clamp((height - 160) * 2 + (jump - 60) * .8);
    return Math.round(clamp(contact * .45 + speed * .22 + aerial * .25 + stamina * .08));
  }
  if (slot.position === 'CF') return Math.round(clamp(contact * .3 + acceleration * .28 + speed * .22 + jump * .12 + stamina * .08));
  if (['LB', 'RB', 'LMF', 'RMF'].includes(slot.position)) return Math.round(clamp(speed * .32 + acceleration * .28 + stamina * .3 + contact * .1));
  return Math.round(clamp(acceleration * .28 + speed * .2 + stamina * .32 + contact * .12 + (attributeValue(player, 'balance') ?? 70) * .08));
}

function ratingFit(player: SquadMappingPlayer, position: PositionCode) {
  const rating = player.positionRatings[position];
  if (typeof rating !== 'number') return null;
  return Math.round(clamp(48 + (rating - 70) * 1.55));
}

function crossPositionBase(player: SquadMappingPlayer, slot: FormationSlot, roleAttributes: number) {
  const source = player.mainPosition;
  const target = slot.position;
  const style = canonicalizePlayerPlaystyle(player.playstyle) ?? player.playstyle;
  if (target === 'CB' && ['DMF', 'CMF', 'LB', 'RB'].includes(source)) {
    const defenderStyle = /destruidor|primeiro volante|lateral defensivo|defensor criativo/i.test(style);
    return clamp(48 + roleAttributes * .34 + (defenderStyle ? 12 : 0), 35, 88);
  }
  if (target === 'DMF' && ['CMF', 'CB', 'LB', 'RB'].includes(source)) return clamp(50 + roleAttributes * .32, 40, 88);
  if (target === 'CMF' && ['DMF', 'AMF', 'LMF', 'RMF'].includes(source)) return clamp(54 + roleAttributes * .3, 45, 90);
  if (target === 'AMF' && ['CMF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF'].includes(source)) return clamp(50 + roleAttributes * .32, 40, 88);
  if (target === 'SS' && ['AMF', 'CF', 'LWF', 'RWF', 'LMF', 'RMF'].includes(source)) return clamp(50 + roleAttributes * .34, 40, 90);
  if (target === 'CF' && ['SS', 'LWF', 'RWF', 'AMF'].includes(source)) return clamp(45 + roleAttributes * .33, 35, 84);
  if (['LB', 'RB'].includes(target) && ['LMF', 'RMF', 'CMF', 'DMF', 'CB'].includes(source)) return clamp(42 + roleAttributes * .32, 30, 82);
  if (['LMF', 'RMF'].includes(target) && ['CMF', 'AMF', 'LB', 'RB', 'LWF', 'RWF'].includes(source)) return clamp(48 + roleAttributes * .34, 38, 88);
  if (['LWF', 'RWF'].includes(target) && ['LMF', 'RMF', 'AMF', 'SS', 'CF'].includes(source)) return clamp(45 + roleAttributes * .35, 35, 86);
  if (positionLine(source) === positionLine(target)) return clamp(40 + roleAttributes * .3, 32, 78);
  return clamp(20 + roleAttributes * .24, 18, 60);
}

function positionFit(player: SquadMappingPlayer, slot: FormationSlot, roleAttributes: number) {
  const all = uniquePositions(player);
  if ((player.mainPosition === 'GK') !== (slot.position === 'GK')) return 2;
  const rating = ratingFit(player, slot.position);
  if (player.mainPosition === slot.position) return Math.max(96, rating ?? 0);
  if (player.trainedPositions.includes(slot.position)) return Math.max(92, rating ?? 0);
  if (player.positions.includes(slot.position)) return Math.max(86, rating ?? 0);
  if (slot.alternatives.some((candidate) => all.includes(candidate))) return Math.max(76, rating ?? 0);
  return Math.max(rating ?? 0, crossPositionBase(player, slot, roleAttributes));
}

function styleFit(player: SquadMappingPlayer, slot: FormationSlot) {
  const canonical = canonicalizePlayerPlaystyle(player.playstyle);
  const meta = getPlayerStyleMeta2026(canonical, slot.position);
  let score = meta?.score ?? 50;
  const role = canonical ? ROLE_BY_STYLE[canonical] : ROLE_BY_STYLE[player.playstyle];
  if (role && slot.primaryRoles.includes(role)) score += 15;
  else if (role && slot.complementaryRoles.includes(role)) score += 8;
  if (meta?.preferredPositions.includes(slot.position)) score += 7;
  else if (meta?.usablePositions?.includes(slot.position)) score += 3;
  if (slot.position === 'CB' && /destruidor|defensor criativo|primeiro volante/i.test(canonical ?? player.playstyle)) score += 8;
  if (slot.position === 'DMF' && /primeiro volante|destruidor|orquestrador/i.test(canonical ?? player.playstyle)) score += 7;
  return clamp(score);
}

function linkedResult(player: SquadMappingPlayer, history: Map<string, AnalysisResult>) {
  if (player.linkedHistoryId && history.has(player.linkedHistoryId)) return history.get(player.linkedHistoryId) ?? null;
  const name = player.name.trim().toLocaleLowerCase('pt-BR');
  for (const result of history.values()) {
    if (result.parsed.playerName.trim().toLocaleLowerCase('pt-BR') === name) return result;
  }
  return null;
}

function linkedScore(player: SquadMappingPlayer, slot: FormationSlot, history: Map<string, AnalysisResult>) {
  const result = linkedResult(player, history);
  if (!result) return null;
  const direct = result.positionScores.find((item) => item.code === slot.position)?.score;
  if (typeof direct === 'number') return clamp(direct);
  const alternative = result.positionScores.find((item) => slot.alternatives.includes(item.code))?.score;
  return typeof alternative === 'number' ? clamp(alternative - 4) : clamp(result.bestPosition.score - 12);
}

function preferenceAdjustment(player: SquadMappingPlayer, slot: FormationSlot, preferences: SquadMappingPreferences) {
  let adjustment = player.locked ? 4 : 0;
  const canonical = canonicalizePlayerPlaystyle(player.playstyle);
  if (preferences.avoidWingers && WING.has(slot.position)) adjustment -= 18;
  if (preferences.avoidWideMidfielders && WIDE_MID.has(slot.position)) adjustment -= 17;
  if (preferences.avoidCrossing && canonical === 'Perito em Cruzamento') adjustment -= 8;
  if (preferences.favorCentralTriangles && CENTRAL.has(slot.position)) adjustment += 5;
  if (preferences.favorShortPassing && ['DMF', 'CMF', 'AMF', 'SS'].includes(slot.position)) adjustment += 4;
  if (preferences.favorDribbling && ['AMF', 'SS', 'CF'].includes(slot.position)) adjustment += 2;
  if (preferences.prioritizeFullProfiles && player.profileCoverage >= 70) adjustment += 3;
  return adjustment;
}

function adaptationMode(player: SquadMappingPlayer, slot: FormationSlot, pos: number): MappingAdaptationMode {
  if (player.mainPosition === slot.position) return 'natural';
  if (player.trainedPositions.includes(slot.position)) return 'trained';
  if (player.positions.includes(slot.position) || slot.alternatives.some((position) => uniquePositions(player).includes(position))) return 'compatible';
  if (pos >= 64) return 'intelligent';
  return 'experimental';
}

function roleLabelFor(player: SquadMappingPlayer, slot: FormationSlot, mode: MappingAdaptationMode) {
  const style = canonicalizePlayerPlaystyle(player.playstyle) ?? (player.playstyle || 'perfil da carta');
  const base = slot.position === 'CB' ? 'ZAG' : slot.position === 'DMF' ? 'VOL' : slot.position === 'CMF' ? 'MLG' : slot.position === 'AMF' ? 'MAT' : slot.position === 'SS' ? 'SA' : slot.label;
  const suffix = mode === 'intelligent' ? 'adaptado' : mode === 'experimental' ? 'experimental' : 'funcional';
  return `${base} ${suffix} • ${style}`;
}

export function scoreMappingPlayerForSlot(
  player: SquadMappingPlayer,
  slot: FormationSlot,
  preferences: SquadMappingPreferences,
  history: Map<string, AnalysisResult>
): MappingSlotPick {
  const attributes = attributeFit(player, slot);
  const pos = positionFit(player, slot, attributes);
  const style = styleFit(player, slot);
  const linked = linkedScore(player, slot, history);
  const skills = skillFit(player, slot);
  const physical = physicalFit(player, slot);
  const confidence = clamp(player.confidence || 45);
  // Mantido apenas para compatibilidade histórica dos testes. Overall não entra no resultado.
  const overallTieBreak = player.overall ? clamp((player.overall - 80) * 0.12, 0, 4) : 0;
  void overallTieBreak;
  const detailReliability = player.profileCoverage >= 70 ? 1 : player.profileCoverage >= 45 ? .82 : .65;
  const base = linked === null
    ? pos * .25 + style * .16 + attributes * (.31 * detailReliability) + skills * .1 + physical * .08 + confidence * .06
    : pos * .18 + style * .13 + attributes * (.23 * detailReliability) + skills * .08 + physical * .06 + linked * .27 + confidence * .05;
  const score = Math.round(clamp(base + preferenceAdjustment(player, slot, preferences)));
  const adaptation = Math.round(clamp(pos * .42 + attributes * .34 + style * .16 + physical * .08));
  const mode = adaptationMode(player, slot, pos);
  const reasons: string[] = [];
  const warnings: string[] = [];
  if (mode === 'natural') reasons.push('Posição natural da carta.');
  if (mode === 'trained') reasons.push('Posição treinada e confirmada.');
  if (mode === 'compatible') reasons.push('Posição já compatível com a carta.');
  if (mode === 'intelligent') reasons.push('Adaptação inteligente aprovada por atributos, estilo e função.');
  if (mode === 'experimental') warnings.push('Adaptação experimental: teste antes de aplicar treino de posição.');
  if (attributes >= 75) reasons.push(`Atributos funcionais fortes para ${slot.label} (${attributes}/100).`);
  else if (attributes < 50 && player.profileCoverage >= 45) warnings.push(`Atributos abaixo do ideal para ${slot.label}.`);
  if (style >= 82) reasons.push(`O estilo ${player.playstyle || 'da carta'} combina com a função.`);
  else if (style < 48) warnings.push(`O estilo ${player.playstyle || 'não confirmado'} pode se comportar diferente nesta função.`);
  if (linked !== null) reasons.push(`Ficha completa vinculada: ${linked}/100 nesta posição.`);
  if (player.profileCoverage >= 70) reasons.push('Perfil completo do print usado no cálculo.');
  if (player.status === 'revisar') warnings.push('Leitura marcada para revisão; confirme os dados antes da escalação definitiva.');
  if (player.locked) reasons.push('Jogador marcado como prioridade pelo usuário.');
  return {
    slot,
    player,
    score,
    positionFit: Math.round(pos),
    styleFit: Math.round(style),
    attributeFit: attributes,
    skillFit: skills,
    physicalFit: physical,
    adaptationFit: adaptation,
    collectiveFit: 50,
    linkedPerformance: linked,
    adaptationMode: mode,
    roleLabel: roleLabelFor(player, slot, mode),
    reasons,
    warnings
  };
}

function emptyPick(slot: FormationSlot, warning = 'Nenhum jogador compatível cadastrado.'): MappingSlotPick {
  return {
    slot,
    player: null,
    score: 0,
    positionFit: 0,
    styleFit: 0,
    attributeFit: 0,
    skillFit: 0,
    physicalFit: 0,
    adaptationFit: 0,
    collectiveFit: 0,
    linkedPerformance: null,
    adaptationMode: 'experimental',
    roleLabel: slot.duty,
    reasons: [],
    warnings: [warning]
  };
}

function formationProfileScore(formation: FormationBlueprint, preferences: SquadMappingPreferences) {
  let score = 74;
  const wingerCount = formation.slots.filter((slot) => WING.has(slot.position)).length;
  const wideMidCount = formation.slots.filter((slot) => WIDE_MID.has(slot.position)).length;
  const centralCount = formation.slots.filter((slot) => CENTRAL.has(slot.position)).length;
  if (preferences.avoidWingers) score -= wingerCount * 14;
  if (preferences.avoidWideMidfielders) score -= wideMidCount * 12;
  if (preferences.favorCentralTriangles) score += Math.min(18, centralCount * 3);
  if (preferences.avoidCrossing && /cruz|corredor|amplitude/i.test(`${formation.description} ${formation.behavior}`)) score -= 6;
  if (!wingerCount && !wideMidCount) score += 10;
  return clamp(Math.round(score));
}

function triangleScore(formation: FormationBlueprint) {
  const central = formation.slots.filter((slot) => CENTRAL.has(slot.position));
  let closePairs = 0;
  for (let index = 0; index < central.length; index += 1) {
    for (let other = index + 1; other < central.length; other += 1) {
      const dx = central[index].x - central[other].x;
      const dy = central[index].y - central[other].y;
      if (Math.hypot(dx, dy) <= 31) closePairs += 1;
    }
  }
  return clamp(48 + closePairs * 6 + Math.max(0, central.length - 3) * 4);
}

function coachStyleScore(formation: FormationBlueprint, coachStyle: FormationCoachStyle) {
  return formation.idealStyles.includes(normalizeFormationCoachStyle(coachStyle)) ? 96 : 66;
}

function isVertical(player: SquadMappingPlayer) {
  const style = canonicalizePlayerPlaystyle(player.playstyle) ?? player.playstyle;
  return VERTICAL_STYLES.has(style);
}

function isController(player: SquadMappingPlayer) {
  const style = canonicalizePlayerPlaystyle(player.playstyle) ?? player.playstyle;
  return CONTROL_STYLES.has(style);
}

function pairAdjustment(existing: MappingSlotPick[], candidate: MappingSlotPick) {
  if (!candidate.player) return 0;
  let delta = 0;
  const style = canonicalizePlayerPlaystyle(candidate.player.playstyle) ?? candidate.player.playstyle;
  for (const pick of existing) {
    if (!pick.player) continue;
    const otherStyle = canonicalizePlayerPlaystyle(pick.player.playstyle) ?? pick.player.playstyle;
    if (candidate.slot.position === 'CB' && pick.slot.position === 'CB') {
      if (/destruidor/i.test(style) && /destruidor/i.test(otherStyle)) delta -= 12;
      if ((/defensor criativo/i.test(style) && /destruidor/i.test(otherStyle)) || (/destruidor/i.test(style) && /defensor criativo/i.test(otherStyle))) delta += 5;
    }
    if (['LB', 'RB'].includes(candidate.slot.position) && ['LB', 'RB'].includes(pick.slot.position)) {
      if (/lateral ofensivo|lateral atacante/i.test(style) && /lateral ofensivo|lateral atacante/i.test(otherStyle)) delta -= 9;
      if (/lateral defensivo/i.test(style) || /lateral defensivo/i.test(otherStyle)) delta += 3;
    }
    const bothCentral = ['DMF', 'CMF', 'AMF', 'SS'].includes(candidate.slot.position) && ['DMF', 'CMF', 'AMF', 'SS'].includes(pick.slot.position);
    if (bothCentral && isVertical(candidate.player) && isVertical(pick.player) && Math.abs(candidate.slot.x - pick.slot.x) < 28) delta -= 7;
    if (bothCentral && ((isController(candidate.player) && isVertical(pick.player)) || (isVertical(candidate.player) && isController(pick.player)))) delta += 3;
    if (candidate.slot.position === 'DMF' && /primeiro volante|1º volante/i.test(style) && ['CMF', 'AMF', 'SS'].includes(pick.slot.position)) delta += 3;
    if (pick.slot.position === 'DMF' && /primeiro volante|1º volante/i.test(otherStyle) && ['CMF', 'AMF', 'SS'].includes(candidate.slot.position)) delta += 3;
  }
  return delta;
}

type BeamState = { picks: MappingSlotPick[]; used: Set<string>; total: number };

function buildLineup(
  formation: FormationBlueprint,
  players: SquadMappingPlayer[],
  preferences: SquadMappingPreferences,
  pins: Record<string, string>,
  history: Map<string, AnalysisResult>
) {
  const eligible = players.filter((player) => !player.excluded);
  const pinnedPicks: MappingSlotPick[] = [];
  const pinnedUsed = new Set<string>();
  for (const slot of formation.slots) {
    const playerId = pins[slot.id];
    if (!playerId) continue;
    const player = eligible.find((item) => item.id === playerId && !pinnedUsed.has(item.id));
    if (!player) continue;
    const pick = scoreMappingPlayerForSlot(player, slot, preferences, history);
    pick.reasons.unshift('Jogador fixado manualmente nesta posição.');
    pinnedPicks.push(pick);
    pinnedUsed.add(player.id);
  }
  const remainingSlots = formation.slots
    .filter((slot) => !pinnedPicks.some((pick) => pick.slot.id === slot.id))
    .map((slot) => ({
      slot,
      candidates: eligible
        .filter((player) => !pinnedUsed.has(player.id))
        .map((player) => scoreMappingPlayerForSlot(player, slot, preferences, history))
        .filter((pick) => preferences.allowIntelligentAdaptations ? pick.score >= 18 : pick.adaptationMode !== 'intelligent' && pick.adaptationMode !== 'experimental')
        .sort((left, right) => right.score - left.score || right.adaptationFit - left.adaptationFit || (left.player?.name ?? '').localeCompare(right.player?.name ?? ''))
        .slice(0, 16)
    }))
    .sort((left, right) => {
      const leftViable = left.candidates.filter((pick) => pick.score >= 55).length;
      const rightViable = right.candidates.filter((pick) => pick.score >= 55).length;
      return leftViable - rightViable || (left.slot.position === 'GK' ? -1 : right.slot.position === 'GK' ? 1 : 0);
    });

  let beam: BeamState[] = [{ picks: [...pinnedPicks], used: new Set(pinnedUsed), total: pinnedPicks.reduce((sum, pick) => sum + pick.score, 0) }];
  for (const entry of remainingSlots) {
    const next: BeamState[] = [];
    const candidates = entry.candidates.length ? entry.candidates : [emptyPick(entry.slot)];
    for (const state of beam) {
      let added = false;
      for (const candidate of candidates) {
        if (candidate.player && state.used.has(candidate.player.id)) continue;
        if (candidate.player && candidate.adaptationMode === 'experimental' && candidate.score < 38) continue;
        const synergy = pairAdjustment(state.picks, candidate);
        const pick = { ...candidate, collectiveFit: Math.round(clamp(50 + synergy * 3)) };
        const used = new Set(state.used);
        if (pick.player) used.add(pick.player.id);
        next.push({ picks: [...state.picks, pick], used, total: state.total + pick.score + synergy });
        added = true;
      }
      if (!added) next.push({ picks: [...state.picks, emptyPick(entry.slot)], used: new Set(state.used), total: state.total - 20 });
    }
    beam = next
      .sort((left, right) => right.total - left.total || left.picks.map((pick) => pick.player?.id ?? '~').join('|').localeCompare(right.picks.map((pick) => pick.player?.id ?? '~').join('|')))
      .slice(0, 96);
  }
  const winner = beam[0]?.picks ?? [];
  return formation.slots.map((slot) => winner.find((pick) => pick.slot.id === slot.id) ?? emptyPick(slot, 'Posição sem jogador.'));
}

function buildBench(players: SquadMappingPlayer[], lineup: MappingSlotPick[], preferences: SquadMappingPreferences, history: Map<string, AnalysisResult>) {
  const used = new Set(lineup.flatMap((pick) => pick.player ? [pick.player.id] : []));
  const hasStartingGoalkeeper = lineup.some((pick) => Boolean(pick.player) && pick.slot.position === 'GK');
  const candidates = players
    .filter((player) => !player.excluded && !used.has(player.id))
    .map((player): MappingBenchPick => {
      const possibleSlots = lineup.map((pick) => scoreMappingPlayerForSlot(player, pick.slot, preferences, history)).sort((left, right) => right.score - left.score);
      const best = possibleSlots[0];
      const coverage = possibleSlots.filter((pick) => pick.score >= 62).map((pick) => pick.slot.position).filter((value, index, all) => all.indexOf(value) === index).slice(0, 6);
      const versatility = Math.min(15, Math.max(0, coverage.length - 1) * 3);
      const profileBonus = player.profileCoverage >= 70 ? 3 : 0;
      return {
        player,
        score: clamp(Math.round((best?.score ?? 25) + versatility + profileBonus)),
        coverage,
        bestRole: best?.roleLabel ?? player.mainPosition,
        reason: coverage.length >= 3 ? 'Cobre vários setores por capacidade real e facilita substituições sem desmontar a formação.' : `Melhor opção disponível para ${best?.slot.label ?? player.mainPosition}.`
      };
    })
    .sort((left, right) => right.score - left.score || left.player.name.localeCompare(right.player.name));
  const goalkeeperLimit = hasStartingGoalkeeper ? preferences.reserveGoalkeepers : 1;
  const bench: MappingBenchPick[] = [];
  let goalkeepers = 0;
  for (const candidate of candidates) {
    if (candidate.player.mainPosition === 'GK') {
      if (goalkeepers >= goalkeeperLimit) continue;
      goalkeepers += 1;
    }
    bench.push(candidate);
    if (bench.length >= preferences.benchSize) break;
  }
  return bench;
}

function substitutionPlans(bench: MappingBenchPick[]): MappingSubstitutionPlan[] {
  const defensive = bench.filter((pick) => pick.coverage.some((position) => DEFENSIVE.has(position))).slice(0, 3);
  const balanced = bench.filter((pick) => pick.coverage.some((position) => ['DMF', 'CMF', 'AMF', 'SS'].includes(position))).slice(0, 3);
  const attacking = bench.filter((pick) => pick.coverage.some((position) => ATTACKING.has(position))).slice(0, 3);
  const options = (list: MappingBenchPick[], reason: string) => list.map((pick) => ({ playerId: pick.player.id, playerName: pick.player.name, role: pick.bestRole, reason }));
  return [
    { scenario: 'vencendo', title: 'Fechar o centro sem perder a saída', instructions: ['Preserve o 1º Volante e aumente a cobertura.', 'Troque primeiro quem estiver cansado nos setores centrais.'], options: options(defensive, 'Aumenta proteção, fôlego e cobertura defensiva.') },
    { scenario: 'empatando', title: 'Renovar tabelas e condução', instructions: ['Mantenha os triângulos próximos.', 'Renove MAT, SA ou MLG antes de mudar toda a estrutura.'], options: options(balanced, 'Mantém o desenho e adiciona energia para criar.') },
    { scenario: 'perdendo', title: 'Aumentar presença entre linhas', instructions: ['Coloque condução e infiltração perto dos atacantes.', 'Evite abrir pontas quando a proposta continuar central.'], options: options(attacking, 'Melhora criação, ruptura e finalização pelo centro.') }
  ];
}

function collectiveScoreFor(lineup: MappingSlotPick[]) {
  const filled = lineup.filter((pick) => pick.player);
  if (!filled.length) return 0;
  let score = 72;
  const destroyerCbs = filled.filter((pick) => pick.slot.position === 'CB' && /destruidor/i.test(pick.player?.playstyle ?? '')).length;
  const attackingFullbacks = filled.filter((pick) => ['LB', 'RB'].includes(pick.slot.position) && /lateral ofensivo|lateral atacante/i.test(pick.player?.playstyle ?? '')).length;
  const centralVertical = filled.filter((pick) => ['DMF', 'CMF', 'AMF', 'SS'].includes(pick.slot.position) && pick.player && isVertical(pick.player)).length;
  const controllers = filled.filter((pick) => ['DMF', 'CMF', 'AMF', 'SS'].includes(pick.slot.position) && pick.player && isController(pick.player)).length;
  if (destroyerCbs > 1) score -= 12;
  if (attackingFullbacks > 1) score -= 9;
  if (centralVertical > 3) score -= (centralVertical - 3) * 7;
  if (controllers >= 1 && centralVertical >= 1) score += 8;
  if (filled.some((pick) => pick.slot.position === 'DMF' && /primeiro volante|1º volante/i.test(pick.player?.playstyle ?? ''))) score += 7;
  const experimental = filled.filter((pick) => pick.adaptationMode === 'experimental').length;
  score -= experimental * 6;
  return Math.round(clamp(score));
}

export function buildFormationResult(
  formation: FormationBlueprint,
  players: SquadMappingPlayer[],
  preferences: SquadMappingPreferences,
  pins: Record<string, string>,
  history: Map<string, AnalysisResult>
): MappingFormationResult {
  const lineup = buildLineup(formation, players, preferences, pins, history);
  const filled = lineup.filter((pick) => pick.player);
  const lineupAverage = filled.length ? Math.round(filled.reduce((sum, pick) => sum + pick.score, 0) / filled.length) : 0;
  const coverageScore = Math.round((filled.length / Math.max(1, formation.slots.length)) * 100);
  const profile = formationProfileScore(formation, preferences);
  const triangles = triangleScore(formation);
  const style = coachStyleScore(formation, preferences.coachStyle);
  const collectiveScore = collectiveScoreFor(lineup);
  const adaptedStarters = filled.filter((pick) => pick.adaptationMode === 'intelligent' || pick.adaptationMode === 'experimental').length;
  const globalScore = Math.round(clamp(lineupAverage * .46 + profile * .16 + triangles * .1 + style * .07 + coverageScore * .06 + collectiveScore * .15));
  const bench = buildBench(players, lineup, preferences, history);
  const warnings: string[] = [];
  const strengths: string[] = [];
  if (coverageScore < 100) warnings.push(`Faltam jogadores compatíveis para ${formation.slots.length - filled.length} posição(ões).`);
  if (formation.slots.some((slot) => WING.has(slot.position)) && preferences.avoidWingers) warnings.push('A formação usa PE/PD e perde pontos no seu perfil central.');
  if (formation.slots.some((slot) => WIDE_MID.has(slot.position)) && preferences.avoidWideMidfielders) warnings.push('A formação depende de ME/MD e não é prioridade no seu perfil.');
  if (adaptedStarters > 3) warnings.push('A escalação depende de muitas adaptações; confirme os treinos de posição antes de aplicar recursos.');
  if (collectiveScore < 60) warnings.push('Há conflito de movimentação entre estilos; veja as justificativas de cada setor.');
  if (!formation.slots.some((slot) => WING.has(slot.position)) && !formation.slots.some((slot) => WIDE_MID.has(slot.position))) strengths.push('Estrutura central sem PE, PD, ME ou MD.');
  if (triangles >= 75) strengths.push('Boa rede de triângulos para passe curto e tabelas.');
  if (style >= 90) strengths.push('Compatível com o estilo de técnico selecionado.');
  if (lineupAverage >= 80) strengths.push('Titulares com encaixe forte por carta, função e atributos.');
  if (collectiveScore >= 80) strengths.push('Estilos complementares sem sobreposição grave de movimento.');
  return { formation, lineup, bench, globalScore, lineupAverage, formationProfileScore: profile, styleScore: style, triangleScore: triangles, coverageScore, collectiveScore, adaptedStarters, warnings, strengths, substitutions: substitutionPlans(bench) };
}

export function buildFormationRanking(
  players: SquadMappingPlayer[],
  preferences: SquadMappingPreferences,
  pins: Record<string, string>,
  history: Map<string, AnalysisResult>
) {
  return FORMATION_BLUEPRINTS
    .map((formation) => buildFormationResult(formation, players, preferences, pins, history))
    .sort((left, right) => right.globalScore - left.globalScore || right.collectiveScore - left.collectiveScore || left.formation.name.localeCompare(right.formation.name));
}

export function suggestedTrainingPositions(player: SquadMappingPlayer, ranking: MappingFormationResult[]) {
  const current = new Set(uniquePositions(player));
  const suggestions = new Map<PositionCode, { score: number; formation: string; reason: string }>();
  for (const result of ranking.slice(0, 12)) {
    for (const slot of result.formation.slots) {
      if (current.has(slot.position) || (player.mainPosition === 'GK') !== (slot.position === 'GK')) continue;
      const pick = scoreMappingPlayerForSlot({ ...player, trainedPositions: [...player.trainedPositions, slot.position] }, slot, DEFAULT_MAPPING_PREFERENCES, new Map());
      if (pick.adaptationFit < 62 || pick.score < 56) continue;
      const previous = suggestions.get(slot.position);
      if (!previous || pick.score > previous.score) suggestions.set(slot.position, { score: pick.score, formation: result.formation.name, reason: `${pick.roleLabel}. Pode render após treino de posição porque os atributos e o estilo atingiram ${pick.adaptationFit}/100 de adaptação.` });
    }
  }
  return Array.from(suggestions.entries()).map(([position, value]) => ({ position, ...value })).sort((left, right) => right.score - left.score).slice(0, 6);
}

export function createMappingCardFingerprint(input: Pick<SquadMappingPlayer, 'name' | 'cardLabel' | 'mainPosition' | 'playstyle' | 'level' | 'attributes' | 'skills'>) {
  const attributeSignature = Object.entries(input.attributes).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${value}`).join('|');
  const source = [normalizedText(input.name), normalizedText(input.cardLabel), input.mainPosition, normalizedText(input.playstyle), input.level ?? '', attributeSignature, [...input.skills].map(normalizedText).sort().join('|')].join('::');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `map-card-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function mergeMappingPlayer(existing: SquadMappingPlayer[], incoming: SquadMappingPlayer) {
  const name = incoming.name.trim().toLocaleLowerCase('pt-BR');
  const duplicate = existing.find((player) => {
    if (incoming.sourceHash && player.sourceHash && player.sourceHash === incoming.sourceHash) return true;
    if (incoming.cardFingerprint && player.cardFingerprint && player.cardFingerprint === incoming.cardFingerprint) return true;
    return Boolean(incoming.sourceFileName)
      && player.sourceFileName === incoming.sourceFileName
      && player.name.trim().toLocaleLowerCase('pt-BR') === name
      && player.mainPosition === incoming.mainPosition
      && canonicalizePlayerPlaystyle(player.playstyle) === canonicalizePlayerPlaystyle(incoming.playstyle);
  });
  if (!duplicate) return { players: [incoming, ...existing], action: 'created' as const, player: incoming };
  const merged: SquadMappingPlayer = {
    ...duplicate,
    ...incoming,
    id: duplicate.id,
    positions: Array.from(new Set([...duplicate.positions, ...incoming.positions])),
    trainedPositions: Array.from(new Set([...duplicate.trainedPositions, ...incoming.trainedPositions])),
    skills: Array.from(new Set([...duplicate.skills, ...incoming.skills])),
    impetos: Array.from(new Set([...duplicate.impetos, ...incoming.impetos])),
    attributes: { ...duplicate.attributes, ...incoming.attributes },
    positionRatings: { ...duplicate.positionRatings, ...incoming.positionRatings },
    physicalModel: { ...duplicate.physicalModel, ...incoming.physicalModel },
    portrait: incoming.portrait || duplicate.portrait,
    imageRef: incoming.imageRef || duplicate.imageRef,
    imageBytes: incoming.imageBytes || duplicate.imageBytes,
    imageStored: incoming.imageStored || duplicate.imageStored,
    linkedHistoryId: incoming.linkedHistoryId || duplicate.linkedHistoryId,
    locked: duplicate.locked,
    excluded: duplicate.excluded,
    createdAt: duplicate.createdAt,
    updatedAt: new Date().toISOString()
  };
  return { players: [merged, ...existing.filter((player) => player.id !== duplicate.id)], action: 'updated' as const, player: merged };
}

export function createFormationTrial(result: MappingFormationResult, targetDays: 7 | 14 | 21): FormationTrial {
  const now = new Date().toISOString();
  return { id: `trial-${Date.now()}-${result.formation.id}`, formationId: result.formation.id, formationName: result.formation.name, lineupPlayerIds: result.lineup.flatMap((pick) => pick.player ? [pick.player.id] : []), startedAt: now, targetDays, matches: 0, wins: 0, draws: 0, losses: 0, note: '', status: 'ativo', updatedAt: now };
}

export function trialProgress(trial: FormationTrial, now = Date.now()) {
  const started = Date.parse(trial.startedAt);
  const elapsedDays = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 86_400_000)) : 0;
  return { elapsedDays, remainingDays: Math.max(0, trial.targetDays - elapsedDays), percentage: clamp(Math.round((elapsedDays / trial.targetDays) * 100)) };
}
