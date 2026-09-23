import assert from 'node:assert/strict';
import { buildFormationAwareRotationR457 } from '../src/lib/formationAwareRotationR457';
import { optimizeGlobalFormationLineupR457 } from '../src/lib/globalLineupOptimizerR457';
import { getFormationBlueprint } from '../src/lib/formationRoleEngine';
import { playerIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { buildSquadRotationReport } from '../src/lib/squadRotation';
function r(name:string,pos:any,score=85,style='Básico',stamina=score):any{
 return {parsed:{playerName:name,cardType:'Epic',specialTag:name,country:'BR',mainPosition:pos,mainPositionPt:pos,positions:[pos],positionsPt:[pos],positionRatings:{[pos]:100},playstyle:style,offensivePlaystyle:style,defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:true,attributes:{lowPass:score,loftedPass:score,ballControl:score,tightPossession:score,finishing:score,offensiveAwareness:score,defensiveAwareness:score,tackling:score,defensiveEngagement:score,aggression:score,speed:score,acceleration:score,stamina,physicalContact:score,jump:score,heading:score,kickingPower:score},nativeSkills:[],specialSkills:[],additionalSkills:[],impetos:[],physicalProfile:{},condition:{},evidence:{attributeCount:20,positionRatingsCount:1},internalId:name,confidence:95},bestPosition:{code:pos,label:pos,score},permittedPositions:[{code:pos,label:pos,reason:'x'}],teamMap:{functionLabel:style,sectorScores:{marcacao:score,cobertura:score,saidaDeBola:score,passe:score,criacao:score,aceleracao:score,finalizacao:score,jogoAereo:score,fisico:stamina}},buildName:name,tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'}};
}
const starters=[r('GK','GK',88),r('LB','LB',87),r('RB','RB',87),r('CB1','CB',92,'Defensor Criativo'),r('CB2','CB',91,'Destruidor'),r('DM1','DMF',92,'1º Volante'),r('DM2','DMF',89,'Orquestrador'),r('AM1','AMF',92,'Armador Criativo'),r('AM2','AMF',90,'Infiltração'),r('CF1','CF',94,'Puxa Marcação'),r('CF2','CF',93,'Artilheiro')];
const reserves=[r('CBR','CB',86,'Destruidor',95),r('DMR','DMF',87,'Meia versátil',96),r('AMR','AMF',88,'Infiltração',96),r('CFR','CF',90,'Artilheiro',95)];
const duplicate={...starters[3],parsed:{...starters[3].parsed,internalId:'CB1-ALT',specialTag:'CB1-ALT'}};
const roster=[...starters,...reserves,duplicate];
const bp=getFormationBlueprint('4-2-2-2');
const global=optimizeGlobalFormationLineupR457(roster,bp,'POSSE_DE_BOLA',{nodeLimit:500000});
const rotation=buildFormationAwareRotationR457(roster,'4-2-2-2','POSSE_DE_BOLA','PERDENDO_1','BAIXA');
assert.ok(rotation);
const gkeys=global.lineup.filter(x=>x.player).map(x=>playerIdentityFingerprintR126(x.player!.parsed)).sort();
const rkeys=rotation!.starterResults.map(x=>playerIdentityFingerprintR126(x.parsed)).sort();
assert.deepEqual(rkeys,gkeys);
const starterSet=new Set(rkeys);
for(const reserve of rotation!.benchResults)assert.ok(!starterSet.has(playerIdentityFingerprintR126(reserve.parsed)));
assert.ok(rotation!.substitutions.length>0);
for(const sub of rotation!.substitutions){assert.equal(sub.automatic,false);assert.equal(sub.beforeTeamScore,rotation!.baseTeamScore);assert.equal(Math.round((sub.afterTeamScore-sub.beforeTeamScore)*100)/100,sub.tacticalDelta);}
const report=buildSquadRotationReport(roster,'4-2-2-2','POSSE_DE_BOLA','PERDENDO_1','BAIXA');
assert.ok(report);assert.equal(report!.starterCount,rotation!.starterResults.length);assert.ok(report!.substitutions.every((s:any)=>s.beforeTeamScore===rotation!.baseTeamScore));
console.log('R457 Stage 13 comportamento aprovado: banco deriva do XI global, exclui identidades titulares e cada troca recalcula o XI.');
