import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { cardFingerprint, type MatchValidationRecord } from '../src/lib/appEvolution';
import { buildMatchEvidenceCalibrationR135 } from '../src/modules/matches/matchEvidenceCalibrationR135';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor(overall=105) {
  const attrs:any={
    offensiveAwareness:75,ballControl:70,dribbling:70,tightPossession:70,lowPass:65,loftedPass:65,
    finishing:72,heading:65,placeKicking:72,curl:76,defensiveAwareness:70,defensiveEngagement:70,
    tackling:70,aggression:70,speed:80,acceleration:75,kickingPower:78,jump:68,physicalContact:74,balance:75,stamina:83
  };
  const parsed:any={
    playerName:'R135 Meio',cardType:'Epic',mainPosition:'CMF',mainPositionPt:'MLG',positions:['CMF','AMF','DMF'],positionsPt:['MLG','MAT','VOL'],positionRatings:{CMF:102,AMF:100,DMF:98},
    playstyle:'Meia versátil',offensivePlaystyle:'Meia versátil',defensivePlaystyle:'Meia versátil',defensivePlaystyleConfirmed:true,dominantFoot:'Direito',
    overall,maxOverall:overall,height:180,weight:78,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:[],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:3,skillConfidence:.95,impetoSlotStatus:'DISPONIVEL'},internalId:'r135-meio',confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:'CMF',label:'MLG',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const source=resultFor();
const fingerprint=cardFingerprint(source);

function record({
  id, day, build='build-a', position='CMF', connection='stable', delay=1, passing=1, tags=['Passe lento'], passErrors=7
}: { id:string; day:number; build?:string; position?:any; connection?:any; delay?:any; passing?:any; tags?:string[]; passErrors?:number }): MatchValidationRecord {
  return {
    id,cardFingerprint:fingerprint,playerName:'R135 Meio',targetPosition:position,formation:'4-3-3' as any,teamStyle:'POSSE_DE_BOLA' as any,
    buildName:build,buildSignature:build,playedAt:new Date(Date.UTC(2026,8,day,12)).toISOString(),minutes:90,
    overallRating:2,passing,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags,note:'',mode:'ranked',connection,
    metrics:{goals:0,assists:0,passErrors,tackles:2,interceptions:2,ballLosses:3,dribblesCompleted:2,shots:1,shotsOnTarget:1},inputDelayRating:delay
  } as MatchValidationRecord;
}

const base:any=applyCleanSlatePerformance2027R119(source);
assert.equal(trainingPlanTotalCost(base.training),64);

// Uma partida nunca pode virar receita.
const one=buildMatchEvidenceCalibrationR135(source,[record({id:'one',day:1})]);
assert.equal(one.status,'OBSERVE');
assert.deepEqual(one.actionNeedAdjustments,{});
const oneBuild:any=applyCleanSlatePerformance2027R119({...source,matchEvidenceCalibrationR135:one});
assert.deepEqual(oneBuild.training,base.training,'Uma partida isolada não pode alterar a ficha.');

// Muitas partidas não bastam se o déficit apareceu em apenas uma sessão.
const isolatedOutlier=buildMatchEvidenceCalibrationR135(source,[
  record({id:'outlier',day:1,passing:1,tags:['Passe lento'],passErrors:7}),
  record({id:'ok-2',day:2,passing:5,tags:[],passErrors:0}),
  record({id:'ok-3',day:3,passing:5,tags:[],passErrors:0}),
  record({id:'ok-4',day:4,passing:5,tags:[],passErrors:0}),
  record({id:'ok-5',day:5,passing:5,tags:[],passErrors:0})
]);
assert.notEqual(isolatedOutlier.status,'ACTIVE','Um outlier isolado não pode virar calibração só porque existe uma amostra grande.');
assert.equal(isolatedOutlier.domainSupport.passing?.distinctSessions,1);

// Repetição estável, em dias distintos e em mais de uma assinatura de build, pode calibrar o retorno marginal.
const stableRecords=[
  record({id:'a',day:1,build:'build-a'}),record({id:'b',day:2,build:'build-a'}),
  record({id:'c',day:3,build:'build-b'}),record({id:'d',day:4,build:'build-b'}),record({id:'e',day:5,build:'build-b'})
];
const calibration=buildMatchEvidenceCalibrationR135(source,stableRecords);
assert.equal(calibration.status,'ACTIVE');
assert.ok(calibration.distinctSessions>=2);
assert.ok(calibration.distinctBuilds>=2);
assert.ok(calibration.confidenceScore>=70);
assert.ok((calibration.actionNeedAdjustments.short_creation??0)>0);
assert.ok(Object.values(calibration.actionNeedAdjustments).every((value)=>value<=.12),'Nenhuma ação pode receber mais que 12% de reponderação.');

const calibrated:any=applyCleanSlatePerformance2027R119({...source,matchEvidenceCalibrationR135:calibration});
assert.equal(trainingPlanTotalCost(calibrated.training),64,'Clean Slate continua responsável pelo orçamento exato.');
assert.ok(calibrated.training.passing>base.training.passing,'Deficiência de passe repetida deve poder elevar o retorno marginal de Passe no próprio Clean Slate.');
assert.notDeepEqual(calibrated.training,base.training,'Evidência real suficiente pode alterar a decisão, mas somente através do Clean Slate.');
assert.equal(calibrated.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(calibrated.cleanSlate2027R119.guards.matchEvidenceCalibrated,true);
assert.ok(calibrated.cleanSlate2027R119.actions.some((action:any)=>Number(action.matchNeedMultiplier)>1),'A ação deve registrar o multiplicador de necessidade usado na auditoria.');
assert.match(calibrated.cleanSlate2027R119.reasons.join(' '),/Evidência real R13[56] ativa/i);

// GER continua irrelevante mesmo quando a calibração está ativa.
const highOverall:any=applyCleanSlatePerformance2027R119({...resultFor(118),matchEvidenceCalibrationR135:calibration});
assert.deepEqual(highOverall.training,calibrated.training,'Overall/GER não pode alterar a ficha calibrada.');

// Evidência de outra posição não pode entrar.
const wrongPosition=buildMatchEvidenceCalibrationR135(source,stableRecords.map((item)=>({...item,targetPosition:'AMF' as any})));
assert.equal(wrongPosition.status,'NO_EVIDENCE');
assert.equal(wrongPosition.rawMatches,0);

// Delay alto deve impedir promoção mesmo com vários registros.
const delayed=buildMatchEvidenceCalibrationR135(source,[1,2,3,4,5].map((day)=>record({id:`delay-${day}`,day,connection:'high_delay',delay:5})));
assert.notEqual(delayed.status,'ACTIVE','Histórico dominado por delay não pode calibrar a ficha.');

const root=path.resolve(__dirname,'..');
const pipeline=fs.readFileSync(path.join(root,'src/lib/cardIntelligencePipeline.ts'),'utf8');
const v4050=fs.readFileSync(path.join(root,'src/lib/realGameplayValidationV4050.ts'),'utf8');
const v4060=fs.readFileSync(path.join(root,'src/lib/longitudinalGameplayLearningV4060.ts'),'utf8');
const calibrationSource=fs.readFileSync(path.join(root,'src/modules/matches/matchEvidenceCalibrationR135.ts'),'utf8');
const calibrationR136Source=fs.readFileSync(path.join(root,'src/modules/matches/matchEvidenceCalibrationR136.ts'),'utf8');
const production=fs.readFileSync(path.join(root,'src/lib/productionAnalysisR128.ts'),'utf8');

assert.ok(pipeline.indexOf('attachMatchEvidenceCalibrationR136(current)') < pipeline.indexOf('applyCleanSlatePerformance2027R119(current'),'R136 deve fornecer evidência temporal/contextual antes do único escritor final.');
assert.match(v4050,/observationalOnly:\s*true/,'v40.50 deve ser apenas observacional.');
assert.match(v4060,/observationalOnly:\s*true/,'v40.60 deve ser apenas observacional.');
assert.doesNotMatch(v4050,/return\s*\{[\s\S]{0,800}training:\s*\{\s*\.\.\.entry\.training/s,'v40.50 não pode reaplicar treino antigo.');
assert.doesNotMatch(v4060,/return\s*\{[\s\S]{0,800}training:\s*\{\s*\.\.\.entry\.training/s,'v40.60 não pode reaplicar treino antigo.');
assert.doesNotMatch(calibrationSource,/recommendedSkills\s*=|recommendedImpetos\s*=|training\s*:/,'R135 não pode escrever build/Top 5/Ímpeto.');
assert.doesNotMatch(calibrationR136Source,/recommendedSkills\s*=|recommendedImpetos\s*=|training\s*:/,'R136 não pode escrever build/Top 5/Ímpeto.');
assert.match(production,/matchEvidenceCalibrationCurrentR136/,'Nova evidência de partida ou mudança de faixa temporal/contexto deve invalidar produção antiga para a próxima reanálise.');

console.log('r135 aprovada: partidas reais calibram apenas retorno marginal no Clean Slate; evidência isolada/delay/outra posição não altera a ficha e motores legados são somente leitura.');
