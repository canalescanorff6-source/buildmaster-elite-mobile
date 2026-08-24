import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const finalEngine = readFileSync(new URL('../src/lib/finalIdentityEngineV4080R27.ts', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../src/lib/cardIntelligencePipeline.ts', import.meta.url), 'utf8');
const masterEngine = readFileSync(new URL('../src/lib/masterCardEngineV4080R50.ts', import.meta.url), 'utf8');

assert.ok(
  finalEngine.includes('Ficha Automática v40.80 — Desempenho Real 2027'),
  'O nome público precisa preservar exatamente o contrato aceito pelas regressões v39.x.'
);
assert.ok(!finalEngine.includes("import { recommendImpetos } from './analyzer';"));
assert.ok(!finalEngine.includes('recommendedImpetos: impetos'));

const authorityOrder =
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyFinalIdentityEngineV4080R27)') <
    pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') &&
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') <
    pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') &&
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') <
    pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') &&
  pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') <
    pipeline.indexOf('applyCleanSlatePerformance2027R119(current, protectedRawCard)');

assert.ok(
  authorityOrder,
  'A identidade histórica fica read-only e o Clean Slate r119 fecha a decisão depois da auditoria r118.'
);
assert.ok(masterEngine.includes('BM_R118_MASTER_READ_ONLY'));

assert.ok(finalEngine.includes('fitTrainingToExactBudget(identityPlan'));
assert.ok(finalEngine.includes('reconstructNaturalAttributes'));
console.log('r28/r119 aprovada: contrato público preservado com identidade legada read-only e autoridade final Clean Slate.');
