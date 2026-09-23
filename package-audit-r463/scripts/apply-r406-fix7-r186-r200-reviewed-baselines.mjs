import crypto from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const REVIEWED_SHA='42c95c332ff0cd1dcc1a61d42cef2139c3995792b7f51a317b402dc69226cd1e';
const R416_SHA='8e31a5d224836cef882d9bb23e396358299adf64cfb1405ce2baa79f280cf0e4';
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
  const source=readFileSync(sourcePath,'utf8');
  const actual=crypto.createHash('sha256').update(source).digest('hex');
  const downstreamR417=source.includes('autonomousPrimaryR417')&&source.includes('rankAutonomousRolesR417');
  const downstreamR457=source.includes('function usageFunctionR457')&&source.includes("decision:targetAdaptation?'TARGET_ADAPTATION':'NATURAL_ANCHOR'")&&source.includes('usageFunction,');
  const downstreamR416=actual===R416_SHA;
  if(actual!==REVIEWED_SHA&&!downstreamR416&&!downstreamR417&&!downstreamR457) throw new Error(`R406-fix7: SHA R119 não revisado: ${actual}; esperados ${REVIEWED_SHA}, ${R416_SHA}, runtime R417 ou runtime R457 reconhecido.`);
  const expected=(downstreamR457||downstreamR417)?actual:downstreamR416?R416_SHA:REVIEWED_SHA;
  const results=[];
  for(const rel of CONTRACTS){
    const file=resolve(root,rel);
    if(!existsSync(file)) throw new Error(`R406-fix7: contrato ausente: ${rel}`);
    const before=readFileSync(file,'utf8');
    const known=[LEGACY_SHA,REVIEWED_SHA,R416_SHA];
    if(!known.includes(expected)) known.push(expected);
    const counts=known.map((sha)=>[sha,(before.match(new RegExp(sha,'g'))||[]).length]);
    const total=counts.reduce((sum,[,count])=>sum+count,0);
    const expectedCount=counts.find(([sha])=>sha===expected)?.[1]??0;
    if(expectedCount===1&&total===1){results.push({path:rel,changed:false});continue;}
    if(total!==1) throw new Error(`R406-fix7: baseline inesperado em ${rel} (${counts.map(([sha,count])=>`${sha.slice(0,8)}=${count}`).join(', ')})`);
    const from=counts.find(([,count])=>count===1)?.[0];
    if(!from) throw new Error(`R406-fix7: baseline fonte ausente em ${rel}`);
    writeFileSync(file,before.replace(from,expected),'utf8');
    results.push({path:rel,changed:true});
  }
  return {changed:results.some(x=>x.changed),sourceSha:actual,expectedSha:expected,downstreamR416,downstreamR417,downstreamR457,results};
}
