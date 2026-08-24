import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const pipeline = readFileSync(resolve(root, 'src/lib/cardIntelligencePipeline.ts'), 'utf8');
const master = readFileSync(resolve(root, 'src/lib/masterCardEngineV4080R50.ts'), 'utf8');
const finalAuthority = readFileSync(resolve(root, 'src/lib/finalDecisionAuthority2027V4080R118.ts'), 'utf8');
const production = readFileSync(resolve(root, 'src/lib/production2027V4080R100.ts'), 'utf8');
const lab = readFileSync(resolve(root, 'src/lib/performanceLab2027V4080R90.ts'), 'utf8');
const resources = readFileSync(resolve(root, 'src/lib/permanentResources2027V4080R80.ts'), 'utf8');
const engine = readFileSync(resolve(root, 'src/lib/performanceEngine2027V4080R108.ts'), 'utf8');
const cleanSlate = readFileSync(resolve(root, 'src/lib/cleanSlatePerformance2027V4080R119.ts'), 'utf8');

assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R108\)/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R109\)/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyMasterCardEngineV4080R50\)/);
assert.match(pipeline, /applyPermanentResources2027R80\(current\);\s+current = applyFinalDecisionAuthority2027R118\(current\);/);
assert.match(master, /authorityMode: 'LEGACY_READ_ONLY'/);
assert.match(finalAuthority, /trainingSource: FinalDecisionSourceR118/);
assert.match(finalAuthority, /Top 5 final vem exclusivamente do r80/);
assert.match(finalAuthority, /Ímpeto final vem exclusivamente do r80/);
assert.match(production, /performanceEngine2027R108/);
assert.match(lab, /performanceEngine2027R108/);
assert.match(resources, /performanceEngine2027R108/);
assert.match(engine, /overallIgnored: true/);
assert.match(engine, /positionSelectionDoesNotRewriteCore: true/);
assert.match(engine, /BM_R118_AERIAL_SPECIALIZATION_PROOF/);
assert.doesNotMatch(engine, /maxOverall/);
assert.doesNotMatch(engine, /\.overall/);

assert.match(cleanSlate, /CLEAN_SLATE_SINGLE_WRITER/);
assert.match(cleanSlate, /noFloorPeakCeiling: true/);
assert.match(pipeline, /applyCleanSlatePerformance2027R119\(current, protectedRawCard\)/);
console.log('r108 integração aprovada: Card Signature é diagnóstico e r119 sela a decisão sem autoridade legada concorrente.');
