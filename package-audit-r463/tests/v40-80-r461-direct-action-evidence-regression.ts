import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import { buildBuildOutcomeCalibrationR460 } from '../src/modules/matches/buildOutcomeCalibrationR460';

const result:any={
  parsed:{playerName:'R461',mainPosition:'CMF',positions:['CMF'],attributes:{},nativeSkills:[],additionalSkills:[],specialSkills:[],impetos:[]},
  bestPosition:{code:'CMF'},tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'},teamMap:{},advancedTacticalFunction:{},usageFunctionR457:'Orquestrador'
};
const snapshot:any={version:'40.80-r460-build-outcome-snapshot-v1',engineRevision:'R459',usageFunction:'Orquestrador',tacticalStyle:'POSSE_DE_BOLA',formation:'4-2-2-2',actions:[{id:'short_creation',label:'Tabela / passe curto',demand:95,projectedGain:4.5,projectedScore:86,decisionConfidence:96}]};
const base:any={
  cardFingerprint:'struct-r461',playerName:'R461',targetPosition:'CMF',formation:'4-2-2-2',teamStyle:'POSSE_DE_BOLA',buildName:'R461',buildSignature:'build-r461',minutes:90,
  overallRating:3,passing:3,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:[],note:'',mode:'ranked',connection:'stable',inputDelayRating:1,
  gameVersion:'6.0.0',gameplayEpoch:'V6',usageFunction:'Orquestrador',gameplayImpactSnapshotR460:snapshot,
  metrics:{goals:0,assists:0,passErrors:0,tackles:0,interceptions:0,ballLosses:0,dribblesCompleted:0,shots:0,progressivePasses:0,keyPasses:0}
};
// result aliases depend on canonical fingerprint machinery; use the same helper output shape by overriding internal identity inputs.
result.parsed.cardType='Epic'; result.parsed.specialTag='R461'; result.parsed.mainPositionPt='MLG'; result.parsed.positionsPt=['MLG']; result.parsed.positionRatings={CMF:100}; result.parsed.playstyle='Orquestrador'; result.parsed.trainingPointsTotal=8; result.parsed.evidence={attributeCount:0}; result.parsed.internalId='r461';
const { cardFingerprint } = require('../src/lib/appEvolution');
base.cardFingerprint=cardFingerprint(result);
function rows(rating:1|5){return ['01','03','05','07'].map((day,index)=>({...base,id:`${rating}-${index}`,playedAt:`2026-09-${day}T12:00:00.000Z`,actionRatingsR461:{short_creation:rating}} as MatchValidationRecord));}
const low=buildBuildOutcomeCalibrationR460(result,rows(1));
const high=buildBuildOutcomeCalibrationR460(result,rows(5));
assert.equal(low.directActionEvidenceRate,100);
assert.equal(high.directActionEvidenceRate,100);
assert.equal(low.status,'ACTIVE','Nota direta ruim e repetida precisa ativar o aprendizado mesmo com nota ampla neutra.');
assert.equal(low.actions[0]?.status,'PERSISTENT_GAP');
assert.ok((low.actionLearningMultipliers.short_creation??1)>1);
assert.equal(high.actions[0]?.status,'VALIDATED','Nota direta boa precisa validar a ação mesmo com nota ampla neutra.');
assert.equal(high.actionLearningMultipliers.short_creation,undefined);
const ui=fs.readFileSync('src/components/MatchValidationCenter.tsx','utf8');
assert.match(ui,/Evidência direta R461/);
assert.match(ui,/actionRatingsR461/);
assert.match(ui,/— = não observei/);
console.log(`R461 aprovado: evidência direta separa ação ruim (${low.actions[0]?.observedScore}) de ação validada (${high.actions[0]?.observedScore}) sem confundir com a nota ampla.`);
