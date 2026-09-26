import type { TacticalStyle } from '@/lib/analyzer';
import type { MatchValidationRecord } from '@/lib/appStartupContractsR200';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import type { IntegratedPlayerRecord, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import { evaluatePairSynergyR454, type PairSynergyR454 } from '@/modules/scouting/gameplayScoutingR454';
import type { SquadBrainSnapshotR481 } from '@/modules/squad-brain/squadBrainEngineR481';

export const CHEMISTRY_GRAPH_R484_VERSION = '40.80-r484-chemistry-graph-v1' as const;

export type ChemistryLineR484 = 'ataque' | 'meio' | 'defesa' | 'goleiro';
export type ChemistrySectorIdR484 = 'defesa' | 'meio' | 'ataque' | 'defesa-meio' | 'meio-ataque';

export type ChemistryNodeR484 = {
  playerId: string;
  playerName: string;
  fingerprint: string;
  slotId: string;
  slotLabel: string;
  line: ChemistryLineR484;
  x: number;
  y: number;
  role: string;
  confidence: number;
};

export type ChemistryLinkR484 = {
  id: string;
  leftId: string;
  leftName: string;
  rightId: string;
  rightName: string;
  leftSlot: string;
  rightSlot: string;
  sector: ChemistrySectorIdR484;
  score: number;
  label: PairSynergyR454['label'];
  reasons: string[];
  warnings: string[];
  confidence: number;
  sharedSessions: number;
};

export type ChemistrySectorR484 = {
  id: ChemistrySectorIdR484;
  label: string;
  score: number | null;
  confidence: number | null;
  links: number;
};

export type ChemistryPlayerConnectivityR484 = {
  playerId: string;
  playerName: string;
  links: number;
  averageScore: number;
};

export type ChemistryRotationImpactR484 = {
  reserveId: string;
  reserveName: string;
  replaces: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  confidence: number;
  summary: string;
};

export type ChemistryGraphSnapshotR484 = {
  version: typeof CHEMISTRY_GRAPH_R484_VERSION;
  mode: 'READ_ONLY_CHEMISTRY_GRAPH';
  formation: string;
  teamStyle: TacticalStyle;
  score: number;
  confidence: number;
  evidence: {
    starters: number;
    links: number;
    sharedSessionLinks: number;
  };
  counts: {
    strong: number;
    good: number;
    neutral: number;
    redundant: number;
    poor: number;
  };
  nodes: ChemistryNodeR484[];
  links: ChemistryLinkR484[];
  sectors: ChemistrySectorR484[];
  bestLink: ChemistryLinkR484 | null;
  weakestLink: ChemistryLinkR484 | null;
  mostConnected: ChemistryPlayerConnectivityR484 | null;
  mostIsolated: ChemistryPlayerConnectivityR484 | null;
  rotations: ChemistryRotationImpactR484[];
  warnings: string[];
  authority: {
    readOnly: true;
    canChangeLineupAutomatically: false;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canChangePosition: false;
    canOverrideSquadBrain: false;
    canOverrideTacticalTwin: false;
    canOverrideR128: false;
    optimizeOverall: false;
  };
  guardrails: string[];
};

type ChemistryGraphInputR484 = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  records: MatchValidationRecord[];
  teamStyle: TacticalStyle;
  squadBrain: SquadBrainSnapshotR481;
};

type NodeContextR484 = ChemistryNodeR484 & {
  result: IntegratedPlayerRecord['result'];
};

const LINE_ORDER_R484: Record<ChemistryLineR484, number> = {
  goleiro: 0,
  defesa: 1,
  meio: 2,
  ataque: 3
};

