import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import { matchSessionKeyR135 } from '../src/modules/matches/matchEvidenceCalibrationR135';
import { buildBuildOutcomeCalibrationR460 } from '../src/modules/matches/buildOutcomeCalibrationR460';
import { cardFingerprint } from '../src/lib/appEvolution';

const result:any={
  parsed:{playerName:'R462',cardType:'Epic',specialTag:'R462',mainPosition:'CMF',mainPositionPt:'MLG',positions:['CMF'],positionsPt:['MLG'],positionRatings:{CMF:100},playstyle:'Orquestrador',trainingPointsTotal:8,attributes:{},nativeSkills:[],additionalSkills:[],specialSkills:[],impetos:[],evidence:{attributeCount:0},internalId:'r462'},
  bestPosition:{code:'CMF'},tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'},teamMap:{},advancedTacticalFunction:{},usageFunctionR457:'Orquestrador'
};
const fp=cardFingerprint(result);
const snapshot:any={version:'40.80-r460-build-outcome-snapshot-v1',engineRevision:'R459',usageFunction:'Orquestrador',tacticalStyle:'POSSE_DE_BOLA',formation:'4-2-2-2',actions:[{id:'short_creation',label:'Tabela / passe curto',demand:95,projectedGain:4.5,projectedScore:86,decisionConfidence:96}]};
function row(id:string,sessionIdR462?:string):MatchValidationRecord{return {
  id,cardFingerprint:fp,playerName:'R462',targetPosition:'CMF',formation:'4-2-2-2',teamStyle:'POSSE_DE_BOLA',buildName:'R462',buildSignature:'build',playedAt:'2026-09-20T12:00:00.000Z',minutes:90,
  overallRating:1,passing:1,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:[],note:'',mode:'ranked',connection:'stable',inputDelayRating:1,gameVersion:'6.0.0',gameplayEpoch:'V6',usageFunction:'Orquestrador',sessionIdR462,
  gameplayImpactSnapshotR460:snapshot,actionRatingsR461:{short_creation:1},metrics:{goals:0,assists:0,passErrors:7,tackles:0,interceptions:0,ballLosses:1,dribblesCompleted:0,shots:0,progressivePasses:1,keyPasses:0}
} as MatchValidationRecord;}

assert.equal(matchSessionKeyR135(row('a','sessao-a')),'session:sessao-a');
assert.equal(matchSessionKeyR135(row('b',undefined)),'legacy-day:2026-09-20');
const oneSession=buildBuildOutcomeCalibrationR460(result,[row('a1','sessao-a'),row('a2','sessao-a'),row('a3','sessao-a'),row('a4','sessao-a')]);
assert.equal(oneSession.distinctSessions,1);
assert.notEqual(oneSession.status,'ACTIVE','Várias partidas na mesma sessão não podem fingir independência temporal.');
const twoSessions=buildBuildOutcomeCalibrationR460(result,[row('a1','sessao-a'),row('a2','sessao-a'),row('b1','sessao-b'),row('b2','sessao-b')]);
assert.equal(twoSessions.distinctSessions,2,'Duas sessões explícitas no mesmo dia precisam ser reconhecidas separadamente.');
assert.equal(twoSessions.status,'ACTIVE','Persistência em duas sessões reais pode ativar o aprendizado quando os outros critérios também passam.');
const repo=fs.readFileSync('src/modules/matches/matchValidationRepositoryR137.ts','utf8');
const ui=fs.readFileSync('src/components/MatchValidationCenter.tsx','utf8');
assert.match(repo,/sessionIdR462/,'Revisão do repositório precisa mudar quando a sessão explícita muda.');
assert.match(ui,/Nova sessão/);
assert.match(ui,/buildmaster-match-session-r462/);
console.log(`R462 aprovado: ${oneSession.distinctSessions} sessão para bloco único e ${twoSessions.distinctSessions} sessões independentes no mesmo dia.`);
