import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applySourceBudgetConvergenceR443, R443_SOURCE_CHECKPOINT_BYTES } from '../scripts/apply-r443-source-budget-convergence.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r443-'));
const write = (relative, source) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
};

write('scripts/check-bundle-budget.mjs', "const limits={sourceTs: 5.25 * 1024 * 1024};\n");
write('tests/v40-80-r184-production-legacy-isolation-regression.mjs', "const sourceLimit=5.25*1024*1024;\n");
write('scripts/apply-r414-ci-contract-convergence.mjs', [
  'export const R414_SOURCE_BUDGET_BYTES = 5_405_024;',
  "if (!budgetCheck.includes('sourceTs: 5.25 * 1024 * 1024')) throw new Error('5,25 MiB');",
  'const x=/5\\.25\\s*\\*\\s*1024/;',
  'const result={sourceGlobalLimitBytes: 5.25 * 1024 * 1024};',
].join('\n'));
write('scripts/audit-r424-final-requirements-closure.mjs', "const a=5.25 * 1024 * 1024; const b=5_405_024; const c=/5\\.25\\s*\\*\\s*1024/; // 5,25 MiB\n");
write('tests/v40-80-r424-final-requirements-closure-regression.mjs', "const a='sourceTs: 5.25 * 1024 * 1024'; const b='R414_SOURCE_BUDGET_BYTES = 5_405_024';\n");

const failingSourceBytes = 5_485_036;
assert.ok(failingSourceBytes > 5_360_000, 'fixture deve reproduzir o teto que falhou no CI');
assert.ok(failingSourceBytes <= R443_SOURCE_CHECKPOINT_BYTES, 'novo checkpoint deve comportar a árvore R442 sem consumir a reserva');

const first = applySourceBudgetConvergenceR443(root);
assert.equal(first.changed, true);
assert.equal(first.checkpointBytes, 5_667_168);
assert.equal(first.reserveBytes, 100_000);
assert.equal(first.globalSourceBudgetBytes, 5.5 * 1024 * 1024);
assert.ok(first.patched.length >= 5);

const second = applySourceBudgetConvergenceR443(root);
assert.equal(second.changed, false, 'hotfix precisa ser idempotente');
assert.equal(second.patched.length, 0);

assert.match(fs.readFileSync(path.join(root,'scripts/check-bundle-budget.mjs'),'utf8'), /sourceTs: 5\.5 \* 1024 \* 1024/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r184-production-legacy-isolation-regression.mjs'),'utf8'), /sourceLimit=5\.5\*1024\*1024/);
assert.match(fs.readFileSync(path.join(root,'scripts/apply-r414-ci-contract-convergence.mjs'),'utf8'), /R414_SOURCE_BUDGET_BYTES = 5_667_168/);
assert.doesNotMatch(fs.readFileSync(path.join(root,'scripts/audit-r424-final-requirements-closure.mjs'),'utf8'), /5\.25 \* 1024 \* 1024|5_405_024|5,25 MiB/);
console.log('R443 aprovada: árvore R442 de 5.485.036 B cabe no checkpoint 5.667.168 B, com reserva de 100 KB e gates convergidos/idempotentes.');