const SECTOR_ORDER_R484: Array<{ id: ChemistrySectorIdR484; label: string }> = [
  { id: 'defesa', label: 'Defesa' },
  { id: 'meio', label: 'Meio-campo' },
  { id: 'ataque', label: 'Ataque' },
  { id: 'defesa-meio', label: 'Defesa ↔ Meio' },
  { id: 'meio-ataque', label: 'Meio ↔ Ataque' }
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function roundSigned(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizedLine(value: unknown): ChemistryLineR484 {
  if (value === 'ataque' || value === 'meio' || value === 'defesa' || value === 'goleiro') return value;
  return 'meio';
}

function spatialDistance(left: ChemistryNodeR484, right: ChemistryNodeR484) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function areTacticalNeighbours(left: ChemistryNodeR484, right: ChemistryNodeR484) {
  const leftOrder = LINE_ORDER_R484[left.line];
  const rightOrder = LINE_ORDER_R484[right.line];
  const gap = Math.abs(leftOrder - rightOrder);
  if (gap > 1) return false;
  if (left.line === 'goleiro' || right.line === 'goleiro') {
    const other = left.line === 'goleiro' ? right.line : left.line;
    return other === 'defesa' && spatialDistance(left, right) <= 42;
  }
  return spatialDistance(left, right) <= (gap === 0 ? 38 : 42);
}

function sectorFor(left: ChemistryNodeR484, right: ChemistryNodeR484): ChemistrySectorIdR484 | null {
  const lines = new Set([left.line, right.line]);
  if (lines.has('goleiro') && lines.has('defesa')) return 'defesa';
  if (left.line === 'defesa' && right.line === 'defesa') return 'defesa';
  if (left.line === 'meio' && right.line === 'meio') return 'meio';
  if (left.line === 'ataque' && right.line === 'ataque') return 'ataque';
  if (lines.has('defesa') && lines.has('meio')) return 'defesa-meio';
  if (lines.has('meio') && lines.has('ataque')) return 'meio-ataque';
  return null;
}

function playerMap(players: IntegratedPlayerRecord[]) {
  return new Map(players.map((player) => [player.name, player] as const));
}

function buildNodeContexts(team: TeamDiagnosis, players: IntegratedPlayerRecord[]): NodeContextR484[] {
  const byName = playerMap(players);
  return team.lineup.flatMap((fit) => {
    if (!fit.player) return [];
    const playerName = fit.player.parsed.playerName;
    const integrated = byName.get(playerName);
    const fingerprint = integrated?.fingerprint ?? cardIdentityFingerprintR126(fit.player.parsed);
    const node: NodeContextR484 = {
      playerId: integrated?.id ?? fingerprint,
      playerName,
      fingerprint,
      slotId: fit.slot.id,
      slotLabel: fit.slot.label,
      line: normalizedLine(fit.slot.line),
      x: Number(fit.slot.x ?? 50),
      y: Number(fit.slot.y ?? 50),
      role: integrated?.functionLabel || fit.player.teamMap?.functionLabel || fit.player.buildName || fit.slot.primaryRoles?.[0] || 'Função não confirmada',
      confidence: clamp(integrated?.confidence ?? fit.player.parsed.confidence ?? 0),
      result: integrated?.result ?? fit.player
    };
    return [node];
  });
}

function contextualSessions(node: NodeContextR484, records: MatchValidationRecord[], formation: string, teamStyle: TacticalStyle) {
  return new Set(records
    .filter((record) => record.cardFingerprint === node.fingerprint)
    .filter((record) => Boolean(record.sessionIdR462))
    .filter((record) => record.formation === formation)
    .filter((record) => teamStyle === 'AUTO' || record.teamStyle === teamStyle)
    .map((record) => record.sessionIdR462 as string));
}

function sharedSessionCount(left: NodeContextR484, right: NodeContextR484, records: MatchValidationRecord[], formation: string, teamStyle: TacticalStyle) {
  const leftSessions = contextualSessions(left, records, formation, teamStyle);
  const rightSessions = contextualSessions(right, records, formation, teamStyle);
  let shared = 0;
  leftSessions.forEach((session) => {
    if (rightSessions.has(session)) shared += 1;
  });
  return shared;
}

function buildLinks(
  nodes: NodeContextR484[],
  records: MatchValidationRecord[],
  formation: string,
  teamStyle: TacticalStyle
): ChemistryLinkR484[] {
  const links: ChemistryLinkR484[] = [];
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      if (!areTacticalNeighbours(left, right)) continue;
      const sector = sectorFor(left, right);
      if (!sector) continue;
      const pair = evaluatePairSynergyR454(left.result, right.result, { formationId: formation, teamStyle });
      const sharedSessions = sharedSessionCount(left, right, records, formation, teamStyle);
      const confidence = clamp(
        average([left.confidence, right.confidence]) * .85 +
        (pair.reasons.length ? 8 : 0) +
        Math.min(12, sharedSessions * 4)
      );
      links.push({
        id: [left.slotId, right.slotId].sort().join('::'),
        leftId: left.playerId,
        leftName: left.playerName,
        rightId: right.playerId,
        rightName: right.playerName,
        leftSlot: left.slotLabel,
        rightSlot: right.slotLabel,
        sector,
        score: pair.score,
        label: pair.label,
        reasons: [...pair.reasons],
        warnings: [...pair.warnings],
        confidence,
        sharedSessions
      });
    }
  }
  return links.sort((a, b) => a.id.localeCompare(b.id));
}

