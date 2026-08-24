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
    pipeline.indexOf('applyMasterCardEngineV4080R50(current)') &&
  pipeline.indexOf('applyMasterCardEngineV4080R50(current)') <
    pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') &&
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') <
    pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)');

assert.ok(
  authorityOrder,
  'A identidade histórica fica read-only e a Card Signature fecha antes da autoridade r118.'
);
assert.ok(masterEngine.includes('BM_R118_MASTER_READ_ONLY'));

assert.ok(finalEngine.includes('fitTrainingToExactBudget(identityPlan'));
assert.ok(finalEngine.includes('reconstructNaturalAttributes'));
console.log('r28/r118 aprovada: contrato público preservado com identidade legada read-only e autoridade final r118.');
