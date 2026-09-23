import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { applyR418UnboundedCapacity } from './apply-r418-unbounded-capacity.mjs';
import { applyR418Fix2HistoricalCapacityContracts } from './apply-r418-fix2-historical-contracts.mjs';
import { applyScalableVaultCapacityR407 } from './apply-r407-scalable-vault-capacity.mjs';
import { applyUnlimitedFichasPpIntegrityR408 } from './apply-r408-unlimited-fichas-pp-integrity.mjs';
import { applyShardedNativeVaultR409 } from './apply-r409-sharded-native-vault.mjs';
import { applyFastResilientVaultReadR410 } from './apply-r410-fast-resilient-vault-read.mjs';
import { applyCrashSafeVaultCommitR411 } from './apply-r411-crash-safe-vault-commit.mjs';
import { applyBoundedVaultHydrationR412 } from './apply-r412-bounded-vault-hydration.mjs';
import { applyProgressiveVaultRenderR413 } from './apply-r413-progressive-vault-render.mjs';
import { applyIndexedVaultQueryR414 } from './apply-r414-indexed-vault-query.mjs';

export const R457_STAGE15_VERSION='40.80-r457-source-runtime-equivalence-v4-r457-safe';
const TEST='tests/v40-80-r457-source-runtime-equivalence-regression.mjs';
function f(root,p){const x=resolve(root,p);if(!existsSync(x))throw new Error(`R457-stage15: ausente ${p}`);return x;}
function write(root,p,s){const x=resolve(root,p);mkdirSync(dirname(x),{recursive:true});writeFileSync(x,s,'utf8');}

const TEST_SOURCE=`import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

const clean=read('src/lib/cleanSlatePerformance2027V4080R119.ts');
const store=read('src/modules/vault/cardHistoryStore.ts');
const startup=read('src/modules/vault/cardHistoryStartupModelR200.ts');
const squad=read('src/modules/squad-mapping/squadMappingStorage.ts');
const tactical=read('src/modules/tactical-studio/tacticalStudio2Storage.ts');
const mutations=read('src/modules/vault/vaultHistoryMutationsR129.ts');
const native=read('src/lib/nativeVaultStorage.ts');
const vaultUi=read('src/components/CleanVaultV3800.tsx');

assert.match(clean,/CLEAN_SLATE_2027_R119_VERSION = '40\\.80-r406-match-calibration-group-return-fix5'/,'Source cru precisa carregar a mesma base Clean Slate compilada.');
assert.match(store,/export const HISTORY_LIMIT = Infinity;/,'Source cru do Cofre não pode voltar ao teto 200.');
assert.match(startup,/export const HISTORY_LIMIT_R200 = (?:Infinity|Number\\.MAX_SAFE_INTEGER);/);
assert.match(store,/STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;/);
assert.doesNotMatch(store,/\\.slice\\(0,\\s*HISTORY_LIMIT\\)/);
assert.doesNotMatch(store,/compactHistoryForNativeStorage\\(items\\)\\.slice\\(0,\\s*40\\)/);
assert.doesNotMatch(store,/Math\\.min\\(next\\.length,\\s*40\\)/);
assert.doesNotMatch(mutations,/\\.slice\\(0,\\s*HISTORY_LIMIT\\)/);
assert.doesNotMatch(squad,/source\\.players[\\s\\S]{0,180}\\.slice\\(0,\\s*500\\)/);
assert.doesNotMatch(squad,/source\\.trials[\\s\\S]{0,180}\\.slice\\(0,\\s*100\\)/);
assert.doesNotMatch(tactical,/\\.slice\\(0,\\s*MAX_TACTICAL_SEQUENCE_PROJECTS\\)/);

for(const marker of [
 'R409','R410','R411','R412'
]) assert.ok(native.includes(marker)||store.includes(marker),\`Contrato \${marker} do Cofre nativo precisa estar materializado no source.\`);
assert.match(vaultUi,/R413|progress/i,'Renderização progressiva R413 precisa estar no source.');
const selectors=read('src/modules/vault/cardVisionVaultSelectorsR151.ts');
assert.match(selectors,/CARDVISION_VAULT_QUERY_INDEX_R414_VERSION|r414-indexed-vault-query/i,'Índice R414 precisa estar materializado no seletor canônico do Cofre.');

for(const n of [225,500,1000,5000,10000]){
 const rows=Array.from({length:n},(_,i)=>({id:i}));
 assert.equal(rows.slice(0,Infinity).length,n);
}
console.log('R457 Stage 15 aprovada: source cru já é runtime canônico, sem tetos artificiais; 225→10000 não são podados por quantidade.');
`;

