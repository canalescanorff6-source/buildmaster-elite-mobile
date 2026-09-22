import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mergeHistoryLists } from '../src/modules/vault/cardHistoryStore';

function saved(name:string, marker:string, usageFunction='Orquestrador', saveKey?:string):any{
  return {
    id:`id-${marker}`,saveKey:saveKey??`custom-${marker}`,savedAt:'agora',updatedAt:'agora',rawText:'',playerImage:null,fullPreview:null,
    result:{
      parsed:{playerName:name,mainPosition:'CMF',positions:['CMF'],cardType:'Epic',specialTag:'Teste',nativeSkills:[],specialSkills:[],additionalSkills:[],attributes:{},impetos:[]},
      usageFunctionR457:usageFunction,bestPosition:{code:'CMF'}
    },
    skillProgress:{},notes:marker,favorite:false,personalTags:[],tacticalRoleNote:'',changeLog:[]
  };
}

const secondary=[saved('Mesmo Jogador','sec','Orquestrador','legacy-key')];
const primary=[saved('Mesmo Jogador','pri','Orquestrador','new-key')];
const merged=mergeHistoryLists(primary,secondary);
assert.equal(merged.length,1,'Mesma carta + posição + função deve ser uma única identidade no merge.');
assert.equal(merged[0].notes,'pri','Primary precisa substituir secondary como no contrato histórico.');

const variant=saved('Mesmo Jogador','var','Orquestrador','same-variante-1');
const withVariant=mergeHistoryLists([variant],merged);
assert.equal(withVariant.length,2,'Variante deliberada precisa continuar independente.');

const source=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
const block=source.slice(source.indexOf('export function mergeHistoryLists'),source.indexOf('export type HistoryLoadOptions'));
assert.doesNotMatch(block,/\.findIndex\(/,'R459 não pode voltar ao merge O(n²).');
assert.match(block,/tokenIndexes/);

const manySecondary:any[]=[];
const manyPrimary:any[]=[];
for(let i=0;i<10000;i++) manySecondary.push(saved(`Jogador ${i}`,`s${i}`,'Orquestrador',`s-${i}`));
for(let i=0;i<1000;i++) manyPrimary.push(saved(`Jogador ${i}`,`p${i}`,'Orquestrador',`p-${i}`));
const started=Date.now();
const large=mergeHistoryLists(manyPrimary,manySecondary);
const elapsed=Date.now()-started;
assert.equal(large.length,10000);
for(let i=0;i<1000;i++) assert.equal(large[i].notes,`p${i}`);
assert.ok(elapsed<8000,`Merge de 11k entradas ficou lento demais: ${elapsed}ms.`);
console.log(`R459 Cofre aprovado: merge canônico linear preservou precedência e processou 11k entradas em ${elapsed}ms.`);
