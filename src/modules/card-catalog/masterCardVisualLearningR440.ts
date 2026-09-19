import { createMasterCardCatalogEntryR438, type MasterCardCatalogEntryR438 } from './masterCardCatalogR438';
import type { CardVisualFingerprintR440 } from './cardVisualIdentityR440';

export const MASTER_CARD_VISUAL_LEARNING_R440_VERSION = '40.80-r440-master-card-visual-learning-v1' as const;

function uniqueHashes(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim().toLowerCase()).filter((value) => /^[0-9a-f]{16}$/.test(value))));
}

export function applyCardVisualFingerprintR440(card: MasterCardCatalogEntryR438, fingerprint: CardVisualFingerprintR440 | null | undefined) {
  if (!fingerprint?.hash) return card;
  const currentQuality = Number(card.visualHashQuality) || 0;
  const incomingQuality = Number(fingerprint.quality) || 0;
  const replacePrimary = !card.visualHash || incomingQuality > currentQuality;
  const primary = replacePrimary ? fingerprint.hash : card.visualHash;
  const variants = uniqueHashes([
    ...(card.visualHashVariants ?? []),
    ...(fingerprint.variants ?? []),
    card.visualHash,
    fingerprint.hash
  ]).filter((hash) => hash !== primary).slice(0, 12);
  return createMasterCardCatalogEntryR438({
    ...card,
    visualHash: primary,
    visualHashAlgorithm: replacePrimary ? fingerprint.algorithm : (card.visualHashAlgorithm || fingerprint.algorithm),
    visualHashVariants: variants,
    visualHashQuality: replacePrimary ? incomingQuality : currentQuality,
    updatedAt: new Date().toISOString()
  });
}

export async function saveCardVisualFingerprintR440(card: MasterCardCatalogEntryR438, fingerprint: CardVisualFingerprintR440 | null | undefined) {
  const { saveMasterCardCatalogEntryR438 } = await import('./masterCardCatalogStorageR438');
  return saveMasterCardCatalogEntryR438(applyCardVisualFingerprintR440(card, fingerprint));
}
