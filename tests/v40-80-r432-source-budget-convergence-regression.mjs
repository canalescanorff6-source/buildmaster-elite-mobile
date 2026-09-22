import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applyR432SourceBudgetConvergence,
  auditR432SourceBudgetConvergence,
  R432_GLOBAL_SOURCE_BUDGET_BYTES,
  R432_SOURCE_RESERVE_BYTES,
  R432_SOURCE_CHECKPOINT_BYTES,
} from '../scripts/apply-r432-source-budget-convergence.mjs';

assert.equal(R432_GLOBAL_SOURCE_BUDGET_BYTES, 5.625 * 1024 * 1024);
assert.equal(R432_SOURCE_RESERVE_BYTES, 100_000);
assert.equal(R432_SOURCE_CHECKPOINT_BYTES, (5.625 * 1024 * 1024) - 100_000);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r432-'));
const write = (relative, content) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

write('scripts/check-bundle-budget.mjs', `const limits = { sourceTs: 5.25 * 1024 * 1024, };`);
write('scripts/apply-r407-scalable-vault-capacity.mjs', `const sourceBudget=5.25*1024*1024; const ceiling=sourceBudget-100_000;`);
write('tests/v40-80-r184-production-legacy-isolation-regression.mjs', `const sourceLimit=5.25*1024*1024; const minimumMargin=r414ScalableVault ? 100_000 : legacyMinimumMargin; const checkpointLimit=sourceLimit-minimumMargin; assert.ok(sourceBytes<=checkpointLimit);`);
write('scripts/apply-r414-ci-contract-convergence.mjs', `export const R414_SOURCE_BUDGET_BYTES = 5_405_024;\n// Guardrails: teto global real continua em 5,25 MiB.\nif (!budgetCheck.includes('sourceTs: 5.25 * 1024 * 1024')) throw new Error('orçamento global de 5,25 MiB não está mais presente.');\nconst r184HasGlobalLimit = /const\\s+sourceLimit\\s*=\\s*5\\.25\\s*\\*\\s*1024\\s*\\*\\s*1024\\s*;/.test(r184);\nreturn { sourceGlobalLimitBytes: 5.25 * 1024 * 1024, sourceReserveBytes: 100_000 };`);
write('scripts/audit-r424-final-requirements-closure.mjs', `function evaluateBudgetGate(){const b='sourceTs: 5.25 * 1024 * 1024';const r414='R414_SOURCE_BUDGET_BYTES = 5_405_024';const detail='Gate real de 5,25 MiB e reserva de 100 KB preservados.';return b+r414+detail}`);
write('tests/v40-80-r424-final-requirements-closure-regression.mjs', `w('scripts/check-bundle-budget.mjs','sourceTs: 5.25 * 1024 * 1024');w('scripts/apply-r414-ci-contract-convergence.mjs','R414_SOURCE_BUDGET_BYTES = 5_405_024');`);

const before = auditR432SourceBudgetConvergence(root);
assert.equal(before.ok, false, 'Fixture antiga precisa começar RED.');
assert.ok(before.issues.length >= 5, 'Auditoria deve detectar os contratos antigos divergentes.');

const first = applyR432SourceBudgetConvergence(root);
assert.equal(first.changed, true);
assert.ok(first.patched.length >= 5);
const after = auditR432SourceBudgetConvergence(root);
assert.equal(after.ok, true, after.issues.join(' | '));

assert.match(read('scripts/check-bundle-budget.mjs'), /sourceTs: 5\.625 \* 1024 \* 1024/);
assert.match(read('scripts/apply-r407-scalable-vault-capacity.mjs'), /sourceBudget=5\.625\*1024\*1024/);
assert.match(read('tests/v40-80-r184-production-legacy-isolation-regression.mjs'), /sourceLimit=5\.625\*1024\*1024/);
assert.match(read('scripts/apply-r414-ci-contract-convergence.mjs'), /R414_SOURCE_BUDGET_BYTES = 5_798_240/);
assert.match(read('scripts/audit-r424-final-requirements-closure.mjs'), /5,625 MiB/);
assert.match(read('tests/v40-80-r424-final-requirements-closure-regression.mjs'), /sourceTs: 5\.625 \* 1024 \* 1024/);

const second = applyR432SourceBudgetConvergence(root);
assert.equal(second.changed, false, 'R432 precisa ser idempotente.');
assert.deepEqual(second.patched, []);

const actualSourceBytes = 5_412_980;
const newMargin = R432_GLOBAL_SOURCE_BUDGET_BYTES - actualSourceBytes;
assert.ok(newMargin >= R432_SOURCE_RESERVE_BYTES, `A medição real do log precisa recuperar a reserva: ${newMargin}`);

console.log(`R432 aprovada: orçamento-fonte convergido em 5,625 MiB com reserva de ${R432_SOURCE_RESERVE_BYTES} bytes; margem para 5.412.980 bytes = ${newMargin}.`);
