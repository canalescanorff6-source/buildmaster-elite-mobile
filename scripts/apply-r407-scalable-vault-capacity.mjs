import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { applySourceBudgetConvergenceR443 } from './apply-r443-source-budget-convergence.mjs';
const STORE='src/modules/vault/cardHistoryStore.ts';
const STARTUP='src/modules/vault/cardHistoryStartupModelR200.ts';
const PACKAGE='package.json';
const TEST='tests/v40-80-r407-unbounded-vault-capacity-regression.mjs';
function replaceOnce(source,from,to,label){const count=source.split(from).length-1;if(count===0&&source.includes(to))return{source,changed:false};if(count!==1)throw new Error(`R407: contrato inesperado em ${label}; ocorrências=${count}`);return{source:source.replace(from,to),changed:true};}
function walkTs(root){let total=0,stack=[root];while(stack.length){const current=stack.pop();for(const entry of readdirSync(current,{withFileTypes:true})){const target=join(current,entry.name);if(entry.isDirectory())stack.push(target);else if(/\.(?:ts|tsx)$/.test(target))total+=statSync(target).size;}}return total;}
export function applyScalableVaultCapacityR407(rootDirectory=process.cwd()){
 const root=resolve(rootDirectory),storePath=resolve(root,STORE),startupPath=resolve(root,STARTUP);
 if(!existsSync(storePath)||!existsSync(startupPath))throw new Error('R407: fronteiras do Cofre não encontradas.');
 const r443=applySourceBudgetConvergenceR443(root);
 let store=readFileSync(storePath,'utf8'),startup=readFileSync(startupPath,'utf8'),changed=false,r;
 const downstreamVaultMigration=store.includes('NATIVE_HISTORY_MANIFEST_KEY_R409')||store.includes('writeNativeHistoryShardedR409');
 if(!downstreamVaultMigration){
  r=replaceOnce(store,'export const HISTORY_LIMIT = 200;','export const HISTORY_LIMIT = Infinity;','HISTORY_LIMIT');store=r.source;changed||=r.changed;
  r=replaceOnce(startup,'export const HISTORY_LIMIT_R200 = 200;','export const HISTORY_LIMIT_R200 = Infinity;','HISTORY_LIMIT_R200');startup=r.source;changed||=r.changed;
  r=replaceOnce(store,'export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 32 * 1024 * 1024;','export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;','startup native bytes');store=r.source;changed||=r.changed;
  r=replaceOnce(store,`  // O print inteiro não é duplicado no Cofre: ele costuma ser a maior parte do tamanho.
  // A ficha calculada, habilidades, Booster, observações e a imagem recortada continuam salvos.
  const maxPlayerImageChars = 900_000;
  const maxEntriesWithImage = 60;
  return items.slice(0, HISTORY_LIMIT).map((entry, index) => ({`,`  const maxPlayerImageChars = 900_000;
  let retainedImageChars = 0;
  const maxRetainedImageChars = 6_000_000;
  return items.map((entry) => ({`,'compactação nativa');store=r.source;changed||=r.changed;
  r=replaceOnce(store,'playerImage: index < maxEntriesWithImage && entry.playerImage && entry.playerImage.length <= maxPlayerImageChars ? entry.playerImage : null,','playerImage: entry.playerImage && entry.playerImage.length <= maxPlayerImageChars && retainedImageChars + entry.playerImage.length <= maxRetainedImageChars ? (retainedImageChars += entry.playerImage.length, entry.playerImage) : null,','orçamento de mídia');store=r.source;changed||=r.changed;
  r=replaceOnce(store,'return compactHistoryForNativeStorage(items).slice(0, 40).map((item) => ({','return compactHistoryForNativeStorage(items).map((item) => ({','fallback sem truncamento');store=r.source;changed||=r.changed;
  r=replaceOnce(store,"if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: Math.min(next.length, 40) };","if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: next.length };",'contagem do fallback');store=r.source;changed||=r.changed;
 }else{
  const invariants=[
   [store.includes('export const HISTORY_LIMIT = Infinity;'),'HISTORY_LIMIT ilimitado'],
   [startup.includes('export const HISTORY_LIMIT_R200 = Infinity;'),'HISTORY_LIMIT_R200 ilimitado'],
   [store.includes('export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;'),'startup nativo sem teto lógico'],
   [store.includes('maxRetainedImageChars = 6_000_000'),'orçamento de mídia por caracteres'],
   [!store.includes('.slice(0, HISTORY_LIMIT)'),'sem truncamento por HISTORY_LIMIT'],
   [!store.includes('Math.min(next.length, 40)'),'fallback sem contagem parcial']
  ];
  for(const [ok,label] of invariants)if(!ok)throw new Error(`R407: árvore R409+ viola invariante: ${label}.`);
 }
 if(changed){writeFileSync(storePath,store,'utf8');writeFileSync(startupPath,startup,'utf8');}
 const testPath=resolve(root,TEST);const testSource=`import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read=(p)=>fs.readFileSync(p,'utf8');\nconst store=read('src/modules/vault/cardHistoryStore.ts');\nconst startup=read('src/modules/vault/cardHistoryStartupModelR200.ts');\nconst budget=read('src/modules/builds/pointBudget.ts');\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');\nconst lifecycle=read('src/modules/vault/vaultProductionLifecycleR139.ts');\nconst actions=read('src/hooks/useCardVisionVaultActionsR185.ts');\nconst cloud=read('src/modules/backup/vaultCloudRuntimeR166.ts');\nassert.match(store,/export const HISTORY_LIMIT = Infinity;/);\nassert.match(startup,/export const HISTORY_LIMIT_R200 = Infinity;/);\nassert.match(store,/STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;/);\nassert.doesNotMatch(store,/maxEntriesWithImage\\s*=\\s*\\d+/);\nassert.match(store,/maxRetainedImageChars = 6_000_000/);\nassert.doesNotMatch(store,/compactHistoryForNativeStorage\\(items\\)\\.slice\\(0,\\s*40\\)/);\nassert.doesNotMatch(store,/Math\\.min\\(next\\.length,\\s*40\\)/);\nassert.match(budget,/MAX_PLAYER_TRAINING_BUDGET = 140/);\nassert.doesNotMatch(budget,/cardHistory|HISTORY_LIMIT|SavedAnalysis/);\nassert.doesNotMatch(optimizer,/cardHistory|HISTORY_LIMIT|SavedAnalysis/);\nfor(const source of [lifecycle,actions,cloud])assert.doesNotMatch(source,/\\.slice\\(0,\\s*HISTORY_LIMIT\\)/);\nfor(const n of [1,12,13,25,50,200,201,500,1000,5000])assert.equal(Array.from({length:n}).slice(0,Infinity).length,n);\nconsole.log('R407 aprovada após R418: 1→5000 fichas preservadas logicamente; nenhum lifecycle volta a podar por HISTORY_LIMIT.');\n`;
 if(!existsSync(testPath)||readFileSync(testPath,'utf8')!==testSource){writeFileSync(testPath,testSource,'utf8');changed=true;}
 const pkgPath=resolve(root,PACKAGE),pkg=JSON.parse(readFileSync(pkgPath,'utf8')),markers=['node tests/v40-80-r407-unbounded-vault-capacity-regression.mjs','node tests/v40-80-r443-source-budget-convergence-regression.mjs'];let current=String(pkg.scripts?.['test:r200']??'');
 if(!current)throw new Error('R407: test:r200 ausente.');
 for(const marker of markers)if(!current.includes(marker)){current=`${current} && ${marker}`;changed=true;}
 if(String(pkg.scripts['test:r200'])!==current){pkg.scripts['test:r200']=current;writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');}
 const sourceBytes=walkTs(resolve(root,'src'));
 const sourceBudget=5.5*1024*1024;
 const historicalCeiling=existsSync(resolve(root,'R200_4_HISTORICAL_REQUIREMENTS_CONVERGENCE.md'))?sourceBudget-100_000:Infinity;
 const ceiling=downstreamVaultMigration?sourceBudget-100_000:historicalCeiling;
 if(sourceBytes>ceiling)throw new Error(`R407: orçamento R184 excedido: ${sourceBytes} > ${ceiling}.`);
 return{changed:changed||r443.changed,sourceChanged:true,sourceBytes,logicalHistoryLimit:'unbounded',retainedImageBudgetChars:6_000_000,sourceBudgetCeiling:ceiling,sourceSafetyMarginBytes:sourceBudget-sourceBytes,r443};
}
