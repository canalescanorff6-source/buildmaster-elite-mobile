import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const training = readFileSync(new URL('../src/modules/builds/trainingOptimizer.ts', import.meta.url), 'utf8');
const analyzer = readFileSync(new URL('../src/lib/analyzer.ts', import.meta.url), 'utf8');
const skill = readFileSync(new URL('../src/lib/skillIntelligenceV31.ts', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../src/lib/cardIntelligencePipeline.ts', import.meta.url), 'utf8');
const finalEngine = readFileSync(new URL('../src/lib/finalIdentityEngineV4080R27.ts', import.meta.url), 'utf8');
const masterEngine = readFileSync(new URL('../src/lib/masterCardEngineV4080R50.ts', import.meta.url), 'utf8');

for (const contract of [
  'BM_FINAL_IDENTITY_GUARD_R27',
  'isHardForbiddenTrainingKey',
  "['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position) && key === 'defending'",
  "position === 'CB' && key === 'shooting'",
  'fitTrainingToExactBudget(',
  'allowedTrainingKeys(position, parsed)',
  'loosenTrainingCaps(position, caps, parsed)'
]) assert.ok(training.includes(contract), `training r27 sem contrato: ${contract}`);

assert.ok(analyzer.includes('automaticPositionFamilyCompatible'), 'AUTO precisa preservar família posicional');
assert.ok(analyzer.includes('fitTrainingToExactBudget(initialTraining, exactPriority, trainingPointsTotal, selected.code, parsed)'), 'fechamento inicial precisa receber parsed');
assert.ok(analyzer.includes('function recommendImpetos') || analyzer.includes('export function recommendImpetos'), 'Ímpeto canônico precisa continuar disponível no motor-base');
assert.ok(skill.includes('return result.bestPosition.code;'), 'Top 5 deve usar a posição final');
assert.ok(finalEngine.includes('reconstructNaturalAttributes'), 'carta treinada precisa reconstruir base');
assert.ok(finalEngine.includes('autoTrainingPlan'), 'r27 precisa ler distribuição já aplicada');
assert.ok(!finalEngine.includes('recommendedImpetos: impetos'), 'r27 não pode recalcular Ímpeto ao trocar a posição; preserva o ranking canônico da carta');
assert.ok(finalEngine.includes("position === 'CF' ? `Defesa travada em ${exact.defending}.`"), 'CA precisa expor trava defensiva');

const authorityOrder =
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyFinalIdentityEngineV4080R27)') <
    pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') &&
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') <
    pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') &&
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') <
    pipeline.indexOf('applyPermanentResources2027R80(current)') &&
  pipeline.indexOf('applyPermanentResources2027R80(current)') <
    pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') &&
  pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') <
    pipeline.indexOf('applyCleanSlatePerformance2027R119(current, protectedRawCard)') &&
  pipeline.indexOf('applyCleanSlatePerformance2027R119(current, protectedRawCard)') <
    pipeline.indexOf('applyPostAuthorityReadOnly(current, applyPlayerGenerationFinalizerV4080R13)');

assert.ok(
  authorityOrder,
  'r119 deve recalcular e selar ficha + Top 5 + Ímpeto depois de toda auditoria histórica'
);
assert.ok(masterEngine.includes('BM_R118_MASTER_READ_ONLY'), 'r50 precisa permanecer somente-leitura');

console.log('r27/r119 aprovada: identidade legada read-only e Clean Slate sela a decisão final após a auditoria.');