function buildSectors(links: ChemistryLinkR484[]): ChemistrySectorR484[] {
  return SECTOR_ORDER_R484.map(({ id, label }) => {
    const sectorLinks = links.filter((link) => link.sector === id);
    return {
      id,
      label,
      score: sectorLinks.length ? clamp(average(sectorLinks.map((link) => link.score))) : null,
      confidence: sectorLinks.length ? clamp(average(sectorLinks.map((link) => link.confidence))) : null,
      links: sectorLinks.length
    };
  });
}

function connectivity(nodes: ChemistryNodeR484[], links: ChemistryLinkR484[]) {
  return nodes.map((node) => {
    const playerLinks = links.filter((link) => link.leftId === node.playerId || link.rightId === node.playerId);
    return {
      playerId: node.playerId,
      playerName: node.playerName,
      links: playerLinks.length,
      averageScore: playerLinks.length ? clamp(average(playerLinks.map((link) => link.score))) : 0
    };
  });
}

function rankedLinks(links: ChemistryLinkR484[]) {
  const best = [...links].sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.id.localeCompare(b.id))[0] ?? null;
  const weakest = [...links].sort((a, b) => a.score - b.score || a.confidence - b.confidence || a.id.localeCompare(b.id))[0] ?? null;
  return { best, weakest };
}

function summaryForDelta(delta: number, reserveName: string, replaces: string) {
  if (delta >= 3) return `${reserveName} melhora a química estrutural ao substituir ${replaces}.`;
  if (delta <= -3) return `${reserveName} reduz a química estrutural ao substituir ${replaces}; a troca exige compensação tática.`;
  return `${reserveName} mantém a química próxima do desenho atual ao substituir ${replaces}.`;
}

function buildRotationImpacts(
  baseNodes: NodeContextR484[],
  baseLinks: ChemistryLinkR484[],
  players: IntegratedPlayerRecord[],
  records: MatchValidationRecord[],
  formation: string,
  teamStyle: TacticalStyle,
  squadBrain: SquadBrainSnapshotR481
): ChemistryRotationImpactR484[] {
  const before = baseLinks.length ? clamp(average(baseLinks.map((link) => link.score))) : 0;
  const byId = new Map(players.map((player) => [player.id, player] as const));
  const byName = playerMap(players);

  return squadBrain.rotations.slice(0, 3).flatMap((rotation) => {
    const starterIndex = baseNodes.findIndex((node) => node.playerName === rotation.replaces);
    const reserve = byId.get(rotation.reserveId) ?? byName.get(rotation.reserveName);
    if (starterIndex < 0 || !reserve) return [];
    const current = baseNodes[starterIndex];
    const simulatedNodes = baseNodes.map((node, index) => index === starterIndex ? {
      ...node,
      playerId: reserve.id,
      playerName: reserve.name,
      fingerprint: reserve.fingerprint,
      role: reserve.functionLabel,
      confidence: clamp(reserve.confidence),
      result: reserve.result
    } : node);
    const simulatedLinks = buildLinks(simulatedNodes, records, formation, teamStyle);
    const after = simulatedLinks.length ? clamp(average(simulatedLinks.map((link) => link.score))) : 0;
    const delta = roundSigned(after - before);
    return [{
      reserveId: reserve.id,
      reserveName: reserve.name,
      replaces: current.playerName,
      scoreBefore: before,
      scoreAfter: after,
      delta,
      confidence: simulatedLinks.length ? clamp(average(simulatedLinks.map((link) => link.confidence))) : 0,
      summary: summaryForDelta(delta, reserve.name, current.playerName)
    }];
  });
}

