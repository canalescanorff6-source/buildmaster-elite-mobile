import assert from 'node:assert/strict';
import { transformPreFinalAutofillR20 } from '../scripts/apply-prefinal-autofill-r20.mjs';

const base = `      setPreFinalConfirmation({
        playerName: autoResult.parsed.playerName || '',
        level: String(autoResult.parsed.level ?? ''),
        points: String(autoResult.trainingPointsTotal ?? autoResult.parsed.trainingPointsTotal ?? '')
      });
Confira Nome, Nível máximo e Pontos antes de gerar a ficha
O restante da carta já foi analisado. Corrija somente estes dados se o OCR tiver lido algo errado.`;

const out = transformPreFinalAutofillR20(base);
assert.ok(out.includes('BM_PREFINAL_AUTOFILL_R20'));
assert.ok(out.includes('preenchidos automaticamente'));
assert.ok(out.includes('explicitProgress > 0 ? explicitProgress : calculatedProgress'));
assert.ok(out.split('\n').length < base.split('\n').length + 12);
assert.equal(transformPreFinalAutofillR20(out), out);
console.log('r21 aprovado: autofill compacto e compatível com teto estrutural.');
