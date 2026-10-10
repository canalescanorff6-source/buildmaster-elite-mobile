/** R562: pure exporter, provenance gates, incomplete cards and UI wiring. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTacticalSnapshotR562 } from '../src/lib/tacticalSnapshotR562';
import { getManager } from '../src/lib/managers';
import type { TeamDiagnosis, IntegratedPlayerRecord } from '../src/modules/core/centralIntelligence';
import type { AnalysisResult, ParsedCard } from '../src/lib/analyzerDomain';
import type { SquadMemberR560 } from '../src/lib/managerLinkEngineR560';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';

const manager = getManager('r-rodriguez-posse-88-2026-10-01');
assert.ok(manager);
const card = {
  playerName:'Piloto', cardType:'Épica', playstyle:'Orquestrador', level:16,
  attributes:{tightPossession:82,balance:81},
  additionalSkills:['Toque Duplo'], impetos:[{name:'Velocidade'}],
  additionalSkillSlotsR560:[{slot:1,skill:'Chute de Primeira',source:'MANUAL'}],
  boosterSlotsR560:{primary:{name:'Velocidade'},secondary:null,secondaryStatus:'NAO_CONFIRMADO',source:'MANUAL'},
  evidence:{attributeCount:2,levelStateR419:'UNCERTAIN'}
} as ParsedCard;
const mockResult = {parsed:card, training:{passing:4,dribbling:2}, validation:{level:'review',confirmed:false}} as unknown as AnalysisResult;
const record = {result:mockResult,fingerprint:cardIdentityFingerprintR126(card),status:'pendente'} as IntegratedPlayerRecord;
const lineup = [
  {slot:{id:'pos-1',position:'DMF',label:'VOL'},player:mockResult},
  {slot:{id:'pos-2',position:'AMF',label:'MAT'},player:{parsed:{...card,playerName:'Criador',playstyle:'Armador criativo'},training:{},validation:{level:'safe',confirmed:true}}},
  {slot:{id:'pos-3',position:'CF',label:'CA'},player:{parsed:{...card,playerName:'Goleador',playstyle:'Artilheiro'},training:{},validation:{level:'safe',confirmed:true}}},
  ...Array.from({length:8},(_,idx)=>({slot:{id:`pos-${idx+4}`,position:'CB',label:`ZAG${idx}`},player:{parsed:{...card,playerName:`Defensor ${idx}`,playstyle:'Defensor criativo'},training:{},validation:{level:'safe',confirmed:true}}}))
] as TeamDiagnosis['lineup'];
const team = {formation:'4-3-3',lineup,filledSlots:11,totalSlots:11} as TeamDiagnosis;
const squad: SquadMemberR560[] = lineup.map((fit)=>({playerName:fit.player?.parsed.playerName??'',position:fit.slot.position,playstyle:fit.player?.parsed.playstyle??null}));
const input = {team,teamStyle:'POSSE_DE_BOLA' as const,selectedManager:manager,players:[record],squad,lineupConfirmed:true};
const before = JSON.stringify(card);
const text = buildTacticalSnapshotR562(input);
assert.match(text,/SNAPSHOT TÁTICO R562/);
assert.match(text,/Técnico: R\. Rodríguez/);
assert.match(text,/Passe por cima A: ATIVO/);
assert.match(text,/Passe de ruptura A: ATIVO/);
assert.match(text,/Habilidade 1=Chute de Primeira \[CONFIRMADO, MANUAL\]/);
assert.match(text,/Habilidade 2=— \[PENDENTE\]/);
assert.match(text,/Ímpeto principal=Velocidade \[CONFIRMADO, MANUAL\]/);
assert.match(text,/Ficha calculada sugerida \(NÃO comprova que foi aplicada\): Passe=4, Drible=2/);
assert.match(text,/Condução firme=82, Equilíbrio=81/);
assert.match(text,/STATUS: PENDENTE/);
assert.match(text,/Condução Firme=PENDENTE \(\+1 não somado ao print\)/);
assert.doesNotMatch(text,/Condução Firme=83/,'Não somar no print OCR');
assert.equal(JSON.stringify(card),before,'Snapshot deve ser somente leitura');
assert.match(buildTacticalSnapshotR562({...input,lineupConfirmed:false}),/Passe por cima A: PENDENTE/);
const incomplete = buildTacticalSnapshotR562({...input,team:{...team,filledSlots:10,lineup:[...lineup.slice(0,3),{...lineup[3],player:null},...lineup.slice(4)]},lineupConfirmed:true});
assert.match(incomplete,/posição sem jogador confirmado/);
assert.match(incomplete,/Escalação: PENDENTE de confirmação/);
const noManager = buildTacticalSnapshotR562({...input,selectedManager:null});
assert.match(noManager,/Técnico: PENDENTE — não selecionado/);
assert.doesNotMatch(noManager,/Passe por cima A: ATIVO/);
const component = readFileSync(resolve(__dirname,'../src/modules/squad/IntegratedTeamLab.tsx'),'utf8');
assert.match(component,/navigator\.clipboard\.writeText\(snapshot\)/);
assert.match(component,/buildTacticalSnapshotR562\(/);
assert.match(component,/Copiar Snapshot/);
assert.match(component,/clipboardFallbackR562/);
assert.match(component,/<div className="bm32-team-pitch"/);
assert.match(component,/className="bm32-team-bench-strip"/);
console.log('R562 Snapshot: proveniência, sem API, dados pendentes, vínculos e botão de cópia GREEN');
