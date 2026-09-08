import assert from 'node:assert/strict';
import fs from 'node:fs';
const retired=[
  'src/lib/individualIdentityEngineV4080R39.ts',
  'src/lib/individualCalibrationEngineV4080R41.ts',
  'src/lib/performanceFoundation2027V4080R60.ts',
  'src/lib/performanceEngine2027V4080R70.ts',
  'src/lib/performanceEngine2027V4080R107.ts',
  'src/lib/performanceEngine2027V4080R109.ts',
];
for (const file of retired) assert.equal(fs.existsSync(file),false,`R181: ${file} não pode voltar ao runtime.`);
const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
for (const token of ['applyIndividualIdentityEngineV4080R39','applyIndividualCalibrationEngineV4080R41','applyPerformanceFoundation2027R60','applyPerformanceEngine2027R70','applyPerformanceEngine2027R107','applyPerformanceEngine2027R109']) assert.doesNotMatch(pipeline,new RegExp(token));
assert.match(pipeline,/applyLegacyTrainingReadOnly\(current, applyCanonicalCardIdentity2027R60\)/);
assert.match(pipeline,/applyLegacyTrainingReadOnly\(current, applyPerformanceEngine2027R108\)/);
assert.match(pipeline,/applyCleanSlatePerformance2027R119\(current, protectedRawCard\)/);
const v3172=fs.readFileSync('tests/v31-72-complementary-skills-regression.ts','utf8');
assert.match(v3172,/BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1'/);
assert.match(v3172,/officialAdditionalSkillPoolForPosition\(target\)/);
assert.equal((v3172.match(/applyCompleteCardIntelligence\(/g)??[]).length,1,'R181: v31.72 deve manter apenas o loop dos três pipelines representativos; catálogo das 13 posições é domínio barato.');
console.log('R181 aposentadoria aprovada: seis motores redundantes fora de src, R108 preservado, R119 single writer e v31.72 saneado.');
