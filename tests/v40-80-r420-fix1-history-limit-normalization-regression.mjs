import assert from 'node:assert/strict';
import { normalizeR200HistoryLimitR420 } from '../scripts/apply-r420-persistence-recovery-closure.mjs';

assert.equal(typeof normalizeR200HistoryLimitR420, 'function', 'R420-fix1 precisa expor normalizador semântico do símbolo R200.');

const canonical = 'export const HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER; // R420: símbolo legado sem teto lógico.';
for (const rhs of ['200', 'Infinity', 'Number.MAX_SAFE_INTEGER']) {
  const source = `export const CARD_HISTORY_STARTUP_MODEL_R200_VERSION = 'x';\nexport const HISTORY_LIMIT_R200   =   ${rhs}; // forma transitória\nexport const AFTER = true;\n`;
  const normalized = normalizeR200HistoryLimitR420(source);
  assert.match(normalized, /HISTORY_LIMIT_R200\s*=\s*Number\.MAX_SAFE_INTEGER\s*;/, `R420-fix1 deve normalizar ${rhs}.`);
  assert.ok(normalized.includes(canonical), `R420-fix1 deve produzir forma canônica para ${rhs}.`);
  assert.equal(normalizeR200HistoryLimitR420(normalized), normalized, 'Normalização deve ser idempotente.');
}

assert.throws(
  () => normalizeR200HistoryLimitR420('export const HISTORY_LIMIT_R200 = 500;\n'),
  /valor inesperado.*500/i,
  'Um novo teto desconhecido precisa falhar fechado, não ser aceito silenciosamente.'
);
assert.throws(
  () => normalizeR200HistoryLimitR420('export const OTHER = 200;\n'),
  /declaração.*ausente/i,
  'Símbolo ausente precisa gerar diagnóstico explícito.'
);

console.log('R420-fix1 aprovada: R200 é normalizado semanticamente e qualquer teto inesperado falha fechado.');
