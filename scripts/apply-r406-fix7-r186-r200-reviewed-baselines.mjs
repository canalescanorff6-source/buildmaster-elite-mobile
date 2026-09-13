import crypto from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const REVIEWED_SHA='42c95c332ff0cd1dcc1a61d42cef2139c3995792b7f51a317b402dc69226cd1e';
const LEGACY_SHA='736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5';
const CONTRACTS=[
  "tests/v40-80-r186-analyzer-boundary-regression.mjs",
  "tests/v40-80-r187-cardvision-reader-actions-boundary-regression.mjs",
  "tests/v40-80-r188-cardvision-result-actions-lazy-boundary-regression.mjs",
  "tests/v40-80-r189-result-workspace-surface-boundary-regression.mjs",
  "tests/v40-80-r190-cardvision-settings-workspace-lazy-boundary-regression.mjs",
  "tests/v40-80-r191-cardvision-vault-workspace-lazy-boundary-regression.mjs",
  "tests/v40-80-r192-result-advanced-workspace-lazy-boundary-regression.mjs",
  "tests/v40-80-r193-analyzer-dedup-budget-regression.mjs",
  "tests/v40-80-r194-cardvision-contract-dedup-regression.mjs",
  "tests/v40-80-r195-controller-prop-hotpath-regression.mjs",
  "tests/v40-80-r196-analyzer-compiled-scoring-regression.mjs",
  "tests/v40-80-r197-training-budget-hotpath-regression.ts",
  "tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs",
  "tests/v40-80-r199-persistence-session-cache-audit-regression.mjs",
  "tests/v40-80-r200-mobile-startup-runtime-boundary-regression.mjs"
];

export function applyReviewedR119BaselinesR186R200(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  const sourcePath=resolve(root,SOURCE);
  if(!existsSync(sourcePath)) throw new Error(`R406-fix7: fonte ausente: ${SOURCE}`);
  const actual=crypto.createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
  if(actual!==REVIEWED_SHA) throw new Error(`R406-fix7: SHA R119 não revisado: ${actual}; esperado ${REVIEWED_SHA}`);
  const results=[];
  for(const rel of CONTRACTS){
    const file=resolve(root,rel);
    if(!existsSync(file)) throw new Error(`R406-fix7: contrato ausente: ${rel}`);
    const before=readFileSync(file,'utf8');
    const reviewed=(before.match(new RegExp(REVIEWED_SHA,'g'))||[]).length;
    const legacy=(before.match(new RegExp(LEGACY_SHA,'g'))||[]).length;
    if(reviewed===1&&legacy===0){ results.push({path:rel,changed:false}); continue; }
    if(legacy!==1||reviewed!==0) throw new Error(`R406-fix7: baseline inesperado em ${rel} (legacy=${legacy}, reviewed=${reviewed})`);
    writeFileSync(file,before.replace(LEGACY_SHA,REVIEWED_SHA),'utf8');
    results.push({path:rel,changed:true});
  }
  return {changed:results.some(x=>x.changed),sourceSha:actual,results};
}
