/** R561 Items 2+3: evidence-proof UI state/projection and component wiring. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCardSlotsViewR561, buildManagerAttributeViewR561 } from '../src/lib/cardVisualEvidenceR561';
import { getManager } from '../src/lib/managers';
import { emptyTraining } from '../src/lib/trainingPlanCore';
import { TRAINING_ATTRIBUTE_GROUPS_R504 } from '../src/modules/analysis/projectedPlayerStateR504';
import type { AnalysisResult, AttributeKey, ParsedCard } from '../src/lib/analyzerDomain';

const asParsed = (input: Partial<ParsedCard>) => input as ParsedCard;
const empty = asParsed({ impetos: [], additionalSkills: [], attributes: {} });
let display = buildCardSlotsViewR561(empty);
assert.equal(display.skills.length, 5);
assert.equal(display.boosters.length, 2);
assert.equal(display.pending, 7, 'Missing OCR fields must remain pending');

display = buildCardSlotsViewR561(asParsed({
  impetos: [{name:'Velocidade', active:true}], additionalSkills:['Toque Duplo'],
  additionalSkillSlotsR560: [
    {slot:1,skill:'Chute de Primeira',source:'OCR'},
    {slot:2,skill:null,source:'MANUAL'},
    {slot:3,skill:'Interceptação'}
  ],
  boosterSlotsR560:{primary:{name:'Equilíbrio'},secondary:null,secondaryStatus:'DISPONIVEL',source:'OCR'}
}));
assert.equal(display.skills[0].status,'CONFIRMADO');
assert.equal(display.skills[1].status,'LIVRE_CONFIRMADA');
assert.equal(display.skills[2].status,'REGISTRADO');
assert.equal(display.skills[3].status,'PENDENTE');
assert.equal(display.boosters[0].status,'CONFIRMADO');
assert.equal(display.boosters[1].status,'LIVRE_CONFIRMADA');

const legacy = buildCardSlotsViewR561(asParsed({
  manualConfirmed: true, additionalSkills:['Toque Duplo'], impetos:[{name:'Pé quente'}]
}));
assert.equal(legacy.skills[0].status, 'REGISTRADO', 'ManualConfirmed is not per-slot evidence');
assert.equal(legacy.boosters[0].status, 'REGISTRADO', 'Legacy impetos do not confirm per-slot source');

const manager = getManager('r-rodriguez-posse-88-2026-10-01');
assert.ok(manager);
const parsed = asParsed({
  attributes: {tightPossession: 83, balance: 85},
  evidence: {attributeCount: 2, positionLocked:true,playstyleLocked:true,positionRatingsCount:0},
  manualConfirmed: true
});
const testResult = { parsed, training: emptyTraining() } as AnalysisResult;
const noSource = buildManagerAttributeViewR561(testResult, manager);
assert.ok(noSource);
assert.equal(noSource.status, 'PENDENTE', 'Even confirmed OCR/manual fields are not proven pre-manager');
assert.ok(noSource.rows.every((row)=>row.base===null&&row.projected===null));
assert.equal(parsed.attributes.tightPossession,83,'Original read is immutable');
assert.equal(buildManagerAttributeViewR561(testResult,null),null);

const attributeKeys = Array.from(new Set(Object.values(TRAINING_ATTRIBUTE_GROUPS_R504).flat())) as AttributeKey[];
const verified = asParsed({
  ...parsed,
  editionIdentity: {schemaVersion:1,source:'MASTER_CATALOG',confidence:100,officialCardId:'CARD-100',officialCardIdVerified:true},
  trainingBase: {cardId:'CARD-100',sources:['https://example.org/verified'],attributes:Object.fromEntries(attributeKeys.map(key=>[key,75]))},
});
const trustedResult = {parsed:verified,training:{...emptyTraining(),dribbling:2,dexterity:3}} as AnalysisResult;
const applied = buildManagerAttributeViewR561(trustedResult, manager);
assert.equal(applied?.status, 'APLICADO');
assert.deepEqual(applied?.rows.map(row=>row.base), [77,78]);
assert.deepEqual(applied?.rows.map(row=>row.projected),[78,79]);
assert.equal(verified.attributes.tightPossession,83, 'Projection must not mutate print');
verified.editionIdentity!.officialCardIdVerified = false;
assert.equal(buildManagerAttributeViewR561(trustedResult, manager)?.status, 'PENDENTE', 'Unverified catalog cannot enable the projection');

const playerUi = readFileSync(resolve(__dirname,'../src/modules/players/PlayerLaboratory.tsx'),'utf8');
const resultUi = readFileSync(resolve(__dirname,'../src/components/result/ResultWorkspace.tsx'),'utf8');
const app = readFileSync(resolve(__dirname,'../src/components/CardVisionApp.tsx'),'utf8');
assert.match(playerUi,/<CardEvidenceSlotsR561 parsed=\{player\.result\.parsed\} compact/);
assert.match(resultUi,/<ManagerAttributePanelR561 result=\{result\} selectedManager=\{selectedManager\}/);
assert.match(resultUi,/<CardEvidenceSlotsR561 parsed=\{card\}/);
assert.match(app,/<ResultCard result=\{result\} selectedManager=\{selectedManager\}/);
console.log('R561 Items 2+3: evidence slots, verified-only manager bonus, no mutation and UI wiring GREEN');
