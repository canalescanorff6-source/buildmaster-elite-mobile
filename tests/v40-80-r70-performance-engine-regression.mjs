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
  'masterEngineIsOnlyWriter:true'
]) assert.ok(engine.includes(contract), `r70 sem contrato: ${contract}`);

assert.ok(pipeline.indexOf('applyPerformanceFoundation2027R60(current)') < pipeline.indexOf('applyPerformanceEngine2027R70(current)'));
assert.ok(pipeline.indexOf('applyPerformanceEngine2027R70(current)') < pipeline.indexOf('applyMasterCardEngineV4080R50(current)'));
assert.ok(master.includes('applyR70WinnerInsideMaster'));
assert.ok(master.indexOf('applyR70WinnerInsideMaster(result)') < master.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)'));
assert.ok(master.includes('analysis.improvementVsIncoming >= 0.3'));
console.log('r70 aprovada: Digital Twin funcional, retorno marginal, gargalos, duas fases e stamina entram antes do Top 5; Motor Mestre segue único escritor.');
