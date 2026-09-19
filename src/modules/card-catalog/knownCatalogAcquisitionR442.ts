import type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';
import type { MasterCardCatalogEntryR438 } from './masterCardCatalogR438';
import { masterCardToSquadMappingPlayerR438 } from './masterCardToSquadMappingR438';

export const KNOWN_CATALOG_ACQUISITION_R442_VERSION = '40.80-r442-known-catalog-acquisition-v1' as const;

export type KnownCatalogPrimaryActionR442 = 'ADD' | 'GENERATE' | 'REVIEW';

export type KnownCatalogCardActionR442 = {
  owned: boolean;
  complete: boolean;
  canAdd: boolean;
  canGenerate: boolean;
  needsReview: boolean;
  primaryAction: KnownCatalogPrimaryActionR442;
};

export function knownCatalogCardActionR442(card: MasterCardCatalogEntryR438, owned: boolean): KnownCatalogCardActionR442 {
  const complete = card.completeness === 'COMPLETE' && card.missingFields.length === 0;
  if (!owned) {
    return { owned: false, complete, canAdd: true, canGenerate: false, needsReview: !complete, primaryAction: 'ADD' };
  }
  if (complete) {
    return { owned: true, complete: true, canAdd: false, canGenerate: true, needsReview: false, primaryAction: 'GENERATE' };
  }
  return { owned: true, complete: false, canAdd: false, canGenerate: false, needsReview: true, primaryAction: 'REVIEW' };
}

function sameProjectedEditionR442(card: MasterCardCatalogEntryR438, player: SquadMappingPlayer) {
  if (player.id === `catalog-${card.catalogCardId}`) return true;
  if (card.cardFingerprint.startsWith('card-r126-') && player.cardFingerprint === card.cardFingerprint) return true;
  if (card.sourceHash && player.sourceHash === card.sourceHash) return true;
  return false;
}

export function addKnownCatalogCardToMappingR442(card: MasterCardCatalogEntryR438, players: SquadMappingPlayer[]) {
  const index = players.findIndex((player) => sameProjectedEditionR442(card, player));
  const previous = index >= 0 ? players[index] : undefined;
  const player = masterCardToSquadMappingPlayerR438(card, previous);
  if (index < 0) return { action: 'created' as const, player, players: [player, ...players] };
  const next = [...players];
  next[index] = player;
  return { action: 'updated' as const, player, players: next };
}

function releaseDateLabel(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function knownCatalogEditionLabelR442(card: MasterCardCatalogEntryR438) {
  return [
    card.cardLabel || card.cardType || 'Edição sem rótulo',
    releaseDateLabel(card.releaseDate),
    card.mainPosition,
    card.overall !== null ? `${Math.round(card.overall)} OVR` : null,
    card.level !== null ? `nível ${card.level}` : null,
    card.trainingPointsTotal !== null ? `${card.trainingPointsTotal} PP` : null
  ].filter(Boolean).join(' • ');
}
