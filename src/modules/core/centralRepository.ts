import { cardFingerprint, type MatchValidationRecord } from '@/lib/appEvolution';
import type { IntegratedPlayerRecord, TeamDiagnosis } from '@/modules/core/centralIntelligence';

export const CENTRAL_INDEX_STORAGE_KEY = 'buildmaster_central_entity_index_v27';

export type CentralImpactNotice = {
  id: string;
  severity: 'critical' | 'important' | 'info';
  title: string;
  detail: string;
  playerId?: string;
};

export type CentralEntityIndex = {
  schemaVersion: 27;
  generatedAt: string;
  players: Array<{
    id: string;
    fingerprint: string;
    name: string;
    status: IntegratedPlayerRecord['status'];
    buildName: string;
    targetPosition: string;
    formationIds: string[];
    matchIds: string[];
  }>;
  team: {
    formation: string;
    lineupPlayerFingerprints: string[];
    missingRoles: string[];
  };
  matches: Array<{
    id: string;
    cardFingerprint: string;
    playedAt: string;
    rating: number;
  }>;
  impacts: CentralImpactNotice[];
};

export function buildCentralEntityIndex(
  players: IntegratedPlayerRecord[],
  team: TeamDiagnosis,
  matches: MatchValidationRecord[]
): CentralEntityIndex {
  const matchIdsByFingerprint = new Map<string, string[]>();
  matches.forEach((record) => {
    const current = matchIdsByFingerprint.get(record.cardFingerprint) ?? [];
    current.push(record.id);
    matchIdsByFingerprint.set(record.cardFingerprint, current);
  });

  const lineupFingerprints = team.lineup
    .map((slot) => slot.player ? cardFingerprint(slot.player) : '')
    .filter(Boolean);

  const impacts: CentralImpactNotice[] = [];
  players.forEach((player) => {
    if (player.status !== 'completo') {
      impacts.push({
        id: `player-status-${player.id}`,
        severity: player.status === 'revisar' ? 'critical' : 'important',
        title: `${player.name} afeta outras análises`,
        detail: `A carta está como ${player.status}. Ficha, encaixes em formação e recomendações do time devem ser revisados depois da confirmação.`,
        playerId: player.id
      });
    }
    if (player.matchCount === 0 && player.status === 'completo') {
      impacts.push({
        id: `player-unvalidated-${player.id}`,
        severity: 'info',
        title: `${player.name} ainda não foi validado em partida`,
        detail: 'A ficha está pronta, mas as recomendações ainda dependem apenas do motor técnico.',
        playerId: player.id
      });
    }
  });
  if (team.missingRoles.length) {
    impacts.unshift({
      id: 'team-missing-roles',
      severity: 'critical',
      title: 'A formação possui espaços sem encaixe confiável',
      detail: team.missingRoles.slice(0, 3).join(' • ')
    });
  }

  return {
    schemaVersion: 27,
    generatedAt: new Date().toISOString(),
    players: players.map((player) => ({
      id: player.id,
      fingerprint: player.fingerprint,
      name: player.name,
      status: player.status,
      buildName: player.buildName,
      targetPosition: player.targetPosition,
      formationIds: [...new Set(player.bestFormations.map((formation) => formation.id))],
      matchIds: matchIdsByFingerprint.get(player.fingerprint) ?? []
    })),
    team: {
      formation: team.formation,
      lineupPlayerFingerprints: lineupFingerprints,
      missingRoles: team.missingRoles
    },
    matches: matches.map((record) => ({
      id: record.id,
      cardFingerprint: record.cardFingerprint,
      playedAt: record.playedAt,
      rating: record.overallRating
    })),
    impacts: impacts.slice(0, 20)
  };
}
