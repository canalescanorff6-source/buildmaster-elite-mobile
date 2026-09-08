'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createVaultCanonicalMutationQueueR153 } from './vaultCanonicalMutationQueueR153';
import { createVaultActionGuardR154 } from './vaultActionGuardR154';
import { commitVaultHistoryR140 } from './vaultHistoryCommitR172';
import type { SavedAnalysis } from './cardHistoryStore';

export const CARDVISION_VAULT_COORDINATOR_R153_VERSION = '40.80-r153-cardvision-vault-coordinator-v1' as const;
export const CARDVISION_VAULT_COORDINATOR_R154_VERSION = '40.80-r154-vault-action-feedback-v1' as const;

type Input = {
  cloudEnabled: boolean;
  history: SavedAnalysis[];
  setHistory: Dispatch<SetStateAction<SavedAnalysis[]>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setLibraryOpen: Dispatch<SetStateAction<boolean>>;
};

export type VaultActionOptionsR154 = {
  key: string;
  label: string;
  duplicateMessage?: string;
};

export function useCardVisionVaultCoordinatorR153(input: Input) {
  const queueRef = useRef(createVaultCanonicalMutationQueueR153());
  const actionGuardRef = useRef(createVaultActionGuardR154());
  const actionLabelsRefR154 = useRef(new Map<string, string>());
  const [activeVaultActionKeysR154, setActiveVaultActionKeysR154] = useState<string[]>([]);
  const [vaultOperationLabelR154, setVaultOperationLabelR154] = useState('');

  useEffect(() => {
    queueRef.current.syncExternalHistory(input.history);
  }, [input.history]);

  const syncActionGuardStateR154 = () => {
    const snapshot = actionGuardRef.current.snapshot();
    setActiveVaultActionKeysR154(snapshot.activeKeys);
    const lastKey = snapshot.activeKeys[snapshot.activeKeys.length - 1];
    setVaultOperationLabelR154(lastKey ? (actionLabelsRefR154.current.get(lastKey) ?? 'Confirmando alteração no Cofre') : '');
  };

  async function runGuardedVaultActionR154<T>(
    options: VaultActionOptionsR154,
    task: () => Promise<T>,
  ): Promise<T | null> {
    if (!actionGuardRef.current.tryAcquire(options.key)) {
      input.setStatus(options.duplicateMessage ?? `${options.label} já está em andamento. Aguarde a confirmação antes de repetir.`);
      return null;
    }
    actionLabelsRefR154.current.set(options.key, options.label);
    syncActionGuardStateR154();
    try {
      return await task();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha inesperada durante a operação.';
      input.setStatus(`${options.label} não foi concluída. ${message} A versão confirmada anterior continua oficial.`);
      return null;
    } finally {
      actionGuardRef.current.release(options.key);
      actionLabelsRefR154.current.delete(options.key);
      syncActionGuardStateR154();
    }
  }

  const getCanonicalVaultHistoryR153 = () => queueRef.current.readCanonical(input.history);

  async function runCanonicalVaultMutationR153<T>(
    mutate: (current: SavedAnalysis[]) => { nextHistory: SavedAnalysis[]; value?: T },
    failureContext = 'Não foi possível confirmar a alteração no Cofre.',
    adoptState = true,
    action?: VaultActionOptionsR154,
  ) {
    const execute = async () => {
      const outcome = await queueRef.current.run(input.history, mutate, commitVaultHistoryR140);
      if (!outcome.ok) {
        input.setStatus(`${failureContext} ${outcome.error ?? 'A memória local recusou a gravação.'} A versão anterior continua sendo a oficial.`);
        return null;
      }
      if (adoptState) input.setHistory(outcome.history);
      return outcome;
    };
    return action ? runGuardedVaultActionR154(action, execute) : execute();
  }

  async function persistAndAdoptVaultHistoryR140(
    nextHistory: SavedAnalysis[],
    failureContext = 'Não foi possível confirmar a alteração no Cofre.',
    rebase?: (current: SavedAnalysis[]) => SavedAnalysis[],
    action?: VaultActionOptionsR154,
  ): Promise<SavedAnalysis[] | null> {
    const committed = await runCanonicalVaultMutationR153(
      (current) => ({ nextHistory: rebase ? rebase(current) : nextHistory }),
      failureContext,
      true,
      action,
    );
    return committed?.history ?? null;
  }

  const [cloudPendingCountR154, setCloudPendingCountR154] = useState(0);
  const cloudLoading = cloudPendingCountR154 > 0;
  const setCloudLoading = (loading: boolean) => {
    setCloudPendingCountR154((current) => loading ? current + 1 : Math.max(0, current - 1));
  };
  const [cloudStatus, setCloudStatus] = useState('Nuvem da conta pronta para sincronizar o Cofre quando você solicitar.');
  const requireSecureAccountCloud = () => {
    if (!input.cloudEnabled) throw new Error('A nuvem segura desta conta não está disponível. O Cofre antigo e compartilhado foi removido.');
  };
  const loadVaultCloudOperationsR166 = async () => {
    const { createVaultCloudOperationsR166 } = await import('@/modules/backup/vaultCloudRuntimeR166');
    return createVaultCloudOperationsR166(
      {
        cloudEnabled: input.cloudEnabled,
        history: input.history,
        setHistory: (history) => input.setHistory(history),
        setStatus: (status) => input.setStatus(status),
        setLibraryOpen: (open) => input.setLibraryOpen(open),
        getCanonicalHistory: getCanonicalVaultHistoryR153,
        commitCanonicalHistory: async (mutate, failureContext) => {
          const committed = await runCanonicalVaultMutationR153((current) => ({ nextHistory: mutate(current) }), failureContext);
          return committed?.history ?? null;
        },
      },
      { setCloudLoading, setCloudStatus },
    );
  };
  const pushCloudHistory = async (items: SavedAnalysis[] = input.history, silent = false) => {
    const cloud = await loadVaultCloudOperationsR166();
    await cloud.pushCloudHistory(items, silent);
  };
  const pullCloudHistory = async () => {
    const cloud = await loadVaultCloudOperationsR166();
    await cloud.pullCloudHistory();
  };
  const syncCloudHistory = async () => {
    const cloud = await loadVaultCloudOperationsR166();
    await cloud.syncCloudHistory();
  };
  const deleteCloudHistoryItem = async (item: SavedAnalysis) => {
    const cloud = await loadVaultCloudOperationsR166();
    await cloud.deleteCloudHistoryItem(item);
  };

  const requestVaultCloudSyncR154 = () => runGuardedVaultActionR154(
    { key: 'cloud-vault-sync', label: 'Sincronizando Cofre com a conta' },
    syncCloudHistory,
  );
  const requestVaultCloudPullR154 = () => runGuardedVaultActionR154(
    { key: 'cloud-vault-pull', label: 'Baixando Cofre da conta' },
    pullCloudHistory,
  );

  return {
    cloudLoading,
    cloudPendingCountR154,
    cloudStatus,
    setCloudLoading,
    setCloudStatus,
    requireSecureAccountCloud,
    pushCloudHistory,
    pullCloudHistory,
    syncCloudHistory,
    deleteCloudHistoryItem,
    runCanonicalVaultMutationR153,
    persistAndAdoptVaultHistoryR140,
    getCanonicalVaultHistoryR153,
    isVaultMutationBusyR153: () => queueRef.current.isBusy(),
    runGuardedVaultActionR154,
    activeVaultActionKeysR154,
    vaultMutationBusyR154: activeVaultActionKeysR154.length > 0,
    vaultOperationLabelR154,
    isVaultActionBusyR154: (key: string) => actionGuardRef.current.isActive(key),
    requestVaultCloudSyncR154,
    requestVaultCloudPullR154,
  };
}
