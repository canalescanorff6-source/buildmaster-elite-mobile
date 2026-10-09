import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { applyAutonomousRoleSeedR417 } from '../src/lib/autonomousCardR417';
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

const requested=resultFor({main:'LWF',best:'SS',attrs:cfAttrs});
requested.parsed.positions.push('SS');requested.requestedUsagePosition='SS';
assert.equal(applyAutonomousRoleSeedR417(requested).bestPosition.code,'SS','A escolha de segundo atacante precisa sobreviver à sugestão automática.');
const full={...cfAttrs,goalkeeperAwareness:40,goalkeeperCatching:40,goalkeeperParrying:40,goalkeeperReflexes:40,goalkeeperReach:40};
const saturated=applyCleanSlatePerformance2027R119(resultFor({name:'Velocidade já completa',attrs:{...full,speed:99,kickingPower:99,stamina:99,lowPass:70,ballControl:74,tightPossession:74}})) as any;
assert.equal(saturated.training.lowerBodyStrength,0,'A categoria totalmente saturada não deve receber pontos por bônus de identidade.');
const slow=applyCleanSlatePerformance2027R119(resultFor({name:'Velocidade carente',attrs:{...full,speed:68,kickingPower:75,stamina:70,lowPass:70,ballControl:74,tightPossession:74}})) as any;
assert.ok(slow.training.lowerBodyStrength>saturated.training.lowerBodyStrength,'O ganho depende da necessidade, mesmo com os mesmos PP.');
assert.equal(trainingPlanTotalCost(saturated.training),32);
assert.equal(trainingPlanTotalCost(slow.training),32);
console.log('Card needs: useful progress, saturation and budget PASS');