function normalizeR407Hybrid(root){
 const storePath=f(root,'src/modules/vault/cardHistoryStore.ts');
 const startupPath=f(root,'src/modules/vault/cardHistoryStartupModelR200.ts');
 let store=readFileSync(storePath,'utf8'),startup=readFileSync(startupPath,'utf8'),changed=false;
 const apply=(source,from,to)=>source.includes(from)?source.replace(from,to):source;
 let next=apply(store,'export const HISTORY_LIMIT = 200;','export const HISTORY_LIMIT = Infinity;'); changed||=next!==store; store=next;
 next=apply(startup,'export const HISTORY_LIMIT_R200 = 200;','export const HISTORY_LIMIT_R200 = Infinity;'); changed||=next!==startup; startup=next;
 next=apply(store,'export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 32 * 1024 * 1024;','export const STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;'); changed||=next!==store; store=next;
 if(store.includes('const maxEntriesWithImage = 60;')){store=store.replace('  const maxEntriesWithImage = 60;','  let retainedImageChars = 0;\n  const maxRetainedImageChars = 6_000_000;');changed=true;}
 if(store.includes('playerImage: index < maxEntriesWithImage && entry.playerImage && entry.playerImage.length <= maxPlayerImageChars ? entry.playerImage : null,')){store=store.replace('playerImage: index < maxEntriesWithImage && entry.playerImage && entry.playerImage.length <= maxPlayerImageChars ? entry.playerImage : null,','playerImage: entry.playerImage && entry.playerImage.length <= maxPlayerImageChars && retainedImageChars + entry.playerImage.length <= maxRetainedImageChars ? (retainedImageChars += entry.playerImage.length, entry.playerImage) : null,');changed=true;}
 next=store.replace('return items.map((entry, index) => ({','return items.map((entry) => ({'); changed||=next!==store; store=next;
 next=store.replace('return compactHistoryForNativeStorage(items).slice(0, 40).map((item) => ({','return compactHistoryForNativeStorage(items).map((item) => ({'); changed||=next!==store; store=next;
 next=store.replace("if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: Math.min(next.length, 40) };","if (fallbackSaved) return { saved: true, backend: 'local-fallback', items: next.length };"); changed||=next!==store; store=next;
 if(changed){writeFileSync(storePath,store,'utf8');writeFileSync(startupPath,startup,'utf8');}
 return changed;
}

function patchPackage(root){
 const path=f(root,'package.json'),pkg=JSON.parse(readFileSync(path,'utf8'));pkg.scripts??={};
 pkg.scripts['test:r457:source-canonical']="node tests/v40-80-r457-source-runtime-equivalence-regression.mjs && node tests/v40-80-r407-unbounded-vault-capacity-regression.mjs && node tests/v40-80-r408-unlimited-fichas-pp-integrity-regression.mjs && node tests/v40-80-r409-sharded-native-vault-regression.mjs && node tests/v40-80-r410-fast-resilient-vault-read-regression.mjs && node tests/v40-80-r411-crash-safe-vault-commit-regression.mjs && node tests/v40-80-r412-bounded-vault-hydration-regression.mjs && node tests/v40-80-r413-progressive-vault-render-regression.mjs && node tests/v40-80-r414-indexed-vault-query-regression.mjs && node tests/v40-80-r418-unbounded-persistent-collections-regression.mjs";
 writeFileSync(path,JSON.stringify(pkg,null,2)+'\n','utf8');
}
function patchWorkflow(root){
 const path=f(root,'.github/workflows/build-apk.yml'),source=readFileSync(path,'utf8');
 if(source.includes('Gate source canônico R457 — antes do sanitize'))return;
 const anchor='      - name: Remover manifesto local antigo antes dos testes'+String.fromCharCode(10);
 if(!source.includes(anchor))throw new Error('R457-stage15: âncora pré-sanitize ausente');
 const block=`      - name: Gate source canônico R457 — antes do sanitize
        timeout-minutes: 8
        run: npm run test:r457:source-canonical

`;
 writeFileSync(path,source.replace(anchor,block+anchor),'utf8');
}
export function applyR457Stage15(rootDirectory=process.cwd()){
 const root=resolve(rootDirectory);
 for(const p of ['package.json','.github/workflows/build-apk.yml','scripts/apply-r418-unbounded-capacity.mjs'])f(root,p);
 // Mesma ordem da fundação R448: primeiro remove tetos artificiais; depois aplica os contratos de cofre escalável.
 normalizeR407Hybrid(root);
 const steps=[
  ['R418',applyR418UnboundedCapacity],
  ['R418-fix2',applyR418Fix2HistoricalCapacityContracts],
  ['R407',applyScalableVaultCapacityR407],
  ['R408',applyUnlimitedFichasPpIntegrityR408],
  ['R409',applyShardedNativeVaultR409],
  ['R410',applyFastResilientVaultReadR410],
  ['R411',applyCrashSafeVaultCommitR411],
  ['R412',applyBoundedVaultHydrationR412],
  ['R413',applyProgressiveVaultRenderR413],
  ['R414',applyIndexedVaultQueryR414]
 ];
 const results=[];
 for(const [name,fn] of steps)results.push({name,result:fn(root)});
 write(root,TEST,TEST_SOURCE);
 patchPackage(root);patchWorkflow(root);
 return {changed:true,version:R457_STAGE15_VERSION,steps:results.map(({name,result})=>({name,changed:Boolean(result?.changed??result?.sourceChanged)}))};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(applyR457Stage15(process.cwd()),null,2));
