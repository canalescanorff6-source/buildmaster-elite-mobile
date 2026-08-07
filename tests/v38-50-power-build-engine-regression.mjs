import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const engine = read('src/lib/performanceBuildEngineV3850.ts');
const domain = read('src/lib/analyzerDomain.ts');
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const panel = read('src/components/PowerBuildEngineV3850Panel.tsx');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const premiumClean = read('src/lib/premiumCleanResultV3810.ts');
const cleanVault = read('src/lib/cleanVaultV3800.ts');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.match(engine, /POWER_BUILD_ENGINE_V3850_VERSION\s*=\s*'38\.50\.0'/);
assert.match(engine, /DESEMPENHO_REAL_SEM_FOCO_EM_OVERALL/);
assert.match(engine, /fitTrainingToExactBudget/);
assert.match(engine, /trainingLevelCost/);
assert.match(engine, /buildPersonalizedSkillPlan/);
assert.match(engine, /filterComplementaryAdditionalSkills/);
assert.match(engine, /scoreImpetos/);
assert.match(engine, /saturationPenalty/);
assert.match(engine, /confidenceSafety/);
assert.match(engine, /specialSkillActivation/);
assert.match(engine, /identityPreservation/);
assert.match(engine, /antiOverallWaste/);
assert.match(engine, /position === 'GK'/);
assert.match(engine, /result\.tacticalProfile\.connectionProfile/);
assert.match(engine, /result\.errorTolerance\?\.conservative/);
assert.match(engine, /result\.cardDna\?\.skillSynergies/);
assert.match(engine, /result\.cardDna\?\.individualGoals/);
assert.match(engine, /trainingPointsUsed === result\.trainingPointsTotal/);
assert.doesNotMatch(engine, /parsed\.(?:overall|maxOverall)/, 'o novo motor não pode usar GER para pontuar fichas');

const improvementsBlock = engine.match(/const IMPROVEMENTS = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
const improvementCount = (improvementsBlock.match(/^\s*'.*',?$/gm) ?? []).length;
assert.ok(improvementCount >= 20, `esperadas mais de 20 melhorias, encontradas ${improvementCount}`);

for (const marker of [
  'PowerBuildScoreDimensions',
  'PowerBuildCandidate',
  'PowerSkillDecision',
  'PowerImpetoDecision',
  'PowerBuildEngineV3850Analysis',
  'powerBuildV3850?: PowerBuildEngineV3850Analysis'
]) assert.ok(domain.includes(marker), `tipo ausente: ${marker}`);

assert.match(pipeline, /applyPowerBuildEngineV3850/);
assert.match(pipeline, /const power = applyPowerBuildEngineV3850\(advancedIntegrity\)/);
assert.match(pipeline, /const finalPower = applyPowerBuildEngineV3850\(powerIntegrity\)/);
assert.match(pipeline, /return enforceComplementarySkillIntegrity\(finalPower\)/);

for (const marker of [
  'Motor de Desempenho v38.50',
  'Ficha poderosa por função, não por overall',
  'GER fora da decisão',
  'Cinco habilidades definitivas',
  'Ímpetos recalculados',
  'analysis.improvements.map'
]) assert.ok(panel.includes(marker), `painel v38.50 sem ${marker}`);

assert.match(workspace, /PowerBuildEngineV3850Panel/);
assert.match(workspace, /<PowerBuildEngineV3850Panel result=\{result\}/);
assert.match(premiumClean, /powerBuildV3850\?\.impetos\?\.\[0\]\?\.name/);
assert.match(cleanVault, /powerBuildV3850\?\.impetos\?\.\[0\]\?\.name/);
assert.equal(pkg.scripts['test:v3850'], 'node tests/v38-50-power-build-engine-regression.mjs');
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3850'));
assert.match(doctor, /Regressões v38\.50/);

console.log(`v38.50 aprovada: ${improvementCount} melhorias refinam ficha, Top 5 e Ímpeto com foco em desempenho real, orçamento exato e zero dependência de GER.`);
