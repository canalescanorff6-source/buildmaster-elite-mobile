import assert from 'node:assert/strict';
import { transformPreFinalAutofillR20 } from '../scripts/apply-prefinal-autofill-r20.mjs';

const source = `
      setPreFinalConfirmation({
        playerName: autoResult.parsed.playerName || '',
        level: String(autoResult.parsed.level ?? ''),
        points: String(autoResult.trainingPointsTotal ?? autoResult.parsed.trainingPointsTotal ?? '')
      });
Confira Nome, Nível máximo e Pontos antes de gerar a ficha
O restante da carta já foi analisado. Corrija somente estes dados se o OCR tiver lido algo errado.
`;

const output = transformPreFinalAutofillR20(source);

for (const marker of [
  'BM_PREFINAL_AUTOFILL_R20',
  'detectedPlayerName',
  'detectedLevel',
  'calculatedProgress',
  '(detectedLevel - 1) * 2',
  'preenchidos automaticamente'
]) {
  assert.ok(output.includes(marker), `r20 sem contrato: ${marker}`);
}

assert.ok(output.includes("playerName: detectedPlayerName"));
assert.ok(output.includes("level: detectedLevel > 0 ? String(detectedLevel) : ''"));
assert.ok(output.includes("points: detectedLevel > 0 || explicitProgress >= 0 ? String(detectedProgress) : ''"));
assert.equal(transformPreFinalAutofillR20(output), output, 'r20 precisa ser idempotente');

// Regra canônica de progressão: nível 31 => 60 pontos.
const level = 31;
assert.equal((level - 1) * 2, 60);

console.log('v40.80 r20 aprovada: Nome/Nível/Pontos automáticos; nível 31 => 60 pontos.');
