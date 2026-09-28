import assert from 'node:assert/strict';
import { evaluateFinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';
import type { ParsedCard } from '../src/lib/analyzerDomain';

const parsed = {
  impetos: [{ name: 'Técnica +2', active: true }],
  confidence: 95,
  attributes: {},
  evidence: { impetoSlotStatus: 'OCUPADO' },
} as unknown as ParsedCard;

const result = evaluateFinalImpetoDecisionR457(
  parsed,
  [
    { id: 'short_creation', frequency: 92, contribution: 90 },
    { id: 'through_creation', frequency: 88, contribution: 86 },
  ],
  'CMF',
  parsed.attributes,
);

assert.equal(result.current, 'Técnica +2');
assert.equal(result.action, 'KEEP_CURRENT', 'Ímpeto já ativo nunca pode virar gasto/troca automática.');
assert.equal(result.automaticSpendAuthorized, false);

console.log('R508: Ímpeto ativo preservado como KEEP_CURRENT.');
