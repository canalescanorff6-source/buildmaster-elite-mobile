import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts','utf8');
assert.ok(pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') < pipeline.indexOf('applyMasterCardEngineV4080R50(current)'));
assert.ok(master.indexOf('applyFinalCardAuthorityV4080R45(input)') < master.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)'));
console.log('r53 aprovada: regressão r28 compatível com Motor Mestre r50.');
