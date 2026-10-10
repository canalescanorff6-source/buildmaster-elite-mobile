import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planSkillBoosterIntelligenceR567 } from '../src/lib/skillBoosterIntelligenceR567';

const card = {
  nativeSkills:['Passe de primeira'],
  specialSkills:[],
  additionalSkills:['Toque duplo'],
  additionalSkillSlotsR560:[
    {slot:1,skill:'Toque duplo',source:'MANUAL'},
    {slot:2,skill:null,source:'MANUAL'},
    {slot:3,skill:null,source:'MANUAL'},
    {slot:4,skill:null,source:'MANUAL'},
    {slot:5,skill:null,source:'MANUAL'},
  ],
  impetos:[{name:'Passe',active:true}],
  boosterSlotsR560:{
    primary:{name:'Passe',active:true},
    secondary:null,
    secondaryStatus:'DISPONIVEL',
    source:'MANUAL'
  }
} as const;
const recommendations = [
  {name:'Passe de primeira',tier:'essencial',reason:'Já possui'},
  {name:'Toque duplo',tier:'essencial',reason:'Já possui'},
  {name:'Chute de primeira',tier:'essencial',reason:'Finalização'},
  {name:'Interceptação',tier:'alternativa',reason:'Defesa'},
] as const;
const boosters = [
  {name:'Passe',tier:'ideal',attributes:[],reason:'Já possui'},
  {name:'Agilidade',tier:'ideal',attributes:[],reason:'Perfil ágil'},
] as const;
const common={
  card: card as any,
  recommendedSkills:recommendations,
  recommendedImpetos:boosters,
  skillTokens:2,
  skillCostTokens:1,
  skillCostConfirmed:true,
  boosterTokens:2,
  boosterCostTokens:2,
  inventoryConfirmed:true,
  costConfirmed:true,
  selectableCraftingName:'Agilidade',
  craftingSelectionConfirmed:true,
};
const before=JSON.stringify(card);
const valid=planSkillBoosterIntelligenceR567(common);
assert.equal(valid.canAutoApply,false);
assert.equal(valid.mode,'CONSULTIVO_SEM_GASTO');
assert.equal(valid.skillSlotsConfirmedFree,4);
assert.equal(valid.craftingSlotConfirmedFree,true,'Booster duplicate in legacy and slots must not occupy crafting.');
assert.equal(valid.skills[0].decision,'JA_POSSUI');
assert.equal(valid.skills[1].decision,'JA_POSSUI');
assert.equal(valid.skills[2].decision,'RECOMENDAR');
assert.equal(valid.skills[2].slot,'2');
assert.equal(valid.skills[3].decision,'RECOMENDAR');
assert.equal(valid.boosters[0].decision,'JA_POSSUI');
assert.equal(valid.boosters[1].decision,'RECOMENDAR');
assert.equal(JSON.stringify(card),before,'Never mutate the card.');
const unconfirmed=planSkillBoosterIntelligenceR567({...common,inventoryConfirmed:false});
assert.equal(unconfirmed.skills[2].decision,'PENDENTE');
assert.equal(unconfirmed.boosters[1].decision,'PENDENTE');
const unknownSkillCost=planSkillBoosterIntelligenceR567({...common,skillCostConfirmed:false});
assert.equal(unknownSkillCost.skills[2].decision,'PENDENTE');
const expensiveSkill=planSkillBoosterIntelligenceR567({...common,skillCostTokens:2});
assert.equal(expensiveSkill.skills[2].decision,'RECOMENDAR');
assert.equal(expensiveSkill.skills[3].decision,'PENDENTE');
const notSelectable=planSkillBoosterIntelligenceR567({...common,craftingSelectionConfirmed:false});
assert.equal(notSelectable.boosters[1].decision,'PENDENTE');
const wrongCrafting=planSkillBoosterIntelligenceR567({...common,selectableCraftingName:'Instinto artilheiro'});
assert.equal(wrongCrafting.boosters[1].decision,'PENDENTE');
const noCost=planSkillBoosterIntelligenceR567({...common,costConfirmed:false});
assert.equal(noCost.boosters[1].decision,'PENDENTE');
const tooExpensive=planSkillBoosterIntelligenceR567({...common,boosterCostTokens:3});
assert.equal(tooExpensive.boosters[1].decision,'PENDENTE');
const noSlots=planSkillBoosterIntelligenceR567({...common,card:{...card,additionalSkillSlotsR560:undefined} as any});
assert.equal(noSlots.skills[2].decision,'PENDENTE');
const ocrSlots=planSkillBoosterIntelligenceR567({...common,card:{...card,additionalSkillSlotsR560:card.additionalSkillSlotsR560.map(x=>({...x,source:'OCR'}))} as any});
assert.equal(ocrSlots.skills[2].decision,'PENDENTE');
const secondOccupied=planSkillBoosterIntelligenceR567({...common,card:{...card,boosterSlotsR560:{...card.boosterSlotsR560,secondary:{name:'Agilidade'}}} as any});
assert.equal(secondOccupied.boosters[1].decision,'JA_POSSUI');
const contradictory=planSkillBoosterIntelligenceR567({...common,card:{...card,additionalSkills:['Toque duplo','Interceptação']} as any});
assert.equal(contradictory.skills[2].decision,'PENDENTE','Contradictory legacy skills must block free slots.');
const component=readFileSync('src/components/result/SkillBoosterPlanningPanelR567.tsx','utf8');
const target=readFileSync('src/components/result/ResultEvidencePanelR561.tsx','utf8');
assert.match(component,/inventoryConfirmed/);
assert.match(component,/costConfirmed/);
assert.match(component,/skillCostConfirmed/);
assert.match(component,/craftingSelectionConfirmed/);
assert.match(target,/<SkillBoosterPlanningPanelR567/);
assert.match(target,/key=\{cardIdentityFingerprintR126/,'New card evidence must remount the local planner.');
console.log('R567 GREEN — slot safety, duplicate guards, tokens, verified cost and UI');
