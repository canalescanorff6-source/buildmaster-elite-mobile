import type { AnalysisResult, PositionCode } from '@/modules/analysis';
import { FORMATION_BLUEPRINTS, type FormationBlueprint, type FormationRoleId, type FormationSlot } from '@/lib/formationRoleEngine';
import {
  canonicalizePlayerPlaystyle,
  getPlayerStyleMeta2026,
  normalizeFormationCoachStyle,
  type FormationCoachStyle
} from '@/lib/efootball2026Playstyles';

export const SQUAD_MAPPING_VERSION = '38.40-mapeamento-elenco-1';

export type SquadMappingPlayer = {
  id: string;
  name: string;
  cardLabel: string;
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
  benchSize: 11;
  reserveGoalkeepers: 0 | 1;
  coachStyle: FormationCoachStyle;
};

export type MappingSlotPick = {
  slot: FormationSlot;
  player: SquadMappingPlayer | null;
  score: number;
  positionFit: number;
  styleFit: number;
  linkedPerformance: number | null;
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

const WING = new Set<PositionCode>(['LWF', 'RWF']);
const WIDE_MID = new Set<PositionCode>(['LMF', 'RMF']);
const CENTRAL = new Set<PositionCode>(['DMF', 'CMF', 'AMF', 'SS', 'CF']);
const DEFENSIVE = new Set<PositionCode>(['GK', 'CB', 'LB', 'RB', 'DMF']);
const ATTACKING = new Set<PositionCode>(['AMF', 'SS', 'CF', 'LWF', 'RWF']);

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
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

function positionFit(player: SquadMappingPlayer, slot: FormationSlot) {
  const all = uniquePositions(player);
  if ((player.mainPosition === 'GK') !== (slot.position === 'GK')) return 2;
  if (player.mainPosition === slot.position) return 100;
  if (player.trainedPositions.includes(slot.position)) return 96;
  if (player.positions.includes(slot.position)) return 90;
  if (slot.alternatives.some((candidate) => all.includes(candidate))) return 80;
  if (slot.position === 'SS' && ['LWF', 'RWF', 'AMF', 'CF'].some((candidate) => all.includes(candidate as PositionCode))) return 68;
  if (slot.position === 'AMF' && ['SS', 'CMF', 'LWF', 'RWF'].some((candidate) => all.includes(candidate as PositionCode))) return 65;
  if (slot.position === 'CF' && ['SS', 'LWF', 'RWF'].some((candidate) => all.includes(candidate as PositionCode))) return 60;
  if (slot.position === 'DMF' && ['CMF', 'CB'].some((candidate) => all.includes(candidate as PositionCode))) return 62;
  if (slot.position === 'CMF' && ['DMF', 'AMF', 'LMF', 'RMF'].some((candidate) => all.includes(candidate as PositionCode))) return 62;
  if (positionLine(player.mainPosition) === positionLine(slot.position)) return 48;
  return 20;
}

function styleFit(player: SquadMappingPlayer, slot: FormationSlot) {
  const canonical = canonicalizePlayerPlaystyle(player.playstyle);
  const meta = getPlayerStyleMeta2026(canonical, slot.position);
  let score = meta?.score ?? 50;
  const role = canonical ? ROLE_BY_STYLE[canonical] : undefined;
  if (role && slot.primaryRoles.includes(role)) score += 15;
  else if (role && slot.complementaryRoles.includes(role)) score += 8;
  if (meta?.preferredPositions.includes(slot.position)) score += 7;
  else if (meta?.usablePositions?.includes(slot.position)) score += 3;
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
  return adjustment;
}

export function scoreMappingPlayerForSlot(
  player: SquadMappingPlayer,
  slot: FormationSlot,
  preferences: SquadMappingPreferences,
  history: Map<string, AnalysisResult>
): MappingSlotPick {
  const pos = positionFit(player, slot);
  const style = styleFit(player, slot);
  const linked = linkedScore(player, slot, history);
  const confidence = clamp(player.confidence || 45);
  const overallTieBreak = player.overall ? clamp((player.overall - 80) * 0.12, 0, 4) : 0;
  const base = linked === null
    ? pos * 0.58 + style * 0.27 + confidence * 0.1 + overallTieBreak
    : pos * 0.35 + style * 0.2 + linked * 0.36 + confidence * 0.06 + overallTieBreak;
  const score = Math.round(clamp(base + preferenceAdjustment(player, slot, preferences)));
  const reasons: string[] = [];
  const warnings: string[] = [];
  if (pos >= 90) reasons.push(player.trainedPositions.includes(slot.position) ? 'Posição treinada e compatível.' : 'Posição natural da carta.');
  else if (pos >= 65) reasons.push('Adaptação posicional viável para esta função.');
  else warnings.push('Precisa de adaptação ou não possui encaixe natural completo.');
  if (style >= 82) reasons.push(`O estilo ${player.playstyle || 'da carta'} combina com a função.`);
  else if (style < 50) warnings.push(`O estilo ${player.playstyle || 'não confirmado'} tem encaixe baixo neste setor.`);
  if (linked !== null) reasons.push(`Ficha completa vinculada: ${linked}/100 nesta posição.`);
  if (player.status === 'revisar') warnings.push('Leitura marcada para revisão; confirme os dados antes da escalação definitiva.');
  if (player.locked) reasons.push('Jogador marcado como prioridade pelo usuário.');
  return { slot, player, score, positionFit: pos, styleFit: style, linkedPerformance: linked, reasons, warnings };
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

function violatesCombination(lineup: MappingSlotPick[], candidate: MappingSlotPick) {
  if (!candidate.player) return false;
  const canonical = canonicalizePlayerPlaystyle(candidate.player.playstyle);
  if (candidate.slot.position === 'CB' && canonical === 'Destruidor') {
    return lineup.some((pick) => pick.player && pick.slot.position === 'CB' && canonicalizePlayerPlaystyle(pick.player.playstyle) === 'Destruidor');
  }
  if (['LB', 'RB'].includes(candidate.slot.position) && ['Lateral Ofensivo', 'Lateral Atacante'].includes(canonical ?? '')) {
    return lineup.some((pick) => pick.player && ['LB', 'RB'].includes(pick.slot.position) && ['Lateral Ofensivo', 'Lateral Atacante'].includes(canonicalizePlayerPlaystyle(pick.player.playstyle) ?? ''));
  }
  return false;
}

function buildLineup(
  formation: FormationBlueprint,
  players: SquadMappingPlayer[],
  preferences: SquadMappingPreferences,
  pins: Record<string, string>,
  history: Map<string, AnalysisResult>
) {
  const eligible = players.filter((player) => !player.excluded);
  const used = new Set<string>();
  const lineup: MappingSlotPick[] = [];
  const orderedSlots = [...formation.slots].sort((left, right) => {
    const leftPin = pins[left.id] ? 1 : 0;
    const rightPin = pins[right.id] ? 1 : 0;
    return rightPin - leftPin || (left.position === 'GK' ? -1 : right.position === 'GK' ? 1 : 0);
  });
  for (const slot of orderedSlots) {
    const pinned = pins[slot.id] ? eligible.find((player) => player.id === pins[slot.id] && !used.has(player.id)) : null;
    if (pinned) {
      const pick = scoreMappingPlayerForSlot(pinned, slot, preferences, history);
      pick.reasons.unshift('Jogador fixado manualmente nesta posição.');
      lineup.push(pick);
      used.add(pinned.id);
      continue;
    }
    const candidates = eligible
      .filter((player) => !used.has(player.id))
      .map((player) => scoreMappingPlayerForSlot(player, slot, preferences, history))
      .sort((left, right) => right.score - left.score);
    const choice = candidates.find((candidate) => !violatesCombination(lineup, candidate)) ?? candidates[0] ?? null;
    if (!choice || choice.score < 20) lineup.push({ slot, player: null, score: 0, positionFit: 0, styleFit: 0, linkedPerformance: null, reasons: [], warnings: ['Nenhum jogador compatível cadastrado.'] });
    else { lineup.push(choice); used.add(choice.player!.id); }
  }
  return formation.slots.map((slot) => lineup.find((pick) => pick.slot.id === slot.id) ?? { slot, player: null, score: 0, positionFit: 0, styleFit: 0, linkedPerformance: null, reasons: [], warnings: ['Posição sem jogador.'] });
}

function buildBench(players: SquadMappingPlayer[], lineup: MappingSlotPick[], preferences: SquadMappingPreferences, history: Map<string, AnalysisResult>) {
  const used = new Set(lineup.flatMap((pick) => pick.player ? [pick.player.id] : []));
  const hasStartingGoalkeeper = lineup.some((pick) => Boolean(pick.player) && pick.slot.position === 'GK');
  const candidates = players
    .filter((player) => !player.excluded && !used.has(player.id))
    .map((player): MappingBenchPick => {
      const possibleSlots = lineup.map((pick) => scoreMappingPlayerForSlot(player, pick.slot, preferences, history)).sort((left, right) => right.score - left.score);
      const best = possibleSlots[0];
      const coverage = possibleSlots.filter((pick) => pick.score >= 68).map((pick) => pick.slot.position).filter((value, index, all) => all.indexOf(value) === index).slice(0, 5);
      const versatility = Math.min(12, Math.max(0, coverage.length - 1) * 3);
      return {
        player,
        score: clamp(Math.round((best?.score ?? 25) + versatility)),
        coverage,
        bestRole: best?.slot.label ?? player.mainPosition,
        reason: coverage.length >= 3 ? 'Cobre vários setores e facilita substituições sem desmontar a formação.' : `Melhor opção disponível para ${best?.slot.label ?? player.mainPosition}.`
      };
    })
    .sort((left, right) => right.score - left.score);
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
  const globalScore = Math.round(clamp(lineupAverage * 0.55 + profile * 0.2 + triangles * 0.12 + style * 0.08 + coverageScore * 0.05));
  const bench = buildBench(players, lineup, preferences, history);
  const warnings: string[] = [];
  const strengths: string[] = [];
  if (coverageScore < 100) warnings.push(`Faltam jogadores compatíveis para ${formation.slots.length - filled.length} posição(ões).`);
  if (formation.slots.some((slot) => WING.has(slot.position)) && preferences.avoidWingers) warnings.push('A formação usa PE/PD e perde pontos no seu perfil central.');
  if (formation.slots.some((slot) => WIDE_MID.has(slot.position)) && preferences.avoidWideMidfielders) warnings.push('A formação depende de ME/MD e não é prioridade no seu perfil.');
  if (!formation.slots.some((slot) => WING.has(slot.position)) && !formation.slots.some((slot) => WIDE_MID.has(slot.position))) strengths.push('Estrutura central sem PE, PD, ME ou MD.');
  if (triangles >= 75) strengths.push('Boa rede de triângulos para passe curto e tabelas.');
  if (style >= 90) strengths.push('Compatível com o estilo de técnico selecionado.');
  if (lineupAverage >= 80) strengths.push('Titulares com encaixe forte por posição e função.');
  return { formation, lineup, bench, globalScore, lineupAverage, formationProfileScore: profile, styleScore: style, triangleScore: triangles, coverageScore, warnings, strengths, substitutions: substitutionPlans(bench) };
}

export function buildFormationRanking(
  players: SquadMappingPlayer[],
  preferences: SquadMappingPreferences,
  pins: Record<string, string>,
  history: Map<string, AnalysisResult>
) {
  return FORMATION_BLUEPRINTS
    .map((formation) => buildFormationResult(formation, players, preferences, pins, history))
    .sort((left, right) => right.globalScore - left.globalScore || right.formationProfileScore - left.formationProfileScore);
}

export function suggestedTrainingPositions(player: SquadMappingPlayer, ranking: MappingFormationResult[]) {
  const current = new Set(uniquePositions(player));
  const suggestions = new Map<PositionCode, { score: number; formation: string; reason: string }>();
  for (const result of ranking.slice(0, 10)) {
    for (const slot of result.formation.slots) {
      if (current.has(slot.position) || (player.mainPosition === 'GK') !== (slot.position === 'GK')) continue;
      const pick = scoreMappingPlayerForSlot({ ...player, trainedPositions: [...player.trainedPositions, slot.position] }, slot, DEFAULT_MAPPING_PREFERENCES, new Map());
      if (pick.score < 62) continue;
      const previous = suggestions.get(slot.position);
      if (!previous || pick.score > previous.score) suggestions.set(slot.position, { score: pick.score, formation: result.formation.name, reason: `Pode render como ${slot.label} após treino de posição, respeitando o estilo ${player.playstyle || 'a confirmar'}.` });
    }
  }
  return Array.from(suggestions.entries()).map(([position, value]) => ({ position, ...value })).sort((left, right) => right.score - left.score).slice(0, 4);
}

export function mergeMappingPlayer(existing: SquadMappingPlayer[], incoming: SquadMappingPlayer) {
  const name = incoming.name.trim().toLocaleLowerCase('pt-BR');
  const duplicate = existing.find((player) => {
    if (incoming.sourceHash && player.sourceHash) return player.sourceHash === incoming.sourceHash;
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
    portrait: incoming.portrait || duplicate.portrait,
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
  return { id: `trial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, formationId: result.formation.id, formationName: result.formation.name, lineupPlayerIds: result.lineup.flatMap((pick) => pick.player ? [pick.player.id] : []), startedAt: now, targetDays, matches: 0, wins: 0, draws: 0, losses: 0, note: '', status: 'ativo', updatedAt: now };
}

export function trialProgress(trial: FormationTrial, now = Date.now()) {
  const started = Date.parse(trial.startedAt);
  const elapsedDays = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 86_400_000)) : 0;
  return { elapsedDays, remainingDays: Math.max(0, trial.targetDays - elapsedDays), percentage: clamp(Math.round((elapsedDays / trial.targetDays) * 100)) };
}
