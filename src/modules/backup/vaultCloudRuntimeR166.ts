import { deleteAccountVault, loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { APP_DATA_VERSION } from '@/lib/dataSafety';
import { runSerializedVaultCloudMutationR128 } from '@/modules/vault/vaultCloudQueueR128';
import { commitVaultHistoryR140 } from '@/modules/vault/vaultPersistenceCoordinatorR140';
import { HISTORY_LIMIT, mergeHistoryLists, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';

export const VAULT_CLOUD_RUNTIME_R166_VERSION = '40.80-r166-vault-cloud-lazy-runtime-v1' as const;

export type VaultCloudRuntimeInputR166 = {
  cloudEnabled: boolean;
  history: SavedAnalysis[];
  setHistory: (history: SavedAnalysis[]) => void;
  setStatus: (status: string) => void;
  setLibraryOpen: (open: boolean) => void;
  getCanonicalHistory?: () => SavedAnalysis[];
  commitCanonicalHistory?: (
    mutate: (current: SavedAnalysis[]) => SavedAnalysis[],
    failureContext?: string,
  ) => Promise<SavedAnalysis[] | null>;
};

export type VaultCloudRuntimeControlsR166 = {
  setCloudLoading: (loading: boolean) => void;
  setCloudStatus: (status: string) => void;
};

export function createVaultCloudOperationsR166(
  input: VaultCloudRuntimeInputR166,
  controls: VaultCloudRuntimeControlsR166,
) {
  const { setCloudLoading, setCloudStatus } = controls;
  const requireCloud = () => {
    if (!input.cloudEnabled) throw new Error('A nuvem segura desta conta não está disponível. O Cofre antigo e compartilhado foi removido.');
  };

  async function pushCloudHistory(items: SavedAnalysis[] = input.history, silent = false) {
    if (!items.length) { if (!silent) setCloudStatus('Nenhuma ficha local para enviar à nuvem.'); return; }
    const snapshot = (items === input.history && input.getCanonicalHistory ? input.getCanonicalHistory() : items).slice(0, HISTORY_LIMIT);
    setCloudLoading(true);
    try {
      await runSerializedVaultCloudMutationR128(async () => {
        requireCloud();
        const existing = await loadAccountVault<Record<string, unknown>>();
        await syncAccountVault({ ...(existing || {}), items: snapshot, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
      });
      const message = `Nuvem segura da conta atualizada com ${snapshot.length} ficha(s).`;
      setCloudStatus(message);
      if (!silent) input.setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem segura.';
      if (!silent) { setCloudStatus(message); input.setStatus(`${message} O Cofre local da conta continua funcionando normalmente.`); }
    } finally { setCloudLoading(false); }
  }

  async function pullCloudHistory() {
    setCloudLoading(true);
    try {
      requireCloud();
      const snapshot = await loadAccountVault<{ items?: unknown[] }>();
      const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      if (!cloudItems.length) { setCloudStatus('A nuvem segura está conectada, mas ainda não há fichas salvas nesta conta.'); return; }
      const committedHistory = input.commitCanonicalHistory
        ? await input.commitCanonicalHistory(
            (current) => mergeHistoryLists(cloudItems, current),
            'As fichas da nuvem foram lidas, mas o Cofre local não confirmou a gravação.',
          )
        : await (async () => {
            const commit = await commitVaultHistoryR140(mergeHistoryLists(cloudItems, input.history));
            if (!commit.ok) {
              input.setStatus(`As fichas da nuvem foram lidas, mas o Cofre local não confirmou a gravação. ${commit.error ?? 'A memória local recusou a gravação.'} A versão anterior continua sendo a oficial.`);
              return null;
            }
            input.setHistory(commit.history);
            return commit.history;
          })();
      if (!committedHistory) return;
      input.setLibraryOpen(true);
      const message = `Baixei ${cloudItems.length} ficha(s) da nuvem segura desta conta.`;
      setCloudStatus(message); input.setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao baixar fichas da nuvem segura.';
      setCloudStatus(message); input.setStatus(`${message} O Cofre local permanece protegido.`);
    } finally { setCloudLoading(false); }
  }

  async function syncCloudHistory() {
    setCloudLoading(true);
    try {
      const outcome = await runSerializedVaultCloudMutationR128(async () => {
        requireCloud();
        const snapshot = await loadAccountVault<{ items?: unknown[] }>();
        const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
        const committedHistory = input.commitCanonicalHistory
          ? await input.commitCanonicalHistory(
              (current) => mergeHistoryLists(current, cloudItems),
              'O Cofre local recusou a sincronização.',
            )
          : await (async () => {
              const next = mergeHistoryLists(input.history, cloudItems);
              const localCommit = await commitVaultHistoryR140(next);
              if (!localCommit.ok) throw new Error(localCommit.error ?? 'O Cofre local recusou a sincronização.');
              input.setHistory(localCommit.history);
              return localCommit.history;
            })();
        if (!committedHistory) throw new Error('O Cofre local recusou a sincronização.');
        try {
          await syncAccountVault({ ...(snapshot && typeof snapshot === 'object' ? snapshot : {}), items: committedHistory, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
          return { history: committedHistory, cloudOk: true as const, error: '' };
        } catch (error) {
          return { history: committedHistory, cloudOk: false as const, error: error instanceof Error ? error.message : 'Falha ao enviar a mesclagem para a nuvem.' };
        }
      });
      input.setHistory(outcome.history); input.setLibraryOpen(true);
      if (!outcome.cloudOk) {
        setCloudStatus(outcome.error);
        input.setStatus(`${outcome.error} A mesclagem local de ${outcome.history.length} ficha(s) foi confirmada e continua sendo a versão oficial.`);
        return;
      }
      const message = `Sincronização segura concluída: ${outcome.history.length} ficha(s) nesta conta.`;
      setCloudStatus(message); input.setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem segura.';
      setCloudStatus(message); input.setStatus(`${message} O salvamento local permanece ativo.`);
    } finally { setCloudLoading(false); }
  }

  async function deleteCloudHistoryItem(item: SavedAnalysis) {
    if (!input.cloudEnabled) return;
    try {
      const current = input.getCanonicalHistory ? input.getCanonicalHistory() : input.history;
      const next = current.filter((entry) => entry.id !== item.id && entry.saveKey !== item.saveKey);
      await runSerializedVaultCloudMutationR128(async () => {
        if (next.length) {
          const existing = await loadAccountVault<Record<string, unknown>>();
          await syncAccountVault({ ...(existing || {}), items: next, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
        } else await deleteAccountVault();
      });
    } catch { /* nuvem nunca invalida a verdade local */ }
  }

  return { requireCloud, pushCloudHistory, pullCloudHistory, syncCloudHistory, deleteCloudHistoryItem };
}
