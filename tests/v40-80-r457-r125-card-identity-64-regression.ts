import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor({
  name='Carta r125', overall=105, main='CF', best=main, style='Artilheiro', defensive='Básico', defensiveConfirmed=true, native=[] as string[], attrs
}: {
  name?: string; overall?: number; main?: string; best?: string; style?: string; defensive?: string; defensiveConfirmed?: boolean; native?: string[]; attrs: Record<string,number>;
}) {
  const parsed:any={
    playerName:name,cardType:'Epic',mainPosition:main,mainPositionPt:main,positions:[main],positionsPt:[main],positionRatings:{[main]:100},
    playstyle:style,offensivePlaystyle:style,defensivePlaystyle:defensive,defensivePlaystyleConfirmed:defensiveConfirmed,dominantFoot:'Direito',
    overall,maxOverall:overall,height:180,weight:78,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:native,additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`r125-${name}`,confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:best,label:best,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const cfAttrs:any={
  offensiveAwareness:91,ballControl:87,dribbling:84,tightPossession:82,lowPass:72,loftedPass:68,finishing:91,heading:80,placeKicking:73,curl:76,
  defensiveAwareness:46,defensiveEngagement:48,tackling:45,aggression:70,speed:86,acceleration:88,kickingPower:88,jump:78,physicalContact:82,balance:83,stamina:79
};
const naturalCF:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,native:['Finalização de primeira','Cabeçada']}));
const sameCardCB:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,best:'CB',native:['Finalização de primeira','Cabeçada']}));
const sameCardHighOverall:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,overall:118,native:['Finalização de primeira','Cabeçada']}));

assert.ok(Number(naturalCF.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=125,'R125: a autoridade Clean Slate não pode regredir abaixo da revisão card-specific.');
assert.equal(naturalCF.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(trainingPlanTotalCost(naturalCF.training),64);
assert.equal(trainingPlanTotalCost(sameCardCB.training),64);
assert.equal(naturalCF.cleanSlate2027R119.cardKey,sameCardCB.cleanSlate2027R119.cardKey,'A identidade da carta não muda por posição de uso.');
assert.equal(naturalCF.cleanSlate2027R119.positionAnchor,'CF');
assert.equal(sameCardCB.cleanSlate2027R119.positionAnchor,'CF');
assert.equal(naturalCF.cleanSlate2027R119.usagePosition,'CF');
assert.equal(sameCardCB.cleanSlate2027R119.usagePosition,'CB');
assert.equal(sameCardCB.cleanSlate2027R119.usagePositionChanged,true);
assert.deepEqual(sameCardCB.training,naturalCF.training,'Uma mudança real CF→CB deve alterar o contexto de uso sem recriar a progressão permanente da mesma carta.');
assert.equal(sameCardCB.cleanSlate2027R119.positionStabilityR184?.decision,'NATURAL_ANCHOR','A autoridade permanente deve continuar ancorada na posição natural da carta.');
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.offensive.status,'LIKELY_INACTIVE');
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.offensive.activeWeight,0);
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.neutralRoleMode,true,'Estilo ofensivo cinza/inativo deve liberar cálculo neutro por função.');
assert.deepEqual(sameCardHighOverall.training,naturalCF.training,'Overall/GER continua proibido de decidir a ficha.');
assert.equal(naturalCF.cleanSlate2027R119.guards.usagePositionAffectsBuildNotCardIdentity,true);
assert.equal(naturalCF.cleanSlate2027R119.guards.inactivePlaystyleDoesNotForceRecipe,true);
assert.equal(naturalCF.cleanSlate2027R119.guards.actionAttributesHaveFunctionalWeights,true);
console.log("R125-SPLIT-A PASS");
