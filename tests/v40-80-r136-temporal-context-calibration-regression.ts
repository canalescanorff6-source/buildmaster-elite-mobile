import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { cardFingerprint, createMatchValidationRecord, type MatchValidationRecord } from '../src/lib/appEvolution';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { buildMatchEvidenceCalibrationR136, recencyWeightR136 } from '../src/modules/matches/matchEvidenceCalibrationR136';

const NOW = Date.UTC(2026, 8, 4, 15);
const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor(style:any='POSSE_DE_BOLA', formation:any='4-3-3') {
  const attrs:any={
    offensiveAwareness:75,ballControl:70,dribbling:70,tightPossession:70,lowPass:65,loftedPass:65,
    finishing:72,heading:65,placeKicking:72,curl:76,defensiveAwareness:70,defensiveEngagement:70,
    tackling:70,aggression:70,speed:80,acceleration:75,kickingPower:78,jump:68,physicalContact:74,balance:75,stamina:83
  };
  const parsed:any={
    playerName:'R136 Meio',cardType:'Epic',mainPosition:'CMF',mainPositionPt:'MLG',positions:['CMF','AMF','DMF'],positionsPt:['MLG','MAT','VOL'],positionRatings:{CMF:102,AMF:100,DMF:98},
    playstyle:'Meia versátil',offensivePlaystyle:'Meia versátil',defensivePlaystyle:'Meia versátil',defensivePlaystyleConfirmed:true,dominantFoot:'Direito',
    overall:105,maxOverall:105,height:180,weight:78,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:[],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:3,skillConfidence:.95,impetoSlotStatus:'DISPONIVEL'},internalId:'r136-meio',confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:'CMF',label:'MLG',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation,style},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const source=resultFor();
const fingerprint=cardFingerprint(source);

function record(id:string, iso:string, overrides:Partial<MatchValidationRecord>={}): MatchValidationRecord {
  return {
    id,cardFingerprint:fingerprint,playerName:'R136 Meio',targetPosition:'CMF',formation:'4-3-3' as any,teamStyle:'POSSE_DE_BOLA' as any,
    buildName:id.includes('b')?'build-b':'build-a',buildSignature:id.includes('b')?'build-b':'build-a',playedAt:iso,minutes:90,
    overallRating:2,passing:1,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:['Passe lento'],note:'',mode:'ranked',connection:'stable',
    metrics:{goals:0,assists:0,passErrors:7,tackles:2,interceptions:2,ballLosses:3,dribblesCompleted:2,shots:1,shotsOnTarget:1},inputDelayRating:1,
    gameSeason:'eFootball 2027',gameVersion:'6.0.0',gameplayEpoch:'V6',...overrides
  } as MatchValidationRecord;
}

const fresh=[
  record('a1','2026-08-30T12:00:00.000Z'),record('a2','2026-09-01T12:00:00.000Z'),
  record('b1','2026-09-02T12:00:00.000Z'),record('b2','2026-09-03T12:00:00.000Z'),record('b3','2026-09-04T12:00:00.000Z')
];
const active=buildMatchEvidenceCalibrationR136(source,fresh,NOW);
assert.equal(active.status,'ACTIVE','Evidência recente, v6.0 e repetida deve poder calibrar.');
assert.equal(active.temporalStatus,'FRESH');
assert.ok(active.currentPatchShare>=95);
assert.ok(active.recencyScore>=90);
assert.ok((active.actionNeedAdjustments.short_creation??0)>0);

