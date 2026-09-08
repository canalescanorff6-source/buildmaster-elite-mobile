import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
assert.equal(fs.existsSync('src/lib/performanceEngine2027V4080R70.ts'), false, 'R70 deve permanecer aposentado.');
assert.doesNotMatch(pipeline,/applyPerformanceEngine2027R70/);
assert.match(pipeline,/applyPerformanceEngine2027R108/);
assert.match(pipeline,/applyCleanSlatePerformance2027R119/);
console.log('r70 aposentadoria aprovada: Card Signature R108 substitui o especialista antigo e R119 segue writer final.');
