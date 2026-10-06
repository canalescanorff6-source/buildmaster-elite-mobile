import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const tone = fs.readFileSync('src/modules/experience/statusToneR545.ts', 'utf8');

assert.match(
  tone,
  /export function classifyPremiumStatusR545/,
  'R545 RED: precisa existir classificador explícito de status premium.',
);

assert.ok(
  tone.includes(String.raw`\\berros?\\b`),
  'R545 RED: erro deve ser reconhecido por palavra inteira para não casar com "encerrou".',
);

assert.doesNotMatch(
  tone,
  /\/falha\|erro\|não foi possível/,
  'R545 RED: classificador antigo por substring não pode continuar ativo.',
);

assert.match(
  app,
  /classifyPremiumStatusR545\(message\)/,
  'R545 RED: CardVisionApp deve usar o classificador explícito.',
);

assert.match(
  app,
  /isCreationSection && \(mainSection !== 'leitor' \|\| !loading\)/,
  'R545 RED: Passo 2 deve ficar oculto enquanto o Reader V2 ainda está lendo.',
);

console.log('R545 aprovado: sucesso do Reader V2 não vira erro por substring e confirmação só aparece após a leitura.');
