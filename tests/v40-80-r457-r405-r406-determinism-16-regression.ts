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
    overall,maxOverall:overall,height:180,weight:78,trainingPointsTotal:16,condition:{},impetos:[],nativeSkills:native,additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`r125-${name}`,confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:best,label:best,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:16,trainingPointsRemaining:16,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const cfAttrs:any={
  offensiveAwareness:91,ballControl:87,dribbling:84,tightPossession:82,lowPass:72,loftedPass:68,finishing:91,heading:80,placeKicking:73,curl:76,
  defensiveAwareness:46,defensiveEngagement:48,tackling:45,aggression:70,speed:86,acceleration:88,kickingPower:88,jump:78,physicalContact:82,balance:83,stamina:79
};
const r404SameStyleArchetypes:any[]=[
  {...cfAttrs,ballControl:96,dribbling:96,tightPossession:95,balance:94,heading:63,jump:65,physicalContact:68,speed:83,acceleration:86,finishing:86},
  {...cfAttrs,offensiveAwareness:96,speed:96,acceleration:97,balance:84,ballControl:84,dribbling:80,tightPossession:79,heading:66,jump:70,physicalContact:72},
  {...cfAttrs,offensiveAwareness:95,finishing:97,kickingPower:96,curl:91,ballControl:84,dribbling:78,tightPossession:77,speed:82,acceleration:83,heading:70},
  {...cfAttrs,heading:97,jump:96,physicalContact:97,finishing:91,kickingPower:91,balance:86,ballControl:77,dribbling:70,tightPossession:69,speed:78,acceleration:76},
  {...cfAttrs,lowPass:94,loftedPass:91,ballControl:94,tightPossession:93,dribbling:89,balance:90,finishing:82,kickingPower:82,speed:80,acceleration:82,heading:65}
];
const base0:any=applyCleanSlatePerformance2027R119(resultFor({name:'R405 base0',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
const repeat0:any=applyCleanSlatePerformance2027R119(resultFor({name:'R405 repeat0',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
assert.deepEqual(repeat0.training,base0.training,'R405: mesma evidência deve produzir a mesma ficha sem aleatoriedade.');
assert.ok(base0.cleanSlate2027R119.pointRationale.every((x:any)=>Number.isFinite(x.returnPerCost)));
const base3:any=applyCleanSlatePerformance2027R119(resultFor({name:'R406 base3',attrs:r404SameStyleArchetypes[3],style:'Artilheiro',native:[]}));
const repeat3:any=applyCleanSlatePerformance2027R119(resultFor({name:'R406 repeat3',attrs:r404SameStyleArchetypes[3],style:'Artilheiro',native:[]}));
assert.deepEqual(repeat3.training,base3.training,'R406: frontier Pareto precisa ser determinística.');
assert.equal(base3.cleanSlate2027R119.guards.exactBudget,true);
assert.ok(Number(base3.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=406);
console.log('R405-R406 determinismo/Pareto PASS');
