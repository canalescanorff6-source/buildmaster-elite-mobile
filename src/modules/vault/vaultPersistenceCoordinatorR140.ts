import type { MatchValidationRecord } from '@/lib/appEvolution';
import {
  persistHistoryStore,
  type HistoryPersistenceResult,
  type SavedAnalysis
} from './cardHistoryStore';
export { commitVaultHistoryR140, type VaultHistoryCommitR140 } from './vaultHistoryCommitR172';
import {
  normalizeMatchValidationRecordsR137,
  persistMatchValidationRepositoryR137,
  readMatchValidationRepositoryR137,
  type MatchValidationWriteResultR137
} from '@/modules/matches/matchValidationRepositoryR137';

export const VAULT_PERSISTENCE_COORDINATOR_R140_VERSION = '40.80-r140-confirmed-local-persistence-v1' as const;

export type CriticalVaultRestoreDepsR140 = {
  persistHistory: (items: SavedAnalysis[]) => Promise<HistoryPersistenceResult>;
  readMatches: () => MatchValidationRecord[];
  writeMatches: (records: MatchValidationRecord[], detail?: Record<string, unknown>) => MatchValidationWriteResultR137;
};

const defaultDeps: CriticalVaultRestoreDepsR140 = {
  persistHistory: persistHistoryStore,
  readMatches: readMatchValidationRepositoryR137,
  writeMatches: persistMatchValidationRepositoryR137
};

export type CriticalVaultRestoreInputR140 = {
  currentHistory: SavedAnalysis[];
  nextHistory?: SavedAnalysis[];
  nextMatchValidation?: unknown;
};

export type CriticalVaultRestoreResultR140 = {
  ok: boolean;
  history: SavedAnalysis[];
  matches: MatchValidationRecord[];
  historyPersistence: HistoryPersistenceResult | null;
  matchPersistence: MatchValidationWriteResultR137 | null;
  rolledBackMatches: boolean;
  error: string | null;
};

/**
 * R140: commit de dois recursos críticos do backup (Cofre + partidas) com rollback do histórico
 * de partidas se a persistência do Cofre falhar. Nenhum setState deve ocorrer antes deste retorno.
 */
export async function commitCriticalVaultRestoreR140(
  input: CriticalVaultRestoreInputR140,
  deps: CriticalVaultRestoreDepsR140 = defaultDeps
): Promise<CriticalVaultRestoreResultR140> {
  const previousMatches = deps.readMatches();
  const nextMatches = input.nextMatchValidation === undefined
    ? previousMatches
    : normalizeMatchValidationRecordsR137(input.nextMatchValidation);
  let matchPersistence: MatchValidationWriteResultR137 | null = null;
  let historyPersistence: HistoryPersistenceResult | null = null;
  let matchesChanged = false;

  if (input.nextMatchValidation !== undefined) {
    matchPersistence = deps.writeMatches(nextMatches, { source: 'backup-restore-r140', phase: 'critical-commit' });
    if (!matchPersistence.persisted) {
      return {
        ok: false,
        history: input.currentHistory,
        matches: previousMatches,
        historyPersistence,
        matchPersistence,
        rolledBackMatches: false,
        error: 'Não foi possível restaurar o histórico de partidas. O Cofre não foi alterado.'
      };
    }
    matchesChanged = true;
  }

  if (input.nextHistory !== undefined) {
    historyPersistence = await deps.persistHistory(input.nextHistory);
    if (!historyPersistence.saved) {
      let rolledBackMatches = false;
      if (matchesChanged) {
        const rollback = deps.writeMatches(previousMatches, { source: 'backup-restore-r140', phase: 'rollback' });
        rolledBackMatches = rollback.persisted;
      }
      return {
        ok: false,
        history: input.currentHistory,
        matches: rolledBackMatches || !matchesChanged ? previousMatches : nextMatches,
        historyPersistence,
        matchPersistence,
        rolledBackMatches,
        error: matchesChanged && !rolledBackMatches
          ? `${historyPersistence.error} O Cofre não foi confirmado e o rollback das partidas também falhou; use o ponto de restauração antes de continuar.`
          : `${historyPersistence.error} O histórico de partidas foi restaurado ao estado anterior.`
      };
    }
  }

  return {
    ok: true,
    history: input.nextHistory ?? input.currentHistory,
    matches: nextMatches,
    historyPersistence,
    matchPersistence,
    rolledBackMatches: false,
    error: null
  };
}
