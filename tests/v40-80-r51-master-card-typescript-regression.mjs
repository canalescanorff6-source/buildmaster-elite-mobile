import assert from 'node:assert/strict';
import fs from 'node:fs';
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts','utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
assert.ok(master.includes('nativeSkillDuplicationBlocked: true'));
assert.ok(!master.includes('Boolean(result.skillIntegrity?.removedDuplicates?.length === 0)'));
assert.ok(!pipeline.includes('synchronizeFinalSkillIntegrity'));
console.log('r51 aprovada: tipagem literal e import não utilizado corrigidos.');
