import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import { buildGameplayMetaV600R10 } from '../src/lib/gameplayMetaV600R10';

const base={
  bestPosition:{code:'CMF',label:'MLG',score:94},
  parsed:{playerName:'Teste',attributes:{lowPass:92,ballControl:92,tightPossession:90,dribbling:89,balance:90,acceleration:88,stamina:93,offensiveAwareness:84,defensiveAwareness:84,defensiveEngagement:85,tackling:82,physicalContact:81},nativeSkills:['Passe de primeira','Passe em profundidade'],specialSkills:[],additionalSkills:[]},
  permittedPositions:[{code:'CMF',label:'MLG',reason:'natural'},{code:'DMF',label:'VOL',reason:'compatível'},{code:'AMF',label:'MAT',reason:'compatível'}],
  avoidPositions:[],
  realPerformance2027V4080R7:{phaseProfile:{phaseBalanceScore:88}},
  metaVivo2027V4080R8:{scores:{manualDefence:86,phaseBalance:88}}
} as unknown as AnalysisResult;
const meta=buildGameplayMetaV600R10(base);
assert.ok(meta.scores.shortPassing>=88);
assert.ok(meta.scores.ballCarry>=85);
assert.ok(meta.scores.tikiTaka>=85);
assert.ok(meta.scores.manualDefence>=80);
assert.notEqual(meta.formation.recommendation,'TRADICIONAL');
assert.ok(meta.formation.safeMoves.some((m)=>m.position==='DMF'));

const cf=buildGameplayMetaV600R10({...base,bestPosition:{code:'CF',label:'CA',score:95},parsed:{...base.parsed,attributes:{...base.parsed.attributes,defensiveAwareness:45,defensiveEngagement:44,tackling:42,stamina:80}},permittedPositions:[{code:'CF',label:'CA',reason:'natural'}],avoidPositions:[{code:'DMF',label:'VOL',reason:'incompatível'}],metaVivo2027V4080R8:{...base.metaVivo2027V4080R8,scores:{...base.metaVivo2027V4080R8!.scores,manualDefence:45,phaseBalance:62}}} as AnalysisResult);
assert.ok(cf.scores.fluidCompatibility<meta.scores.fluidCompatibility);
assert.ok(cf.formation.safeMoves.every((m)=>m.position!=='DMF'));
assert.equal(meta.guarantees.doesNotFixNetwork,true);
console.log(`Gameplay Meta v6.0 r10 aprovado: ${meta.salesSummary}`);
