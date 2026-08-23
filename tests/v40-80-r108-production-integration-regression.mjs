import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const pipeline = readFileSync(resolve(root, 'src/lib/cardIntelligencePipeline.ts'), 'utf8');
const master = readFileSync(resolve(root, 'src/lib/masterCardEngineV4080R50.ts'), 'utf8');
const production = readFileSync(resolve(root, 'src/lib/production2027V4080R100.ts'), 'utf8');
const lab = readFileSync(resolve(root, 'src/lib/performanceLab2027V4080R90.ts'), 'utf8');
const resources = readFileSync(resolve(root, 'src/lib/permanentResources2027V4080R80.ts'), 'utf8');
const engine = readFileSync(resolve(root, 'src/lib/performanceEngine2027V4080R108.ts'), 'utf8');

assert.match(pipeline, /applyPerformanceEngine2027R107\(current\);\s+current = applyPerformanceEngine2027R108\(current\);\s+current = applyMasterCardEngineV4080R50\(current\);/);
assert.match(master, /applyR108WinnerInsideMaster/);
assert.match(master, /Motor Mestre aplicou Extreme Gameplay r108/);
assert.match(production, /performanceEngine2027R108/);
assert.match(production, /Extreme r108:/);
assert.match(lab, /performanceEngine2027R108/);
assert.match(resources, /performanceEngine2027R108/);
assert.match(engine, /overallIgnored: true/);
assert.match(engine, /antiOverallSpread: winner\.categoryCount <= 6/);
assert.match(engine, /positionSelectionDoesNotRewriteCore: true/);
assert.match(engine, /EXTREME_GAMEPLAY_BREAKPOINT_SYNERGY_V600/);
assert.doesNotMatch(engine, /maxOverall/);
assert.doesNotMatch(engine, /\.overall/);

console.log('r108 integração aprovada: pipeline, Mestre, laboratório, recursos e produção usam o motor extremo sem overall.');
