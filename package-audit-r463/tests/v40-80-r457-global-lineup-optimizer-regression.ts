import assert from 'node:assert/strict';
import { optimizeGlobalFormationLineupR457 } from '../src/lib/globalLineupOptimizerR457';
import { getFormationBlueprint, scorePlayerForFormationSlot, type FormationBlueprint } from '../src/lib/formationRoleEngine';
import { playerIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';

function r(name:string,pos:any,score=85,style='Básico'):any{
 return {parsed:{playerName:name,cardType:'Epic',specialTag:name,country:'BR',mainPosition:pos,mainPositionPt:pos,positions:[pos],positionsPt:[pos],positionRatings:{[pos]:100},playstyle:style,offensivePlaystyle:style,defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:true,attributes:{lowPass:score,loftedPass:score,ballControl:score,finishing:score,offensiveAwareness:score,defensiveAwareness:score,tackling:score,defensiveEngagement:score,aggression:score,speed:score,acceleration:score,stamina:score,physicalContact:score,jump:score,heading:score},nativeSkills:[],specialSkills:[],additionalSkills:[],impetos:[],physicalProfile:{},condition:{},evidence:{attributeCount:18,positionRatingsCount:1},internalId:name,confidence:95},bestPosition:{code:pos,label:pos,score},permittedPositions:[{code:pos,label:pos,reason:'x'}],teamMap:{functionLabel:style,sectorScores:{marcacao:score,cobertura:score,saidaDeBola:score,passe:score,criacao:score,aceleracao:score,finalizacao:score,jogoAereo:score,fisico:score}},buildName:name,tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'}};
}

function bruteForce(results:any[],bp:FormationBlueprint){
 const slots=bp.slots;
 let best=-Infinity,bestSig='';
 const used=new Set<string>();
 const selected:Array<any|null>=[];
 const visit=(i:number,total:number)=>{
   if(i===slots.length){
     const sig=selected.map((p,idx)=>`${slots[idx].id}:${p?playerIdentityFingerprintR126(p.parsed):'EMPTY'}`).sort().join('|');
     if(total>best+1e-9||(Math.abs(total-best)<=1e-9&&(!bestSig||sig<bestSig))){best=total;bestSig=sig;}
     return;
   }
   const slot=slots[i];
   for(const p of results){
     const key=playerIdentityFingerprintR126(p.parsed);if(used.has(key))continue;
     const fit=scorePlayerForFormationSlot(p,slot);if(fit.score<48)continue;
     used.add(key);selected.push(p);visit(i+1,total+fit.score);selected.pop();used.delete(key);
   }
   selected.push(null);visit(i+1,total);selected.pop();
 };
 visit(0,0);return {best,bestSig};
}

const bp=getFormationBlueprint('4-2-2-2');
const players=[
 r('GK','GK'),r('LB','LB'),r('RB','RB'),r('CB1','CB',91,'Defensor Criativo'),r('CB2','CB',90,'Destruidor'),
 r('DM1','DMF',92,'1º Volante'),r('DM2','DMF',91,'Orquestrador'),r('AM1','AMF',92,'Armador Criativo'),r('AM2','AMF',91,'Infiltração'),
 r('CF1','CF',93,'Puxa Marcação'),r('CF2','CF',92,'Artilheiro'),r('ALT','SS',89,'Armador Criativo')
];
const a=optimizeGlobalFormationLineupR457(players,bp,'POSSE_DE_BOLA',{nodeLimit:500000});
const reversed={...bp,slots:[...bp.slots].reverse()};
const b=optimizeGlobalFormationLineupR457(players,reversed,'POSSE_DE_BOLA',{nodeLimit:500000});
assert.equal(a.status,'PROVEN_GLOBAL');
assert.equal(b.status,'PROVEN_GLOBAL');
const sig=(x:any)=>x.lineup.map((i:any)=>[i.slot.id,i.player?.parsed.playerName??null]).sort().map(JSON.stringify);
assert.deepEqual(sig(a),sig(b),'Permutar os slots não pode mudar a solução global.');
assert.equal(new Set(a.lineup.filter(x=>x.player).map(x=>x.player!.parsed.playerName)).size,a.filledSlots);
assert.equal(a.teamStyle,'POSSE_DE_BOLA');
assert.equal(a.admissibleUpperBound,'SUM_REMAINING_SLOT_MAX');

// Prova independente: numa instância pequena, o branch-and-bound deve empatar com enumeração total.
const tiny:any={...bp,id:'tiny',slots:bp.slots.filter(s=>['cb1','cb2','dm1'].includes(s.id))};
const tinyPlayers=[r('A','CB',90,'Destruidor'),r('B','CB',88,'Defensor Criativo'),r('C','DMF',91,'1º Volante'),r('D','DMF',86,'Orquestrador')];
const opt=optimizeGlobalFormationLineupR457(tinyPlayers,tiny,'POSSE_DE_BOLA',{nodeLimit:200000});
const brute=bruteForce(tinyPlayers,tiny);
assert.equal(opt.status,'PROVEN_GLOBAL');
assert.equal(opt.rawTotalScore,brute.best,'O bound admissível precisa produzir o mesmo ótimo da força bruta.');

const duplicateCard={...players[3],parsed:{...players[3].parsed,internalId:'CB1-V2',specialTag:'CB1-V2'}};
const withDuplicate=optimizeGlobalFormationLineupR457([...players,duplicateCard],bp,'POSSE_DE_BOLA',{nodeLimit:500000});
const cb1Count=withDuplicate.lineup.filter((x:any)=>x.player?.parsed.playerName==='CB1').length;
assert.equal(cb1Count,1,'Duas cartas do mesmo atleta não podem ocupar duas vagas no XI.');

console.log('R457 Stage 12 aprovada: bound admissível conferido contra força bruta, solução independente da ordem e identidade única do atleta.');
