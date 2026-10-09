import {referenceBaseAgreesWithPrint} from '../src/modules/card-catalog/readerCardEdition';
import references from '../src/data/cardEditionReferences.json';
import {deriveProjectedPlayerStateR504} from '../src/modules/analysis/projectedPlayerStateR504';
import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { cardEvidenceFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { productionOutputFingerprintR128 } from '../src/lib/productionAuthorityR128';


const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor({
  name='Carta r125', overall=105, main='CF', best=main, style='Artilheiro', defensive='Básico', defensiveConfirmed=true, native=[] as string[], attrs
}: {
  name?: string; overall?: number; main?: string; best?: string; style?: string; defensive?: string; defensiveConfirmed?: boolean; native?: string[]; attrs: Record<string,number>;
}) {
  const parsed:any={
    playerName:name,cardType:'Epic',mainPosition:main,mainPositionPt:main,positions:[main],positionsPt:[main],positionRatings:{[main]:100},
    playstyle:style,offensivePlaystyle:style,defensivePlaystyle:defensive,defensivePlaystyleConfirmed:defensiveConfirmed,dominantFoot:'Direito',
    overall,maxOverall:overall,height:180,weight:78,trainingPointsTotal:32,condition:{},impetos:[],nativeSkills:native,additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`r125-${name}`,confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:best,label:best,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:32,trainingPointsRemaining:32,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const cfAttrs:any={
  offensiveAwareness:91,ballControl:87,dribbling:84,tightPossession:82,lowPass:72,loftedPass:68,finishing:91,heading:80,placeKicking:73,curl:76,
  defensiveAwareness:46,defensiveEngagement:48,tackling:45,aggression:70,speed:86,acceleration:88,kickingPower:88,jump:78,physicalContact:82,balance:83,stamina:79
};


const display={...cfAttrs,goalkeeperAwareness:40,goalkeeperCatching:40,goalkeeperParrying:40,goalkeeperReflexes:40,goalkeeperReach:40};
const input=resultFor({attrs:display});input.trainingPointsTotal=0;input.parsed.trainingPointsTotal=0;
input.parsed.editionIdentity={schemaVersion:1,officialCardId:'verified-fixture',officialCardIdVerified:true,source:'MASTER_CATALOG',confidence:99};
input.parsed.trainingBase={cardId:'verified-fixture',attributes:{...display,speed:70},fixedBonus:{speed:3},sources:['https://example.com/verified-fixture']};
const blocked=applyCleanSlatePerformance2027R119(input);
assert.deepEqual(blocked.parsed.attributes,display,'A prévia bloqueada precisa preservar os valores realmente lidos.');
const original=cardEvidenceFingerprintR126(input.parsed);const output=productionOutputFingerprintR128(input);
input.parsed.trainingBase.attributes.speed=71;
assert.notEqual(cardEvidenceFingerprintR126(input.parsed),original,'Base alterada deve invalidar a evidência de treino.');
assert.notEqual(productionOutputFingerprintR128(input),output,'Base alterada deve invalidar o selo final.');
const beforeBonus=cardEvidenceFingerprintR126(input.parsed);input.parsed.trainingBase.fixedBonus.speed=4;
assert.notEqual(cardEvidenceFingerprintR126(input.parsed),beforeBonus,'Bônus fixo alterado precisa invalidar a evidência.');
const beforeRole=productionOutputFingerprintR128(input);input.requestedUsagePosition='SS';
assert.notEqual(productionOutputFingerprintR128(input),beforeRole,'Uma escolha de função nova precisa invalidar a ficha antiga.');
console.log('Training base: blocked preview preserves print; input changes invalidate evidence/seal PASS');

// Progression groups from the published simulator: GK1 awareness/jump,
// GK2 parrying/reach, GK3 catching/reflexes. Jump also gains aerial training.
const keeper:any={attributes:{goalkeeperAwareness:70,goalkeeperCatching:70,goalkeeperParrying:70,goalkeeperReflexes:70,goalkeeperReach:70,jump:60,heading:60,physicalContact:60}};
const projected=deriveProjectedPlayerStateR504(keeper,{...zero(),gk1:2,gk2:3,gk3:4,aerialStrength:1});
assert.equal(projected.finalAttributes.goalkeeperAwareness,72);
assert.equal(projected.finalAttributes.goalkeeperCatching,74);
assert.equal(projected.finalAttributes.goalkeeperParrying,73);
assert.equal(projected.finalAttributes.goalkeeperReflexes,74);
assert.equal(projected.finalAttributes.goalkeeperReach,73);
assert.equal(projected.finalAttributes.jump,63);
assert.equal(projected.finalAttributes.heading,61);
console.log('Goalkeeper progression and shared jump gains PASS');

const ref=references.cards.find(c=>c.capture==='001')!;
const reference:any={cardId:ref.id,attributes:ref.baseAttributes,fixedBonus:ref.fixedBonus,sources:ref.sources};
const unchanged=Object.fromEntries(Object.entries(reference.attributes).map(([key,value])=>[key,String(Number(value)+Number(reference.fixedBonus?.[key]??0))]));
assert.ok(referenceBaseAgreesWithPrint(reference,unchanged));
assert.equal(referenceBaseAgreesWithPrint(reference,{...unchanged,jump:String(Number(unchanged.jump)+20)}),false,'Jump cannot gain without aerial or GK1 progress.');
console.log('Shared jump base validation rejects impossible evidence PASS');
