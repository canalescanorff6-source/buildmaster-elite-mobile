import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { cardFingerprint, createMatchValidationRecord, type MatchValidationRecord } from '../src/lib/appEvolution';
import { buildBuildOutcomeCalibrationR460 } from '../src/modules/matches/buildOutcomeCalibrationR460';
import { buildMatchEvidenceCalibrationR136 } from '../src/modules/matches/matchEvidenceCalibrationR136';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});
function sourceResult(){
  const attrs:any={
    offensiveAwareness:78,ballControl:82,dribbling:79,tightPossession:80,lowPass:80,loftedPass:77,
    finishing:68,heading:62,placeKicking:72,curl:76,defensiveAwareness:72,defensiveEngagement:74,
    tackling:70,aggression:68,speed:76,acceleration:78,kickingPower:72,jump:64,physicalContact:69,balance:77,stamina:84
  };
  const parsed:any={
    playerName:'R460 Maestro',cardType:'Epic',mainPosition:'CMF',mainPositionPt:'MLG',positions:['CMF','DMF','AMF'],positionsPt:['MLG','VOL','MAT'],positionRatings:{CMF:100},
    playstyle:'Orquestrador',offensivePlaystyle:'Orquestrador',defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:false,dominantFoot:'Direito',
    overall:100,maxOverall:100,height:178,weight:72,trainingPointsTotal:8,condition:{},impetos:[],nativeSkills:['Passe de primeira'],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.95,impetoSlotStatus:'DISPONIVEL'},internalId:'r460-maestro',confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:'CMF',label:'MLG',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:8,trainingPointsRemaining:8,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'R460',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{},
    usageFunctionR457:'Orquestrador'
  } as any;
}

const source=sourceResult();
const analyzed:any=applyCleanSlatePerformance2027R119(source);
const created=createMatchValidationRecord(analyzed,{
  minutes:90,overallRating:3,passing:2,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:['Passe lento'],note:'',mode:'ranked',connection:'stable',
  metrics:{goals:0,assists:0,passErrors:6,tackles:1,interceptions:1,ballLosses:2,dribblesCompleted:2,shots:1,progressivePasses:2,keyPasses:0},inputDelayRating:1
});
assert.equal(created.usageFunction,'Orquestrador');
assert.ok(created.usageContextSignatureR460?.startsWith('usage-r460-'));
assert.equal(created.gameplayImpactSnapshotR460?.version,'40.80-r460-build-outcome-snapshot-v1');
assert.ok((created.gameplayImpactSnapshotR460?.actions.length??0)>0,'Partida R460 precisa congelar a promessa funcional da ficha.');

const fingerprint=cardFingerprint(analyzed);
const shortAction={id:'short_creation',label:'Tabela / passe curto',demand:95,projectedGain:4.5,projectedScore:86,decisionConfidence:96};
function record(id:string,day:string,passing:1|2|3|4|5,usageFunction='Orquestrador',good=false):MatchValidationRecord{
  return {
    ...created,id,cardFingerprint:fingerprint,playedAt:`2026-09-${day}T12:00:00.000Z`,usageFunction,
    passing,overallRating:passing,movement:3,finishing:3,defending:3,physical:3,stamina:3,
    tags:good?[]:['Passe lento'],
    metrics:{goals:0,assists:good?1:0,passErrors:good?0:7,tackles:1,interceptions:1,ballLosses:2,dribblesCompleted:2,shots:1,progressivePasses:good?9:1,keyPasses:good?2:0},
    gameplayImpactSnapshotR460:{version:'40.80-r460-build-outcome-snapshot-v1',engineRevision:'R459',usageFunction,tacticalStyle:'POSSE_DE_BOLA',formation:'4-2-2-2',actions:[shortAction]}
  } as MatchValidationRecord;
}
const bad=[record('b1','01',1),record('b2','03',1),record('b3','05',2),record('b4','07',1)];
const learned=buildBuildOutcomeCalibrationR460(analyzed,bad);
assert.equal(learned.status,'ACTIVE','Falha persistente da mesma função em várias sessões precisa ativar aprendizado R460.');
assert.ok((learned.actionLearningMultipliers.short_creation??1)>1,'Falha persistente precisa reforçar retorno marginal da ação, com teto conservador.');
assert.equal(learned.actions.find(a=>a.id==='short_creation')?.status,'PERSISTENT_GAP');
assert.ok((learned.actionLearningMultipliers.short_creation??1)<=1.06);

