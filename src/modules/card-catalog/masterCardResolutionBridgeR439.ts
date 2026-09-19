import { createMasterCardCatalogEntryR438, type MasterCardCatalogEntryR438 } from './masterCardCatalogR438';
import { squadMappingCardToMasterCardR438 } from './masterCardMigrationR438';
import { saveMasterCardCatalogEntryR438 } from './masterCardCatalogStorageR438';
import { setOwnedCardR438 } from './ownedCardCollectionR438';

export const MASTER_CARD_RESOLUTION_BRIDGE_R439_VERSION = '40.80-r439-master-card-resolution-bridge-v1' as const;

type SquadMappingInputR439 = Parameters<typeof squadMappingCardToMasterCardR438>[0];

export async function saveResolvedFullOcrCardR439(player: SquadMappingInputR439, selected?: MasterCardCatalogEntryR438 | null) {
  const incoming = squadMappingCardToMasterCardR438(player);
  const entry = selected ? createMasterCardCatalogEntryR438({
    ...incoming,
    catalogCardId: selected.catalogCardId,
    cardFingerprint: selected.cardFingerprint.startsWith('card-r126-') ? selected.cardFingerprint : incoming.cardFingerprint,
    playerFingerprint: selected.playerFingerprint || incoming.playerFingerprint,
    playerName: selected.playerName || incoming.playerName,
    cardLabel: selected.cardLabel || incoming.cardLabel,
    cardType: selected.cardType || incoming.cardType,
    specialTag: selected.specialTag || incoming.specialTag,
    country: selected.country || incoming.country,
    releaseDate: selected.releaseDate || incoming.releaseDate,
    playstyle: incoming.playstyle || selected.playstyle,
    offensivePlaystyle: incoming.offensivePlaystyle || selected.offensivePlaystyle,
    defensivePlaystyle: incoming.defensivePlaystyle || selected.defensivePlaystyle,
    sources: Array.from(new Set([...selected.sources, ...incoming.sources, 'OCR_IMPORT']))
  }) : createMasterCardCatalogEntryR438({ ...incoming, sources: Array.from(new Set([...incoming.sources, 'OCR_IMPORT'])) });
  const saved = await saveMasterCardCatalogEntryR438(entry);
  await setOwnedCardR438(saved.catalogCardId);
  return saved;
}
