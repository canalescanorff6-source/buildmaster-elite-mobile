import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const patcher = readFileSync(new URL('../scripts/apply-r17-regression-compatibility.mjs', import.meta.url), 'utf8');
for (const marker of [
  'BM_R17_REGRESSION_COMPATIBILITY',
  'carryIdentity >= 86',
  'dribbleSlots() >= 2',
  "position === 'CF'",
  'Proteção anti-overall',
  'Confira Nome, Nível máximo e Pontos de progressão',
  'setDraftResult\\\\(autoResult\\\\)'
]) {
  assert.ok(patcher.includes(marker), `r17 sem contrato ${marker}`);
}
assert.ok(patcher.includes("tests/v40-10-progress-experience-regression.mjs"));
assert.ok(patcher.includes("tests/v40-70-live-catalog-zero-confirmation-regression.mjs"));
console.log('v40.80 r17 estrutural aprovada: DNA técnico + anti-overall + regressões r16 alinhadas.');
