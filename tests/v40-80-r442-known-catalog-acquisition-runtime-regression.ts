import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438 } from '../src/modules/card-catalog/masterCardCatalogR438';
import {
  addKnownCatalogCardToMappingR442,
  knownCatalogCardActionR442,
  knownCatalogEditionLabelR442
} from '../src/modules/card-catalog/knownCatalogAcquisitionR442';

const attributes = {
  offensiveAwareness: 90, ballControl: 91, dribbling: 92, tightPossession: 90, lowPass: 86, loftedPass: 82,
  finishing: 94, heading: 80, placeKicking: 84, curl: 88, defensiveAwareness: 55, defensiveEngagement: 58,
  tackling: 50, aggression: 65, goalkeeperAwareness: 40, goalkeeperCatching: 40, goalkeeperParrying: 40,
  goalkeeperReflexes: 40, goalkeeperReach: 40, speed: 89, acceleration: 91, kickingPower: 92, jump: 78,
  physicalContact: 82, balance: 88, stamina: 85
} as any;

const complete = createMasterCardCatalogEntryR438({
  catalogCardId: 'master-r442-cr7-showtime',
  playerName: 'Cristiano Ronaldo',
  cardLabel: 'Show Time 23 Jun 2026',
  cardType: 'Show Time',
  releaseDate: '2026-06-23',
  cardFingerprint: 'card-r126-cr7-showtime-20260623',
  playerFingerprint: 'player-cr7',
  mainPosition: 'CF',
  positions: ['CF', 'SS'],
  offensivePlaystyle: 'Artilheiro',
  overall: 105,
  level: 32,
  trainingPointsTotal: 62,
  attributes,
  nativeSkills: ['Passe de primeira'],
  skillInventoryConfirmed: true,
  confidence: 99,
  sources: ['CATALOG_PATCH']
});
assert.equal(complete.completeness, 'COMPLETE');

const available = knownCatalogCardActionR442(complete, false);
assert.equal(available.primaryAction, 'ADD');
assert.equal(available.canAdd, true);
assert.equal(available.canGenerate, false, 'não deve gerar antes de entrar no Meu Elenco');

const owned = knownCatalogCardActionR442(complete, true);
assert.equal(owned.primaryAction, 'GENERATE');
assert.equal(owned.canAdd, false);
assert.equal(owned.canGenerate, true);

const first = addKnownCatalogCardToMappingR442(complete, []);
assert.equal(first.action, 'created');
assert.equal(first.players.length, 1);
assert.equal(first.player.id, `catalog-${complete.catalogCardId}`);
assert.equal(first.player.name, 'Cristiano Ronaldo');
assert.equal(first.player.sourceFileName, `catalogo-r438-${complete.catalogCardId}`);
assert.equal(first.player.sourceHash, complete.catalogCardId, 'carta sem print deve usar ID estável como fallback, não exigir imagem');

const previous = {
  ...first.player,
  trainedPositions: ['AMF' as const],
  note: 'usar como SA em posse',
  locked: true
};
const again = addKnownCatalogCardToMappingR442(complete, [previous]);
assert.equal(again.action, 'updated');
assert.deepEqual(again.player.trainedPositions, ['AMF']);
assert.equal(again.player.note, 'usar como SA em posse');
assert.equal(again.player.locked, true);
assert.equal(again.players.length, 1, 'repetir adicionar não pode duplicar a mesma edição');

const otherEdition = createMasterCardCatalogEntryR438({
  ...complete,
  catalogCardId: 'master-r442-cr7-epic',
  cardFingerprint: 'card-r126-cr7-epic-20250101',
  cardLabel: 'Epic Portugal',
  cardType: 'Epic',
  releaseDate: '2025-01-01',
  level: 35,
  trainingPointsTotal: 68
});
const secondEdition = addKnownCatalogCardToMappingR442(otherEdition, again.players);
assert.equal(secondEdition.players.length, 2, 'duas versões do mesmo jogador devem permanecer separadas');
assert.notEqual(secondEdition.player.id, again.player.id);

const partial = createMasterCardCatalogEntryR438({
  catalogCardId: 'partial-r442', playerName: 'Neymar Jr', cardFingerprint: 'card-r126-neymar-partial',
  mainPosition: 'LWF', positions: ['LWF'], level: 30, confidence: 70, sources: ['CATALOG_PATCH']
});
const partialOwned = knownCatalogCardActionR442(partial, true);
assert.equal(partialOwned.primaryAction, 'GENERATE');
assert.equal(partialOwned.canGenerate, true);
assert.equal(partialOwned.needsReview, true);

const label = knownCatalogEditionLabelR442(complete);
assert.match(label, /Show Time/i);
assert.match(label, /2026/);
assert.match(label, /105/);
assert.match(label, /62 PP/);

console.log('R442 runtime aprovado: carta conhecida entra no Meu Elenco sem print, preserva edições e só gera ficha depois da posse.');