const base:any=applyCleanSlatePerformance2027R119(source);
const calibrated:any=applyCleanSlatePerformance2027R119({...source,matchEvidenceCalibrationR136:active});
assert.equal(trainingPlanTotalCost(calibrated.training),64);
assert.ok(calibrated.training.passing>base.training.passing,'R136 deve conseguir elevar retorno marginal de passe somente via Clean Slate.');
assert.equal(calibrated.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.match(calibrated.cleanSlate2027R119.reasons.join(' '),/R136/i);

// O mesmo déficit, meses atrás, não pode permanecer dominante indefinidamente.
const old=fresh.map((item,index)=>({...item,id:`old-${index}`,playedAt:`2026-01-${String(10+index).padStart(2,'0')}T12:00:00.000Z`}));
const stale=buildMatchEvidenceCalibrationR136(source,old,NOW);
assert.notEqual(stale.status,'ACTIVE','Histórico antigo sozinho deve decair para observação.');
assert.equal(stale.temporalStatus,'STALE');
assert.ok(stale.recencyScore<=40);
assert.equal(recencyWeightR136(old[0],NOW),.40);

// Histórico migrado sem versão continua útil, mas não comanda sozinho o meta atual.
const legacy=fresh.map(({gameSeason,gameVersion,gameplayEpoch,...item})=>item as MatchValidationRecord);
const legacyCalibration=buildMatchEvidenceCalibrationR136(source,legacy,NOW);
assert.notEqual(legacyCalibration.status,'ACTIVE');
assert.ok(legacyCalibration.currentPatchShare<45);
assert.ok(legacyCalibration.legacyShare>50);

// Evidência antiga ruim + sessões recentes boas deve perder o déficit por decaimento e atualização de comportamento.
const recentGood=[
  record('good-1','2026-09-01T12:00:00.000Z',{passing:5,tags:[],metrics:{goals:0,assists:1,passErrors:0,tackles:2,interceptions:2,ballLosses:2,dribblesCompleted:3,shots:1,shotsOnTarget:1}}),
  record('good-2','2026-09-03T12:00:00.000Z',{passing:5,tags:[],metrics:{goals:0,assists:1,passErrors:0,tackles:2,interceptions:2,ballLosses:2,dribblesCompleted:3,shots:1,shotsOnTarget:1}}),
  record('good-3','2026-09-04T12:00:00.000Z',{passing:5,tags:[],metrics:{goals:0,assists:1,passErrors:0,tackles:2,interceptions:2,ballLosses:2,dribblesCompleted:3,shots:1,shotsOnTarget:1}})
];
const recovered=buildMatchEvidenceCalibrationR136(source,[...old,...recentGood],NOW);
assert.ok((recovered.domainNeeds.passing??0)<(active.domainNeeds.passing??1),'Desempenho recente bom deve reduzir a necessidade antiga.');
assert.notEqual(recovered.status,'ACTIVE','Déficit antigo superado por sessões recentes boas não deve continuar alterando a ficha.');

// Contexto tático diferente pesa principalmente sobre movimentação/defesa, sem apagar tendência intrínseca.
const movementBad=fresh.map((item)=>({...item,passing:3,movement:1,defending:1,tags:['Ficou fora de posição'],teamStyle:'CONTRA_ATAQUE_RAPIDO' as any,formation:'4-2-2-2' as any}));
const mismatched=buildMatchEvidenceCalibrationR136(source,movementBad,NOW);
const sameContext=buildMatchEvidenceCalibrationR136(source,movementBad.map((item)=>({...item,teamStyle:'POSSE_DE_BOLA' as any,formation:'4-3-3' as any})),NOW);
assert.ok((mismatched.domainSupport.movement?.effectiveMatches??0)<(sameContext.domainSupport.movement?.effectiveMatches??0),'Movimentação fora do contexto atual precisa ter suporte efetivo menor.');

// Novos registros reais já nascem carimbados com o patch atual.
const created=createMatchValidationRecord(source,{
  minutes:90,overallRating:3,passing:3,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:[],note:'',mode:'ranked',connection:'stable',metrics:undefined,inputDelayRating:1
});
assert.equal(created.gameSeason,'eFootball 2027');
assert.equal(created.gameVersion,'6.0.0');
assert.equal(created.gameplayEpoch,'V6');

const root=path.resolve(__dirname,'..');
const pipeline=fs.readFileSync(path.join(root,'src/lib/cardIntelligencePipeline.ts'),'utf8');
const production=fs.readFileSync(path.join(root,'src/lib/productionAnalysisR128.ts'),'utf8');
const moduleSource=fs.readFileSync(path.join(root,'src/modules/matches/matchEvidenceCalibrationR136.ts'),'utf8');
assert.ok(pipeline.indexOf('attachMatchEvidenceCalibrationR136(current)') < pipeline.indexOf('applyCleanSlatePerformance2027R119(current'),'R136 deve entrar antes do único escritor final.');
assert.match(production,/matchEvidenceCalibrationCurrentR136/,'Produção antiga precisa invalidar quando evidência cruza faixa temporal/contextual.');
assert.doesNotMatch(moduleSource,/recommendedSkills\s*=|recommendedImpetos\s*=|training\s*:/,'R136 não pode escrever build, Top 5 ou Ímpeto.');

console.log('r136 aprovada: partidas recentes/contextuais v6.0 calibram apenas o Clean Slate; evidência antiga, legada ou fora do contexto perde peso sem ser apagada.');
