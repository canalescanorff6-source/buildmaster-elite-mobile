import assert from 'node:assert/strict';
import { evaluateFinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';

const finishing=[
  {id:'finish_box',frequency:96,contribution:90},
  {id:'attack_space',frequency:90,contribution:84},
  {id:'turn_finish',frequency:76,contribution:70},
  {id:'long_finish',frequency:68,contribution:62}
] as any;
const base:any={
  playerName:'R457 Impeto',mainPosition:'CF',positions:['CF'],confidence:95,
  attributes:{offensiveAwareness:94,finishing:95,kickingPower:91,acceleration:90,speed:88,ballControl:85,balance:83},
  impetos:[{name:'Cruzamento',active:true}],
  evidence:{impetoSlotStatus:'OCUPADO'}
};
const current=evaluateFinalImpetoDecisionR457(base,finishing,'CF');
assert.equal(current.numericAttributeEffectVerified,false);
assert.equal(current.automaticSpendAuthorized,false);
assert.notEqual(current.technicalIdeal,'Cruzamento','Ímpeto existente não pode ser declarado ideal automaticamente.');
assert.ok(current.technicalIdealScore>=48);
assert.ok(['REPLACE_IF_ALLOWED','KEEP_CURRENT'].includes(current.action));
const unknown=evaluateFinalImpetoDecisionR457({...base,impetos:[{name:'Ímpeto não catalogado',active:true}]},finishing,'CF');
assert.equal(unknown.action,'REVIEW_SLOT','Ímpeto atual não reconhecido não pode ser trocado por comparação inexistente.');
assert.equal(unknown.currentScore,null);


const empty=evaluateFinalImpetoDecisionR457({...base,impetos:[],evidence:{impetoSlotStatus:'DISPONIVEL'}},finishing,'CF');
assert.equal(empty.action,'ADD_IF_AVAILABLE');
assert.ok(empty.technicalIdeal);

const noSlot=evaluateFinalImpetoDecisionR457({...base,impetos:[],evidence:{impetoSlotStatus:'SEM_VAGA'}},finishing,'CF');
assert.equal(noSlot.action,'SLOT_NOT_AVAILABLE');
assert.equal(noSlot.technicalIdeal,empty.technicalIdeal);

const gerVariant=evaluateFinalImpetoDecisionR457({...base,overall:119},finishing,'CF');
assert.equal(gerVariant.technicalIdeal,current.technicalIdeal,'GER não pode mudar Ímpeto técnico ideal.');
console.log('R457 Ímpeto aprovado: ideal técnico é calculado mesmo com Ímpeto atual; gasto continua bloqueado e nenhum bônus numérico não confirmado é inventado.');
