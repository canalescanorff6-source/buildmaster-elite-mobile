import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
assert.equal(fs.existsSync('src/lib/performanceEngine2027V4080R107.ts'), false, 'R107 deve permanecer aposentado do runtime.');
assert.match(pipeline,/applyPerformanceEngine2027R108/);
assert.match(pipeline,/applyCleanSlatePerformance2027R119/);
assert.doesNotMatch(pipeline,/applyPerformanceEngine2027R107/);
console.log('r107 aposentadoria runtime aprovada: R108 preservado e R119 continua autoridade final.');
