import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
assert.equal(fs.existsSync('src/lib/individualIdentityEngineV4080R39.ts'), false, 'R39 deve permanecer aposentado do runtime.');
assert.doesNotMatch(pipeline, /applyIndividualIdentityEngineV4080R39/);
assert.match(pipeline, /applyCanonicalCardIdentity2027R60/);
assert.match(pipeline, /applyPerformanceEngine2027R108/);
assert.match(pipeline, /applyCleanSlatePerformance2027R119/);
console.log('r39 aposentadoria aprovada: identidade moderna R60/R108/R119 substitui o estágio histórico sem segundo writer.');
