import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const finalEngine = readFileSync(new URL('../src/lib/finalIdentityEngineV4080R27.ts', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../src/lib/cardIntelligencePipeline.ts', import.meta.url), 'utf8');

assert.ok(
  finalEngine.includes('Ficha Automática v40.80 — Desempenho Real 2027'),
  'O nome público precisa preservar exatamente o contrato aceito pelas regressões v39.x.'
);
assert.ok(!finalEngine.includes("import { recommendImpetos } from './analyzer';"));
assert.ok(!finalEngine.includes('recommendedImpetos: impetos'));
assert.ok(
  pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') <
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)'),
  'A ficha DNA continua fechando antes das habilidades adicionais.'
);
assert.ok(finalEngine.includes('fitTrainingToExactBudget(identityPlan'));
assert.ok(finalEngine.includes('reconstructNaturalAttributes'));
console.log('r28 aprovada: contrato público restaurado e Ímpeto canônico preservado sem desfazer o Motor DNA Final.');
