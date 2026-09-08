import type { HistoryPersistenceResult, SavedAnalysis } from './cardHistoryStore';

export const VAULT_HISTORY_COMMIT_R172_VERSION = '40.80-r172-vault-history-commit-light-v1' as const;

export type VaultHistoryCommitR140 = {
  ok: boolean;
  history: SavedAnalysis[];
  persistence: HistoryPersistenceResult;
  error: string | null;
};

/**
 * R172: fronteira leve do commit local confirmado do Cofre.
 * Preserva exatamente a autoridade R140: a UI só adota a mutação depois que
 * cardHistoryStore confirmar a persistência local. Nuvem continua secundária.
 */
export async function commitVaultHistoryR140(
  nextHistory: SavedAnalysis[],
  persist?: (items: SavedAnalysis[]) => Promise<HistoryPersistenceResult>
): Promise<VaultHistoryCommitR140> {
  const snapshot = nextHistory.slice();
  const writer = persist ?? (await import('./cardHistoryStore')).persistHistoryStore;
  const persistence = await writer(snapshot);
  return persistence.saved
    ? { ok: true, history: snapshot, persistence, error: null }
    : { ok: false, history: snapshot, persistence, error: persistence.error };
}
