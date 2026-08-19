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

const legacyDirectOrder =
  pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') <
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)');

const masterOrder =
  pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') <
    pipeline.indexOf('applyMasterCardEngineV4080R50(current)') &&
  masterEngine.indexOf('applyFinalCardAuthorityV4080R45(input)') <
    masterEngine.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)');

assert.ok(
  legacyDirectOrder || masterOrder,
  'A ficha DNA continua fechando antes das habilidades adicionais.'
);

assert.ok(finalEngine.includes('fitTrainingToExactBudget(identityPlan'));
assert.ok(finalEngine.includes('reconstructNaturalAttributes'));
console.log('r28/r50 aprovada: contrato público preservado e ordem ficha DNA -> Top 5 mantida pela autoridade única do Motor Mestre.');
