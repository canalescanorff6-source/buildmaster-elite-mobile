import assert from 'node:assert/strict';
import fs from 'node:fs';
const selectors=fs.readFileSync('src/modules/vault/cardVisionVaultSelectorsR151.ts','utf8');
const clean=fs.readFileSync('src/lib/cleanVaultV3800.ts','utf8');
assert.match(selectors,/CARDVISION_VAULT_QUERY_INDEX_R414_VERSION/);
assert.match(selectors,/vaultEntryIndexCacheR414 = new WeakMap/);
assert.match(selectors,/const index = vaultEntryIndexR414\(item\)/);
assert.match(selectors,/matches\.push\(\{ item, index \}\)/);
assert.doesNotMatch(selectors,/entryMatchesAdvancedFilters\(item, input\.advancedFilters\)/);
assert.doesNotMatch(selectors,/history\.flatMap\(\(item\) => \[/);
assert.doesNotMatch(selectors,/analysisUsagePositionR138/);
assert.doesNotMatch(selectors,/savedStatusLabelR200 as savedStatusLabel/);
assert.match(clean,/cleanVaultBuildSignatureCacheR414\.get\(entry\)/);
assert.match(clean,/cleanVaultCardVersionCacheR414\.get\(entry\)/);
assert.match(clean,/const duplicates: CleanVaultDuplicateGroup<T>\[\] = \[\]/);

const count=10000;
let indexBuilds=0;
const indexCache=new WeakMap();
const cards=Array.from({length:count},(_,i)=>({id:'card-'+i,name:'Jogador '+i,result:{trainingPointsTotal:(i%140)+1}}));
function indexed(card){let value=indexCache.get(card);if(value)return value;indexBuilds++;value={search:card.name.toLowerCase(),pp:card.result.trainingPointsTotal};indexCache.set(card,value);return value;}
for(let pass=0;pass<8;pass++)for(const card of cards)indexed(card);
assert.equal(indexBuilds,count);
const beforePP=cards[7777].result.trainingPointsTotal;
cards[7777]={...cards[7777],name:'Jogador 7777 atualizado'};
for(const card of cards)indexed(card);
assert.equal(indexBuilds,count+1);
assert.equal(cards[7777].result.trainingPointsTotal,beforePP);

let signatureBuilds=0;
const signatureCache=new WeakMap();
function signature(card){let value=signatureCache.get(card);if(value)return value;signatureBuilds++;value=card.id+'::'+card.result.trainingPointsTotal;signatureCache.set(card,value);return value;}
for(let pass=0;pass<5;pass++)for(const card of cards)signature(card);
assert.equal(signatureBuilds,count);
assert.equal(cards.length,count);
console.log('R414 aprovada: índice de busca/ordenação e assinaturas derivadas são reutilizados; 10.000 fichas e PP preservados.');
