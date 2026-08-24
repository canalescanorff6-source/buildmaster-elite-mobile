import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine=fs.readFileSync('src/lib/performanceEngine2027V4080R70.ts','utf8');
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const master=fs.readFileSync('src/lib/masterCardEngineV4080R50.ts','utf8');

for (const contract of [
  '40.80-r70-performance-engine-2027',
  "authority:'SPECIALIST_READ_ONLY'",
  'transitionLoad',
  'staminaFloor',
  'bottleneckBoost',
  'saturation(projected)',
  "['PEAK','BALANCED_90','FLUID_PHASE']",
  'projectedStrongUntilMinute',
  'overallIgnored:true',
  'masterEngineIsOnlyWriter:false',
  'finalAuthorityR118IsOnlyWriter:true'
]) assert.ok(engine.includes(contract), `r70 sem contrato: ${contract}`);

assert.ok(pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyPerformanceFoundation2027R60)') < pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyPerformanceEngine2027R70)'));
assert.ok(pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyPerformanceEngine2027R70)') < pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)'));
assert.ok(master.includes('BM_R118_MASTER_READ_ONLY'));
assert.ok(!master.includes('applyR70WinnerInsideMaster'));
assert.ok(!master.includes('result.training ='));
console.log('r70 aprovada: Digital Twin permanece especialista read-only; r50 não escreve ficha e r119 mantém a autoridade final.');
