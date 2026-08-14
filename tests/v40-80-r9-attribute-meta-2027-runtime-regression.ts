import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import { buildAttributeMeta2027 } from '../src/lib/attributeMeta2027V600';

const base={
  bestPosition:{code:'CF',label:'CA',score:95},
  parsed:{offensivePlaystyle:'Artilheiro',playstyle:'Artilheiro',attributes:{offensiveAwareness:88,finishing:87,acceleration:86,speed:84,balance:82,physicalContact:80},nativeSkills:[],specialSkills:[],additionalSkills:[]},
  tacticalProfile:{style:'CONTRA_ATAQUE',connectionProfile:'VARIABLE'}
} as unknown as AnalysisResult;
const artilheiro=buildAttributeMeta2027(base);
assert.equal(artilheiro.playerPlaystyle,'Artilheiro');
assert.ok((artilheiro.targets.find((x)=>x.attribute==='finishing')?.targetIdeal ?? 0)>=95);
assert.ok((artilheiro.trainingBias.dexterity ?? 0)>0);

const pivo=buildAttributeMeta2027({...base,parsed:{...base.parsed,offensivePlaystyle:'Pivô',playstyle:'Pivô'}} as AnalysisResult);
assert.ok((pivo.targets.find((x)=>x.attribute==='physicalContact')?.targetIdeal ?? 0)>=92);
assert.ok((pivo.targets.find((x)=>x.attribute==='lowPass')?.targetIdeal ?? 0)>=86);
assert.notDeepEqual(pivo.trainingBias,artilheiro.trainingBias);

const volante=buildAttributeMeta2027({...base,bestPosition:{code:'DMF',label:'VOL',score:95},parsed:{...base.parsed,offensivePlaystyle:'Primeiro volante',playstyle:'Primeiro volante',attributes:{defensiveAwareness:87,defensiveEngagement:86,tackling:84,physicalContact:85,stamina:88,lowPass:82}}} as AnalysisResult);
assert.ok((volante.targets.find((x)=>x.attribute==='defensiveAwareness')?.targetIdeal ?? 0)>=96);
assert.ok((volante.trainingBias.defending ?? 0)>(volante.trainingBias.dribbling ?? 0));

const orquestrador=buildAttributeMeta2027({...base,bestPosition:{code:'CMF',label:'MLG',score:95},parsed:{...base.parsed,offensivePlaystyle:'Orquestrador',playstyle:'Orquestrador',attributes:{lowPass:86,ballControl:86,tightPossession:84,stamina:87,balance:84,acceleration:81}}} as AnalysisResult);
assert.ok((orquestrador.targets.find((x)=>x.attribute==='lowPass')?.targetIdeal ?? 0)>=94);
assert.ok((orquestrador.trainingBias.passing ?? 0)>(orquestrador.trainingBias.defending ?? 0));

const saturated=buildAttributeMeta2027({...base,parsed:{...base.parsed,attributes:{offensiveAwareness:100,finishing:100,acceleration:100,speed:100,balance:100,physicalContact:100}}} as AnalysisResult);
assert.ok(saturated.stopSpending.length>=3);
assert.ok(saturated.stopSpending.every((x)=>x.priority==='SATURADA'||x.priority==='MANTER'));
console.log(`Atributos Meta 2027 aprovados: ${artilheiro.summary} | ${pivo.summary}`);
