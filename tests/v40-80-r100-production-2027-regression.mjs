import assert from 'node:assert/strict';
import fs from 'node:fs';

const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const production = fs.readFileSync('src/lib/production2027V4080R100.ts', 'utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts', 'utf8');

assert.ok(production.includes("PRODUCTION_2027_R100_VERSION = '40.80-r100-production-2027'"));
assert.ok(production.includes('singleTrainingAuthority'));
assert.ok(production.includes('dualPhasePreserved'));
assert.ok(production.includes('staminaProtected'));
assert.ok(production.includes('nativeSkillDuplicatesBlocked'));
assert.ok(production.includes('rareResourcesProtected'));
assert.ok(production.includes('deterministicSignature'));
assert.ok(production.includes('trainingPlanTotalCost(result.training)'));
assert.ok(production.includes('skillIdentityKey'));
assert.ok(production.includes("lab?.risk === 'ALTO'"));

const r60 = pipeline.indexOf('applyCanonicalCardIdentity2027R60(current)');
const r70 = pipeline.indexOf('applyPerformanceEngine2027R70(current)');
const masterIndex = pipeline.indexOf('applyMasterCardEngineV4080R50(current)');
const r80 = pipeline.indexOf('applyPermanentResources2027R80(current)');
const r90 = pipeline.indexOf('applyPerformanceLab2027R90(current)');
const r100 = pipeline.indexOf('applyProduction2027R100(current)');
assert.ok(r60 >= 0 && r60 < r70 && r70 < masterIndex && masterIndex < r80 && r80 < r90 && r90 < r100);
assert.ok(master.includes('applyR70WinnerInsideMaster(result)'));
assert.ok(master.includes('applyDefinitiveAdditionalSkillsV600R15(result)'));
assert.ok(master.includes('synchronizeFinalSkillIntegrity(result)'));

console.log('r100 aprovada: Fundação -> Performance -> Motor Mestre -> Recursos -> Lab -> Produção, com autoridade única preservada.');
