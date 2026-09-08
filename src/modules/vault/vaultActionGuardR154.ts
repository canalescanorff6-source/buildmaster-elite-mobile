export const VAULT_ACTION_GUARD_R154_VERSION = '40.80-r154-vault-action-guard-v1' as const;

export type VaultActionGuardSnapshotR154 = {
  activeKeys: string[];
  activeCount: number;
};

/**
 * R154 — bloqueia apenas repetições semânticas da MESMA ação enquanto ela ainda está ativa.
 *
 * Não serializa persistência e não vira writer: a fila canônica R153 continua sendo a autoridade
 * de ordenação das transformações e R140 continua sendo a única autoridade de commit local.
 */
export function createVaultActionGuardR154() {
  const active = new Set<string>();

  function normalizeKey(key: string): string {
    return key.trim();
  }

  function tryAcquire(key: string): boolean {
    const normalized = normalizeKey(key);
    if (!normalized) throw new Error('A ação do Cofre precisa de uma chave estável.');
    if (active.has(normalized)) return false;
    active.add(normalized);
    return true;
  }

  function release(key: string): void {
    const normalized = normalizeKey(key);
    if (!normalized) return;
    active.delete(normalized);
  }

  function isActive(key: string): boolean {
    return active.has(normalizeKey(key));
  }

  function snapshot(): VaultActionGuardSnapshotR154 {
    const activeKeys = Array.from(active).sort();
    return { activeKeys, activeCount: activeKeys.length };
  }

  return { tryAcquire, release, isActive, snapshot };
}

export type VaultActionGuardR154 = ReturnType<typeof createVaultActionGuardR154>;
