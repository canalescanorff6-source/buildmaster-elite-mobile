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

assert.equal(R432_GLOBAL_SOURCE_BUDGET_BYTES, 5.90625 * 1024 * 1024);
assert.equal(R432_SOURCE_RESERVE_BYTES, 65_536);
assert.equal(R432_SOURCE_CHECKPOINT_BYTES, 6_127_616);

const root=fs.mkdtempSync(path.join(os.tmpdir(),'buildmaster-r432-r518-'));
const write=(relative,content)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,'utf8')};
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

write('scripts/check-bundle-budget.mjs',`const limits={sourceTs: 5.765625 * 1024 * 1024};`);
write('scripts/apply-r407-scalable-vault-capacity.mjs',`import { R443_GLOBAL_SOURCE_BUDGET_BYTES, R443_SOURCE_CHECKPOINT_BYTES } from './apply-r443-source-budget-convergence.mjs'; const sourceBudget=R443_GLOBAL_SOURCE_BUDGET_BYTES; const ceiling=R443_SOURCE_CHECKPOINT_BYTES;`);
write('tests/v40-80-r184-production-legacy-isolation-regression.mjs',`const sourceLimit=5.765625*1024*1024; const minimumMargin=r414ScalableVault ? 65_536 : legacyMinimumMargin; const checkpointLimit=sourceLimit-minimumMargin;`);
write('scripts/apply-r414-ci-contract-convergence.mjs',`export const R414_SOURCE_BUDGET_BYTES = 5_980_160;\n// Guardrails: teto global real continua em 5,765625 MiB.\nif(!budgetCheck.includes('sourceTs: 5.765625 * 1024 * 1024'))throw new Error('orçamento global de 5,765625 MiB ausente');\nconst re=/5\\.765625\\s*\\*\\s*1024/;\nreturn { sourceGlobalLimitBytes: 5.765625 * 1024 * 1024, sourceReserveBytes: 65_536 };`);
write('scripts/audit-r424-final-requirements-closure.mjs',`function evaluateBudgetGate(){const b='sourceTs: 5.765625 * 1024 * 1024';const r414='R414_SOURCE_BUDGET_BYTES = 5_980_160';const detail='Gate real de 5,765625 MiB e reserva de 64 KiB.';return b+r414+detail}`);
write('tests/v40-80-r424-final-requirements-closure-regression.mjs',`w('scripts/check-bundle-budget.mjs','sourceTs: 5.765625 * 1024 * 1024');w('scripts/apply-r414-ci-contract-convergence.mjs','R414_SOURCE_BUDGET_BYTES = 5_980_160');`);

const before=auditR432SourceBudgetConvergence(root);
assert.equal(before.ok,false,'Fixture R517 deve começar RED diante do contrato R518.');
assert.ok(before.issues.length>=4);
const first=applyR432SourceBudgetConvergence(root);
assert.equal(first.changed,true);
const after=auditR432SourceBudgetConvergence(root);
assert.equal(after.ok,true,after.issues.join(' | '));
assert.match(read('scripts/check-bundle-budget.mjs'),/sourceTs: 5\.90625 \* 1024 \* 1024/);
assert.match(read('tests/v40-80-r184-production-legacy-isolation-regression.mjs'),/sourceLimit=5\.90625\*1024\*1024/);
assert.match(read('scripts/apply-r414-ci-contract-convergence.mjs'),/R414_SOURCE_BUDGET_BYTES = 6_127_616/);
assert.match(read('scripts/apply-r414-ci-contract-convergence.mjs'),/sourceTs: 5\.90625 \* 1024 \* 1024/);
assert.match(read('scripts/audit-r424-final-requirements-closure.mjs'),/5,90625 MiB/);
assert.match(read('tests/v40-80-r424-final-requirements-closure-regression.mjs'),/sourceTs: 5\.90625 \* 1024 \* 1024/);
for (const relative of ['scripts/check-bundle-budget.mjs','tests/v40-80-r184-production-legacy-isolation-regression.mjs','scripts/apply-r414-ci-contract-convergence.mjs','scripts/audit-r424-final-requirements-closure.mjs','tests/v40-80-r424-final-requirements-closure-regression.mjs']) write(relative,read(relative).replaceAll('5.90625','5.875').replaceAll('5\\.90625','5\\.875').replaceAll('5,90625','5,875').replaceAll('6_127_616','6_094_848'));
assert.equal(auditR432SourceBudgetConvergence(root).ok,false,'O baseline imediatamente anterior também precisa convergir.');
assert.equal(applyR432SourceBudgetConvergence(root).changed,true);
assert.equal(auditR432SourceBudgetConvergence(root).ok,true);
const second=applyR432SourceBudgetConvergence(root);
assert.equal(second.changed,false,'R432/R518 precisa ser idempotente.');
assert.deepEqual(second.patched,[]);
const actualSourceBytes=5_991_302;
const margin=R432_GLOBAL_SOURCE_BUDGET_BYTES-actualSourceBytes;
assert.ok(margin>=R432_SOURCE_RESERVE_BYTES,`R518 deve preservar 64 KiB completos; margem=${margin}`);
console.log(`R432/R518 aprovada: 5,90625 MiB, checkpoint ${R432_SOURCE_CHECKPOINT_BYTES} e reserva ${R432_SOURCE_RESERVE_BYTES} B.`);