const good=[record('g1','01',5,'Orquestrador',true),record('g2','03',5,'Orquestrador',true),record('g3','05',4,'Orquestrador',true),record('g4','07',5,'Orquestrador',true)];
const validated=buildBuildOutcomeCalibrationR460(analyzed,good);
assert.notEqual(validated.status,'ACTIVE','Ação validada não deve receber pressão extra só porque existiu previsão de ganho.');
assert.equal(validated.actionLearningMultipliers.short_creation,undefined);
assert.equal(validated.actions.find(a=>a.id==='short_creation')?.status,'VALIDATED');

const otherFunction=bad.map((item,index)=>({...item,id:`other-${index}`,usageFunction:'Meia versátil',gameplayImpactSnapshotR460:{...item.gameplayImpactSnapshotR460!,usageFunction:'Meia versátil'}}));
const isolated=buildBuildOutcomeCalibrationR460(analyzed,otherFunction);
assert.equal(isolated.status,'NO_EVIDENCE','Função conhecida diferente não pode comandar o aprendizado direto.');
assert.equal(isolated.mismatchedFunctionMatches,otherFunction.length);

// R136 continua enxergando histórico geral, mas função diferente recebe forte desconto.
const sameR136=buildMatchEvidenceCalibrationR136(analyzed,bad);
const otherR136=buildMatchEvidenceCalibrationR136(analyzed,otherFunction as MatchValidationRecord[]);
assert.ok((sameR136.domainSupport.passing?.effectiveMatches??0)>(otherR136.domainSupport.passing?.effectiveMatches??0),'R136 também precisa descontar função conhecida diferente.');

const pipeline=fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const clean=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
const prod=fs.readFileSync('src/lib/productionAnalysisR128.ts','utf8');
assert.ok(pipeline.indexOf('attachBuildOutcomeCalibrationR460(current)') < pipeline.indexOf('applyCleanSlatePerformance2027R119(current'),'R460 deve entrar antes do único escritor final.');
assert.match(clean,/actionLearningMultipliers/,'Clean Slate precisa consumir apenas o multiplicador read-only do R460.');
assert.match(prod,/buildOutcomeCalibrationCurrentR460/,'Resultado salvo precisa ser invalidado quando surgirem novas partidas R460.');


// Backup/import corrompido não pode injetar demanda/confiança arbitrária nem ações desconhecidas.
const corrupted = bad.map((item,index)=>({
  ...item,
  id:`corrupt-${index}`,
  gameplayImpactSnapshotR460:{
    ...item.gameplayImpactSnapshotR460!,
    actions:[
      {id:'short_creation',label:'Tabela',demand:9999,projectedGain:9999,projectedScore:9999,decisionConfidence:9999},
      {id:'unknown_action',label:'INVENTADA',demand:100,projectedGain:30,projectedScore:100,decisionConfidence:100}
    ]
  }
} as MatchValidationRecord));
const hardened=buildBuildOutcomeCalibrationR460(analyzed,corrupted);
const hardenedShort=hardened.actions.find(a=>a.id==='short_creation');
assert.ok(hardenedShort,'Ação oficial precisa sobreviver à sanitização.');
assert.ok((hardenedShort?.demand??0)<=100 && (hardenedShort?.projectedScore??0)<=100 && (hardenedShort?.projectedGain??0)<=30,'Snapshot importado precisa ser limitado ao domínio seguro.');
assert.equal(hardened.actions.some(a=>a.id==='unknown_action'),false,'Ação desconhecida/importada não pode entrar no aprendizado R460.');

console.log(`R460 aprovado: snapshot soberano, função isolada e promessa×resultado ativo em ${learned.snapshotMatches} partidas; short_creation ×${learned.actionLearningMultipliers.short_creation}.`);
