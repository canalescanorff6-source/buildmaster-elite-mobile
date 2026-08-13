import assert from 'node:assert/strict';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzerDomain';
import { buildMetaVivo2027V4080R8, applyMetaVivo2027V4080R8 } from '../src/lib/metaVivo2027V4080R8';
import { buildV600LiveCatalogSnapshot } from '../src/lib/efootballV600LiveCatalog';
import { deriveCompactDefenseV600, createFluidFormationPlanV600 } from '../src/lib/fluidFormationV600';
import { evaluateFluidFormationMetaV600 } from '../src/lib/fluidFormationMetaV600';
import { getFormationBlueprint } from '../src/lib/formationRoleEngine';

const plan:TrainingPlan={shooting:6,passing:6,dribbling:8,dexterity:8,lowerBodyStrength:7,aerialStrength:0,defending:2,gk1:0,gk2:0,gk3:0};
const fixture={
  objective:'COMPETITIVE',
  parsed:{playerName:'SA Meta Vivo',cardType:'Épico',mainPosition:'SS',mainPositionPt:'SA',positions:['SS'],positionsPt:['SA'],positionRatings:{SS:100},playstyle:'Armador Criativo',offensivePlaystyle:'Armador Criativo',defensivePlaystyle:'Pressão no Ataque',defensivePlaystyleConfirmed:true,condition:{},impetos:[{name:'Técnica',active:true}],nativeSkills:['Passe de primeira','Interceptação'],additionalSkills:[],specialSkills:[],attributes:{offensiveAwareness:89,ballControl:93,dribbling:94,tightPossession:93,lowPass:86,loftedPass:78,finishing:83,defensiveAwareness:61,defensiveEngagement:74,tackling:58,aggression:73,speed:85,acceleration:92,kickingPower:81,jump:62,physicalContact:65,balance:93,stamina:86},physicalProfile:{},manualConfirmed:false,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:20,positionRatingsCount:1,impetoSlotStatus:'OCUPADO'},internalId:'meta-vivo-r8',confidence:96,warnings:[]},
  bestPosition:{code:'SS',label:'SA',score:97},positionScores:[],pri:{},tacticalFit:{},training:plan,trainingCost:plan,trainingPointsUsed:50,trainingPointsTotal:50,trainingPointsRemaining:0,trainingCostRule:'teste',trainingComparison:[],buildVariants:[{id:'a',kind:'recommended',title:'A',positionLabel:'SA',training:plan,pointsUsed:50,note:'',qualityScore:92} as any],recommendationExplanation:[],tacticalProfile:{formation:'4-3-3',style:'POSSE_DE_BOLA',connectionProfile:'VARIABLE'},teamMap:{attackingJob:'aproximação e tabela',defensiveJob:'fechar passe interior',functionLabel:'SA',tacticalIdentity:'',buildupJob:'',pressingJob:'',idealPartners:[],riskAlerts:[],matchPlan:[],sectorScores:{marcacao:70,cobertura:72,saidaDeBola:88,passe:89,criacao:92,aceleracao:92,finalizacao:84,jogoAereo:55,fisico:66},coachFit:''},profileTips:[],validation:{} as any,permittedPositions:[],avoidPositions:[],recommendedSkills:['Toque duplo','Controle com a sola','Passe em profundidade','Chute de primeira','Espírito guerreiro'],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[{name:'Agilidade',tier:'ideal',attributes:['Aceleração','Equilíbrio'],reason:'Resposta.',score:91}],buildName:'r7',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{} as any,advancedTacticalFunction:{} as any,specialSkillsAnalysis:{} as any,physicalEngine:{} as any,attributeGoals:{} as any,advancedOptimizer:{} as any,correctionLimit:{} as any,marginalReturn:[],errorTolerance:{} as any,skillPriority:{} as any,
  efootballV600:{engineVersion:'6.0.0-buildmaster-r5',season:'eFootball 2027',liveMeta:true,selectedPosition:'SS',connectionProfile:'VARIABLE',offensivePlaystyle:'Armador Criativo',defensivePlaystyle:'Pressão no Ataque',baselineTraining:plan,finalTraining:plan,exactBudget:true,candidatesEvaluated:49,baselineScore:88,winnerScore:92,gain:4,responseScore:93,manualDefenceScore:82,firstTouchScore:94,finalSkills:['Toque duplo','Controle com a sola','Passe em profundidade','Chute de primeira','Espírito guerreiro'],impetoPrimary:null,fluidFormationReady:true,overloadReady:true,previousSeasonMemoryDownweighted:true,guarantees:{doesNotClaimToFixNetwork:true,gerIsNotOptimizationTarget:true,exactPointBudget:true,onlyConfirmedDefensiveStyleWeighted:true,ownedSkillDuplicationBlocked:true,invalidImpetoSpendBlocked:true},reasons:[],summary:''},
  realPerformance2027V4080R7:{engineVersion:'40.80-r7-real-performance-2027',mode:'DESEMPENHO_REAL_2027',selectedPosition:'SS',connectionProfile:'VARIABLE',phaseProfile:{attackRole:'tabela e infiltração',defenceRole:'fechar corredor interior',attackWeight:80,defenceWeight:20,phaseBalanceScore:88},skillMarginal:[{name:'Toque duplo',category:'drible',marginalGain:94,attackGain:86,defenceGain:20,delayResilience:88,dnaGain:98,reason:''},{name:'Controle com a sola',category:'drible',marginalGain:92,attackGain:84,defenceGain:22,delayResilience:91,dnaGain:97,reason:''},{name:'Passe em profundidade',category:'passe',marginalGain:89,attackGain:80,defenceGain:30,delayResilience:93,dnaGain:86,reason:''},{name:'Chute de primeira',category:'finalização',marginalGain:84,attackGain:88,defenceGain:5,delayResilience:63,dnaGain:84,reason:''},{name:'Espírito guerreiro',category:'mental',marginalGain:80,attackGain:60,defenceGain:65,delayResilience:86,dnaGain:80,reason:''}],finalSkills:['Toque duplo','Controle com a sola','Passe em profundidade','Chute de primeira','Espírito guerreiro'],impetoPolicy:{slotStatus:'OCUPADO',current:'Técnica',currentScore:93,ideal:'Agilidade',idealScore:91,gain:-2,decision:'MANTER',reason:'Ganho insuficiente para justificar troca.'},learning:{epoch:'V6',memoryState:'V6_ATUAL',currentMatchWeight:1,legacyMatchWeight:.35,minimumAbMatchesPerArm:5,recommendation:'Priorize partidas v6.'},guarantees:{gerIsNotOptimizationTarget:true,networkIsNotModified:true,existingImpetoNotAutoReplaced:true,onlyOwnedSafeSkills:true,attackAndDefenceEvaluated:true,v5HistoryDownweighted:true},reasons:[],summary:''}
} as unknown as AnalysisResult;

