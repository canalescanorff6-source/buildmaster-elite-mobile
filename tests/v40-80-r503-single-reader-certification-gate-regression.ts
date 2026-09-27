import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { CardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';
import { deriveSingleReaderFinalizationR503 } from '../src/modules/card-reader/singleReaderFinalizationR503';

function certification(
  state: CardTruthCertificationR501['state'],
  canFinalize: boolean,
): CardTruthCertificationR501 {
  return {
    version: '40.80-r501-card-truth-certification-v1',
    state,
    confidencePercent: state === 'FINAL_CERTIFIED' ? 96 : 72,
    criticalState: state === 'FINAL_CERTIFIED' ? 'TRUSTED' : 'UNCERTAIN',
    trainingBudgetState: state === 'FINAL_CERTIFIED' ? 'TRUSTED' : 'UNCERTAIN',
    levelState: state === 'FINAL_CERTIFIED' ? 'TRUSTED' : 'UNCERTAIN',
    canFinalize,
    reasons: ['fixture R503'],
  };
}

const final = deriveSingleReaderFinalizationR503(certification('FINAL_CERTIFIED', true));
assert.equal(final.state, 'FINALIZE');
assert.equal(final.canPersistConfirmed, true);
assert.equal(final.canPromoteResult, true);

for (const state of [
  'PROVISIONAL_HIGH_CONFIDENCE',
  'PROVISIONAL_LOW_CONFIDENCE',
] as const) {
  const decision = deriveSingleReaderFinalizationR503(certification(state, false));
  assert.equal(decision.state, 'REVIEW_REQUIRED', `R503: ${state} deve permanecer em revisão.`);
  assert.equal(decision.canPersistConfirmed, false, 'R503: ficha provisória não pode ser persistida como confirmada.');
  assert.equal(decision.canPromoteResult, false, 'R503: ficha provisória não pode virar resultado final.');
}

const blocked = deriveSingleReaderFinalizationR503(certification('BLOCKED_INSUFFICIENT_DATA', false));
assert.equal(blocked.state, 'BLOCKED');
assert.equal(blocked.canPersistConfirmed, false);
assert.equal(blocked.canPromoteResult, false);

const missing = deriveSingleReaderFinalizationR503(null);
assert.equal(missing.state, 'BLOCKED', 'R503: resultado sem certificação deve falhar fechado.');
assert.equal(missing.canPersistConfirmed, false);
assert.equal(missing.canPromoteResult, false);

const reader = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts', 'utf8');
assert.match(reader, /deriveSingleReaderFinalizationR503/,
  'R503: fluxo unitário precisa consultar a autoridade de promoção antes de confirmar.');
assert.match(reader, /const confirmationDecisionR503=deriveSingleReaderFinalizationR503\([\s\S]{0,160}cardTruthCertificationR501[\s\S]{0,120}\);/,
  'R503: decisão deve usar a certificação estrutural produzida pelo Clean Slate.');

const confirmedIndex = reader.indexOf('if (confirmed) {');
const persistIndex = reader.indexOf('persistConfirmedAnalysisR470(nextResult');
const finalSetIndex = reader.indexOf('setResult(nextResult);');
const decisionIndex = reader.indexOf('confirmationDecisionR503');
assert.ok(confirmedIndex >= 0 && persistIndex > confirmedIndex && finalSetIndex > persistIndex, 'R503: fluxo confirmado esperado não foi localizado.');
assert.ok(decisionIndex >= 0 && decisionIndex < persistIndex,
  'R503: certificação precisa ser avaliada antes da persistência confirmada.');

assert.match(reader,
  /if\s*\(!confirmationDecisionR503\.canPersistConfirmed\)[\s\S]{0,700}setDraftResult\(nextResult\);[\s\S]{0,180}setResult\(null\);[\s\S]{0,300}return;/,
  'R503: ficha não certificada deve permanecer como prévia e interromper a promoção/persistência.');
assert.match(reader,
  /if\s*\(confirmed\)[\s\S]{0,1800}confirmationDecisionR503\.canPersistConfirmed[\s\S]{0,3000}persistConfirmedAnalysisR470\(nextResult/,
  'R503: persistência confirmada só pode ocorrer depois do gate estrutural.');

const safeRepair = fs.readFileSync('scripts/ci-safe-repair.mjs', 'utf8');
assert.match(safeRepair, /applyR503SingleReaderFinalization/,
  'R503: Zero-Red precisa materializar o gate unitário antes dos testes pesados.');
assert.match(safeRepair, /Card Truth R503[^\n]*confirmação unitária/,
  'R503: ci:repair-safe precisa expor uma etapa explícita para a confirmação unitária fail-closed.');

console.log('R503 aprovado: confirmação manual não vence Card Truth; somente FINAL_CERTIFIED pode persistir e virar resultado final.');
