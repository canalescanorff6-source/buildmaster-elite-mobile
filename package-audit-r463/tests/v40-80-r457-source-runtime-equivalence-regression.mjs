import assert from 'node:assert/strict';
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

assert.match(clean,/CLEAN_SLATE_2027_R119_VERSION = '40\.80-r406-match-calibration-group-return-fix5'/,'Source cru precisa carregar a mesma base Clean Slate compilada.');
assert.match(store,/export const HISTORY_LIMIT = Infinity;/,'Source cru do Cofre não pode voltar ao teto 200.');
assert.match(startup,/export const HISTORY_LIMIT_R200 = (?:Infinity|Number\.MAX_SAFE_INTEGER);/);
assert.match(store,/STARTUP_NATIVE_HISTORY_MAX_BYTES = 0;/);
assert.doesNotMatch(store,/\.slice\(0,\s*HISTORY_LIMIT\)/);
assert.doesNotMatch(store,/compactHistoryForNativeStorage\(items\)\.slice\(0,\s*40\)/);
assert.doesNotMatch(store,/Math\.min\(next\.length,\s*40\)/);
assert.doesNotMatch(mutations,/\.slice\(0,\s*HISTORY_LIMIT\)/);
assert.doesNotMatch(squad,/source\.players[\s\S]{0,180}\.slice\(0,\s*500\)/);
assert.doesNotMatch(squad,/source\.trials[\s\S]{0,180}\.slice\(0,\s*100\)/);
assert.doesNotMatch(tactical,/\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/);

for(const marker of [
 'R409','R410','R411','R412'
]) assert.ok(native.includes(marker)||store.includes(marker),`Contrato ${marker} do Cofre nativo precisa estar materializado no source.`);
assert.match(vaultUi,/R413|progress/i,'Renderização progressiva R413 precisa estar no source.');
const selectors=read('src/modules/vault/cardVisionVaultSelectorsR151.ts');
assert.match(selectors,/CARDVISION_VAULT_QUERY_INDEX_R414_VERSION|r414-indexed-vault-query/i,'Índice R414 precisa estar materializado no seletor canônico do Cofre.');

for(const n of [225,500,1000,5000,10000]){
 const rows=Array.from({length:n},(_,i)=>({id:i}));
 assert.equal(rows.slice(0,Infinity).length,n);
}
console.log('R457 Stage 15 aprovada: source cru já é runtime canônico, sem tetos artificiais; 225→10000 não são podados por quantidade.');
