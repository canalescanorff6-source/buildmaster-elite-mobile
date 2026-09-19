import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438 } from '../src/modules/card-catalog/masterCardCatalogR438';
import { applyCardVisualFingerprintR440 } from '../src/modules/card-catalog/masterCardVisualLearningR440';

const card = createMasterCardCatalogEntryR438({
  catalogCardId: 'card-a', cardFingerprint: 'provisional-a', playerName: 'Jogador A', mainPosition: 'CF',
  positions: ['CF'], sourceHash: 'source-a', level: 32, trainingPointsTotal: 62,
  attributes: {}, nativeSkills: [], additionalSkills: [], specialSkills: [], skillInventoryConfirmed: false
});
const learned = applyCardVisualFingerprintR440(card, { algorithm: 'dhash64-v1', hash: '0123456789abcdef', variants: ['1123456789abcdef'], quality: 91 });
assert.equal(learned.catalogCardId, card.catalogCardId);
assert.equal(learned.visualHash, '0123456789abcdef');
assert.equal(learned.visualHashAlgorithm, 'dhash64-v1');
assert.equal(learned.visualHashQuality, 91);
assert.ok(learned.visualHashVariants.includes('1123456789abcdef'));

const enriched = applyCardVisualFingerprintR440(learned, { algorithm: 'dhash64-v1', hash: '0123456789abcdee', variants: ['2123456789abcdef'], quality: 96 });
assert.equal(enriched.visualHash, '0123456789abcdee', 'A evidência de maior qualidade deve virar a assinatura principal.');
assert.equal(enriched.visualHashQuality, 96);
assert.ok(enriched.visualHashVariants.includes('0123456789abcdef'), 'A assinatura anterior deve continuar como variante tolerante.');
assert.ok(enriched.visualHashVariants.includes('2123456789abcdef'));

const weaker = applyCardVisualFingerprintR440(enriched, { algorithm: 'dhash64-v1', hash: 'ffffffffffffffff', quality: 60 });
assert.equal(weaker.visualHash, enriched.visualHash, 'Uma leitura visual pior não pode substituir a melhor assinatura já aprendida.');
assert.equal(weaker.visualHashQuality, 96);

console.log('R440 aprendizado visual aprovado: assinatura principal melhora por qualidade e variantes anteriores são preservadas.');
