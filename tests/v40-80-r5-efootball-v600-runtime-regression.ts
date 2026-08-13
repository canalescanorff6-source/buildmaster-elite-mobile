import assert from 'node:assert/strict';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzerDomain';
import { parseCard } from '../src/lib/analyzer';
import { buildEfootballV600Performance, applyEfootballV600Performance } from '../src/lib/efootballV600Performance';
import { deriveCompactDefenseV600, inferFormationNameV600 } from '../src/lib/fluidFormationV600';
import { getFormationBlueprint } from '../src/lib/formationRoleEngine';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const dual = parseCard(`[AJUSTES MANUAIS]\nNOME DO JOGADOR: Teste v6\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO OFENSIVO: Artilheiro\nESTILO DE JOGO DEFENSIVO: Pressão no Ataque\nPONTOS TOTAIS: 64\nTalento ofensivo: 90\nControle de bola: 88\nDrible: 84\nCondução firme: 86\nPasse rasteiro: 78\nPasse alto: 70\nFinalização: 92\nCabeçada: 80\nVelocidade: 86\nAceleração: 88\nEquilíbrio: 84\nResistência: 82\nTalento defensivo: 45\nDedicação defensiva: 65\nDesarme: 48\nAgressividade: 72\n[FIM AJUSTES]`);
assert.equal(dual.offensivePlaystyle, 'Artilheiro');
assert.equal(dual.defensivePlaystyle, 'Pressão no Ataque');
assert.equal(dual.defensivePlaystyleConfirmed, true);
assert.equal(dual.playstyle, 'Artilheiro');
const provisional = parseCard(`[AJUSTES MANUAIS]\nNOME DO JOGADOR: Teste estilo novo\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO OFENSIVO: Armador Criativo\nESTILO DE JOGO DEFENSIVO: Sentinela Experimental\nPONTOS TOTAIS: 64\nControle de bola: 88\nPasse rasteiro: 86\nAceleração: 86\nDedicação defensiva: 72\n[FIM AJUSTES]`);
assert.equal(provisional.defensivePlaystyle, 'Sentinela Experimental');
assert.equal(provisional.defensivePlaystyleConfirmed, false);

