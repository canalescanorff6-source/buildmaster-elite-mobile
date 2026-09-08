import type { SavedAnalysis } from './cardHistoryStore';
import type { VaultHistoryCommitR140 } from './vaultHistoryCommitR172';

export const VAULT_CANONICAL_MUTATION_QUEUE_R153_VERSION = '40.80-r153-canonical-local-mutation-v1' as const;

export type VaultCanonicalMutationPlanR153<T = void> = {
  nextHistory: SavedAnalysis[];
  value?: T;
};

export type VaultCanonicalMutationOutcomeR153<T = void> = {
  ok: boolean;
  history: SavedAnalysis[];
  value?: T;
  commit: VaultHistoryCommitR140 | null;
  error: string | null;
};

type CommitHistoryR153 = (items: SavedAnalysis[]) => Promise<VaultHistoryCommitR140>;

/**
 * R153 — serializa a TRANSFORMAÇÃO + persistência do Cofre.
 *
 * O storage R140 já serializava gravações físicas, porém a UI podia calcular dois snapshots
 * concorrentes a partir da mesma renderização antiga. Nesse cenário o segundo snapshot podia
 * terminar por último e apagar a primeira alteração. Este coordenador mantém um snapshot
 * canônico em memória e só executa a próxima transformação depois da confirmação anterior.
 *
 * Não é uma nova autoridade de persistência: o commit continua obrigatoriamente sendo R140.
 */
export function createVaultCanonicalMutationQueueR153(
  initialHistory: SavedAnalysis[] = [],
) {
  let canonical = initialHistory.slice();
  let initialized = initialHistory.length > 0;
  let pending = 0;
  let queue: Promise<unknown> = Promise.resolve();

  function syncExternalHistory(items: SavedAnalysis[]): void {
    // Durante uma transação, o snapshot interno é mais novo do que qualquer render React
    // intermediário. Sincronizações externas são adotadas quando não há mutação pendente.
    if (pending > 0) return;
    canonical = items.slice();
    initialized = true;
  }

  function readCanonical(fallback: SavedAnalysis[] = []): SavedAnalysis[] {
    return (initialized ? canonical : fallback).slice();
  }

  function isBusy(): boolean {
    return pending > 0;
  }

  function run<T>(
    fallbackHistory: SavedAnalysis[],
    mutate: (current: SavedAnalysis[]) => VaultCanonicalMutationPlanR153<T>,
    commit: CommitHistoryR153,
  ): Promise<VaultCanonicalMutationOutcomeR153<T>> {
    pending += 1;
    const execute = async (): Promise<VaultCanonicalMutationOutcomeR153<T>> => {
      const current = readCanonical(fallbackHistory);
      let plan: VaultCanonicalMutationPlanR153<T>;
      try {
        plan = mutate(current.slice());
      } catch (cause) {
        return {
          ok: false,
          history: current,
          commit: null,
          error: cause instanceof Error ? cause.message : 'Falha ao preparar a alteração do Cofre.',
        };
      }

      try {
        const confirmed = await commit(plan.nextHistory.slice());
        if (!confirmed.ok) {
          return {
            ok: false,
            history: current,
            value: plan.value,
            commit: confirmed,
            error: confirmed.error ?? 'A memória local recusou a gravação.',
          };
        }
        canonical = confirmed.history.slice();
        initialized = true;
        return {
          ok: true,
          history: canonical.slice(),
          value: plan.value,
          commit: confirmed,
          error: null,
        };
      } catch (cause) {
        return {
          ok: false,
          history: current,
          value: plan.value,
          commit: null,
          error: cause instanceof Error ? cause.message : 'Falha inesperada ao confirmar a alteração do Cofre.',
        };
      }
    };

    const operation = queue.then(execute, execute);
    queue = operation.then(() => undefined, () => undefined);
    return operation.finally(() => { pending = Math.max(0, pending - 1); });
  }

  return { syncExternalHistory, readCanonical, isBusy, run };
}

export type VaultCanonicalMutationQueueR153 = ReturnType<typeof createVaultCanonicalMutationQueueR153>;
