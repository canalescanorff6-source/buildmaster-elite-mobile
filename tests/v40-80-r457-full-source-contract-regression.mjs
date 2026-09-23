import assert from 'node:assert/strict';
import fs from 'node:fs';

const required=[
 'src/lib/globalLineupOptimizerR457.ts',
 'src/lib/formationAwareRotationR457.ts',
 'src/lib/canonicalDnaR457.ts',
 'src/lib/finalAdditionalSkillSetR457.ts',
 'src/lib/finalImpetoDecisionR457.ts',
 'src/lib/scoutingDecisionEvidenceR457.ts',
 'src/modules/scouting/matchScoutingBridgeR457.ts'
];
for(const path of required)assert.ok(fs.existsSync(path),`R457 ausente: ${path}`);

const clean=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const ui=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
const pro=fs.readFileSync('src/lib/professionalSquadEngine.ts','utf8');
const rotation=fs.readFileSync('src/lib/squadRotation.ts','utf8');

assert.match(clean,/r406-match-calibration-group-return-fix5/);
assert.match(clean,/certifyExactTrainingR457/);
assert.match(clean,/selectJointConfigurationR457/);
assert.match(clean,/canonicalDnaR457/);
assert.doesNotMatch(clean,/activeMatchCalibration\(input\)\?\.status!==['"]ACTIVE['"]/);
assert.doesNotMatch(pipeline,/Clean Slate r125 é o único escritor/);
assert.doesNotMatch(ui,/Clean Slate R125/);
assert.match(pro,/optimizeGlobalFormationLineupR457/);
assert.doesNotMatch(pro,/buildFormationLineup\(/);
assert.match(rotation,/buildFormationAwareRotationR457/);
assert.doesNotMatch(rotation,/const starters=pickStarters\(players,style\)/);

console.log('R457 source gate aprovado: source final não volta a R125, greedy XI ou rotação 1/4/3/3.');