const plan: TrainingPlan = { shooting:8, passing:5, dribbling:7, dexterity:8, lowerBodyStrength:7, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 };
const budget = trainingPlanTotalCost(plan);
const fixture = {
  objective:'COMPETITIVE',
  parsed:{
    playerName:'SA v6', cardType:'Épico', mainPosition:'SS', mainPositionPt:'SA', positions:['SS'], positionsPt:['SA'], positionRatings:{SS:100},
    playstyle:'Armador Criativo', offensivePlaystyle:'Armador Criativo', defensivePlaystyle:'Pressão no Ataque', defensivePlaystyleConfirmed:true,
    trainingPointsTotal:budget, trainingPointsUsed:budget, trainingPointSource:'OCR', condition:{}, impetos:[{name:'Técnica',value:2,active:true}],
    nativeSkills:['Passe de primeira'], additionalSkills:[], specialSkills:[],
    attributes:{offensiveAwareness:88,ballControl:91,dribbling:89,tightPossession:91,lowPass:86,loftedPass:79,finishing:84,defensiveAwareness:58,defensiveEngagement:72,tackling:55,aggression:74,speed:84,acceleration:89,kickingPower:82,jump:64,physicalContact:66,balance:91,stamina:86},
    physicalProfile:{}, manualConfirmed:false, evidence:{positionLocked:true,playstyleLocked:true,attributeCount:20,positionRatingsCount:1,impetoSlotStatus:'DISPONIVEL'}, internalId:'sa-v6', confidence:94, warnings:[]
  },
  bestPosition:{code:'SS',label:'SA',score:95}, positionScores:[], pri:{}, tacticalFit:{}, training:plan, trainingCost:plan,
  trainingPointsUsed:budget,trainingPointsTotal:budget,trainingPointsRemaining:0,trainingCostRule:'teste',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
  tacticalProfile:{formation:'4-3-3',style:'POSSE_DE_BOLA',connectionProfile:'HIGH_DELAY'},
  teamMap:{functionLabel:'SA',tacticalIdentity:'',defensiveJob:'',buildupJob:'',attackingJob:'',pressingJob:'',idealPartners:[],riskAlerts:[],matchPlan:[],sectorScores:{marcacao:60,cobertura:60,saidaDeBola:84,passe:88,criacao:90,aceleracao:88,finalizacao:82,jogoAereo:55,fisico:70},coachFit:''},
  profileTips:[],validation:{} as any,permittedPositions:[],avoidPositions:[],recommendedSkills:['Passe em profundidade','Toque duplo','Chute de primeira','Controle com a sola','Espírito guerreiro'],skillRecommendations:[],avoidSkills:[],
  recommendedImpetos:[
    {name:'Agilidade',tier:'ideal',attributes:['Aceleração','Equilíbrio'],reason:'Resposta.',score:86,confidence:90,official:true},
    {name:'Passe',tier:'alternativo',attributes:['Passe rasteiro','Passe alto'],reason:'Passe.',score:82,confidence:88,official:true}
  ],
  buildName:'v40.80',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{} as any,advancedTacticalFunction:{} as any,specialSkillsAnalysis:{} as any,physicalEngine:{} as any,attributeGoals:{} as any,advancedOptimizer:{} as any,correctionLimit:{} as any,marginalReturn:[],errorTolerance:{} as any,skillPriority:{} as any,
  maximumPerformanceV4080:{engineVersion:'40.80.0',mode:'DESEMPENHO_MAXIMO_STACK_FINAL',deterministic:true,selectedPosition:'SS',selectedPositionLabel:'SA',trainingSource:'ATUAL',baseTraining:plan,finalTraining:plan,exactBudget:true,candidatesEvaluated:1,baselineJointScore:85,winnerJointScore:85,jointGain:0,skillPlan:{finalSkills:[],score:0,lateBound:true,duplicatesWithOwned:0,slotsFilled:0},impeto:{slotStatus:'DISPONIVEL',canCraft:true,existing:['Técnica'],primary:'Agilidade',candidates:[{name:'Agilidade',tier:'ideal',attributes:['Aceleração','Equilíbrio'],reason:'Resposta.',score:86,confidence:90,official:true},{name:'Passe',tier:'alternativo',attributes:['Passe rasteiro'],reason:'Passe.',score:82,confidence:88,official:true}],bestScore:86,selectableOfficialCount:28,randomPool:{outfieldMin:14,outfieldMax:15,goalkeeper:8},policy:'teste'},marginalAudit:[],guarantees:{gerIsNotOptimizationTarget:true,finalBuildFirst:true,finalSkillsReconciled:true,invalidImpetoSpendBlocked:true,existingImpetoPreserved:true,longitudinalWinnerProtected:false,noRandomness:true},reasons:[],summary:''}
} as unknown as AnalysisResult;

const analysis = buildEfootballV600Performance(fixture);
assert.equal(analysis.liveMeta, true);
assert.equal(analysis.connectionProfile, 'HIGH_DELAY');
assert.equal(analysis.exactBudget, true);
assert.equal(trainingPlanTotalCost(analysis.finalTraining), budget);
assert.equal(analysis.defensivePlaystyle, 'Pressão no Ataque');
assert.ok(analysis.candidatesEvaluated > 1);
assert.ok(analysis.finalSkills.length > 0 && analysis.finalSkills.length <= 5);
assert.ok(!analysis.finalSkills.includes('Passe de primeira'));
assert.equal(analysis.guarantees.doesNotClaimToFixNetwork, true);
const applied = applyEfootballV600Performance(fixture);
assert.match(applied.buildName,/eFootball 2027 v6\.0 Adaptativa/);
assert.equal(trainingPlanTotalCost(applied.training),budget);

const attack = getFormationBlueprint('4-3-3-2ss');
assert.equal(attack.slots.filter((slot)=>slot.position==='SS').length,2);
const defence = deriveCompactDefenseV600(attack,'COMPACTO_CENTRAL');
assert.equal(defence.slots.length,attack.slots.length);
assert.equal(defence.slots.filter((slot)=>slot.position==='GK').length,1);
assert.ok(defence.slots.filter((slot)=>slot.position==='AMF').length>=1,'dois SA devem poder recuar para linha compacta');
assert.notEqual(inferFormationNameV600(attack.slots),inferFormationNameV600(defence.slots));

console.log(`v6.0 runtime aprovada: ${analysis.candidatesEvaluated} fichas de mesmo orçamento, resposta ${analysis.responseScore}/100, defesa ${analysis.manualDefenceScore}/100; ataque ${inferFormationNameV600(attack.slots)} -> defesa ${inferFormationNameV600(defence.slots)}.`);
