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
const sameAttrsPoacher:any=applyCleanSlatePerformance2027R119(resultFor({name:'Mesmo DNA Artilheiro',attrs:cfAttrs,style:'Artilheiro'}));
const sameAttrsPivot:any=applyCleanSlatePerformance2027R119(resultFor({name:'Mesmo DNA Pivô',attrs:cfAttrs,style:'Pivô'}));
const poacherAttack=sameAttrsPoacher.cleanSlate2027R119.actions.find((x:any)=>x.id==='attack_space');
const pivotAttack=sameAttrsPivot.cleanSlate2027R119.actions.find((x:any)=>x.id==='attack_space');
const poacherHold=sameAttrsPoacher.cleanSlate2027R119.actions.find((x:any)=>x.id==='hold_up');
const pivotHold=sameAttrsPivot.cleanSlate2027R119.actions.find((x:any)=>x.id==='hold_up');
assert.ok(poacherAttack && pivotAttack && poacherAttack.frequency > pivotAttack.frequency,'Artilheiro deve reforçar ataque ao espaço mais que Pivô com a mesma carta-base.');
assert.ok(poacherHold && pivotHold && pivotHold.frequency > poacherHold.frequency,'Pivô deve reforçar proteção/apoio mais que Artilheiro com a mesma carta-base.');

const provisionalDefensive:any=applyCleanSlatePerformance2027R119(resultFor({name:'ZAG estilo defensivo provisório',main:'CB',best:'CB',style:'Defensor Criativo',defensive:'Destruidor',defensiveConfirmed:false,attrs:{...cfAttrs,defensiveAwareness:90,defensiveEngagement:90,tackling:90,aggression:90}}));
assert.equal(provisionalDefensive.cleanSlate2027R119.playstyleContext.defensive.activeWeight,0,'Estilo defensivo provisório não pode influenciar a ficha até confirmação.');
assert.match(provisionalDefensive.cleanSlate2027R119.playstyleContext.note,/provisório.*peso zero/i);
console.log("R125-SPLIT-B PASS");
