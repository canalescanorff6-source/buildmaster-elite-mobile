import { INTELLIGENT_LEARNING_R470_VERSION, type LearningProposalR470 } from '../../lib/intelligentLearningR470';
import type { BuildOutcomeCalibrationR460 } from '../matches/buildOutcomeCalibrationR460';
import { GAMEPLAY_ENGINE_R510_CALIBRATION, GAMEPLAY_ENGINE_R510_VERSION, type GameplayActionIdR510 } from './gameplayEngineR510';

export const GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION='40.80-r516-real-match-calibration-contract-v1' as const;
const MAX_MULTIPLIER_R516=1.06;
type MappingR516=readonly [GameplayActionIdR510,number][];
export type GameplayCalibrationBridgeInputR516={outcome:BuildOutcomeCalibrationR460;proposal:LearningProposalR470};
export type GameplayCalibrationPrimitiveCandidateR516={action:GameplayActionIdR510;suggestedMultiplier:number;evidenceActionIds:string[]};
export type GameplayCalibrationBridgeR516={
 version:typeof GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION;mode:'READ_ONLY_EXPERIMENTAL';status:'CANDIDATE'|'OBSERVE';
 source:{r460:BuildOutcomeCalibrationR460['version'];r470:typeof INTELLIGENT_LEARNING_R470_VERSION};
 target:{r510:typeof GAMEPLAY_ENGINE_R510_VERSION;r510CalibrationStatus:typeof GAMEPLAY_ENGINE_R510_CALIBRATION.status;certifiedForFinalWrite:typeof GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite};
 productionWriteAllowed:false;automaticApplyAllowed:false;humanReviewRequired:true;
 primitiveCandidates:GameplayCalibrationPrimitiveCandidateR516[];unsupportedEvidenceActions:string[];
};
const ACTION_MAP_R516:Readonly<Record<string,MappingR516>>={
 attack_space:[['attackingMovement',1]],finish_box:[['finishingAction',.8],['attackingMovement',.2]],turn_finish:[['finishingAction',.55],['pressEscape',.25],['centralCarry',.2]],long_finish:[['finishingAction',1]],close_control:[['firstTouchUnderPressure',.45],['centralCarry',.3],['pressEscape',.25]],carry:[['centralCarry',.7],['pressEscape',.3]],short_creation:[['shortCombination',.7],['lineBreakingPass',.3]],through_creation:[['lineBreakingPass',.8],['shortCombination',.2]],hold_up:[['duelShield',.7],['firstTouchUnderPressure',.3]],aerial_finish:[['aerialDuel',.55],['finishingAction',.45]],aerial_defend:[['aerialDuel',.55],['defensiveDuel',.45]],press_recover:[['defensiveDuel',1]],intercept:[['defensiveDuel',1]],defensive_duel:[['defensiveDuel',1]],build_out:[['shortCombination',.5],['lineBreakingPass',.3],['pressEscape',.2]],
};
const clampR516=(value:number)=>Math.max(1,Math.min(MAX_MULTIPLIER_R516,Number.isFinite(value)?value:1));
export function buildGameplayCalibrationBridgeR516(input:GameplayCalibrationBridgeInputR516):GameplayCalibrationBridgeR516{
 const gateOpen=input.outcome.status==='ACTIVE'&&input.proposal.status==='PROPOSED'&&input.proposal.kind==='CALIBRATION_WEIGHT';
 const rows=new Map<GameplayActionIdR510,GameplayCalibrationPrimitiveCandidateR516>(),unsupported:string[]=[];
 if(gateOpen)for(const evidence of input.outcome.actions.filter(item=>item.status==='PERSISTENT_GAP')){
  const mapping=ACTION_MAP_R516[evidence.id];if(!mapping?.length){if(!unsupported.includes(evidence.id))unsupported.push(evidence.id);continue}
  const learned=Number(input.outcome.actionLearningMultipliers[evidence.id]);const source=clampR516(Number.isFinite(learned)?learned:Number(evidence.learningMultiplier||1));
  for(const [action,share] of mapping){const suggestedMultiplier=Number((1+(source-1)*share).toFixed(4)),previous=rows.get(action);
   if(!previous)rows.set(action,{action,suggestedMultiplier,evidenceActionIds:[evidence.id]});
   else{previous.suggestedMultiplier=Math.max(previous.suggestedMultiplier,suggestedMultiplier);if(!previous.evidenceActionIds.includes(evidence.id))previous.evidenceActionIds.push(evidence.id)}
  }
 }
 const primitiveCandidates=[...rows.values()].map(candidate=>({...candidate,evidenceActionIds:[...candidate.evidenceActionIds].sort()})).sort((a,b)=>a.action.localeCompare(b.action));
 return{version:GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION,mode:'READ_ONLY_EXPERIMENTAL',status:gateOpen&&primitiveCandidates.length?'CANDIDATE':'OBSERVE',source:{r460:input.outcome.version,r470:INTELLIGENT_LEARNING_R470_VERSION},target:{r510:GAMEPLAY_ENGINE_R510_VERSION,r510CalibrationStatus:GAMEPLAY_ENGINE_R510_CALIBRATION.status,certifiedForFinalWrite:GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite},productionWriteAllowed:false,automaticApplyAllowed:false,humanReviewRequired:true,primitiveCandidates,unsupportedEvidenceActions:unsupported.sort()};
}
