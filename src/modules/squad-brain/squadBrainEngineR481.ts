import type { MatchValidationRecord } from '@/lib/appStartupContractsR200';
import type { IntegratedPlayerRecord, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalTwinSnapshotR480, TacticalTwinScenarioIdR480 } from '@/modules/tactical-twin/tacticalTwinEngineR480';

export const SQUAD_BRAIN_R481_VERSION = '40.80-r481-squad-brain-v1';

export type SquadBrainCoverageStatusR481 = 'forte' | 'adequada' | 'fraca' | 'critica';

export type SquadBrainCorePlayerR481 = {
  playerId: string;
  playerName: string;
  role: string;
  line: string;
  starterScore: number;
  evidenceMatches: number;
  replacementScore: number;
  replacementGap: number;
  importance: number;
  reason: string;
};

export type SquadBrainRotationR481 = {
  reserveId: string;
  reserveName: string;
  replaces: string;
  replacementMode: 'MANTER_FUNCAO' | 'MUDAR_COMPORTAMENTO';
  readiness: number;
  evidenceMatches: number;
  reason: string;
};

export type SquadBrainCoverageR481 = {
  line: 'ataque' | 'meio' | 'defesa' | 'goleiro';
  label: string;
  starters: number;
  reserves: number;
  averageStarterScore: number;
  bestReserveScore: number;
  status: SquadBrainCoverageStatusR481;
  note: string;
};

export type SquadBrainScenarioBenchR481 = {
  scenario: TacticalTwinScenarioIdR480;
  label: string;
  reserveIds: string[];
  reserveNames: string[];
  rationale: string;
};

export type SquadBrainSnapshotR481 = {
  version: string;
  mode: 'READ_ONLY_SQUAD_ORCHESTRATION';
  confidence: number;
  evidence: {
    totalPlayers: number;
    confirmedPlayers: number;
    playersWithMatches: number;
    matchRecords: number;
  };
  core: SquadBrainCorePlayerR481[];
  rotations: SquadBrainRotationR481[];
  coverage: SquadBrainCoverageR481[];
  scenarioBench: SquadBrainScenarioBenchR481[];
  warnings: string[];
  authority: {
    readOnly: true;
    canChangeLineupAutomatically: false;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canOverrideR128: false;
  };
  guardrails: string[];
};

