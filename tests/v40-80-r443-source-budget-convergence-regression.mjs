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

const root=fs.mkdtempSync(path.join(os.tmpdir(),'buildmaster-r443-r542-'));
const write=(relative,source)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source)};
write('scripts/check-bundle-budget.mjs','const limits={sourceTs: 5.78125 * 1024 * 1024};\n');
write('tests/v40-80-r184-production-legacy-isolation-regression.mjs','const sourceLimit=5.78125*1024*1024;\n');
for(const [file,tail] of [
 ['v40-80-r193-analyzer-dedup-budget-regression.mjs','5_344_000'],
 ['v40-80-r194-cardvision-contract-dedup-regression.mjs','5_340_500'],
 ['v40-80-r195-controller-prop-hotpath-regression.mjs','5_337_000'],
 ['v40-80-r196-analyzer-compiled-scoring-regression.mjs','5_335_700'],
 ['v40-80-r197-training-budget-hotpath-regression.ts','5_335_500'],
 ['v40-80-r198-e2e-production-finalization-authority-regression.mjs','5_335_350'],
 ['v40-80-r199-persistence-session-cache-audit-regression.mjs','5_335_307'],
 ['v40-80-r200-mobile-startup-runtime-boundary-regression.mjs','5_360_000'],
])write(`tests/${file}`,`const sourceLimit=postBoundary?5_996_544:${tail};\n`);
write('scripts/apply-r414-ci-contract-convergence.mjs',[
 'export const R414_SOURCE_BUDGET_BYTES = 5_996_544;',
 "if(!budget.includes('sourceTs: 5.78125 * 1024 * 1024'))throw new Error('5,78125 MiB');",
 'const re=/5\\.78125\\s*\\*\\s*1024/;',
 'const result={sourceGlobalLimitBytes: 5.78125 * 1024 * 1024};',
].join('\n'));
write('scripts/audit-r424-final-requirements-closure.mjs',"const ok=/sourceTs:\\s*5\\.78125\\s*\\*\\s*1024\\s*\\*\\s*1024/.test(b)&&/R414_SOURCE_BUDGET_BYTES\\s*=\\s*5_996_544/.test(r414); // 5,78125 MiB\n");
write('tests/v40-80-r424-final-requirements-closure-regression.mjs',"const a='sourceTs: 5.78125 * 1024 * 1024'; const b='R414_SOURCE_BUDGET_BYTES = 5_996_544';\n");

const currentSourceBytes=6_039_154;
assert.ok(currentSourceBytes>5_996_544,'R542 deve reproduzir a ultrapassagem do checkpoint R518 após o Reader V2 coexistir com o fallback clássico.');
assert.equal(R443_GLOBAL_SOURCE_BUDGET_BYTES,5.84375*1024*1024);
assert.equal(R443_SOURCE_RESERVE_BYTES,65_536);
assert.equal(R443_SOURCE_CHECKPOINT_BYTES,6_062_080);
assert.ok(currentSourceBytes<=R443_SOURCE_CHECKPOINT_BYTES,'avanço mínimo de 64 KiB deve acomodar R542 preservando integralmente a reserva de 64 KiB.');
assert.ok(R443_GLOBAL_SOURCE_BUDGET_BYTES-currentSourceBytes>=R443_SOURCE_RESERVE_BYTES);

const first=applySourceBudgetConvergenceR443(root);
assert.equal(first.changed,true);
assert.equal(first.checkpointBytes,6_062_080);
assert.equal(first.reserveBytes,65_536);
assert.equal(first.globalSourceBudgetBytes,5.84375*1024*1024);
assert.ok(first.patched.length>=13);
const second=applySourceBudgetConvergenceR443(root);
assert.equal(second.changed,false,'convergência R443/R542 precisa ser idempotente');
assert.equal(second.patched.length,0);

assert.match(fs.readFileSync(path.join(root,'scripts/check-bundle-budget.mjs'),'utf8'),/sourceTs: 5\.84375 \* 1024 \* 1024/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r184-production-legacy-isolation-regression.mjs'),'utf8'),/sourceLimit=5\.84375\*1024\*1024/);
for(const file of [
 'v40-80-r193-analyzer-dedup-budget-regression.mjs','v40-80-r194-cardvision-contract-dedup-regression.mjs',
 'v40-80-r195-controller-prop-hotpath-regression.mjs','v40-80-r196-analyzer-compiled-scoring-regression.mjs',
 'v40-80-r197-training-budget-hotpath-regression.ts','v40-80-r198-e2e-production-finalization-authority-regression.mjs',
 'v40-80-r199-persistence-session-cache-audit-regression.mjs','v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
])assert.match(fs.readFileSync(path.join(root,'tests',file),'utf8'),/6_062_080/);
assert.match(fs.readFileSync(path.join(root,'scripts/apply-r414-ci-contract-convergence.mjs'),'utf8'),/R414_SOURCE_BUDGET_BYTES = 6_062_080/);
assert.match(fs.readFileSync(path.join(root,'scripts/audit-r424-final-requirements-closure.mjs'),'utf8'),/5\\\.84375/);
assert.match(fs.readFileSync(path.join(root,'tests/v40-80-r424-final-requirements-closure-regression.mjs'),'utf8'),/5\.84375 \* 1024 \* 1024/);

// R542: os contratos R424 mais novos deixaram de duplicar números históricos e
// passaram a apontar semanticamente para R443. O converger canônico precisa
// aceitar essa forma sem reintroduzir literais aposentados.
const semanticRoot=fs.mkdtempSync(path.join(os.tmpdir(),'buildmaster-r443-semantic-r542-'));
const semanticWrite=(relative,source)=>{const file=path.join(semanticRoot,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source)};
semanticWrite('scripts/check-bundle-budget.mjs','const limits={sourceTs: 5.84375 * 1024 * 1024};\n');
semanticWrite('tests/v40-80-r184-production-legacy-isolation-regression.mjs','const sourceLimit=5.84375*1024*1024;\n');
for(const file of [
 'v40-80-r193-analyzer-dedup-budget-regression.mjs','v40-80-r194-cardvision-contract-dedup-regression.mjs',
 'v40-80-r195-controller-prop-hotpath-regression.mjs','v40-80-r196-analyzer-compiled-scoring-regression.mjs',
 'v40-80-r197-training-budget-hotpath-regression.ts','v40-80-r198-e2e-production-finalization-authority-regression.mjs',
 'v40-80-r199-persistence-session-cache-audit-regression.mjs','v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
])semanticWrite(`tests/${file}`,'const checkpoint=6_062_080;\n');
semanticWrite('scripts/apply-r414-ci-contract-convergence.mjs','export const R414_SOURCE_BUDGET_BYTES = 6_062_080; const sourceGlobalLimitBytes = 5.84375 * 1024 * 1024;\n');
semanticWrite('scripts/audit-r424-final-requirements-closure.mjs',"const r443=read(root,'scripts/apply-r443-source-budget-convergence.mjs')||''; const ok=/R443_SOURCE_RESERVE_BYTES=65_536/.test(r443);\n");
semanticWrite('tests/v40-80-r424-final-requirements-closure-regression.mjs',"w('scripts/apply-r443-source-budget-convergence.mjs','R443_SOURCE_RESERVE_BYTES=65_536');\n");
const semantic=applySourceBudgetConvergenceR443(semanticRoot);
assert.equal(semantic.changed,false,'R443 deve aceitar R424 semântico sem regravar contratos atuais.');

console.log('R443/R542 aprovada: orçamento avançou 64 KiB para o Reader V2, preserva a reserva e aceita R424 semântico.');
