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
write('tests/v40-80-r193-analyzer-dedup-budget-regression.mjs', "const effectiveLimit = r443CatalogBoundary ? 5_832_704 : 5_344_000;\n");
write('tests/v40-80-r194-cardvision-contract-dedup-regression.mjs', "const effectiveLimit = postCatalogBoundary ? 5_832_704 : 5_340_500;\n");
write('scripts/apply-r414-ci-contract-convergence.mjs', [
  'export const R414_SOURCE_BUDGET_BYTES = 5_405_024;',
  "if (!budgetCheck.includes('sourceTs: 5.25 * 1024 * 1024')) throw new Error('5,25 MiB');",
  'const x=/5\\.25\\s*\\*\\s*1024/;',
  'const result={sourceGlobalLimitBytes: 5.25 * 1024 * 1024};',
].join('\n'));
write('scripts/audit-r424-final-requirements-closure.mjs', "const ok=/sourceTs:\\s*5\\.25\\s*\\*\\s*1024\\s*\\*\\s*1024/.test(b)&&/R414_SOURCE_BUDGET_BYTES\\s*=\\s*5_405_024/.test(r414); // 5,25 MiB\n");
write('tests/v40-80-r424-final-requirements-closure-regression.mjs', "const a='sourceTs: 5.25 * 1024 * 1024'; const b='R414_SOURCE_BUDGET_BYTES = 5_405_024';\n");

const failingSourceBytes = 5_900_000;
assert.ok(failingSourceBytes > 5_832_704, 'fixture deve ultrapassar o checkpoint R443 anterior usado pelos R193/R194');
assert.ok(failingSourceBytes <= R443_SOURCE_CHECKPOINT_BYTES, 'novo checkpoint deve acomodar o R500 mantendo a reserva de 64 KiB');

const first = applySourceBudgetConvergenceR443(root);
assert.equal(first.changed, true);
assert.equal(first.checkpointBytes, 5_963_776);
assert.equal(first.reserveBytes, 65_536);
assert.equal(first.globalSourceBudgetBytes, 5.75 * 1024 * 1024);
assert.ok(first.patched.length >= 7, 'R443 deve convergir também os orçamentos legados dos R193 e R194');

const second = applySourceBudgetConvergenceR443(root);
assert.equal(second.changed, false, 'migração de orçamento precisa ser idempotente');
assert.equal(second.patched.length, 0);

assert.match(fs.readFileSync(path.join(root,'scripts/check-bundle-budget.mjs'),'utf8'), /sourceTs: 5\.75 \* 1024 \* 1024/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r184-production-legacy-isolation-regression.mjs'),'utf8'), /sourceLimit=5\.75\*1024\*1024/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r193-analyzer-dedup-budget-regression.mjs'),'utf8'), /5_963_776/);
assert.doesNotMatch(fs.readFileSync(path.join(root,'tests/v40-80-r193-analyzer-dedup-budget-regression.mjs'),'utf8'), /5_832_704/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r194-cardvision-contract-dedup-regression.mjs'),'utf8'), /5_963_776/);
assert.doesNotMatch(fs.readFileSync(path.join(root,'tests/v40-80-r194-cardvision-contract-dedup-regression.mjs'),'utf8'), /5_832_704/);
assert.match(fs.readFileSync(path.join(root,'scripts/apply-r414-ci-contract-convergence.mjs'),'utf8'), /R414_SOURCE_BUDGET_BYTES = 5_963_776/);
assert.doesNotMatch(fs.readFileSync(path.join(root,'scripts/audit-r424-final-requirements-closure.mjs'),'utf8'), /5\.25 \* 1024 \* 1024|5_405_024|5,25 MiB/);
console.log('R443/R500 aprovada: checkpoint 5.963.776 B preserva 64 KiB de reserva e converge também R193/R194.');