type SquadBrainInputR481 = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  records: MatchValidationRecord[];
  twin: TacticalTwinSnapshotR480;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function normalized(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function lineFromPosition(position: string): SquadBrainCoverageR481['line'] {
  const value = String(position || '').toUpperCase();
  if (value === 'GK') return 'goleiro';
  if (['CB','LB','RB','DMF'].includes(value)) return 'defesa';
  if (['CMF','LMF','RMF','AMF'].includes(value)) return 'meio';
  return 'ataque';
}

function lineLabel(line: SquadBrainCoverageR481['line']) {
  if (line === 'ataque') return 'Ataque';
  if (line === 'meio') return 'Meio-campo';
  if (line === 'defesa') return 'Defesa';
  return 'Goleiro';
}

function playerEvidenceCount(player: IntegratedPlayerRecord, records: MatchValidationRecord[]) {
  return records.filter((record) => record.cardFingerprint === player.fingerprint).length;
}

function bestBenchReplacementFor(team: TeamDiagnosis, starterName: string) {
  return team.benchSuggestions
    .filter((item) => item.replaces === starterName)
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

function scenarioKeywordScore(scenario: TacticalTwinScenarioIdR480, text: string) {
  const value = normalized(text);
  if (scenario === 'proteger') {
    return /vol|defens|zague|lateral|cobertura|marcacao/.test(value) ? 18 : 0;
  }
  if (scenario === 'buscar') {
    return /atac|artil|final|infiltra|armador|criativo|pivo|puxa|veloc/.test(value) ? 18 : 0;
  }
  if (scenario === 'pressao') {
    return /orquestr|armador|passe|meia|volante|controle/.test(value) ? 14 : 0;
  }
  return /equilibr|versatil|cobertura|controle/.test(value) ? 8 : 0;
}

export function buildSquadBrainR481({ team, players, records, twin }: SquadBrainInputR481): SquadBrainSnapshotR481 {
  const playerByName = new Map(players.map((player) => [player.name, player] as const));
  const starterNames = team.lineup.flatMap((item) => item.player ? [item.player.parsed.playerName] : []);
  const starterNameSet = new Set(starterNames);
  const reservePlayers = players.filter((player) => !starterNameSet.has(player.name));

  const core = team.lineup
    .filter((item) => item.player)
    .map((item) => {
      const name = item.player?.parsed.playerName ?? '';
      const player = playerByName.get(name);
      const replacement = bestBenchReplacementFor(team, name);
      const replacementScore = replacement?.score ?? 0;
      const replacementGap = clamp(item.score - replacementScore, 0, 100);
      const evidenceMatches = player ? playerEvidenceCount(player, records) : 0;
      const confidenceBonus = player ? Math.min(12, Math.max(0, player.confidence - 70) * .25) : 0;
      const evidenceBonus = Math.min(12, evidenceMatches * 2);
      const importance = clamp(item.score * .55 + replacementGap * .25 + confidenceBonus + evidenceBonus);
      const role = player?.functionLabel || item.player?.teamMap?.functionLabel || item.player?.buildName || item.slot.primaryRoles?.[0] || 'Função não confirmada';
      return {
        playerId: player?.id ?? name,
        playerName: name,
        role,
        line: item.slot.line,
        starterScore: clamp(item.score),
        evidenceMatches,
        replacementScore,
        replacementGap,
        importance,
        reason: replacement
          ? `Reserva mais próxima: ${replacement.name} (${replacement.score}/100); diferença de ${replacementGap} ponto(s).`
          : 'Não há reserva direta confirmada para esta função.'
      };
    })
    .sort((a, b) => b.importance - a.importance || b.starterScore - a.starterScore);

  const rotations = team.benchSuggestions
    .map((item) => {
      const reserve = players.find((player) => player.id === item.id || player.name === item.name);
      const evidenceMatches = reserve ? playerEvidenceCount(reserve, records) : 0;
      const evidenceBonus = Math.min(10, evidenceMatches * 2);
      const confidenceBonus = reserve ? Math.max(0, reserve.confidence - 70) * .15 : 0;
      return {
        reserveId: reserve?.id ?? item.id,
        reserveName: item.name,
        replaces: item.replaces,
        replacementMode: item.replacementMode,
        readiness: clamp(item.score * .78 + evidenceBonus + confidenceBonus),
        evidenceMatches,
        reason: `${item.reason} ${item.behaviourChange}`
      };
    })
    .sort((a, b) => b.readiness - a.readiness)
    .slice(0, 8);

  const lines: SquadBrainCoverageR481['line'][] = ['ataque','meio','defesa','goleiro'];
  const coverage = lines.map((line) => {
    const starters = team.lineup.filter((item) => item.player && item.slot.line === line);
    const reserveForLine = reservePlayers
      .filter((player) => lineFromPosition(player.targetPositionCode) === line)
      .map((player) => {
        const bench = team.benchSuggestions.find((item) => item.id === player.id || item.name === player.name);
        return bench?.score ?? Math.round((player.efficiency + player.confidence) / 2);
      })
      .sort((a, b) => b - a);
    const averageStarterScore = clamp(average(starters.map((item) => item.score)));
    const bestReserveScore = reserveForLine[0] ?? 0;
    let status: SquadBrainCoverageStatusR481 = 'adequada';
    if (!starters.length) status = 'critica';
    else if (!reserveForLine.length) status = 'fraca';
    else if (bestReserveScore >= averageStarterScore - 8) status = 'forte';
    else if (bestReserveScore < averageStarterScore - 20) status = 'fraca';
    return {
      line,
      label: lineLabel(line),
      starters: starters.length,
      reserves: reserveForLine.length,
      averageStarterScore,
      bestReserveScore,
      status,
      note: !starters.length
        ? 'Não há titular identificado nesta linha.'
        : !reserveForLine.length
          ? 'Sem reserva natural confirmado para esta linha.'
          : status === 'forte'
            ? 'Há substituição próxima do nível estrutural dos titulares.'
            : `Melhor reserva está ${Math.max(0, averageStarterScore - bestReserveScore)} ponto(s) abaixo da média dos titulares.`
    };
  });

  const scenarioBench = twin.scenarios.map((scenario) => {
    const ranked = team.benchSuggestions
      .map((item) => {
        const player = players.find((candidate) => candidate.id === item.id || candidate.name === item.name);
        const evidence = player ? playerEvidenceCount(player, records) : 0;
        const text = `${item.role} ${item.reason} ${item.behaviourChange}`;
        const score = item.score + scenarioKeywordScore(scenario.id, text) + Math.min(8, evidence * 2);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return {
      scenario: scenario.id,
      label: scenario.label,
      reserveIds: ranked.map(({ item }) => item.id),
      reserveNames: ranked.map(({ item }) => item.name),
      rationale: ranked.length
        ? `Prioridade de banco para ${scenario.label.toLowerCase()}: ${ranked.map(({ item }) => item.name).join(', ')}.`
        : 'Ainda não há reservas suficientes para formar uma rotação específica deste cenário.'
    };
  });

  const confirmedPlayers = players.filter((player) => player.status === 'completo' && player.confidence >= 75).length;
  const playersWithMatches = players.filter((player) => playerEvidenceCount(player, records) > 0).length;
  const coverageScore = average(coverage.map((item) => {
    if (item.status === 'forte') return 100;
    if (item.status === 'adequada') return 78;
    if (item.status === 'fraca') return 45;
    return 20;
  }));
  const evidenceScore = players.length ? (playersWithMatches / players.length) * 100 : 0;
  const confidence = clamp(twin.confidence * .42 + coverageScore * .28 + evidenceScore * .18 + (players.length ? confirmedPlayers / players.length * 100 : 0) * .12);

  const warnings = [
    ...coverage.filter((item) => item.status === 'critica' || item.status === 'fraca').map((item) => `${item.label}: ${item.note}`),
    core.filter((item) => item.replacementGap >= 20).slice(0, 3).map((item) => `${item.playerName} é pouco substituível no elenco atual: diferença de ${item.replacementGap} ponto(s) para a melhor alternativa.`),
    rotations.length < 5 ? 'O banco ainda possui poucas rotações confiáveis para cobrir cenários diferentes.' : null,
    twin.evidence.contextualMatchRecords === 0 ? 'Sem partidas no mesmo contexto tático; a priorização do banco depende mais da estrutura do que de validação real.' : null
  ].flat().filter((item): item is string => Boolean(item));

  return {
    version: SQUAD_BRAIN_R481_VERSION,
    mode: 'READ_ONLY_SQUAD_ORCHESTRATION',
    confidence,
    evidence: {
      totalPlayers: players.length,
      confirmedPlayers,
      playersWithMatches,
      matchRecords: records.length
    },
    core,
    rotations,
    coverage,
    scenarioBench,
    warnings,
    authority: {
      readOnly: true,
      canChangeLineupAutomatically: false,
      canWriteTraining: false,
      canWriteSkills: false,
      canWriteImpetus: false,
      canOverrideR128: false
    },
    guardrails: [
      'O Squad Brain R481 organiza o elenco e o banco; ele não altera automaticamente a escalação.',
      'Nenhuma recomendação pode escrever ficha, Top 5, Ímpeto ou treinamento.',
      'A prioridade considera encaixe, cobertura e evidência real; Overall isolado nunca decide a rotação.',
      'A autoridade final das cartas permanece R119 → R126 → R128.'
    ]
  };
}
