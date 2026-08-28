import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pipeline = readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const master = readFileSync('src/lib/masterCardEngineV4080R50.ts', 'utf8');
const authority = readFileSync('src/lib/finalDecisionAuthority2027V4080R118.ts', 'utf8');
const ui = readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx', 'utf8');
const r108 = readFileSync('src/lib/performanceEngine2027V4080R108.ts', 'utf8');
const r119 = readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts', 'utf8');

assert.match(authority, /BM_R118_SINGLE_FINAL_AUTHORITY/);
assert.match(authority, /FINAL_SINGLE_WRITER/);
assert.match(authority, /CARD_SIGNATURE_R115/);
assert.match(authority, /EMERGENCY_R45/);
assert.match(authority, /legacyPattern/);
assert.match(authority, /8\/8\/8\/12/);
assert.match(authority, /permanentTop5/);
assert.match(authority, /permanentImpeto/);
assert.match(master, /BM_R118_MASTER_READ_ONLY/);
assert.doesNotMatch(master, /result\.training\s*=/);
assert.match(pipeline, /applyPermanentResources2027R80\(current\);\s*current = applyFinalDecisionAuthority2027R118\(current\);/);
assert.ok(pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') < pipeline.indexOf('applyPostAuthorityReadOnly(current, applyPerformanceLab2027R90)'));
assert.match(pipeline, /BM_R119_CLEAN_SLATE_SINGLE_WRITER/);
assert.match(pipeline, /BM_R119_RAW_SNAPSHOT_GUARD/);
assert.match(pipeline, /BM_R119_FAST_ANDROID_PATH/);
assert.match(pipeline, /applyLegacyTrainingReadOnly\(current, applyMaximumPerformanceV4040\)/);
assert.match(pipeline, /applyPostAuthorityReadOnly\(current, applyPerformanceLab2027R90\)/);
assert.match(pipeline, /applyPostAuthorityReadOnly\(current, applyProduction2027R100\)/);
assert.match(pipeline, /applyPostAuthorityReadOnly\(current, applyPlayerGenerationFinalizerV4080R13\)/);
assert.ok(pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') < pipeline.indexOf('applyCleanSlatePerformance2027R119(current, protectedRawCard)'));
assert.match(r119, /CLEAN_SLATE_SINGLE_WRITER/);
assert.match(r119, /ignoresIncomingTraining: true/);
assert.match(r119, /noFloorPeakCeiling: true/);
assert.match(ui, /Motor final: Clean Slate r12[23]/);
assert.doesNotMatch(ui, /final-r45/);
assert.match(r108, /BM_R118_AERIAL_SPECIALIZATION_PROOF/);
assert.match(r108, /specializationSignals >= 2/);

console.log('r118 compatível e r123 final: legado read-only, snapshot cru protegido, Clean Slate como escritor final e UI sem final-r45.');
