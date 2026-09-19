import { runtimeGet, runtimeList, runtimePut } from '@/lib/localDatabase';
import { createMasterCardCatalogEntryR438, mergeMasterCardCatalogEntryR438, type MasterCardCatalogEntryR438 } from './masterCardCatalogR438';

export const MASTER_CARD_STORAGE_R438_VERSION = '40.80-r438-master-card-storage-v1' as const;
export const MASTER_CARD_PREFIX_R438 = 'master-card:v1:';
export const MASTER_CARD_INDEX_KEY_R438 = 'master-card-index:v1';
export const MASTER_CARD_META_KEY_R438 = 'master-card-meta:v1';

type MasterCardIndexItemR438 = { catalogCardId: string; playerName: string; cardLabel: string; completeness: MasterCardCatalogEntryR438['completeness']; updatedAt: string };

export async function loadMasterCardCatalogR438() {
  const rows = await runtimeList<MasterCardCatalogEntryR438>('cards', Number.MAX_SAFE_INTEGER);
  return rows
    .filter((row) => String(row.key).startsWith(MASTER_CARD_PREFIX_R438))
    .map((row) => createMasterCardCatalogEntryR438(row.value))
    .sort((a, b) => a.playerName.localeCompare(b.playerName, 'pt-BR') || a.cardLabel.localeCompare(b.cardLabel, 'pt-BR'));
}

async function updateIndexR438(entry: MasterCardCatalogEntryR438) {
  const current = await runtimeGet<MasterCardIndexItemR438[]>('cards', MASTER_CARD_INDEX_KEY_R438).catch(() => null) ?? [];
  const next = [
    { catalogCardId: entry.catalogCardId, playerName: entry.playerName, cardLabel: entry.cardLabel, completeness: entry.completeness, updatedAt: entry.updatedAt },
    ...current.filter((item) => item.catalogCardId !== entry.catalogCardId)
  ];
  await runtimePut('cards', MASTER_CARD_INDEX_KEY_R438, next);
  await runtimePut('cards', MASTER_CARD_META_KEY_R438, { schemaVersion: 1, version: MASTER_CARD_STORAGE_R438_VERSION, count: next.length, updatedAt: new Date().toISOString() });
}

export async function saveMasterCardCatalogEntryR438(input: MasterCardCatalogEntryR438) {
  const entry = createMasterCardCatalogEntryR438(input);
  const key = `${MASTER_CARD_PREFIX_R438}${entry.catalogCardId}`;
  const existing = await runtimeGet<MasterCardCatalogEntryR438>('cards', key).catch(() => null);
  const resolved = existing ? mergeMasterCardCatalogEntryR438(createMasterCardCatalogEntryR438(existing), entry) : entry;
  await runtimePut('cards', key, resolved);
  await updateIndexR438(resolved);
  return resolved;
}
