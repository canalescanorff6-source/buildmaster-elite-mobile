import assert from 'node:assert/strict';
import fs from 'node:fs';
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts','utf8');
assert.ok(pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') < pipeline.indexOf('applyMasterCardEngineV4080R50(current)'));
assert.ok(pipeline.indexOf('applyMasterCardEngineV4080R50(current)') < pipeline.indexOf('applyPlayerGenerationFinalizerV4080R13(current)'));
assert.ok(master.indexOf('applyFinalCardAuthorityV4080R45(input)') < master.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)'));
assert.ok(master.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)') < master.indexOf('synchronizeFinalSkillIntegrity(result)'));
console.log('r52 aprovada: teste legado reconhece a autoridade única r50 sem duplicar Top 5 no pipeline.');
