import { assertAccountVaultOwner, captureAccountVaultOwner, loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { APP_DATA_VERSION, checksumFor, type BackupEnvelope } from '@/lib/dataSafety';
import { runSerializedVaultCloudMutationR128 } from '@/modules/vault/vaultCloudQueueR128';
import { commitVaultHistoryR140 } from '@/modules/vault/vaultPersistenceCoordinatorR140';
import { mergeHistoryLists, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';

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

function withCloudHistory(existing: Record<string, unknown> | null, items: SavedAnalysis[]) {
  const updatedAt = new Date().toISOString();
  const payload = { ...(existing || {}), items, version: APP_DATA_VERSION, updatedAt };
  const full = existing?.fullBackup as BackupEnvelope | undefined;
  if (full?.app === 'BuildMaster Elite Tático' && full.sections && typeof full.sections === 'object' && !Array.isArray(full.sections)) {
    // The current backup must follow the current vault; historical restore points stay intact.
    const sections = { ...full.sections, history: items };
    const core = { app: full.app, version: full.version, schema: full.schema, exportedAt: updatedAt, sections };
    return { ...payload, fullBackup: { ...full, ...core, checksum: checksumFor(core) } };
  }
  return payload;
}

export function createVaultCloudOperationsR166(
  input: VaultCloudRuntimeInputR166,
  controls: VaultCloudRuntimeControlsR166,
) {
  const { setCloudLoading, setCloudStatus } = controls;
  const requireCloud = () => {
    if (!input.cloudEnabled) throw new Error('A nuvem segura desta conta não está disponível. O Cofre antigo e compartilhado foi removido.');
  };

  async function pushCloudHistory(items: SavedAnalysis[] = input.history, silent = false) {
    const owner = captureAccountVaultOwner();
    const snapshot = (items === input.history && input.getCanonicalHistory ? input.getCanonicalHistory() : items);
    setCloudLoading(true);
    try {
      await runSerializedVaultCloudMutationR128(async () => {
        assertAccountVaultOwner(owner);
        requireCloud();
        const existing = await loadAccountVault<Record<string, unknown>>(owner);
        assertAccountVaultOwner(owner);
        await syncAccountVault(withCloudHistory(existing, snapshot), owner);
      });
      assertAccountVaultOwner(owner);
      const message = `Nuvem segura da conta atualizada com ${snapshot.length} ficha(s).`;
      setCloudStatus(message);
      if (!silent) input.setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem segura.';
      if (!silent) { setCloudStatus(message); input.setStatus(`${message} O Cofre local da conta continua funcionando normalmente.`); }
    } finally { setCloudLoading(false); }
  }

  async function pullCloudHistory() {
    const owner = captureAccountVaultOwner();
    setCloudLoading(true);
    try {
      requireCloud();
      const snapshot = await loadAccountVault<{ items?: unknown[] }>(owner);
      assertAccountVaultOwner(owner);
      const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      if (!cloudItems.length) { setCloudStatus('A nuvem segura está conectada, mas ainda não há fichas salvas nesta conta.'); return; }
      const committedHistory = input.commitCanonicalHistory
        ? await input.commitCanonicalHistory(
            (current) => { assertAccountVaultOwner(owner); return mergeHistoryLists(cloudItems, current); },
            'As fichas da nuvem foram lidas, mas o Cofre local não confirmou a gravação.',
          )
        : await (async () => {
            assertAccountVaultOwner(owner);
            const commit = await commitVaultHistoryR140(mergeHistoryLists(cloudItems, input.history));
            assertAccountVaultOwner(owner);
            if (!commit.ok) {
              input.setStatus(`As fichas da nuvem foram lidas, mas o Cofre local não confirmou a gravação. ${commit.error ?? 'A memória local recusou a gravação.'} A versão anterior continua sendo a oficial.`);
              return null;
            }
            input.setHistory(commit.history);
            return commit.history;
          })();
      assertAccountVaultOwner(owner);
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
    const owner = captureAccountVaultOwner();
    setCloudLoading(true);
    try {
      const outcome = await runSerializedVaultCloudMutationR128(async () => {
        assertAccountVaultOwner(owner);
        requireCloud();
        const snapshot = await loadAccountVault<{ items?: unknown[] }>(owner);
        assertAccountVaultOwner(owner);
        const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
        const committedHistory = input.commitCanonicalHistory
          ? await input.commitCanonicalHistory(
              (current) => { assertAccountVaultOwner(owner); return mergeHistoryLists(current, cloudItems); },
              'O Cofre local recusou a sincronização.',
            )
          : await (async () => {
              assertAccountVaultOwner(owner);
              const next = mergeHistoryLists(input.history, cloudItems);
              const localCommit = await commitVaultHistoryR140(next);
              assertAccountVaultOwner(owner);
              if (!localCommit.ok) throw new Error(localCommit.error ?? 'O Cofre local recusou a sincronização.');
              input.setHistory(localCommit.history);
              return localCommit.history;
            })();
        assertAccountVaultOwner(owner);
        if (!committedHistory) throw new Error('O Cofre local recusou a sincronização.');
        try {
          await syncAccountVault(withCloudHistory(snapshot, committedHistory), owner);
          return { history: committedHistory, cloudOk: true as const, error: '' };
        } catch (error) {
          return { history: committedHistory, cloudOk: false as const, error: error instanceof Error ? error.message : 'Falha ao enviar a mesclagem para a nuvem.' };
        }
      });
      assertAccountVaultOwner(owner);
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
    const owner = captureAccountVaultOwner();
    if (!input.cloudEnabled) return;
    try {
      const current = input.getCanonicalHistory ? input.getCanonicalHistory() : input.history;
      const next = current.filter((entry) => entry.id !== item.id && entry.saveKey !== item.saveKey);
      await runSerializedVaultCloudMutationR128(async () => {
        assertAccountVaultOwner(owner);
        const existing = await loadAccountVault<Record<string, unknown>>(owner);
        assertAccountVaultOwner(owner);
        await syncAccountVault(withCloudHistory(existing, next), owner);
      });
    } catch { /* nuvem nunca invalida a verdade local */ }
  }

  return { requireCloud, pushCloudHistory, pullCloudHistory, syncCloudHistory, deleteCloudHistoryItem };
}
