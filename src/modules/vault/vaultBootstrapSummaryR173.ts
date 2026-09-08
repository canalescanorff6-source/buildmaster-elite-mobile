export const VAULT_BOOTSTRAP_SUMMARY_R173_VERSION = '40.80-r173-vault-bootstrap-summary-v1' as const;

export type VaultBootstrapEntryR173 = {
  id: string;
  folderId?: string;
  result: {
    parsed: {
      playerName: string;
    };
  };
};

export type VaultBootstrapSummaryR173 = {
  players: number;
  fichas: number;
  archived: number;
};

function normalizeVaultPlayerNameR173(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cleanVaultPlayerKeyR173(entry: VaultBootstrapEntryR173): string {
  return normalizeVaultPlayerNameR173(entry.result.parsed.playerName) || `sem-nome-${entry.id}`;
}

export function buildVaultBootstrapSummaryR173<T extends VaultBootstrapEntryR173>(entries: T[]): VaultBootstrapSummaryR173 {
  const active = entries.filter((entry) => entry.folderId !== 'arquivados');
  return {
    players: new Set(active.map(cleanVaultPlayerKeyR173)).size,
    fichas: active.length,
    archived: entries.length - active.length,
  };
}
