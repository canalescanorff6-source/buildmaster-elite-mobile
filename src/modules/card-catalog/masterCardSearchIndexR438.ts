import type { MasterCardCatalogEntryR438 } from './masterCardCatalogR438';

export const MASTER_CARD_SEARCH_INDEX_R438_VERSION = '40.80-r438-master-card-search-v1' as const;

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function masterCardSearchDocumentR438(card: MasterCardCatalogEntryR438) {
  return normalize([
    card.playerName, card.cardLabel, card.cardType, card.specialTag, card.country, card.releaseDate,
    card.mainPosition, ...card.positions, card.playstyle, card.offensivePlaystyle, card.defensivePlaystyle,
    ...card.nativeSkills, ...card.additionalSkills, ...card.specialSkills, ...card.unclassifiedSkills,
    ...card.impetos.map((item) => item.name), ...card.boosters, card.catalogCardId, card.cardFingerprint
  ].filter(Boolean).join(' '));
}

export function searchMasterCardsR438(cards: MasterCardCatalogEntryR438[], query: string) {
  const term = normalize(query);
  if (!term) return [...cards];
  const tokens = term.split(' ').filter(Boolean);
  return cards
    .map((card) => {
      const doc = masterCardSearchDocumentR438(card);
      if (!tokens.every((token) => doc.includes(token))) return null;
      const name = normalize(card.playerName);
      const label = normalize(card.cardLabel);
      let score = 10;
      if (name === term) score += 100;
      else if (name.startsWith(term)) score += 70;
      else if (name.includes(term)) score += 50;
      if (label === term) score += 35;
      else if (label.includes(term)) score += 20;
      if (card.completeness === 'COMPLETE') score += 5;
      return { card, score };
    })
    .filter((item): item is { card: MasterCardCatalogEntryR438; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score || a.card.playerName.localeCompare(b.card.playerName, 'pt-BR') || a.card.cardLabel.localeCompare(b.card.cardLabel, 'pt-BR'))
    .map((item) => item.card);
}
