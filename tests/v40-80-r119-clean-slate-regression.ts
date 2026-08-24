import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});
function card(name:string,attrs:any,style='Homem de área',specialSkills:string[]=[]){
  const parsed:any={playerName:name,cardType:'Epic',mainPosition:'CF',mainPositionPt:'CA',positions:['CF'],positionsPt:['CA'],positionRatings:{CF:100},playstyle:style,offensivePlaystyle:style,defensivePlaystyle:null,dominantFoot:'Direito',overall:105,maxOverall:105,height:182,weight:80,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:['Chute de primeira'],additionalSkills:[],specialSkills,attributes:attrs,physicalProfile:{},manualConfirmed:true,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.97,impetoSlotStatus:'DISPONIVEL'},internalId:name,confidence:.97,warnings:[]};
  return {parsed,bestPosition:{code:'CF',label:'CA',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}} as any;
}
const technical=card('Tecnico CF',{offensiveAwareness:92,finishing:92,ballControl:90,dribbling:88,tightPossession:89,acceleration:88,balance:90,speed:84,kickingPower:89,heading:72,jump:73,physicalContact:77,stamina:82,lowPass:78,loftedPass:70,curl:86,placeKicking:75});
const aerial=card('Aereo CF',{offensiveAwareness:91,finishing:89,ballControl:79,dribbling:72,tightPossession:73,acceleration:80,balance:78,speed:80,kickingPower:87,heading:91,jump:92,physicalContact:90,stamina:83,lowPass:70,loftedPass:68,curl:76,placeKicking:72},'Homem de área',['Fortaleza aérea','Cabeçada fulminante']);
const a:any=applyCleanSlatePerformance2027R119(technical);
const b:any=applyCleanSlatePerformance2027R119(aerial);
assert.equal(trainingPlanTotalCost(a.training),64);
assert.equal(trainingPlanTotalCost(b.training),64);
assert.equal(a.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(a.cleanSlate2027R119.guards.ignoresIncomingTraining,true);
assert.ok(a.training.aerialStrength < 12,'Homem de área técnico não pode receber bola aérea +12 por receita.');
assert.ok(b.training.aerialStrength > a.training.aerialStrength,'A carta realmente aérea deve justificar mais investimento aéreo.');
assert.equal(a.recommendedSkills.length,5);
assert.equal(new Set(a.recommendedSkills).size,5);
const polluted={...technical,training:{...zero(),shooting:8,dexterity:8,lowerBodyStrength:8,aerialStrength:12},parsed:{...technical.parsed,overall:110,maxOverall:110}};
const pollutedResult:any=applyCleanSlatePerformance2027R119(polluted as any,technical.parsed);
assert.deepEqual(pollutedResult.training,a.training,'Ficha recebida/overall não podem semear o Clean Slate.');
console.log('r119 aprovada: snapshot cru, orçamento exato, anti-receita, DNA aéreo real e Top 5 independente.');
