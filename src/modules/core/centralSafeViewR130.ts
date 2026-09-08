import type { TacticalFormation, TacticalStyle } from '../../lib/analyzerDomain';
import type { MatchValidationRecord } from '../../lib/appEvolution';
import { recordSafeRuntimeError } from '../../lib/safeDiagnostics';
import {
  buildCentralDashboard,
  buildIntegratedPlayers,
  buildTeamDiagnosis,
  type CentralDashboard,
  type CentralPlayerInput,
  type IntegratedPlayerRecord,
  type TeamDiagnosis
} from './centralIntelligence';

/**
 * R130 — isolamento de falhas para computações derivadas da UI.
 * Não persiste dados e não possui autoridade sobre fichas.
 */
export function safeIntegratedPlayersR130(inputs: CentralPlayerInput[], matches: MatchValidationRecord[]): IntegratedPlayerRecord[] {
  const records: IntegratedPlayerRecord[] = [];
  for (const input of inputs) {
    try {
      const [record] = buildIntegratedPlayers([input], matches);
      if (record) records.push(record);
    } catch (cause) {
      void recordSafeRuntimeError({ area: 'central-player-normalization', code: 'normalize_failed', message: cause instanceof Error ? cause.message : 'Falha ao normalizar jogador na Central' });
    }
  }
  return records.sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
}

export function safeTeamDiagnosisR130(players: IntegratedPlayerRecord[], formation: TacticalFormation, style: TacticalStyle): TeamDiagnosis {
  try {
    return buildTeamDiagnosis(players, formation, style);
  } catch (cause) {
    void recordSafeRuntimeError({ area: 'team-diagnosis', code: 'diagnosis_failed', message: cause instanceof Error ? cause.message : 'Falha ao calcular diagnóstico do time' });
    return buildTeamDiagnosis([], formation, style);
  }
}

export function safeCentralDashboardR130(players: IntegratedPlayerRecord[], matches: MatchValidationRecord[], team: TeamDiagnosis): CentralDashboard {
  try {
    return buildCentralDashboard(players, matches, team);
  } catch (cause) {
    void recordSafeRuntimeError({ area: 'central-dashboard', code: 'dashboard_failed', message: cause instanceof Error ? cause.message : 'Falha ao montar painel central' });
    return {
      players: players.length,
      confirmed: players.filter((player) => player.status === 'completo').length,
      needsReview: players.filter((player) => player.status !== 'completo').length,
      matchRecords: matches.length,
      squadReadiness: team.globalScore,
      latestPlayer: players[0] ? { id: players[0].id, name: players[0].name, targetPosition: players[0].targetPosition } : null,
      recommendations: team.recommendations.slice(0, 8)
    };
  }
}

export function safeViewComputationR130<T>(area: string, compute: () => T, fallback: T): T {
  try {
    return compute();
  } catch (cause) {
    void recordSafeRuntimeError({
      area,
      code: 'render_computation_failed',
      message: cause instanceof Error ? cause.message : 'Cálculo visual incompatível foi isolado.'
    });
    return fallback;
  }
}
