import { runtimeDelete, runtimeList, runtimePut } from '@/lib/localDatabase';

export const OWNED_CARD_COLLECTION_R438_VERSION = '40.80-r438-owned-card-collection-v1' as const;
export const OWNED_CARD_PREFIX_R438 = 'owned-card:v1:';

export type OwnedCardRecordR438 = {
  catalogCardId: string;
  owned: true;
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
  note: string;
};

export function createOwnedCardRecordR438(catalogCardId: string, current?: Partial<OwnedCardRecordR438>): OwnedCardRecordR438 {
  const now = new Date().toISOString();
  return {
    catalogCardId: String(catalogCardId).trim(),
    owned: true,
    favorite: Boolean(current?.favorite),
    addedAt: String(current?.addedAt || now),
    updatedAt: now,
    note: String(current?.note ?? '').slice(0, 1000)
  };
}

export async function loadOwnedCardCollectionR438() {
  const rows = await runtimeList<OwnedCardRecordR438>('cards', Number.MAX_SAFE_INTEGER);
  return rows.filter((row) => String(row.key).startsWith(OWNED_CARD_PREFIX_R438) && row.value?.owned === true).map((row) => row.value);
}

export async function setOwnedCardR438(catalogCardId: string, current?: Partial<OwnedCardRecordR438>) {
  const record = createOwnedCardRecordR438(catalogCardId, current);
  await runtimePut('cards', `${OWNED_CARD_PREFIX_R438}${record.catalogCardId}`, record);
  return record;
}

export async function removeOwnedCardR438(catalogCardId: string) {
  await runtimeDelete('cards', `${OWNED_CARD_PREFIX_R438}${catalogCardId}`);
}
