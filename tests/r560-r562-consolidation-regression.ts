import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getManager } from '../src/lib/managers';
import { evaluateManagerLinksR560, projectManagerAttributesR560 } from '../src/lib/managerLinkEngineR560';
import { buildCardSlotsViewR561 } from '../src/lib/cardVisualEvidenceR561';
import { buildTacticalSnapshotR562 } from '../src/lib/tacticalSnapshotR562';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';

const manager=getManager('r-rodriguez-posse-88-2026-10-01');
assert.ok(manager);
assert.equal(manager.primaryProficiency,88);
const members=Array.from({length:11},(_,i)=>({playerName:'Jogador '+i,position:'CB' as const,playstyle:'Defensor criativo',fingerprint:'edition-'+i}));
members[0]={...members[0],position:'DMF',playstyle:'Orquestrador'};
members[1]={...members[1],position:'AMF',playstyle:'Armador criativo'};
members[2]={...members[2],position:'CF',playstyle:'Artilheiro'};
assert.deepEqual(evaluateManagerLinksR560(manager,members,false).map(v=>v.status),['PENDENTE','PENDENTE']);
assert.deepEqual(evaluateManagerLinksR560(manager,members,true).map(v=>v.status),['ATIVO','ATIVO']);
assert.equal(evaluateManagerLinksR560(manager,members.slice(0,10),true)[0].status,'PENDENTE');
assert.deepEqual(projectManagerAttributesR560({balance:84,tightPossession:90},manager,'PRINT_JA_COM_BONUS').attributes,{balance:84,tightPossession:90});
assert.deepEqual(projectManagerAttributesR560({balance:84,tightPossession:90},manager,'BASE_SEM_BONUS_TECNICO').attributes,{balance:85,tightPossession:91});

const card={playerName:'Piloto',cardType:'Épica',mainPosition:'DMF',internalId:'r562-test',playstyle:'Orquestrador',
  attributes:{balance:82,tightPossession:79},trainingPointsTotal:40,trainingPointsUsed:36,
  additionalSkills:['Toque duplo'],nativeSkills:[],specialSkills:[],
  additionalSkillSlotsR560:[{slot:1,skill:'Passe de primeira',source:'MANUAL'}],
  boosterSlotsR560:{primary:{name:'Passe'},secondary:null,secondaryStatus:'NAO_CONFIRMADO',source:'MANUAL'},
  impetos:[{name:'Passe'}],evidence:{attributeCount:2,criticalStateR419:'UNCERTAIN'}
} as any;
const slots=buildCardSlotsViewR561(card);
assert.equal(slots.skills[0].status,'CONFIRMADO');
assert.equal(slots.skills[1].status,'PENDENTE');
assert.equal(slots.boosters[0].status,'CONFIRMADO');
assert.equal(slots.boosters[1].status,'PENDENTE');
assert.equal(buildCardSlotsViewR561({...card,additionalSkillSlotsR560:undefined}).skills[0].status,'REGISTRADO');

const result={parsed:card,training:{passing:4},validation:{confirmed:false,level:'review'}} as any;
const record={fingerprint:cardIdentityFingerprintR126(card),status:'pendente',result} as any;
const team={formation:'4-3-1-2',totalSlots:11,filledSlots:1,lineup:[
  {slot:{id:'dmf',label:'VOL',position:'DMF'},player:result},
  ...Array.from({length:10},(_,i)=>({slot:{id:'empty-'+i,label:'Vazio '+i,position:'CB'},player:null}))
]} as any;
const before=JSON.stringify(card);
const snapshot=buildTacticalSnapshotR562({team,teamStyle:'POSSE_DE_BOLA',selectedManager:manager,players:[record],lineupConfirmed:true});
assert.match(snapshot,/SNAPSHOT TÁTICO R562/);
assert.match(snapshot,/R\. Rodríguez/);
assert.match(snapshot,/Escalação: PENDENTE/);
assert.match(snapshot,/Habilidades adicionais \[5\]/);
assert.match(snapshot,/Passe de primeira \[CONFIRMADO\]/);
assert.match(snapshot,/Toque duplo/,{message:'Legacy skill should not be silently presented as owned when explicit source exists'});
assert.match(snapshot,/PENDENTE — bônus não somado ao print/);
assert.equal(JSON.stringify(card),before,'Snapshot never mutates vault card.');
const noManager=buildTacticalSnapshotR562({team,teamStyle:'POSSE_DE_BOLA',selectedManager:null,players:[record],lineupConfirmed:false});
assert.match(noManager,/Técnico: PENDENTE/);
const teamUi=readFileSync('src/modules/squad/IntegratedTeamLab.tsx','utf8');
const appUi=readFileSync('src/components/CardVisionApp.tsx','utf8');
const playerUi=readFileSync('src/modules/players/PlayerLaboratory.tsx','utf8');
assert.match(teamUi,/navigator\.clipboard\.writeText\(snapshot\)/);
assert.match(teamUi,/Copiar Snapshot/);
assert.match(teamUi,/setManualCopyR562/);
assert.match(appUi,/selectedManager=\{selectedManager\}/);
assert.match(playerUi,/buildCardSlotsViewR561/);
console.log('R560–R562 GREEN: immutable editions, slots, links, snapshot, clipboard fallback');
