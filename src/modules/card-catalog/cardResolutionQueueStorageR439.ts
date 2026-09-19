import { runtimeDelete, runtimeGet, runtimeList, runtimePut } from '@/lib/localDatabase';
import { createResolutionQueueItemR439, mergeResolutionQueueItemR439, type CardResolutionQueueItemR439 } from './cardResolutionQueueR439';

export const CARD_RESOLUTION_QUEUE_STORAGE_R439_VERSION = '40.80-r439-card-resolution-storage-v1' as const;
export const CARD_RESOLUTION_PREFIX_R439 = 'card-resolution:v1:';

function key(sourceHash: string) {
  return `${CARD_RESOLUTION_PREFIX_R439}${String(sourceHash).trim().toLowerCase()}`;
}

export async function loadCardResolutionQueueR439() {
  const rows = await runtimeList<CardResolutionQueueItemR439>('cards', Number.MAX_SAFE_INTEGER);
  return rows
    .filter((row) => String(row.key).startsWith(CARD_RESOLUTION_PREFIX_R439))
    .map((row) => row.value)
    .filter((item): item is CardResolutionQueueItemR439 => Boolean(item?.sourceHash && item?.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCardResolutionQueueItemR439(input: CardResolutionQueueItemR439) {
  const storageKey = key(input.sourceHash);
  const existing = await runtimeGet<CardResolutionQueueItemR439>('cards', storageKey).catch(() => null);
  const normalized = createResolutionQueueItemR439({
    sourceHash: input.sourceHash,
    sourceFileName: input.sourceFileName,
    observation: input.observation,
    resolution: input.resolution,
    createdAt: input.createdAt
  });
  const resolved = existing ? mergeResolutionQueueItemR439(existing, { ...normalized, status: input.status, selectedCatalogCardId: input.selectedCatalogCardId }) : { ...normalized, status: input.status, selectedCatalogCardId: input.selectedCatalogCardId };
  await runtimePut('cards', storageKey, resolved);
  return resolved;
}

export async function removeCardResolutionQueueItemR439(sourceHash: string) {
  await runtimeDelete('cards', key(sourceHash));
}
