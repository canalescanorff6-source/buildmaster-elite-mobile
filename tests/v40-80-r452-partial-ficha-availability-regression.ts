import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119, CLEAN_SLATE_2027_R119_VERSION } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});
assert.equal(CLEAN_SLATE_2027_R119_VERSION,'40.80-r551-card-needs-v1','A mudança semântica no mínimo de evidência precisa de versão própria para invalidar receitas antigas.');
function input(attrs:any){const parsed:any={playerName:'Jogador R452',cardType:'Epic',mainPosition:'CF',mainPositionPt:'CA',positions:['CF'],positionsPt:['CA'],positionRatings:{CF:100},playstyle:null,offensivePlaystyle:null,defensivePlaystyle:null,dominantFoot:'Direito',overall:null,maxOverall:null,height:null,weight:null,trainingPointsTotal:56,condition:{},impetos:[],nativeSkills:[],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,evidence:{positionLocked:true,playstyleLocked:false,attributeCount:0,positionRatingsCount:1,skillConfidence:.2,impetoSlotStatus:'DESCONHECIDO'},internalId:'r452-56',confidence:.58,warnings:['OCR parcial']};return {parsed,bestPosition:{code:'CF',label:'CA',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,trainingPointsTotal:56,trainingPointsRemaining:56,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'review',confirmed:true,canGenerate:true,issues:[]},permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}} as any;}
const usefulAttributes={offensiveAwareness:90,finishing:92,speed:87,acceleration:86,ballControl:85,dribbling:84,tightPossession:85,lowPass:75,balance:83,stamina:80};
for(const attrs of [{},{speed:87},Object.fromEntries(Object.entries(usefulAttributes).slice(0,9))]){
  const r:any=applyCleanSlatePerformance2027R119(input(attrs));
  assert.equal(r.cleanSlate2027R119.status,'BLOCKED_INSUFFICIENT_DATA','Identidade e PP não autorizam uma receita sem os 10 atributos críticos reais.');
  assert.deepEqual(r.training,zero());
  assert.equal(r.trainingPointsUsed,0);
  assert.equal(r.trainingPointsRemaining,56);
  assert.equal(r.cleanSlate2027R119.optimalityCertificateR457.status,'NOT_RUN');
  assert.ok(r.cleanSlate2027R119.reasons.some((reason:string)=>/atributos/i.test(reason)));
}
const inflated=input({});
inflated.parsed.evidence.attributeCount=26;
const inflatedResult:any=applyCleanSlatePerformance2027R119(inflated);
assert.equal(inflatedResult.cleanSlate2027R119.status,'BLOCKED_INSUFFICIENT_DATA','Contagem declarada não substitui os valores dos atributos.');
assert.equal(inflatedResult.trainingPointsUsed,0);

const useful:any=applyCleanSlatePerformance2027R119(input(usefulAttributes));
assert.equal(useful.cleanSlate2027R119.status,'READY');
assert.equal(trainingPlanTotalCost(useful.training),56);
assert.equal(useful.trainingPointsUsed,56);
assert.equal(useful.trainingPointsRemaining,0);
assert.equal(useful.cleanSlate2027R119.cardTruthCertificationR501.canFinalize,false,'Uma carta útil ainda pode permanecer provisória.');
assert.ok(useful.cleanSlate2027R119.reasons.some((reason:string)=>/R452: ficha provisória/i.test(reason)),'Cobertura útil abaixo de 26 deve conservar a etiqueta de ficha provisória.');

const gkAttributes={goalkeeperAwareness:88,goalkeeperCatching:86,goalkeeperParrying:87,goalkeeperReflexes:90};
for(const count of [3,4]){
  const gk=input(Object.fromEntries(Object.entries(gkAttributes).slice(0,count)));
  gk.parsed.mainPosition='GK';gk.parsed.positions=['GK'];gk.bestPosition.code='GK';
  const r:any=applyCleanSlatePerformance2027R119(gk);
  assert.equal(r.cleanSlate2027R119.status,count===4?'READY':'BLOCKED_INSUFFICIENT_DATA','Goleiro preserva o mínimo canônico de 4 atributos críticos reais.');
  assert.equal(r.trainingPointsUsed,count===4?56:0);
}
console.log('R452 aprovada: atributos insuficientes preservam prévia sem receita; cobertura mínima real permite progressão provisória.');
