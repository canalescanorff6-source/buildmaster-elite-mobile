import assert from 'node:assert/strict';
import {
  differenceHash64FromLumaR440,
  hammingDistanceHexR440,
  visualHashSimilarityR440,
  type CardVisualFingerprintR440
} from '../src/modules/card-catalog/cardVisualIdentityR440';
import { resolveMasterCardObservationR440 } from '../src/modules/card-catalog/cardIdentityResolverR440';
import { createMasterCardCatalogEntryR438 } from '../src/modules/card-catalog/masterCardCatalogR438';

const baseLuma = Array.from({ length: 72 }, (_, index) => {
  const x = index % 9;
  const y = Math.floor(index / 9);
  return x * 18 + y * 5 + ((x + y) % 3) * 2;
});
const compressedLuma = baseLuma.map((value, index) => value + (index % 7 === 0 ? 3 : index % 11 === 0 ? -2 : 0));
const otherLuma = baseLuma.map((value, index) => 255 - value + (index % 2 ? 12 : -12));

const hashA = differenceHash64FromLumaR440(baseLuma, 9, 8);
const hashB = differenceHash64FromLumaR440(compressedLuma, 9, 8);
const hashOther = differenceHash64FromLumaR440(otherLuma, 9, 8);
assert.equal(hashA.length, 16, 'dHash 64-bit deve usar 16 caracteres hexadecimais.');
assert.ok(hammingDistanceHexR440(hashA, hashB) <= 6, 'Compressão/pequeno ruído deve manter distância visual curta.');
assert.ok(visualHashSimilarityR440(hashA, hashB) >= 90, 'Mesma arte com ruído leve deve preservar similaridade alta.');
assert.ok(visualHashSimilarityR440(hashA, hashOther) < 60, 'Arte visualmente oposta não pode parecer a mesma edição.');

const visual = (hash: string): CardVisualFingerprintR440 => ({ algorithm: 'dhash64-v1', hash, quality: 92 });
const common = {
  playerName: 'Cristiano Ronaldo',
  mainPosition: 'CF' as const,
  positions: ['CF' as const],
  level: 32,
  trainingPointsTotal: 62,
  attributes: Object.fromEntries([
    'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading','placeKicking','curl',
    'defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach',
    'speed','acceleration','kickingPower','jump','physicalContact','balance','stamina'
  ].map((key, index) => [key, 70 + (index % 18)])),
  nativeSkills: ['Finalização de primeira'],
  additionalSkills: [],
  specialSkills: [],
  skillInventoryConfirmed: true,
  sourceHash: null
};
const cardA = createMasterCardCatalogEntryR438({
  ...common,
  catalogCardId: 'cr7-a',
  cardFingerprint: 'provisional-a',
  cardLabel: 'Show Time A',
  cardType: 'Show Time',
  playstyle: 'Artilheiro',
  visualHash: hashA,
  visualHashAlgorithm: 'dhash64-v1',
  visualHashQuality: 94
});
const cardB = createMasterCardCatalogEntryR438({
  ...common,
  catalogCardId: 'cr7-b',
  cardFingerprint: 'provisional-b',
  cardLabel: 'Show Time B',
  cardType: 'Show Time',
  playstyle: 'Artilheiro',
  visualHash: hashOther,
  visualHashAlgorithm: 'dhash64-v1',
  visualHashQuality: 94
});

const resolved = resolveMasterCardObservationR440({
  playerName: 'Cristiano Ronaldo',
  mainPosition: 'CF',
  cardType: 'Show Time',
  playstyle: 'Artilheiro',
  visualFingerprint: visual(hashB)
}, [cardA, cardB]);
assert.equal(resolved.status, 'RESOLVED');
assert.equal(resolved.selectedCatalogCardId, 'cr7-a', 'A assinatura visual deve desempatar versões textualmente quase idênticas.');
assert.equal(resolved.reason, 'VISUAL_FINGERPRINT_MATCH');
assert.ok(resolved.confidence >= 92);

const noVisual = resolveMasterCardObservationR440({
  playerName: 'Cristiano Ronaldo',
  mainPosition: 'CF',
  cardType: 'Show Time',
  playstyle: 'Artilheiro'
}, [cardA, cardB]);
assert.equal(noVisual.status, 'AMBIGUOUS', 'Sem evidência visual suficiente, o sistema deve preservar a ambiguidade.');

console.log('R440 runtime aprovado: dHash tolera ruído leve, rejeita arte diferente e desempata versões sem escolher no escuro.');