function publicNodes(nodes: NodeContextR484[]): ChemistryNodeR484[] {
  return nodes.map(({ result: _result, ...node }) => node);
}

export function buildChemistryGraphR484({ team, players, records, teamStyle, squadBrain }: ChemistryGraphInputR484): ChemistryGraphSnapshotR484 {
  const nodeContexts = buildNodeContexts(team, players);
  const links = buildLinks(nodeContexts, records, team.formation, teamStyle);
  const nodes = publicNodes(nodeContexts);
  const score = links.length ? clamp(average(links.map((link) => link.score))) : 0;
  const confidence = links.length ? clamp(average(links.map((link) => link.confidence))) : 0;
  const sectors = buildSectors(links);
  const linkRanks = rankedLinks(links);
  const connected = connectivity(nodes, links);
  const mostConnected = [...connected].sort((a, b) => b.links - a.links || b.averageScore - a.averageScore || a.playerName.localeCompare(b.playerName))[0] ?? null;
  const mostIsolated = [...connected].sort((a, b) => a.links - b.links || a.averageScore - b.averageScore || a.playerName.localeCompare(b.playerName))[0] ?? null;
  const rotations = buildRotationImpacts(nodeContexts, links, players, records, team.formation, teamStyle, squadBrain);

  const counts = {
    strong: links.filter((link) => link.label === 'FORTE').length,
    good: links.filter((link) => link.label === 'BOA').length,
    neutral: links.filter((link) => link.label === 'NEUTRA').length,
    redundant: links.filter((link) => link.label === 'REDUNDANTE').length,
    poor: links.filter((link) => link.label === 'RUIM').length
  };

  const warnings = [
    nodes.length < 2 ? 'Titulares insuficientes para calcular química entre pares.' : null,
    nodes.length >= 2 && links.length === 0 ? 'Nenhum par de titulares está dentro da vizinhança tática segura desta formação.' : null,
    links.length > 0 && links.every((link) => link.sharedSessions === 0) ? 'Sem sessões compartilhadas confirmadas; confiança usa somente estrutura e dados das cartas.' : null,
    counts.poor ? `${counts.poor} ligação(ões) ruim(ns) exigem revisão de complementaridade.` : null,
    counts.redundant ? `${counts.redundant} ligação(ões) redundante(s) podem repetir comportamento.` : null
  ].filter((item): item is string => Boolean(item));

  return {
    version: CHEMISTRY_GRAPH_R484_VERSION,
    mode: 'READ_ONLY_CHEMISTRY_GRAPH',
    formation: team.formation,
    teamStyle,
    score,
    confidence,
    evidence: {
      starters: nodes.length,
      links: links.length,
      sharedSessionLinks: links.filter((link) => link.sharedSessions > 0).length
    },
    counts,
    nodes,
    links,
    sectors,
    bestLink: linkRanks.best,
    weakestLink: linkRanks.weakest,
    mostConnected,
    mostIsolated,
    rotations,
    warnings,
    authority: {
      readOnly: true,
      canChangeLineupAutomatically: false,
      canWriteTraining: false,
      canWriteSkills: false,
      canWriteImpetus: false,
      canChangePosition: false,
      canOverrideSquadBrain: false,
      canOverrideTacticalTwin: false,
      canOverrideR128: false,
      optimizeOverall: false
    },
    guardrails: [
      'O Chemistry Graph R484 observa complementaridade entre vizinhos táticos; ele não altera a escalação.',
      'O score de dupla vem do avaliador R454; evidência de partida pode aumentar confiança, mas nunca fabricar sinergia.',
      'Nenhuma simulação escreve ficha, Top 5, Ímpeto, posição, Cofre ou preset.',
      'GER/Overall não participa do cálculo de química.',
      'A autoridade final das cartas permanece R119 → R126 → R128.'
    ]
  };
}
