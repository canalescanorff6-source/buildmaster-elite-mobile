import type { MasterCardCatalogEntryR438 } from './masterCardCatalogR438';
import { resolveMasterCardObservationR439, type MasterCardIdentityObservationR439, type MasterCardResolutionR439 } from './cardIdentityResolverR439';
import { visualFingerprintSimilarityR440, type CardVisualFingerprintR440 } from './cardVisualIdentityR440';

export const CARD_IDENTITY_RESOLVER_R440_VERSION = '40.80-r440-visual-card-resolver-v1' as const;

export type MasterCardIdentityObservationR440 = MasterCardIdentityObservationR439 & {
  visualFingerprint?: CardVisualFingerprintR440 | null;
};

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function candidatePool(observation: MasterCardIdentityObservationR440, catalog: MasterCardCatalogEntryR438[]) {
  const name = normalize(observation.playerName);
  if (!name) return catalog;
  const samePlayer = catalog.filter((card) => {
    const cardName = normalize(card.playerName);
    return cardName === name || cardName.includes(name) || name.includes(cardName);
  });
  return samePlayer.length ? samePlayer : catalog;
}

function visualCandidates(observation: MasterCardIdentityObservationR440, catalog: MasterCardCatalogEntryR438[]) {
  const fingerprint = observation.visualFingerprint;
  if (!fingerprint || fingerprint.quality < 55) return [];
  return candidatePool(observation, catalog)
    .map((card) => ({ card, similarity: visualFingerprintSimilarityR440(fingerprint, card) }))
    .filter((item) => item.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity || left.card.catalogCardId.localeCompare(right.card.catalogCardId));
}

export function resolveMasterCardObservationR440(observation: MasterCardIdentityObservationR440, catalog: MasterCardCatalogEntryR438[]): MasterCardResolutionR439 {
  const base = resolveMasterCardObservationR439(observation, catalog);
  if (base.reason === 'SOURCE_HASH_EXACT' || base.reason === 'CARD_FINGERPRINT_EXACT') return base;
  const ranked = visualCandidates(observation, catalog);
  const top = ranked[0];
  if (!top) return base;
  const second = ranked[1];
  const margin = top.similarity - (second?.similarity ?? 0);
  const confidence = Math.min(100, Math.round(top.similarity * .92 + Math.min(8, observation.visualFingerprint?.quality ?? 0) * .08));
  if (top.similarity >= 90 && (margin >= 8 || !second || second.similarity < 82)) {
    return {
      status: 'RESOLVED',
      action: top.card.completeness === 'COMPLETE' ? 'USE_CATALOG' : 'FULL_OCR',
      reason: 'VISUAL_FINGERPRINT_MATCH',
      selectedCatalogCardId: top.card.catalogCardId,
      confidence,
      candidates: ranked.slice(0, 5).map((item) => ({
        catalogCardId: item.card.catalogCardId,
        score: item.similarity,
        reasons: [`arte da carta ${item.similarity}%`],
        completeness: item.card.completeness
      }))
    };
  }
  if (top.similarity >= 82 && second && margin < 8) {
    return {
      status: 'AMBIGUOUS',
      action: 'CHOOSE_CANDIDATE',
      reason: 'VISUAL_FINGERPRINT_AMBIGUOUS',
      selectedCatalogCardId: null,
      confidence: top.similarity,
      candidates: ranked.slice(0, 5).map((item) => ({
        catalogCardId: item.card.catalogCardId,
        score: item.similarity,
        reasons: [`arte da carta ${item.similarity}%`],
        completeness: item.card.completeness
      }))
    };
  }
  return base;
}
