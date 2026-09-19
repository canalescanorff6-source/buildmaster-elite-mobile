import type { AttributeKey, PositionCode } from '@/lib/analyzerDomain';
import { createMasterCardCatalogEntryR438, mergeMasterCardCatalogEntryR438, sameMasterCardEditionR438, type MasterCardCatalogEntryR438 } from './masterCardCatalogR438';
import { saveMasterCardCatalogEntryR438, loadMasterCardCatalogR438 } from './masterCardCatalogStorageR438';
import { loadOwnedCardCollectionR438, setOwnedCardR438, type OwnedCardRecordR438 } from './ownedCardCollectionR438';

export const MASTER_CARD_MIGRATION_R438_VERSION = '40.80-r438-master-card-migration-v1' as const;

type SquadMappingCardR438 = {
  id: string; name: string; cardLabel: string; cardFingerprint: string; playerFingerprint: string; identityStatus?: 'canonical' | 'provisional';
  mainPosition: PositionCode; positions: PositionCode[]; positionRatings?: Partial<Record<PositionCode, number>>; playstyle: string;
  offensivePlaystyle?: string | null; defensivePlaystyle?: string | null; overall?: number | null; level?: number | null; trainingPointsTotal?: number | null;
  attributes: Partial<Record<AttributeKey, number>>; skills: string[]; impetos: string[]; height?: number | null; weight?: number | null; age?: number | null;
  physicalModel?: Record<string, number>; imageRef?: string | null; portrait?: string | null; sourceHash?: string | null; linkedHistoryId?: string | null;
  confidence?: number; profileCoverage?: number;
};

export function squadMappingCardToMasterCardR438(player: SquadMappingCardR438): MasterCardCatalogEntryR438 {
  const skillsConfirmed = player.identityStatus === 'canonical' || Boolean(player.linkedHistoryId);
  return createMasterCardCatalogEntryR438({
    playerName: player.name,
    cardLabel: player.cardLabel,
    cardType: '', specialTag: null, country: null, releaseDate: null,
    cardFingerprint: player.cardFingerprint,
    playerFingerprint: player.playerFingerprint,
    mainPosition: player.mainPosition,
    positions: player.positions,
    positionRatings: player.positionRatings ?? {},
    playstyle: player.playstyle || null,
    offensivePlaystyle: player.offensivePlaystyle || player.playstyle || null,
    defensivePlaystyle: player.defensivePlaystyle || null,
    defensivePlaystyleConfirmed: Boolean(player.defensivePlaystyle),
    overall: player.overall ?? null,
    level: player.level ?? null,
    trainingPointsTotal: player.trainingPointsTotal ?? null,
    attributes: player.attributes,
    nativeSkills: skillsConfirmed ? player.skills : [],
    additionalSkills: [],
    specialSkills: [],
    unclassifiedSkills: skillsConfirmed ? [] : player.skills,
    skillInventoryConfirmed: skillsConfirmed,
    impetos: player.impetos.map((name) => ({ name })),
    boosters: [],
    height: player.height ?? null,
    weight: player.weight ?? null,
    age: player.age ?? null,
    condition: {},
    physicalProfile: player.physicalModel ?? {},
    imageRef: player.imageRef ?? null,
    portraitRef: player.portrait?.startsWith('data:image/') ? `legacy-inline:${player.sourceHash || player.id}` : null,
    sourceHash: player.sourceHash ?? null,
    confidence: Math.max(0, Math.min(100, Math.round(Number(player.confidence) || Number(player.profileCoverage) || 0))),
    sources: ['MIGRATED_SQUAD_MAPPING']
  });
}

export function planSquadMappingMigrationR438(players: SquadMappingCardR438[], existingCatalog: MasterCardCatalogEntryR438[] = [], existingOwned: OwnedCardRecordR438[] = []) {
  let catalog = [...existingCatalog];
  const owned = new Map(existingOwned.map((item) => [item.catalogCardId, item]));
  for (const player of players) {
    const incoming = squadMappingCardToMasterCardR438(player);
    const index = catalog.findIndex((item) => sameMasterCardEditionR438(item, incoming));
    const resolved = index >= 0 ? mergeMasterCardCatalogEntryR438(catalog[index], incoming) : incoming;
    if (index >= 0) catalog = catalog.map((item, itemIndex) => itemIndex === index ? resolved : item);
    else catalog = [resolved, ...catalog];
    const previous = owned.get(resolved.catalogCardId);
    owned.set(resolved.catalogCardId, { catalogCardId: resolved.catalogCardId, owned: true, favorite: previous?.favorite ?? false, addedAt: previous?.addedAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), note: previous?.note ?? '' });
  }
  return { catalog, owned: [...owned.values()] };
}

export async function migrateSquadMappingToMasterCatalogR438(players: SquadMappingCardR438[]) {
  const existingCatalog = await loadMasterCardCatalogR438();
  const existingOwned = await loadOwnedCardCollectionR438();
  const plan = planSquadMappingMigrationR438(players, existingCatalog, existingOwned);
  for (const entry of plan.catalog) await saveMasterCardCatalogEntryR438(entry);
  for (const item of plan.owned) await setOwnedCardR438(item.catalogCardId, item);
  return { catalog: await loadMasterCardCatalogR438(), owned: await loadOwnedCardCollectionR438(), migratedCount: players.length, ownedCount: plan.owned.length };
}

export async function upsertOwnedMasterCardFromSquadMappingR438(player: SquadMappingCardR438) {
  const entry = await saveMasterCardCatalogEntryR438(squadMappingCardToMasterCardR438(player));
  await setOwnedCardR438(entry.catalogCardId);
  return entry;
}
