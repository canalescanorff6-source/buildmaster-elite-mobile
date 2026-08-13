import assert from 'node:assert/strict';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzerDomain';
import { buildRealPerformance2027V4080R7, applyRealPerformance2027V4080R7 } from '../src/lib/realPerformance2027V4080R7';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const plan: TrainingPlan = { shooting:6, passing:6, dribbling:8, dexterity:8, lowerBodyStrength:7, aerialStrength:0, defending:2, gk1:0, gk2:0, gk3:0 };
const budget = trainingPlanTotalCost(plan);
const result = {
  objective:'COMPETITIVE', parsed:{ playerName:'SA Real 2027',cardType:'Épico',mainPosition:'SS',mainPositionPt:'SA',positions:['SS'],positionsPt:['SA'],positionRatings:{SS:100},playstyle:'Armador Criativo',offensivePlaystyle:'Armador Criativo',defensivePlaystyle:'Pressão no Ataque',defensivePlaystyleConfirmed:true,trainingPointsTotal:budget,trainingPointsUsed:budget,trainingPointSource:'OCR',condition:{},impetos:[{name:'Técnica',value:2,active:true}],nativeSkills:['Passe de primeira'],additionalSkills:[],specialSkills:[],attributes:{offensiveAwareness:88,ballControl:92,dribbling:93,tightPossession:92,lowPass:84,loftedPass:76,finishing:82,defensiveAwareness:57,defensiveEngagement:71,tackling:54,aggression:70,speed:84,acceleration:91,kickingPower:80,jump:61,physicalContact:64,balance:92,stamina:85},physicalProfile:{},manualConfirmed:false,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:20,positionRatingsCount:1,impetoSlotStatus:'OCUPADO'},internalId:'sa-real-r7',confidence:95,warnings:[] },
  bestPosition:{code:'SS',label:'SA',score:96},positionScores:[],pri:{},tacticalFit:{},training:plan,trainingCost:plan,trainingPointsUsed:budget,trainingPointsTotal:budget,trainingPointsRemaining:0,trainingCostRule:'teste',trainingComparison:[],buildVariants:[{id:'a',title:'A',training:plan,pointsUsed:budget,note:'',qualityScore:90} as any],recommendationExplanation:[],tacticalProfile:{formation:'4-3-3',style:'POSSE_DE_BOLA',connectionProfile:'VARIABLE'},teamMap:{} as any,profileTips:[],validation:{} as any,permittedPositions:[],avoidPositions:[],recommendedSkills:['Toque duplo','Controle com a sola','Passe em profundidade','Chute de primeira','Espírito guerreiro'],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[{name:'Agilidade',tier:'ideal',attributes:['Aceleração','Equilíbrio'],reason:'Resposta.',score:92,confidence:92,official:true},{name:'Passe',tier:'alternativo',attributes:['Passe rasteiro'],reason:'Passe.',score:84,confidence:88,official:true}],buildName:'r6',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{} as any,advancedTacticalFunction:{} as any,specialSkillsAnalysis:{} as any,physicalEngine:{} as any,attributeGoals:{} as any,advancedOptimizer:{} as any,correctionLimit:{} as any,marginalReturn:[],errorTolerance:{} as any,skillPriority:{} as any,
  maximumPerformanceV4080:{engineVersion:'40.80.0',mode:'DESEMPENHO_MAXIMO_STACK_FINAL',deterministic:true,selectedPosition:'SS',selectedPositionLabel:'SA',trainingSource:'ATUAL',baseTraining:plan,finalTraining:plan,exactBudget:true,candidatesEvaluated:1,baselineJointScore:88,winnerJointScore:88,jointGain:0,skillPlan:{finalSkills:[],score:0,lateBound:true,duplicatesWithOwned:0,slotsFilled:0},impeto:{slotStatus:'OCUPADO',canCraft:false,existing:['Técnica'],primary:'Técnica',candidates:[{name:'Agilidade',tier:'ideal',attributes:['Aceleração','Equilíbrio'],reason:'Resposta.',score:92,confidence:92,official:true}],bestScore:100,selectableOfficialCount:28,randomPool:{outfieldMin:14,outfieldMax:15,goalkeeper:8},policy:'preservar'},marginalAudit:[],guarantees:{gerIsNotOptimizationTarget:true,finalBuildFirst:true,finalSkillsReconciled:true,invalidImpetoSpendBlocked:true,existingImpetoPreserved:true,longitudinalWinnerProtected:false,noRandomness:true},reasons:[],summary:''},
  efootballV600:{engineVersion:'6.0.0-buildmaster-r5',season:'eFootball 2027',liveMeta:true,selectedPosition:'SS',connectionProfile:'VARIABLE',offensivePlaystyle:'Armador Criativo',defensivePlaystyle:'Pressão no Ataque',baselineTraining:plan,finalTraining:plan,exactBudget:true,candidatesEvaluated:49,baselineScore:88,winnerScore:91,gain:3,responseScore:92,manualDefenceScore:78,firstTouchScore:92,finalSkills:['Toque duplo','Controle com a sola','Passe em profundidade','Chute de primeira','Espírito guerreiro'],impetoPrimary:null,fluidFormationReady:true,overloadReady:true,previousSeasonMemoryDownweighted:true,guarantees:{doesNotClaimToFixNetwork:true,gerIsNotOptimizationTarget:true,exactPointBudget:true,onlyConfirmedDefensiveStyleWeighted:true,ownedSkillDuplicationBlocked:true,invalidImpetoSpendBlocked:true},reasons:[],summary:''}
} as unknown as AnalysisResult;

const analysis = buildRealPerformance2027V4080R7(result);
assert.equal(analysis.mode,'DESEMPENHO_REAL_2027');
assert.equal(analysis.finalSkills.length,5);
assert.equal(new Set(analysis.finalSkills).size,5);
assert.ok(!analysis.finalSkills.includes('Passe de primeira'));
assert.ok(analysis.skillMarginal.length >= 5);
assert.ok(analysis.skillMarginal.every((item)=>item.marginalGain>=0 && item.marginalGain<=100));
assert.equal(analysis.impetoPolicy.decision,'MANTER');
assert.equal(analysis.impetoPolicy.current,'Técnica');
assert.equal(analysis.impetoPolicy.ideal,'Agilidade');
assert.equal(analysis.learning.legacyMatchWeight,0.35);
assert.equal(analysis.learning.minimumAbMatchesPerArm,5);
assert.equal(analysis.guarantees.networkIsNotModified,true);
const applied=applyRealPerformance2027V4080R7(result);
assert.match(applied.buildName,/Desempenho Real 2027/);
assert.equal(trainingPlanTotalCost(applied.training),budget);
console.log(`r7 aprovada: ${analysis.finalSkills.join(', ')}; Ímpeto ${analysis.impetoPolicy.decision}; fases ${analysis.phaseProfile.attackWeight}/${analysis.phaseProfile.defenceWeight}.`);
