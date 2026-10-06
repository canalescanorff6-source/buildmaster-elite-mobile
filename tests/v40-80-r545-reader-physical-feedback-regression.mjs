import assert from 'node:assert/strict';
import fs from 'node:fs';

// Evidência física R545: Android chegou a 90%/9 de 10 e concluiu o worker; este gate protege o feedback exibido ao usuário.

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const progressCard = fs.readFileSync('src/components/ReaderRecoveryAndProgressV3840.tsx', 'utf8');

assert.doesNotMatch(
  app,
  /\/falha\|erro\|não foi possível\|inválid\|corrompid\//,
  'R545 RED: classificador de perigo não pode casar "erro" como substring dentro de palavras de sucesso, como "encerrou".',
);
assert.match(
  app,
  /\\berros?\\b/,
  'R545 RED: erro deve ser reconhecido por palavra inteira no classificador de toast.',
);
assert.match(
  progressCard,
  /const liveMessage = progress\?\.label\?\.trim\(\) \|\| status;/,
  'R545 RED: card físico deve priorizar o rótulo de progresso atual em vez de status inicial obsoleto.',
);
assert.match(
  progressCard,
  /<p>\{liveMessage\}<\/p>/,
  'R545 RED: mensagem dinâmica deve ser renderizada no card de progresso.',
);

console.log('R545 aprovado: sucesso não vira alerta vermelho e progresso físico mostra o campo atual.');
