import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
assert.equal(fs.existsSync('src/lib/individualCalibrationEngineV4080R41.ts'), false);
assert.doesNotMatch(pipeline,/applyIndividualCalibrationEngineV4080R41/);
assert.match(pipeline,/applyPerformanceEngine2027R108/);
assert.match(pipeline,/applyCleanSlatePerformance2027R119/);
console.log('r42 compatibilidade aprovada: guarda individual antiga foi aposentada sem criar autoridade paralela.');
