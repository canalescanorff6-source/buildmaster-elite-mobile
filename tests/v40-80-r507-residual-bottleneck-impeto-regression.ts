import assert from 'node:assert/strict';
import type { ParsedCard } from '../src/lib/analyzerDomain';
import { evaluateFinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';

const parsed = {
  playerName: 'R507 Test',
  mainPosition: 'AMF',
  confidence: 96,
  attributes: {
    lowPass: 82,
    loftedPass: 80,
    ballControl: 84,
    tightPossession: 84,
    dribbling: 82,
    offensiveAwareness: 80,
    acceleration: 80,
    balance: 80,
  },
  impetos: [],
  evidence: { impetoSlotStatus: 'DISPONIVEL' },
} as unknown as ParsedCard;

const finalAttributes = { ...parsed.attributes } as any;

const passBottleneck = evaluateFinalImpetoDecisionR457(parsed, [
  { id: 'short_creation', frequency: 95, contribution: 90, projectedScore: 42 },
  { id: 'through_creation', frequency: 90, contribution: 86, projectedScore: 48 },
  { id: 'close_control', frequency: 82, contribution: 78, projectedScore: 92 },
], 'AMF', finalAttributes);

const passResolved = evaluateFinalImpetoDecisionR457(parsed, [
  { id: 'short_creation', frequency: 95, contribution: 90, projectedScore: 94 },
  { id: 'through_creation', frequency: 90, contribution: 86, projectedScore: 92 },
  { id: 'close_control', frequency: 82, contribution: 78, projectedScore: 92 },
], 'AMF', finalAttributes);

const legacy = evaluateFinalImpetoDecisionR457(parsed, [
  { id: 'short_creation', frequency: 95, contribution: 90 },
  { id: 'through_creation', frequency: 90, contribution: 86 },
], 'AMF', finalAttributes);

const candidate = (result: typeof passBottleneck, name: string) =>
  result.candidates.find((item) => item.name === name);

const bottleneckPasse = candidate(passBottleneck, 'Passe');
const resolvedPasse = candidate(passResolved, 'Passe');
assert.ok(bottleneckPasse && resolvedPasse, 'R507: Passe precisa permanecer comparável no Top 5 de Ímpetos.');
assert.equal(passBottleneck.residualBottleneckSource, 'POST_BUILD_ACTION_GAPS',
  'R507: decisão com projectedScore deve declarar gargalos pós-build como fonte.');
assert.equal(passResolved.residualBottleneckSource, 'POST_BUILD_ACTION_GAPS',
  'R507: ações resolvidas ainda vêm do mesmo estado pós-build, apenas com gap menor.');
assert.equal(legacy.residualBottleneckSource, 'LEGACY_NO_PROJECTED_GAPS',
  'R507: ausência de projectedScore deve permanecer fallback explícito.');
assert.ok(bottleneckPasse.residualBottleneckFit > resolvedPasse.residualBottleneckFit,
  'R507: Ímpeto Passe deve receber mais contexto residual quando criação por passe continua fraca após a ficha.');
assert.ok(bottleneckPasse.totalScore > resolvedPasse.totalScore,
  'R507: mantendo demanda/posição/atributos iguais, o gargalo residual pós-build precisa influenciar o ranking funcional.');
assert.equal(legacy.candidates.every((item) => item.residualBottleneckFit === 0), true,
  'R507: fallback sem projectedScore não pode inventar gargalo residual.');
assert.equal(passBottleneck.numericAttributeEffectVerified, false,
  'R507: contexto residual não autoriza inventar efeito numérico oficial de Ímpeto.');
assert.equal(passBottleneck.automaticSpendAuthorized, false,
  'R507: gargalo residual não autoriza gasto automático.');

const repeat = evaluateFinalImpetoDecisionR457(parsed, [
  { id: 'short_creation', frequency: 95, contribution: 90, projectedScore: 42 },
  { id: 'through_creation', frequency: 90, contribution: 86, projectedScore: 48 },
  { id: 'close_control', frequency: 82, contribution: 78, projectedScore: 92 },
], 'AMF', finalAttributes);
assert.deepEqual(repeat.candidates, passBottleneck.candidates, 'R507: gargalo residual precisa ser determinístico.');

console.log('R507 aprovado: Ímpeto usa gargalo residual pós-ficha sem inventar bônus numérico oficial ou gasto automático.');
