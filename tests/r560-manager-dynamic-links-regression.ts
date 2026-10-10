import assert from 'node:assert/strict';
import { getManager } from '../src/lib/managers';
import { MANAGERS_V600_R11 } from '../src/lib/managersV600R11';
import { evaluateManagerLinksR560, formatSquadForChatR560, projectManagerAttributesR560 } from '../src/lib/managerLinkEngineR560';
import type { SquadMemberR560 } from '../src/lib/managerLinkEngineR560';

const manager = getManager('r-rodriguez-posse-88-2026-10-01');
assert.ok(manager);
assert.equal(manager.primaryProficiency, 88);
assert.ok(MANAGERS_V600_R11.some((item) => item.id === manager.id));
const squad: SquadMemberR560[] = [
  {playerName:'Volante',position:'DMF',playstyle:'Orquestrador'},
  {playerName:'Meia',position:'AMF',playstyle:'Creative Playmaker'},
  {playerName:'Atacante',position:'CF',playstyle:'Goal Poacher'}
];
assert.deepEqual(evaluateManagerLinksR560(manager,squad,{lineupConfirmed:true}).map(x=>x.status), ['ATIVO','ATIVO']);
assert.deepEqual(evaluateManagerLinksR560(manager,squad).map(x=>x.status), ['PENDENTE','PENDENTE']);
assert.deepEqual(evaluateManagerLinksR560(manager,squad.slice(1),{lineupConfirmed:true}).map(x=>x.status), ['INATIVO','ATIVO']);
assert.deepEqual(evaluateManagerLinksR560(manager,[{playerName:'Volante',position:'CMF',playstyle:'Orquestrador'},...squad.slice(1)],{lineupConfirmed:true}).map(x=>x.status), ['INATIVO','ATIVO']);
assert.deepEqual(evaluateManagerLinksR560(manager,[{playerName:'Volante',position:'DMF',playstyle:null},...squad.slice(1)],{lineupConfirmed:true}).map(x=>x.status), ['INATIVO','ATIVO']);
const attrs={tightPossession:85,balance:80,finishing:99};
const noDouble=projectManagerAttributesR560(attrs,manager,'PRINT_JA_COM_BONUS');
assert.equal(noDouble.status,'NAO_APLICADO'); assert.deepEqual(noDouble.attributes,attrs);
const unknown=projectManagerAttributesR560(attrs,manager,'INDETERMINADO'); assert.deepEqual(unknown.attributes,attrs);
const projected=projectManagerAttributesR560(attrs,manager,'BASE_SEM_BONUS_TECNICO');
assert.equal(projected.status,'APLICADO');
assert.equal(projectManagerAttributesR560({finishing:88},manager,'BASE_SEM_BONUS_TECNICO').status,'NAO_APLICADO'); assert.deepEqual(projected.attributes,{tightPossession:86,balance:81,finishing:99});
assert.deepEqual(attrs,{tightPossession:85,balance:80,finishing:99},'Não alterar atributos da carta original');
assert.equal(projectManagerAttributesR560(attrs,getManager('cruyff-posse-89'),'BASE_SEM_BONUS_TECNICO').status,'SEM_BONUS');
const report=formatSquadForChatR560(squad,manager.id,'POSSE_DE_BOLA','4-3-1-2');
assert.match(report,/R\. Rodríguez/);assert.match(report,/PENDENTE DE CONFIRMAÇÃO/);assert.match(report,/4-3-1-2/);
assert.doesNotMatch(report,/\bAPI KEY\b/);
const eleven=[...squad,...Array.from({length:8},(_,i)=>({playerName:`Reserva ${i}`,position:'CB' as const,playstyle:'Defensor criativo'}))];
assert.match(formatSquadForChatR560(eleven,manager.id,'POSSE_DE_BOLA','4-3-1-2',{lineupConfirmed:true}),/Vínculo Passe por cima A: ATIVO/);
console.log('R560: boosters base seguros, links posicionais verificados, avaliação condicional e exportação local GREEN');
