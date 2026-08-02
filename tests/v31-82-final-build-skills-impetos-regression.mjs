import fs from 'node:fs';
import assert from 'node:assert/strict';

const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const supreme = fs.readFileSync('src/lib/supremeGameplayEngine.ts', 'utf8');
const impeto = fs.readFileSync('src/lib/localAiEngine.ts', 'utf8');
const skills = fs.readFileSync('src/lib/skillIntegrity.ts', 'utf8');

const finalSkillsIndex = pipeline.indexOf('const withFinalSkills = enforceComplementarySkillIntegrity(supreme)');
const finalImpetosIndex = pipeline.indexOf('const withFinalImpetos = applyLocalAiToResult(withFinalSkills)');
assert.ok(finalSkillsIndex >= 0 && finalImpetosIndex > finalSkillsIndex, 'Ímpetos devem ser recalculados depois da ficha e habilidades finais.');
assert.match(pipeline, /const integrityBeforeCalibration = enforceComplementarySkillIntegrity\(correctedFinal\)/);
assert.match(pipeline, /return enforceComplementarySkillIntegrity\(applyCalibrationV32\(calibratedImpetos\)\)/);
assert.match(supreme, /exactBudgetFinalists = finalists\.filter\(\(item\) => trainingPlanTotalCost\(item\.plan\) === result\.trainingPointsTotal\)/);
assert.match(impeto, /!ownedNames\.has\(item\.profile\.name\.toLowerCase\(\)\)/);
assert.match(impeto, /(?:31\.10-local-ai-final-build-3|31\.82-local-ai-formation-final-build-1|35\.00-local-ai-position-style-final-build-1)/);
assert.match(skills, /filterComplementaryAdditionalSkills\(/);
assert.match(skills, /const exactFive = recommendedSkills\.length === 5/);
assert.match(skills, /const roleCompatible = recommendedSkills\.every/);
assert.match(skills, /Habilidades adicionais e Ímpetos foram avaliados em trilhas separadas/);

console.log('Regressão de ficha, habilidades e ímpetos v31.82 aprovada.');
