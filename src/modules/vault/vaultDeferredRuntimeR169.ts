export const VAULT_DEFERRED_RUNTIME_R169_VERSION = '40.80-r169-vault-deferred-runtime-v1' as const;

export type VaultDeferredRuntimeR169 = {
  production: typeof import('./vaultProductionLifecycleR139');
  mutations: typeof import('./vaultHistoryMutationsR129');
};

let runtimePromise: Promise<VaultDeferredRuntimeR169> | null = null;

/**
 * R169: carrega lifecycle de produção e mutações de catálogo somente quando uma ação
 * real do Cofre precisar deles. O histórico, a fila R153 e o commit R140 permanecem
 * fora desta fronteira e continuam sendo as autoridades canônicas.
 */
export function loadVaultDeferredRuntimeR169(): Promise<VaultDeferredRuntimeR169> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import('./vaultProductionLifecycleR139'),
      import('./vaultHistoryMutationsR129'),
    ]).then(([production, mutations]) => ({ production, mutations }));
  }
  return runtimePromise;
}

export function preloadVaultDeferredRuntimeR169(): void {
  void loadVaultDeferredRuntimeR169();
}
