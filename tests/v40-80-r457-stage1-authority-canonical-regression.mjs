import assert from 'node:assert/strict';
import fs from 'node:fs';

const clean=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const ui=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
const r126=fs.readFileSync('src/lib/productionAuthorityR126.ts','utf8');
const r128=fs.readFileSync('src/lib/productionAuthorityR128.ts','utf8');

assert.match(clean,/CLEAN_SLATE_2027_R119_VERSION = '40\.80-r406-match-calibration-group-return-fix5'/);
assert.match(clean,/BM_R457_SOURCE_CANONICAL_R406/);
assert.doesNotMatch(pipeline,/Clean Slate r125 é o único escritor/);
assert.match(pipeline,/BM_R457_AUTHORITY_CHAIN/);
assert.match(r126,/authority: 'PRODUCTION_SINGLE_WRITER'/);
assert.match(r126,/decisionEngine: CLEAN_SLATE_2027_R119_VERSION/);
assert.match(r128,/authority: 'PRODUCTION_OUTPUT_INTEGRITY'/);
assert.match(r128,/isCurrentProductionAnalysisR126/);
assert.doesNotMatch(ui,/Clean Slate R125/);
assert.match(ui,/cleanSlateRevision=cleanSlate\.version\.match/);
assert.match(clean,/let current=evaluateCompactPlanR148\(chosen\.levels,evaluationContext,false\)/);
assert.match(clean,/const matchNeed=actions\.reduce/);
assert.match(clean,/if\(!calibration \|\| calibration\.status!==['"]ACTIVE['"]\) return 1;/);
console.log('R457 Stage 1 aprovada: source cru materializa R406-fix5; R126 sela; R128 protege; UI não fixa R125.');
