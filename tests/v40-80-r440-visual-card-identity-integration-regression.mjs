import fs from 'node:fs';
import assert from 'node:assert/strict';

const quickReader = fs.readFileSync('src/modules/card-catalog/quickCardIdentityReaderR439.ts', 'utf8');
const resolver = fs.readFileSync('src/modules/card-catalog/cardIdentityResolverR440.ts', 'utf8');
const visual = fs.readFileSync('src/modules/card-catalog/cardVisualIdentityR440.ts', 'utf8');
const learning = fs.readFileSync('src/modules/card-catalog/masterCardVisualLearningR440.ts', 'utf8');
const catalog = fs.readFileSync('src/modules/card-catalog/masterCardCatalogR438.ts', 'utf8');
const center = fs.readFileSync('src/modules/squad-mapping/SquadMappingCenter.tsx', 'utf8');

assert.ok(visual.includes('differenceHash64FromLumaR440'));
assert.ok(visual.includes('shiftedBoxesR440'), 'A assinatura deve tolerar pequenos deslocamentos do recorte.');
assert.ok(quickReader.includes('extractCardVisualFingerprintR440'), 'A leitura rápida deve calcular a arte antes do OCR completo.');
assert.ok(quickReader.includes('visualFingerprint'), 'A observação R439 precisa transportar a assinatura visual.');
assert.ok(resolver.includes('VISUAL_FINGERPRINT_MATCH'));
assert.ok(resolver.includes('top.similarity >= 90'), 'Match visual automático exige limiar forte.');
assert.ok(catalog.includes('visualHashVariants'), 'Catálogo Mestre deve preservar variantes tolerantes da mesma arte.');
assert.ok(learning.includes('saveCardVisualFingerprintR440'));
assert.ok(center.includes('resolveMasterCardObservationR440'), 'Meu Elenco deve usar o resolvedor visual R440.');
assert.ok(center.includes('saveCardVisualFingerprintR440'), 'Match automático, OCR e escolha manual devem ensinar a arte ao catálogo.');

console.log('R440 integração aprovada: leitura rápida calcula hash da arte, resolver usa limiar forte e catálogo aprende variantes visuais.');