const analysis=buildMetaVivo2027V4080R8(fixture);
assert.equal(analysis.mode,'META_VIVO_2027');
assert.equal(analysis.finalSkills.length,5);
assert.equal(new Set(analysis.finalSkills).size,5);
assert.equal(analysis.phaseRole.responsibility,'PRESSOR_PRIMARIO');
assert.equal(analysis.impetoInvestment.decision,'MANTER');
assert.equal(analysis.guarantees.doesNotClaimToFixNetwork,true);
assert.equal(analysis.guarantees.doublePressureGuardEnabled,true);
assert.ok(analysis.scores.firstTouch>=80);
assert.ok(analysis.scores.finalFunctional>=0&&analysis.scores.finalFunctional<=100);
assert.equal(analysis.catalog.standardAdditionalSkills,44);
assert.ok(analysis.catalog.recognizedSpecialSkills>=20);
assert.equal(analysis.catalog.teamPlaystyles,6);
const applied=applyMetaVivo2027V4080R8(fixture);
assert.match(applied.buildName,/Meta Vivo 2027/);
assert.deepEqual(applied.recommendedSkills,analysis.finalSkills);

const catalog=buildV600LiveCatalogSnapshot();
assert.equal(catalog.standardAdditionalSkills,44);
assert.ok(catalog.offensivePlaystyles>=22);
assert.ok(catalog.confirmedDefensivePlaystyleNames.includes('Pressão no Ataque'));
assert.ok(catalog.teamPlaystyleEntries.some((item)=>item.id==='SOBREPOSICAO'));
assert.ok(catalog.skillEntries.filter((item)=>item.kind==='PROVISORIA').every((item)=>item.weightAllowed===false||item.weightAllowed===true));

const attack=getFormationBlueprint('4-3-3-2ss');
const planFluid=createFluidFormationPlanV600(attack.id,attack);
planFluid.defensivePreset='MANUAL_SEGURO';
planFluid.defense=deriveCompactDefenseV600(attack,'MANUAL_SEGURO');
planFluid.teamPlaystyle='SOBREPOSICAO';
const formationMeta=evaluateFluidFormationMetaV600(planFluid);
assert.equal(planFluid.defense.slots.length,11);
assert.ok(formationMeta.compactness>=0&&formationMeta.compactness<=100);
assert.ok(formationMeta.recommendations.length>=1);
console.log(`Meta Vivo r8 aprovada: final ${analysis.scores.finalFunctional}/100, toque ${analysis.scores.firstTouch}, defesa ${analysis.scores.manualDefence}, catálogo ${catalog.standardAdditionalSkills}+${catalog.recognizedSpecialSkills}, dupla pressão ${analysis.phaseRole.doublePressRisk}.`);
