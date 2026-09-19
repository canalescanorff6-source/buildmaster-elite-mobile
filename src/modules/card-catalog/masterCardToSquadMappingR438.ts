import type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';
import type { MasterCardCatalogEntryR438 } from './masterCardCatalogR438';

export const MASTER_CARD_TO_SQUAD_MAPPING_R438_VERSION = '40.80-r438-master-card-projection-v1' as const;

export function masterCardToSquadMappingPlayerR438(card: MasterCardCatalogEntryR438, previous?: Partial<SquadMappingPlayer>): SquadMappingPlayer {
  const now = new Date().toISOString();
  return {
    id: previous?.id || `catalog-${card.catalogCardId}`,
    name: card.playerName,
    cardLabel: card.cardLabel || card.cardType || card.catalogCardId,
    cardFingerprint: card.cardFingerprint,
    playerFingerprint: card.playerFingerprint,
    identityStatus: card.cardFingerprint.startsWith('card-r126-') ? 'canonical' : 'provisional',
    mainPosition: card.mainPosition,
    positions: [...card.positions],
    trainedPositions: previous?.trainedPositions ?? [],
    playstyle: card.playstyle || card.offensivePlaystyle || '',
    offensivePlaystyle: card.offensivePlaystyle,
    defensivePlaystyle: card.defensivePlaystyle,
    trainingPointsTotal: card.trainingPointsTotal,
    overall: card.overall,
    confidence: card.confidence,
    status: card.completeness === 'IDENTITY_ONLY' ? 'revisar' : 'pronto',
    portrait: previous?.portrait ?? null,
    sourceFileName: previous?.sourceFileName || `catalogo-r438-${card.catalogCardId}`,
    sourceHash: card.sourceHash || previous?.sourceHash || card.catalogCardId,
    imageRef: card.imageRef,
    imageBytes: previous?.imageBytes ?? 0,
    imageStored: Boolean(card.imageRef || previous?.imageStored),
    attributes: { ...card.attributes },
    positionRatings: { ...card.positionRatings },
    skills: Array.from(new Set([...card.nativeSkills, ...card.additionalSkills, ...card.specialSkills, ...card.unclassifiedSkills])),
    impetos: card.impetos.map((item) => item.name),
    height: card.height,
    weight: card.weight,
    age: card.age,
    level: card.level,
    physicalModel: Object.fromEntries(Object.entries(card.physicalProfile).filter(([, value]) => typeof value === 'number')) as Record<string, number>,
    profileCoverage: card.completeness === 'COMPLETE' ? 100 : card.completeness === 'PARTIAL' ? Math.max(55, card.confidence) : Math.min(54, card.confidence),
    linkedHistoryId: previous?.linkedHistoryId ?? null,
    locked: Boolean(previous?.locked),
    excluded: Boolean(previous?.excluded),
    note: previous?.note || '',
    createdAt: previous?.createdAt || card.createdAt || now,
    updatedAt: now
  };
}
