import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EXPLAINABLE_AI_R489_VERSION,
  buildExplainableDecisionR489
} from '../src/modules/explainable-ai/explainableDecisionEngineR489';

const input = {
  kind: 'BUILD',
  decisionId: 'fixture-r128',
  verdict: 'Ficha oficial preservada',
  availability: {
    r480: 'NOT_APPLICABLE',
    r481: 'NOT_APPLICABLE',
    r482: 'NOT_APPLICABLE',
    r483: 'UNAVAILABLE',
    r484: 'NOT_APPLICABLE'
  }
} as any;

assert.match(EXPLAINABLE_AI_R489_VERSION, /r489/i);

const before = JSON.stringify(input);
const first = buildExplainableDecisionR489(input);
const second = buildExplainableDecisionR489(input);

assert.deepEqual(first, second, 'R489 precisa ser determinístico para o mesmo input.');
assert.equal(JSON.stringify(input), before, 'R489 não pode mutar a entrada.');
assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteVault, false);
assert.equal(first.authority.optimizeOverall, false);
assert.equal(first.performanceConfidence, null, 'Sem evidência de desempenho, a confiança precisa permanecer nula.');
assert.ok(first.reasons.every((reason: any) => Array.isArray(reason.evidenceIds) && reason.evidenceIds.length > 0));

const engineSource = fs.readFileSync('src/modules/explainable-ai/explainableDecisionEngineR489.ts', 'utf8');
assert.doesNotMatch(engineSource, /fetch\(|localStorage|sessionStorage|Math\.random|Date\.now|new Date\(/);
assert.doesNotMatch(engineSource, /\.overall\b|maxOverall|\bGER\b/);

console.log('R489 contrato base aprovado.');
