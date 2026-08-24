import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const master = read('src/lib/masterCardEngineV4080R50.ts');
const r70 = read('src/lib/performanceEngine2027V4080R70.ts');
const r45 = read('src/lib/finalCardAuthorityV4080R45.ts');
const r118 = read('src/lib/finalDecisionAuthority2027V4080R118.ts');
const r90 = read('src/lib/performanceLab2027V4080R90.ts');
const r100 = read('src/lib/production2027V4080R100.ts');
const r119 = read('src/lib/cleanSlatePerformance2027V4080R119.ts');

assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R70\)/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R107\)/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R108\)/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R109\)/);
assert.match(pipeline, /applyPermanentResources2027R80\(current\);\s*current = applyFinalDecisionAuthority2027R118\(current\);\s*current = applyPostAuthorityReadOnly\(current, applyPerformanceLab2027R90\);/);
assert.match(master, /BM_R118_MASTER_READ_ONLY/);
assert.doesNotMatch(master, /applyFinalCardAuthorityV4080R45/);
assert.doesNotMatch(master, /applyR107WinnerInsideMaster/);
assert.doesNotMatch(master, /applyR108WinnerInsideMaster/);
assert.match(r118, /FINAL_SINGLE_WRITER/);
assert.match(r118, /EMERGENCY_R45/);
assert.match(r118, /applyFinalCardAuthorityV4080R45\(input\)/);
assert.match(r90, /performanceEngine2027R107\?\.winner\?\.projectedStrongUntilMinute/);
assert.match(r100, /cleanSlate\?\.score/);
assert.match(r119, /CLEAN_SLATE_SINGLE_WRITER/);
assert.match(r119, /RAW_CARD_SNAPSHOT/);
assert.match(pipeline, /applyCleanSlatePerformance2027R119\(current, protectedRawCard\)/);

for (const source of [r70, r45]) {
  assert.match(source, /gk1:\s*\['goalkeeperAwareness',\s*'jump'\]/);
  assert.match(source, /gk2:\s*\['goalkeeperParrying',\s*'goalkeeperReach'\]/);
  assert.match(source, /gk3:\s*\['goalkeeperCatching',\s*'goalkeeperReflexes'\]/);
}

console.log('r107 compatibilidade aprovada: especialistas históricos continuam disponíveis, mas r119 é o único escritor final.');
