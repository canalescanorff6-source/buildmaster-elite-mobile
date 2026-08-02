import assert from 'node:assert/strict';
import {
  calculateUnifiedCreationProgress,
  createUnifiedCreationDraft,
  isUnifiedCreationDraftActive,
  resolveUnifiedCreationStep,
  unifiedCreationDraftLabel,
  UNIFIED_CREATION_VERSION
} from '../src/lib/unifiedCreationFlowV3790';

assert.equal(UNIFIED_CREATION_VERSION, '37.90.0');
assert.equal(resolveUnifiedCreationStep({ hasDraftResult: false, hasResult: false }), 'input');
assert.equal(resolveUnifiedCreationStep({ hasDraftResult: true, hasResult: false }), 'review');
assert.equal(resolveUnifiedCreationStep({ hasDraftResult: true, hasResult: true }), 'result');

const readerProgress = calculateUnifiedCreationProgress({
  method: 'reader',
  playerName: 'Jogador Teste',
  points: '62',
  targetPosition: 'CF',
  cardPosition: 'CF',
  playstyle: 'Artilheiro',
  hasImage: true,
  hasRawText: true,
  manualAttributeCount: 0,
  hasDraftResult: false,
  hasResult: false
});
assert.ok(readerProgress >= 70, `Fluxo completo de entrada deve chegar próximo da revisão: ${readerProgress}`);

const draft = createUnifiedCreationDraft({
  method: 'manual',
  playerName: '  Jogador Manual  ',
  points: '62 pontos',
  targetPosition: 'AMF',
  cardPosition: 'CMF',
  playstyle: 'Meia versátil',
  hasImage: false,
  hasRawText: true,
  manualAttributeCount: 8,
  hasDraftResult: true,
  hasResult: false
});
assert.equal(draft.playerName, 'Jogador Manual');
assert.equal(draft.points, '62');
assert.equal(draft.step, 'review');
assert.equal(draft.progress, 78);
assert.equal(unifiedCreationDraftLabel(draft), 'Ficha de Jogador Manual');
assert.equal(isUnifiedCreationDraftActive(draft, Date.parse(draft.updatedAt) + 1000), true);
assert.equal(isUnifiedCreationDraftActive(draft, Date.parse(draft.updatedAt) + 1000 * 60 * 60 * 24 * 8), false);

console.log('v37.90 Fluxo Único aprovado: entrada centralizada, progresso consistente e rascunho retomável por conta.');
