import type { MatchValidationRecord } from '../../lib/appEvolution';
import type { IntelligentLearningR470Analysis } from '../../lib/intelligentLearningR470';
import type { MotorLabLifecycleR472 } from '../../lib/motorLabLifecycleR472';
import type { BuildOutcomeCalibrationR460 } from '../matches/buildOutcomeCalibrationR460';
import { readMatchValidationRepositoryR137 } from '../matches/matchValidationRepositoryR137';
import { GAMEPLAY_ENGINE_R510_CALIBRATION, GAMEPLAY_ENGINE_R510_VERSION, type GameplayActionIdR510 } from './gameplayEngineR510';
import type { GameplayCalibrationBridgeR516, GameplayCalibrationPrimitiveCandidateR516 } from './gameplayCalibrationBridgeR516';

export const REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION='40.80-r518-real-match-calibration-evidence-v1' as const;
const L={mult:1.06,matches:8,sessions:3,stable:70,patch:80,confidence:88,globalMatches:24,globalSessions:6,globalContexts:3,globalFamilies:3,globalFunctions:3} as const;
const FAMILY:Readonly<Record<GameplayActionIdR510,string>>={shortCombination:'CREATION',lineBreakingPass:'CREATION',firstTouchUnderPressure:'CONTROL_PROGRESSION',centralCarry:'CONTROL_PROGRESSION',pressEscape:'CONTROL_PROGRESSION',attackingMovement:'ATTACK_FINISHING',finishingAction:'ATTACK_FINISHING',duelShield:'DUEL_DEFENSIVE',defensiveDuel:'DUEL_DEFENSIVE',aerialDuel:'AERIAL'};
export type EvidenceOriginR518='PERSISTED_REAL'|'TEST_FIXTURE'|'UNKNOWN';
export type RealMatchCalibrationStatusR518='INSUFFICIENT_EVIDENCE'|'COLLECTING'|'READY_FOR_REVIEW'|'READY_FOR_R510_PROMOTION'|'BLOCKED';
export type RealMatchCalibrationContextR518={contextKey:string;outcomeR460:BuildOutcomeCalibrationR460;learningR470:IntelligentLearningR470Analysis;lifecycleR472:MotorLabLifecycleR472;bridgeR516:GameplayCalibrationBridgeR516};
export type RealMatchCalibrationEvidenceInputR518={origin:EvidenceOriginR518;records:readonly MatchValidationRecord[];contexts:readonly RealMatchCalibrationContextR518[]};
export type QualityGateR518={contextKey:string;id:string;passed:boolean;observed:string|number|boolean|null;required:string;reason:string};
export type RealMatchCalibrationEvidenceR518={
 version:typeof REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION;status:RealMatchCalibrationStatusR518;fingerprint:string;
 authority:{readOnly:true;productionWriteAllowed:false;automaticApplyAllowed:false;canCertifyR510:false;humanReviewRequired:true};
 evidenceSummary:{origin:EvidenceOriginR518;totalRecords:number;totalContexts:number;readyContexts:number;distinctSessions:number};
 qualityGates:QualityGateR518[];coverage:{contextCount:number;primitiveActions:GameplayActionIdR510[];primitiveFamilies:string[];usageFunctions:string[];functionalContexts:string[]};
 primitiveCandidates:GameplayCalibrationPrimitiveCandidateR516[];blockers:string[];missingRequirements:string[];
 audit:{targetR510Version:typeof GAMEPLAY_ENGINE_R510_VERSION;r510CalibrationStatus:typeof GAMEPLAY_ENGINE_R510_CALIBRATION.status;r510CertifiedForFinalWrite:typeof GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite;notes:string[]};
};
type J=null|boolean|number|string|J[]|{[key:string]:J};
type Eval={contextKey:string;ready:boolean;blocked:boolean;gates:QualityGateR518[];blockers:string[];missingRequirements:string[];candidates:GameplayCalibrationPrimitiveCandidateR516[];position:string;usageFunction:string};
const uniq=(v:readonly string[])=>[...new Set(v.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const push=(a:string[],v:string)=>{if(!a.includes(v))a.push(v)};
const gate=(contextKey:string,id:string,passed:boolean,observed:QualityGateR518['observed'],required:string,reason:string):QualityGateR518=>({contextKey,id,passed,observed,required,reason});
const complete=(c:Partial<RealMatchCalibrationContextR518>):c is RealMatchCalibrationContextR518=>Boolean(c&&c.contextKey&&c.outcomeR460&&c.learningR470&&c.lifecycleR472&&c.bridgeR516);
const session=(r:MatchValidationRecord)=>String(r.sessionIdR462||r.playedAt||r.id||'').trim();
function stable(v:J):string{if(typeof v==='number')return JSON.stringify(Number.isFinite(v)?Number(v.toFixed(4)):v);if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stable).join(',')}]`;return `{${Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>`${JSON.stringify(k)}:${stable(x)}`).join(',')}}`}
function hash(v:string){let h=0x811c9dc5;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return`r518-${h.toString(16).padStart(8,'0')}`}

export function evaluateContextR518(context:RealMatchCalibrationContextR518):Eval{
 const contextKey=String(context.contextKey||'').trim(),o=context.outcomeR460,l=context.learningR470,life=context.lifecycleR472,b=context.bridgeR516,blockers:string[]=[],missingRequirements:string[]=[];
 const gap=o.actions.filter(a=>a.status==='PERSISTENT_GAP').some(a=>b.primitiveCandidates.some(c=>c.evidenceActionIds.includes(a.id)));
 const matches=Math.min(Number(o.snapshotMatches||0),Number(o.compatibleMatches||0)),generation=Number(o.generationMatchesR464||0),generationOk=Boolean(String(o.currentGenerationSignatureR464||'').trim())&&generation>=Number(o.snapshotMatches||0),targetOk=b.target.r510===GAMEPLAY_ENGINE_R510_VERSION,readOnly=b.productionWriteAllowed===false&&b.automaticApplyAllowed===false&&b.humanReviewRequired===true,multOk=b.primitiveCandidates.every(c=>Number.isFinite(c.suggestedMultiplier)&&c.suggestedMultiplier>=1&&c.suggestedMultiplier<=L.mult);
 const gates:QualityGateR518[]=[
  gate(contextKey,'R460_ACTIVE',o.status==='ACTIVE',o.status,'ACTIVE','R460 precisa estar ACTIVE.'),
  gate(contextKey,'PERSISTENT_GAP_SUPPORTED',gap,gap,'true','Exige PERSISTENT_GAP traduzido pela R516.'),
  gate(contextKey,'R470_CALIBRATION_PROPOSED',l.proposal.status==='PROPOSED'&&l.proposal.kind==='CALIBRATION_WEIGHT',`${l.proposal.status}/${l.proposal.kind}`,'PROPOSED/CALIBRATION_WEIGHT','R470 deve propor CALIBRATION_WEIGHT.'),
  gate(contextKey,'R470_AUTO_PROMOTION_ELIGIBLE',l.proposal.autoPromotionEligible===true,l.proposal.autoPromotionEligible,'true','R470 precisa permitir revisão.'),
  gate(contextKey,'R470_CONFIDENCE',Number(l.confidence||0)>=L.confidence,Number(l.confidence||0),`>=${L.confidence}`,'Confiança R470 insuficiente.'),
  gate(contextKey,'R470_NO_DRIFT',l.drift.detected===false,l.drift.detected,'false','Drift bloqueia promoção.'),
  gate(contextKey,'R472_READY_FOR_REVIEW',life.candidate.status==='READY_FOR_REVIEW',life.candidate.status,'READY_FOR_REVIEW','R472 precisa estar READY_FOR_REVIEW.'),
  gate(contextKey,'R472_ELIGIBLE_FOR_REVIEW',life.candidate.eligibleForReview===true,life.candidate.eligibleForReview,'true','R472 precisa autorizar revisão.'),
  gate(contextKey,'MATCH_VOLUME',matches>=L.matches,matches,`>=${L.matches}`,'Exige oito partidas compatíveis.'),
  gate(contextKey,'SESSION_DIVERSITY',Number(o.distinctSessions||0)>=L.sessions,Number(o.distinctSessions||0),`>=${L.sessions}`,'Exige três sessões.'),
  gate(contextKey,'STABLE_SHARE',Number(o.stableShare||0)>=L.stable,Number(o.stableShare||0),`>=${L.stable}`,'Estabilidade insuficiente.'),
  gate(contextKey,'CURRENT_PATCH_SHARE',Number(o.currentPatchShare||0)>=L.patch,Number(o.currentPatchShare||0),`>=${L.patch}`,'Patch atual insuficiente.'),
  gate(contextKey,'GENERATION_COMPATIBILITY',generationOk,generation,`>= snapshotMatches (${Number(o.snapshotMatches||0)})`,'Geração incompatível.'),
  gate(contextKey,'R516_TARGET_VERSION',targetOk,b.target.r510,GAMEPLAY_ENGINE_R510_VERSION,'R516 deve apontar à R510 vigente.'),
  gate(contextKey,'R516_READ_ONLY',readOnly,readOnly,'true','R516 deve ser read-only.'),
  gate(contextKey,'R516_MULTIPLIER_LIMIT',multOk,b.primitiveCandidates.length?Math.max(...b.primitiveCandidates.map(c=>c.suggestedMultiplier)):null,`1..${L.mult}`,'Multiplicador R516 fora do teto.'),
 ];
 if(l.drift.detected)push(blockers,'R470_DRIFT_DETECTED');if(life.candidate.status==='BLOCKED')push(blockers,'R472_LIFECYCLE_BLOCKED');if(!targetOk)push(blockers,'R510_VERSION_MISMATCH');if(!readOnly)push(blockers,'R516_AUTHORITY_VIOLATION');if(!multOk)push(blockers,'R516_MULTIPLIER_OUT_OF_RANGE');
 const hard=new Set(['R470_NO_DRIFT','R516_TARGET_VERSION','R516_READ_ONLY','R516_MULTIPLIER_LIMIT']);for(const g of gates)if(!g.passed&&!hard.has(g.id))push(missingRequirements,g.id);
 const blocked=blockers.length>0,ready=!blocked&&gates.every(g=>g.passed);
 return{contextKey,ready,blocked,gates,blockers,missingRequirements,candidates:ready?b.primitiveCandidates.map(c=>({...c,evidenceActionIds:[...c.evidenceActionIds].sort()})):[],position:String(o.position||'').trim(),usageFunction:String(o.usageFunction||'').trim()};
}
function aggregate(evals:readonly Eval[]){const rows=new Map<GameplayActionIdR510,GameplayCalibrationPrimitiveCandidateR516>();for(const e of evals)for(const c of e.candidates){const p=rows.get(c.action);if(!p)rows.set(c.action,{...c,evidenceActionIds:[...c.evidenceActionIds]});else{p.suggestedMultiplier=Math.max(p.suggestedMultiplier,c.suggestedMultiplier);p.evidenceActionIds=uniq([...p.evidenceActionIds,...c.evidenceActionIds])}}return[...rows.values()].map(c=>({...c,evidenceActionIds:uniq(c.evidenceActionIds)})).sort((a,b)=>a.action.localeCompare(b.action))}
export function buildRealMatchCalibrationEvidenceR518(input:RealMatchCalibrationEvidenceInputR518):RealMatchCalibrationEvidenceR518{
 const blockers:string[]=[],missingRequirements:string[]=[],contextKeys=uniq(input.contexts.map(c=>String(c.contextKey??'').trim())),recordIds=uniq(input.records.map(r=>String(r.id??'').trim())),sessions=uniq(input.records.map(session)),evals:Eval[]=[];let status:RealMatchCalibrationStatusR518='COLLECTING';
 if(input.origin==='UNKNOWN'){blockers.push('EVIDENCE_ORIGIN_UNKNOWN');status='BLOCKED'}else if(input.origin==='TEST_FIXTURE')blockers.push('NON_PERSISTED_EVIDENCE');
 if(!input.records.length||!input.contexts.length){missingRequirements.push('REAL_MATCH_EVIDENCE_REQUIRED');if(status!=='BLOCKED')status='INSUFFICIENT_EVIDENCE'}
 if(input.origin==='TEST_FIXTURE'&&status==='COLLECTING')missingRequirements.push('PERSISTED_REAL_EVIDENCE_REQUIRED');
 if(input.origin==='PERSISTED_REAL'&&input.records.length&&input.contexts.length)for(const raw of input.contexts){if(!complete(raw)){push(blockers,'CONTEXT_CONTRACT_INCOMPLETE');continue}const e=evaluateContextR518(raw);evals.push(e);e.blockers.forEach(x=>push(blockers,x));e.missingRequirements.forEach(x=>push(missingRequirements,x))}
 const ready=evals.filter(e=>e.ready),primitiveCandidates=aggregate(ready),primitiveActions=primitiveCandidates.map(c=>c.action),primitiveFamilies=uniq(primitiveActions.map(a=>FAMILY[a])),usageFunctions=uniq(ready.map(e=>e.usageFunction)),functionalContexts=uniq(ready.map(e=>`${e.position}:${e.usageFunction}`)),qualityGates=evals.flatMap(e=>e.gates).sort((a,b)=>a.contextKey.localeCompare(b.contextKey)||a.id.localeCompare(b.id));
 const checks:[string,boolean][]=[['GLOBAL_MATCH_VOLUME',input.records.length>=L.globalMatches],['GLOBAL_SESSION_DIVERSITY',sessions.length>=L.globalSessions],['GLOBAL_CONTEXT_DIVERSITY',ready.length>=L.globalContexts],['GLOBAL_PRIMITIVE_FAMILY_COVERAGE',primitiveFamilies.length>=L.globalFamilies],['GLOBAL_FUNCTION_POSITION_DIVERSITY',functionalContexts.length>=L.globalFunctions]];
 if(input.origin==='PERSISTED_REAL'&&ready.length)for(const [id,ok] of checks)if(!ok)push(missingRequirements,id);
 const globalReady=input.origin==='PERSISTED_REAL'&&blockers.length===0&&checks.every(([,ok])=>ok);
 if(input.origin==='PERSISTED_REAL'&&input.records.length&&input.contexts.length)status=blockers.length?'BLOCKED':globalReady?'READY_FOR_R510_PROMOTION':ready.length?'READY_FOR_REVIEW':'COLLECTING';
 const payload:J={version:REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,origin:input.origin,contextKeys,recordIds,recordSessions:sessions,totalRecords:input.records.length,totalContexts:input.contexts.length,readyContexts:ready.length,qualityGates:qualityGates.map(g=>({contextKey:g.contextKey,id:g.id,passed:g.passed,observed:g.observed,required:g.required})),coverage:{primitiveActions,primitiveFamilies,usageFunctions,functionalContexts},primitiveCandidates:primitiveCandidates.map(c=>({action:c.action,suggestedMultiplier:c.suggestedMultiplier,evidenceActionIds:c.evidenceActionIds})),blockers:[...blockers].sort(),missingRequirements:[...missingRequirements].sort(),targetR510Version:GAMEPLAY_ENGINE_R510_VERSION,r510CalibrationStatus:GAMEPLAY_ENGINE_R510_CALIBRATION.status,r510CertifiedForFinalWrite:GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,status};
 return{version:REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,status,fingerprint:hash(stable(payload)),authority:{readOnly:true,productionWriteAllowed:false,automaticApplyAllowed:false,canCertifyR510:false,humanReviewRequired:true},evidenceSummary:{origin:input.origin,totalRecords:input.records.length,totalContexts:input.contexts.length,readyContexts:ready.length,distinctSessions:sessions.length},qualityGates,coverage:{contextCount:contextKeys.length,primitiveActions,primitiveFamilies,usageFunctions,functionalContexts},primitiveCandidates,blockers:[...blockers].sort(),missingRequirements:[...missingRequirements].sort(),audit:{targetR510Version:GAMEPLAY_ENGINE_R510_VERSION,r510CalibrationStatus:GAMEPLAY_ENGINE_R510_CALIBRATION.status,r510CertifiedForFinalWrite:GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,notes:['R518 é somente leitura e não aplica calibração automaticamente.','READY_FOR_R510_PROMOTION exige revisão humana de change-set futuro.']}};
}
export function buildPersistedRealMatchCalibrationEvidenceR518(contexts:readonly RealMatchCalibrationContextR518[]):RealMatchCalibrationEvidenceR518{return buildRealMatchCalibrationEvidenceR518({origin:'PERSISTED_REAL',records:readMatchValidationRepositoryR137(),contexts})}
