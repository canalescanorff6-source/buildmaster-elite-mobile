import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const master = read('src/lib/masterCardEngineV4080R50.ts');
const r70 = read('src/lib/performanceEngine2027V4080R70.ts');
const r45 = read('src/lib/finalCardAuthorityV4080R45.ts');
const r90 = read('src/lib/performanceLab2027V4080R90.ts');
const r100 = read('src/lib/production2027V4080R100.ts');

assert.match(pipeline, /applyPerformanceEngine2027R70\(current\);\s*current = applyPerformanceEngine2027R107\(current\);\s*current = applyPerformanceEngine2027R108\(current\);\s*current = applyMasterCardEngineV4080R50\(current\);/);
assert.match(master, /applyR107WinnerInsideMaster/);
assert.match(master, /applyR108WinnerInsideMaster/);
assert.match(master, /if \(!extremeR108\.applied\)/);
assert.match(master, /if \(!qualityR107\.applied\) result = applyR70WinnerInsideMaster\(result\)/);
assert.match(master, /analysis\.guards\.formationIndependent/);
assert.match(master, /analysis\.guards\.correctGkMapping/);
assert.match(r90, /performanceEngine2027R107\?\.winner\?\.projectedStrongUntilMinute/);
assert.match(r90, /performanceEngine2027R70\?\.winner\?\.projectedStrongUntilMinute/);
assert.match(r100, /extreme\?\.winner\.totalScore \?\? quality\?\.winner\.totalScore \?\? performance\?\.winner\.totalScore/);

for (const source of [r70, r45]) {
  assert.match(source, /gk1:\s*\['goalkeeperAwareness',\s*'jump'\]/);
  assert.match(source, /gk2:\s*\['goalkeeperParrying',\s*'goalkeeperReach'\]/);
  assert.match(source, /gk3:\s*\['goalkeeperCatching',\s*'goalkeeperReflexes'\]/);
  assert.doesNotMatch(source, /gk1:\s*\['goalkeeperAwareness',\s*'goalkeeperCatching'\]/);
}

console.log('r107 compatibilidade aprovada: r108 > r107 > r70, mantendo GK corrigido.');
