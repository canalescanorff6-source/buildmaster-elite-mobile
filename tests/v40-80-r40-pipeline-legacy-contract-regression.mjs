import assert from 'node:assert/strict';
import fs from 'node:fs';

const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');

const finalSkillsIndex = pipeline.indexOf('const withFinalSkills = enforceComplementarySkillIntegrity(supreme)');
const finalImpetosIndex = pipeline.indexOf('const withFinalImpetos = applyLocalAiToResult(withFinalSkills)');
assert.ok(finalSkillsIndex >= 0 && finalImpetosIndex > finalSkillsIndex);

for (const marker of [
  'enforceComplementarySkillIntegrity(supreme)',
  'const integrityBeforeCalibration = enforceComplementarySkillIntegrity(correctedFinal)',
  'return enforceComplementarySkillIntegrity(applyCalibrationV32(calibratedImpetos))',
  'return enforceComplementarySkillIntegrity(finalAdvanced)',
  'const power = applyPowerBuildEngineV3850(advancedIntegrity)',
  'const finalMaximum = applyMaxMatchPerformanceV3860(maximumIntegrity)',
  'const supremePerformance = applySupremePerformanceV3870(finalMaximumIntegrity)'
]) assert.ok(pipeline.includes(marker), `Contrato legado ausente: ${marker}`);

assert.ok(pipeline.includes('applyIndividualIdentityEngineV4080R39(current)'));
console.log('r40 aprovada: contratos históricos restaurados sem remover a identidade individual r39.');
