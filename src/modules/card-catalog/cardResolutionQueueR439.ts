import type { MasterCardIdentityObservationR439, MasterCardResolutionR439 } from './cardIdentityResolverR439';

export const CARD_RESOLUTION_QUEUE_R439_VERSION = '40.80-r439-card-resolution-queue-v1' as const;

export type CardResolutionQueueStatusR439 = 'PENDING' | 'RESOLVED' | 'NEW_CARD';
export type CardResolutionQueueItemR439 = {
  id: string;
  sourceHash: string;
  sourceFileName: string;
  observation: MasterCardIdentityObservationR439;
  resolution: MasterCardResolutionR439;
  candidateIds: string[];
  status: CardResolutionQueueStatusR439;
  selectedCatalogCardId: string | null;
  createdAt: string;
  updatedAt: string;
};

function cleanHash(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function queueId(sourceHash: string) {
  return `resolution-r439-${cleanHash(sourceHash)}`;
}

export function createResolutionQueueItemR439(input: {
  sourceHash: string;
  sourceFileName: string;
  observation: MasterCardIdentityObservationR439;
  resolution: MasterCardResolutionR439;
  createdAt?: string;
}): CardResolutionQueueItemR439 {
  const now = new Date().toISOString();
  const sourceHash = cleanHash(input.sourceHash);
  const status: CardResolutionQueueStatusR439 = input.resolution.status === 'NEW_CARD' ? 'NEW_CARD' : input.resolution.status === 'RESOLVED' ? 'RESOLVED' : 'PENDING';
  return {
    id: queueId(sourceHash),
    sourceHash,
    sourceFileName: String(input.sourceFileName ?? '').slice(0, 180),
    observation: { ...input.observation, sourceHash },
    resolution: input.resolution,
    candidateIds: input.resolution.candidates.map((item) => item.catalogCardId),
    status,
    selectedCatalogCardId: input.resolution.selectedCatalogCardId,
    createdAt: String(input.createdAt || now),
    updatedAt: now
  };
}

export function mergeResolutionQueueItemR439(left: CardResolutionQueueItemR439, right: CardResolutionQueueItemR439) {
  if (cleanHash(left.sourceHash) !== cleanHash(right.sourceHash)) throw new Error('R439: não é permitido mesclar resoluções de imagens diferentes.');
  return {
    ...left,
    ...right,
    id: left.id,
    createdAt: left.createdAt,
    candidateIds: Array.from(new Set([...left.candidateIds, ...right.candidateIds])),
    updatedAt: new Date().toISOString()
  };
}

export function resolveQueueCandidateR439(item: CardResolutionQueueItemR439, catalogCardId: string) {
  if (!item.candidateIds.includes(catalogCardId)) throw new Error('R439: a carta escolhida não pertence às candidatas desta resolução.');
  return {
    ...item,
    status: 'RESOLVED' as const,
    selectedCatalogCardId: catalogCardId,
    resolution: { ...item.resolution, status: 'RESOLVED' as const, action: 'USE_CATALOG' as const, selectedCatalogCardId: catalogCardId, reason: 'IDENTITY_SCORE' as const },
    updatedAt: new Date().toISOString()
  };
}

export function resolutionQueueSummaryR439(items: CardResolutionQueueItemR439[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    resolved: items.filter((item) => item.status === 'RESOLVED').length,
    newCards: items.filter((item) => item.status === 'NEW_CARD').length,
    needsReview: items.filter((item) => item.status === 'PENDING' && item.resolution.status === 'NEEDS_REVIEW').length
  };
}
