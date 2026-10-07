import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const root=process.cwd();
const run=(args)=>{
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
};
for(const config of ['types-r542','types-r542-zones','types-r542-bridge','types-r542-automatic']) {
  run(['node_modules/typescript/bin/tsc','-p',`tests/${config}/tsconfig.json`,'--pretty','false']);
}
const legacy=readdirSync('tests').filter(name=>/^v40-80-r542-reader-v2-.*\.(ts|mjs)$/.test(name)).sort();
const focused=['reader-v2-identity-recovery-regression.ts','reader-v2-level-budget-regression.ts','reader-v2-numeric-cell-regression.ts','reader-v2-partial-attributes-regression.ts','v40-80-r544-field-aware-retry-regression.mjs','v40-80-r545-reader-success-flow-ui-regression.mjs','reader-v2-action-flow-regression.ts','reader-v2-review-evidence-regression.ts','reader-v2-cancellation-regression.ts','reader-v2-finalization-race-regression.ts','reader-confirmed-authority-regression.ts','reader-runtime-ci-gate-regression.mjs'];
for(const name of [...legacy,...focused]) {
  if(!existsSync(`tests/${name}`)) throw new Error(`Regressão do leitor ausente: ${name}`);
  run(name.endsWith('.ts')?['-r','./tests/_ts-require.cjs',`tests/${name}`]:[`tests/${name}`]);
}
console.log(`Reader V2: ${legacy.length+focused.length} arquivos de regressão e 4 configurações TypeScript aprovados.`);
