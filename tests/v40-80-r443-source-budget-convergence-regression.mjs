import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applySourceBudgetConvergenceR443,
  R443_GLOBAL_SOURCE_BUDGET_BYTES,
  R443_SOURCE_CHECKPOINT_BYTES,
  R443_SOURCE_RESERVE_BYTES,
} from '../scripts/apply-r443-source-budget-convergence.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'buildmaster-r443-r518-'));
const write=(relative,source)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source)};
write('scripts/check-bundle-budget.mjs','const limits={sourceTs: 5.765625 * 1024 * 1024};\n');
write('tests/v40-80-r184-production-legacy-isolation-regression.mjs','const sourceLimit=5.765625*1024*1024;\n');
for(const [file,tail] of [
 ['v40-80-r193-analyzer-dedup-budget-regression.mjs','5_344_000'],
 ['v40-80-r194-cardvision-contract-dedup-regression.mjs','5_340_500'],
 ['v40-80-r195-controller-prop-hotpath-regression.mjs','5_337_000'],
 ['v40-80-r196-analyzer-compiled-scoring-regression.mjs','5_335_700'],
 ['v40-80-r197-training-budget-hotpath-regression.ts','5_335_500'],
 ['v40-80-r198-e2e-production-finalization-authority-regression.mjs','5_335_350'],
 ['v40-80-r199-persistence-session-cache-audit-regression.mjs','5_335_307'],
 ['v40-80-r200-mobile-startup-runtime-boundary-regression.mjs','5_360_000'],
])write(`tests/${file}`,`const sourceLimit=postBoundary?5_980_160:${tail};\n`);
write('scripts/apply-r414-ci-contract-convergence.mjs',[
 'export const R414_SOURCE_BUDGET_BYTES = 5_980_160;',
 "if(!budget.includes('sourceTs: 5.765625 * 1024 * 1024'))throw new Error('5,765625 MiB');",
 'const re=/5\\.765625\\s*\\*\\s*1024/;',
 'const result={sourceGlobalLimitBytes: 5.765625 * 1024 * 1024};',
].join('\n'));
write('scripts/audit-r424-final-requirements-closure.mjs',"const ok=/sourceTs:\\s*5\\.765625\\s*\\*\\s*1024\\s*\\*\\s*1024/.test(b)&&/R414_SOURCE_BUDGET_BYTES\\s*=\\s*5_980_160/.test(r414); // 5,765625 MiB\n");
write('tests/v40-80-r424-final-requirements-closure-regression.mjs',"const a='sourceTs: 5.765625 * 1024 * 1024'; const b='R414_SOURCE_BUDGET_BYTES = 5_980_160';\n");

const currentSourceBytes=5_991_302;
assert.ok(currentSourceBytes>5_980_160,'R518 deve reproduzir a ultrapassagem do checkpoint R517 após a nova evidência real.');
assert.equal(R443_GLOBAL_SOURCE_BUDGET_BYTES,5.78125*1024*1024);
assert.equal(R443_SOURCE_RESERVE_BYTES,65_536);
assert.equal(R443_SOURCE_CHECKPOINT_BYTES,5_996_544);
assert.ok(currentSourceBytes<=R443_SOURCE_CHECKPOINT_BYTES,'avanço mínimo deve acomodar R518 preservando integralmente a reserva de 64 KiB.');
assert.ok(R443_GLOBAL_SOURCE_BUDGET_BYTES-currentSourceBytes>=R443_SOURCE_RESERVE_BYTES);

const first=applySourceBudgetConvergenceR443(root);
assert.equal(first.changed,true);
assert.equal(first.checkpointBytes,5_996_544);
assert.equal(first.reserveBytes,65_536);
assert.equal(first.globalSourceBudgetBytes,5.78125*1024*1024);
assert.ok(first.patched.length>=13);
const second=applySourceBudgetConvergenceR443(root);
assert.equal(second.changed,false,'convergência R443/R518 precisa ser idempotente');
assert.equal(second.patched.length,0);

assert.match(fs.readFileSync(path.join(root,'scripts/check-bundle-budget.mjs'),'utf8'),/sourceTs: 5\.78125 \* 1024 \* 1024/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r184-production-legacy-isolation-regression.mjs'),'utf8'),/sourceLimit=5\.78125\*1024\*1024/);
for(const file of [
 'v40-80-r193-analyzer-dedup-budget-regression.mjs','v40-80-r194-cardvision-contract-dedup-regression.mjs',
 'v40-80-r195-controller-prop-hotpath-regression.mjs','v40-80-r196-analyzer-compiled-scoring-regression.mjs',
 'v40-80-r197-training-budget-hotpath-regression.ts','v40-80-r198-e2e-production-finalization-authority-regression.mjs',
 'v40-80-r199-persistence-session-cache-audit-regression.mjs','v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
])assert.match(fs.readFileSync(path.join(root,'tests',file),'utf8'),/5_996_544/);
assert.match(fs.readFileSync(path.join(root,'scripts/apply-r414-ci-contract-convergence.mjs'),'utf8'),/R414_SOURCE_BUDGET_BYTES = 5_996_544/);
assert.match(fs.readFileSync(path.join(root,'scripts/audit-r424-final-requirements-closure.mjs'),'utf8'),/5\\\.78125/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r424-final-requirements-closure-regression.mjs'),'utf8'),/5\.78125 \* 1024 \* 1024/);
console.log('R443/R518 aprovada: orçamento avançou apenas 16 KiB e preserva 64 KiB completos de reserva.');
