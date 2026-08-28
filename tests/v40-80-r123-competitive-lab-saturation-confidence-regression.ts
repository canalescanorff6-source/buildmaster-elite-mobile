import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { buildRealGameplayValidationV4050 } from '../src/lib/realGameplayValidationV4050';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function baseResult({overall=105, withMatchEvidence=false}:{overall?:number;withMatchEvidence?:boolean}={}) {
  const attrs:any={
    offensiveAwareness:88,ballControl:94,dribbling:94,tightPossession:93,lowPass:88,loftedPass:82,finishing:83,heading:60,placeKicking:83,curl:90,
    defensiveAwareness:52,defensiveEngagement:54,tackling:50,aggression:58,speed:87,acceleration:92,kickingPower:84,jump:64,physicalContact:66,balance:94,stamina:82
  };
  const parsed:any={
    playerName:'Carta de teste r123',cardType:'Epic',mainPosition:'AMF',mainPositionPt:'MAT',positions:['AMF'],positionsPt:['MAT'],positionRatings:{AMF:100},
    playstyle:'Jogador de infiltração',offensivePlaystyle:'Jogador de infiltração',defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:true,dominantFoot:'Direito',
    overall,maxOverall:overall,height:178,weight:74,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:['Toque duplo','Passe de primeira'],additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`r123-${overall}`,confidence:.98,warnings:[]
  };
  const result:any={
    objective:'COMPETITIVE',parsed,bestPosition:{code:'AMF',label:'MAT',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  };
  if(withMatchEvidence) result.gameplayValidationMemoryV4050={engineVersion:'40.50.0',applied:true,winnerId:'X',winnerLabel:'X',confidenceScore:88,rawMatches:10,effectiveMatches:7,verifiedAt:'2026-08-27T00:00:00Z'};
  return result;
}

const baseline:any=applyCleanSlatePerformance2027R119(baseResult());
const highOverall:any=applyCleanSlatePerformance2027R119(baseResult({overall:115}));
const evidenced:any=applyCleanSlatePerformance2027R119(baseResult({withMatchEvidence:true}));
const clean=baseline.cleanSlate2027R119;

assert.match(clean.version,/r123-competitive-lab-saturation-confidence/);
assert.equal(clean.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(trainingPlanTotalCost(baseline.training),64);
assert.deepEqual(highOverall.training,baseline.training,'Overall não pode alterar a ficha r123.');

assert.ok(clean.decisionConfidence.score>0 && clean.decisionConfidence.score<=100);
assert.ok(['ALTA','MODERADA','BAIXA'].includes(clean.decisionConfidence.level));
assert.ok(clean.decisionConfidence.attributeCoverage>0);
assert.ok(evidenced.cleanSlate2027R119.decisionConfidence.realMatchEvidence>clean.decisionConfidence.realMatchEvidence,'Evidência real pode elevar apenas a confiança, não criar uma receita.');
assert.deepEqual(evidenced.training,baseline.training,'Memória de gameplay não pode sobrescrever a autoridade r123 automaticamente.');

assert.ok(clean.saturationProfile.length>0,'r123 precisa auditar saturação dos grupos usados.');
assert.ok(clean.saturationProfile.every((item:any)=>baseline.training[item.training]>0));
assert.ok(clean.saturationProfile.every((item:any)=>['EFICIENTE','ATENCAO','SATURADO'].includes(item.status)));
assert.equal(clean.guards.saturationAudited,true);

assert.equal(clean.competitiveLab.mode,'READ_ONLY_AB');
assert.equal(clean.competitiveLab.safeguards.readOnly,true);
assert.equal(clean.competitiveLab.safeguards.neverAutoPromotes,true);
assert.deepEqual(clean.competitiveLab.arms[0].training,baseline.training,'Braço A deve ser exatamente a ficha final.');
assert.equal(trainingPlanTotalCost(clean.competitiveLab.arms[0].training),64);
if(clean.competitiveLab.arms[1]) {
  assert.equal(trainingPlanTotalCost(clean.competitiveLab.arms[1].training),64);
  assert.ok(clean.competitiveLab.arms[1].distanceFromPrimary>=2);
}

const lab=buildRealGameplayValidationV4050(baseline,[]);
assert.equal(lab.arms[0]?.id,'CLEAN_SLATE_R123_A','Laboratório real deve usar a ficha Clean Slate atual, não alternativas históricas.');
if(clean.competitiveLab.arms[1]) assert.equal(lab.arms[1]?.id,'CLEAN_SLATE_R123_B');
assert.equal(lab.guarantees.singleMatchNeverChangesBuild,true);

console.log('r123 aprovada: confiança separada, saturação local auditável e laboratório A/B Clean Slate somente leitura.');
