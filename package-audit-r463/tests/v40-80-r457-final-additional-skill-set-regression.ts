import assert from 'node:assert/strict';
import { optimizeFinalAdditionalSkillSetR457 } from '../src/lib/finalAdditionalSkillSetR457';

const actions=[
  {id:'short_creation',label:'Tabela',frequency:92,contribution:84},
  {id:'through_creation',label:'Ruptura',frequency:86,contribution:81},
  {id:'close_control',label:'Controle',frequency:78,contribution:72},
  {id:'press_recover',label:'Pressão',frequency:60,contribution:55},
  {id:'intercept',label:'Interceptação',frequency:48,contribution:42}
] as any;

const base:any={
  playerName:'R457 Skills',
  mainPosition:'CMF',positions:['CMF','DMF'],cardType:'Epic',specialTag:'Teste',
  nativeSkills:['Liderança'],specialSkills:[],
  additionalSkills:['Passe de primeira','Especialista em pênalti'],
  attributes:{},evidence:{},impetos:[]
};
const first=optimizeFinalAdditionalSkillSetR457(base,actions,'CMF');
const repeat=optimizeFinalAdditionalSkillSetR457({...base,playerName:'Outro nome'},actions,'CMF');
assert.equal(first.status,'OPTIMAL_SET_PROVEN');
assert.equal(first.finalSkills.length,5);
assert.equal(new Set(first.finalSkills).size,5);
assert.equal(first.officialOnly,true);
assert.equal(first.roleCompatible,true);
assert.equal(first.nativeSpecialDuplicatesBlocked,true);
assert.ok(first.combinationsTested>0);
assert.deepEqual(first.finalSkills,repeat.finalSkills,'Nome do jogador não pode decidir o conjunto.');
assert.ok(first.decisions.some(item=>item.action==='KEEP'&&item.skill==='Passe de primeira'),'Skill atual útil deve poder ser mantida.');
assert.ok(first.decisions.some(item=>item.action==='REPLACE'&&item.replaces==='Especialista em pênalti'),'Skill atual fraca/incompatível deve poder ser substituída.');
const defensiveActions=[
  {id:'intercept',label:'Interceptação',frequency:96,contribution:92},
  {id:'defensive_duel',label:'Duelo',frequency:91,contribution:87},
  {id:'cover_space',label:'Cobertura',frequency:88,contribution:83},
  {id:'build_out',label:'Saída',frequency:74,contribution:67},
  {id:'aerial_defend',label:'Aéreo',frequency:70,contribution:63}
] as any;
const incompatible:any={...base,mainPosition:'CB',positions:['CB'],additionalSkills:['Chute de primeira','Interceptação']};
const incompatibleResult=optimizeFinalAdditionalSkillSetR457(incompatible,defensiveActions,'CB');
assert.ok(incompatibleResult.removals.includes('Chute de primeira'),'Skill instalada incompatível precisa permanecer visível como remoção.');
assert.ok(incompatibleResult.decisions.some(item=>item.action==='REPLACE'&&item.replaces==='Chute de primeira'),'Slot incompatível deve gerar SUBSTITUIR, não sumir.');


const defensive=optimizeFinalAdditionalSkillSetR457({...base,additionalSkills:[]},defensiveActions,'DMF');
assert.equal(defensive.finalSkills.length,5);
assert.notDeepEqual(defensive.finalSkills,first.finalSkills,'Demandas funcionais diferentes devem poder gerar conjunto diferente.');
assert.ok(defensive.finalSkills.includes('Interceptação')||defensive.finalSkills.includes('Bloqueador'));
console.log('R457 skills aprovada: conjunto final de cinco slots é otimizado globalmente no pool oficial, sem diversidade forçada, sem GER e com KEEP/ADD/REPLACE.');
