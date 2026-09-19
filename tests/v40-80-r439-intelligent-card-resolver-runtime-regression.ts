import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438 } from '../src/modules/card-catalog/masterCardCatalogR438';
import {
  resolveMasterCardObservationR439,
  parseQuickIdentityHintsR439,
  type MasterCardIdentityObservationR439
} from '../src/modules/card-catalog/cardIdentityResolverR439';

const attrs = {
  offensiveAwareness: 90, ballControl: 89, dribbling: 88, tightPossession: 87, lowPass: 84, loftedPass: 80,
  finishing: 94, heading: 84, placeKicking: 80, curl: 87, defensiveAwareness: 45, defensiveEngagement: 50,
  tackling: 44, aggression: 62, goalkeeperAwareness: 40, goalkeeperCatching: 40, goalkeeperParrying: 40,
  goalkeeperReflexes: 40, goalkeeperReach: 40, speed: 89, acceleration: 88, kickingPower: 92, jump: 86,
  physicalContact: 84, balance: 82, stamina: 85
};

function card(input: Partial<Parameters<typeof createMasterCardCatalogEntryR438>[0]> & { catalogCardId: string; cardLabel: string; releaseDate: string; playstyle: string; level: number }) {
  return createMasterCardCatalogEntryR438({
    playerName: 'Cristiano Ronaldo', mainPosition: 'CF', cardFingerprint: `card-r126-${input.catalogCardId}`,
    playerFingerprint: 'player-r126-cr7', positions: ['CF', 'SS'], attributes: attrs, nativeSkills: ['Chute de primeira'],
    skillInventoryConfirmed: true, trainingPointsTotal: null, confidence: 99, sources: ['CATALOG_PATCH'],
    ...input
  });
}

const showTime = card({ catalogCardId: 'cr7-showtime-2026', cardLabel: "Show Time • 23 Jun '26", releaseDate: '2026-06-23', playstyle: 'Artilheiro', level: 32, overall: 107, cardType: 'Show Time' });
const epic = card({ catalogCardId: 'cr7-epic-2025', cardLabel: "Epic Portugal • 12 Dec '25", releaseDate: '2025-12-12', playstyle: 'Homem de Área', level: 35, overall: 106, cardType: 'Epic' });

const byHash = resolveMasterCardObservationR439({ sourceHash: 'abc123', playerName: '', mainPosition: null }, [
  { ...showTime, sourceHash: 'abc123' }, epic
]);
assert.equal(byHash.status, 'RESOLVED');
assert.equal(byHash.action, 'USE_CATALOG');
assert.equal(byHash.selectedCatalogCardId, 'cr7-showtime-2026');
assert.equal(byHash.reason, 'SOURCE_HASH_EXACT');

const observed: MasterCardIdentityObservationR439 = {
  sourceHash: 'new-print', playerName: 'Cristiano Ronaldo', mainPosition: 'CF', releaseDate: '2026-06-23',
  cardType: 'Show Time', cardLabel: "23 Jun '26 Show Time", playstyle: 'Artilheiro', overall: 107, level: 32, country: 'Portugal'
};
const exact = resolveMasterCardObservationR439(observed, [showTime, epic]);
assert.equal(exact.status, 'RESOLVED');
assert.equal(exact.selectedCatalogCardId, 'cr7-showtime-2026');
assert.ok(exact.confidence >= 90);
assert.equal(exact.action, 'USE_CATALOG');

const ambiguous = resolveMasterCardObservationR439({ sourceHash: 'x', playerName: 'Cristiano Ronaldo', mainPosition: 'CF' }, [showTime, epic]);
assert.equal(ambiguous.status, 'AMBIGUOUS');
assert.equal(ambiguous.candidates.length, 2);
assert.equal(ambiguous.action, 'CHOOSE_CANDIDATE');

const unknown = resolveMasterCardObservationR439({ sourceHash: 'z', playerName: 'Aubameyang', mainPosition: 'CF' }, [showTime, epic]);
assert.equal(unknown.status, 'NEW_CARD');
assert.equal(unknown.action, 'FULL_OCR');

const poor = resolveMasterCardObservationR439({ sourceHash: 'p', playerName: '', mainPosition: null }, [showTime, epic]);
assert.equal(poor.status, 'NEEDS_REVIEW');
assert.equal(poor.action, 'REVIEW_IDENTITY');

const partial = createMasterCardCatalogEntryR438({
  playerName: 'Cristiano Ronaldo', mainPosition: 'CF', sourceHash: 'partial-source', cardFingerprint: 'card-r126-partial',
  playerFingerprint: 'player-r126-cr7', positions: ['CF'], cardLabel: 'Show Time parcial', cardType: 'Show Time', releaseDate: '2026-06-23',
  playstyle: 'Artilheiro', level: 32, attributes: { finishing: 94 }, nativeSkills: [], skillInventoryConfirmed: false, confidence: 80,
  sources: ['CATALOG_PATCH']
});
const partialResolution = resolveMasterCardObservationR439({ sourceHash: 'partial-source', playerName: 'Cristiano Ronaldo', mainPosition: 'CF' }, [partial]);
assert.equal(partialResolution.status, 'RESOLVED');
assert.equal(partialResolution.action, 'FULL_OCR');

const parsed = parseQuickIdentityHintsR439("Cristiano Ronaldo\nShow Time\n23 Jun '26\nCF\nArtilheiro\nOverall 107\nLevel 32\nPortugal");
assert.equal(parsed.releaseDate, '2026-06-23');
assert.equal(parsed.cardType, 'Show Time');
assert.equal(parsed.overall, 107);
assert.equal(parsed.level, 32);
assert.equal(parsed.country, 'Portugal');

console.log('R439 runtime aprovado: resolução rápida por hash/evidência, ambiguidade preservada e fallback OCR somente quando necessário.');
