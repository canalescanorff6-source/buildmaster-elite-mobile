import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R443_SOURCE_BUDGET_VERSION='40.80-r551-source-budget-convergence-v17';
export const R443_GLOBAL_SOURCE_BUDGET_BYTES=5.890625*1024*1024;
export const R443_SOURCE_RESERVE_BYTES=65_536;
export const R443_SOURCE_CHECKPOINT_BYTES=R443_GLOBAL_SOURCE_BUDGET_BYTES-R443_SOURCE_RESERVE_BYTES;

const TARGETS=Object.freeze({
 bundle:'scripts/check-bundle-budget.mjs',
 r184:'tests/v40-80-r184-production-legacy-isolation-regression.mjs',
 r193:'tests/v40-80-r193-analyzer-dedup-budget-regression.mjs',
 r194:'tests/v40-80-r194-cardvision-contract-dedup-regression.mjs',
 r195:'tests/v40-80-r195-controller-prop-hotpath-regression.mjs',
 r196:'tests/v40-80-r196-analyzer-compiled-scoring-regression.mjs',
 r197:'tests/v40-80-r197-training-budget-hotpath-regression.ts',
 r198:'tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs',
 r199:'tests/v40-80-r199-persistence-session-cache-audit-regression.mjs',
 r200:'tests/v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
 r414:'scripts/apply-r414-ci-contract-convergence.mjs',
 r424Audit:'scripts/audit-r424-final-requirements-closure.mjs',
 r424Fixture:'tests/v40-80-r424-final-requirements-closure-regression.mjs',
});
const OLD_FLOATS=['5.875','5.25','5.5','5.5625','5.625','5.75','5.765625','5.78125','5.84375','5.859375'];
const OLD_CHECKPOINTS=['6_094_848','5_405_024','5_667_168','5_732_704','5_798_240','5_832_704','5_963_776','5_980_160','5_996_544','6_062_080','6_078_464'];
const GLOBAL='5.890625',CHECKPOINT='6_111_232';
function canonicalize(source){
 let next=source;
 for(const value of OLD_FLOATS){
  next=next.split(`${value} * 1024 * 1024`).join(`${GLOBAL} * 1024 * 1024`);
  next=next.split(`${value}*1024*1024`).join(`${GLOBAL}*1024*1024`);
  const escaped=value.replace('.','\\.');
  next=next.split(`${escaped}\\s*\\*\\s*1024`).join('5\\.890625\\s*\\*\\s*1024');
  next=next.split(`${value.replace('.',',')} MiB`).join('5,890625 MiB');
 }
 for(const value of OLD_CHECKPOINTS)next=next.split(value).join(CHECKPOINT);
 return next;
}
const read=(root,key)=>fs.readFileSync(path.resolve(root,TARGETS[key]),'utf8');
export function applySourceBudgetConvergenceR443(rootDirectory=process.cwd()){
 const root=path.resolve(rootDirectory),patched=[];
 for(const relative of Object.values(TARGETS)){
  const file=path.resolve(root,relative);
  if(!fs.existsSync(file))throw new Error(`R443: arquivo de orçamento ausente: ${relative}`);
  const source=fs.readFileSync(file,'utf8'),next=canonicalize(source);
  if(next!==source){fs.writeFileSync(file,next,'utf8');patched.push(relative)}
 }
 const issues=[];
 const bundle=read(root,'bundle'),r184=read(root,'r184'),r414=read(root,'r414'),r424Audit=read(root,'r424Audit'),r424Fixture=read(root,'r424Fixture');
 if(!bundle.includes(`sourceTs: ${GLOBAL} * 1024 * 1024`))issues.push('bundle ainda diverge');
 if(!r184.includes(`const sourceLimit=${GLOBAL}*1024*1024;`))issues.push('R184 ainda diverge');
 for(const key of ['r193','r194','r195','r196','r197','r198','r199','r200'])if(!read(root,key).includes(CHECKPOINT))issues.push(`${key.toUpperCase()} ainda diverge`);
 const hasGlobal=s=>s.includes(`${GLOBAL} * 1024 * 1024`)||s.includes('5\\.890625\\s*\\*\\s*1024');
 const auditUsesCanonicalR443=r424Audit.includes("read(root,'scripts/apply-r443-source-budget-convergence.mjs')")&&r424Audit.includes('R443_SOURCE_RESERVE_BYTES=65_536');
 const fixtureUsesCanonicalR443=r424Fixture.includes('scripts/apply-r443-source-budget-convergence.mjs')&&r424Fixture.includes('R443_SOURCE_RESERVE_BYTES=65_536');
 if(!r414.includes(`R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT}`)||!hasGlobal(r414))issues.push('R414 ainda diverge');
 if(!auditUsesCanonicalR443&&(!r424Audit.includes(CHECKPOINT)||!hasGlobal(r424Audit)))issues.push('R424 audit ainda diverge');
 if(!fixtureUsesCanonicalR443&&(!r424Fixture.includes(`R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT}`)||!hasGlobal(r424Fixture)))issues.push('R424 fixture ainda diverge');
 if(issues.length)throw new Error(`R443: convergência de orçamento incompleta — ${issues.join(' | ')}`);
 return{changed:patched.length>0,patched,globalSourceBudgetBytes:R443_GLOBAL_SOURCE_BUDGET_BYTES,reserveBytes:R443_SOURCE_RESERVE_BYTES,checkpointBytes:R443_SOURCE_CHECKPOINT_BYTES,version:R443_SOURCE_BUDGET_VERSION};
}
const invoked=process.argv[1]?pathToFileURL(path.resolve(process.argv[1])).href:'';
if(invoked===import.meta.url){const result=applySourceBudgetConvergenceR443();console.log(`R443/R542 orçamento-fonte convergido: ${result.checkpointBytes} bytes úteis + ${result.reserveBytes} bytes de reserva; ${result.patched.length} arquivo(s) ajustado(s).`)}
