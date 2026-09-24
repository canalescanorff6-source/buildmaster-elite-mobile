import assert from 'node:assert/strict';
import { deriveMotorLabCandidateR472 } from '../src/lib/motorLabLifecycleR472';

const blockedByDrift = deriveMotorLabCandidateR472({
  proposalStatus: 'PROPOSED',
  proposalKind: 'AB_CANDIDATE',
  proposalRisk: 'MEDIUM',
  autoPromotionEligible: false,
  confidence: 88,
  driftDetected: true,
  abStatus: 'STRONG_SIGNAL',
  performanceStage: 'VALIDADA',
  performanceRisk: 'BAIXO',
  evidence: ['drift']
});
assert.equal(blockedByDrift.status, 'BLOCKED');
assert.equal(blockedByDrift.eligibleForReview, false);

const readyAb = deriveMotorLabCandidateR472({
  proposalStatus: 'PROPOSED',
  proposalKind: 'AB_CANDIDATE',
  proposalRisk: 'MEDIUM',
  autoPromotionEligible: false,
  confidence: 86,
  driftDetected: false,
  abStatus: 'STRONG_SIGNAL',
  performanceStage: 'VALIDADA',
  performanceRisk: 'BAIXO',
  evidence: ['A venceu repetidamente']
});
assert.equal(readyAb.status, 'READY_FOR_REVIEW');
assert.equal(readyAb.eligibleForReview, true);

const readyCalibration = deriveMotorLabCandidateR472({
  proposalStatus: 'PROPOSED',
  proposalKind: 'CALIBRATION_WEIGHT',
  proposalRisk: 'LOW',
  autoPromotionEligible: true,
  confidence: 91,
  driftDetected: false,
  abStatus: 'COMPARABLE',
  performanceStage: 'TESTADA',
  performanceRisk: 'BAIXO',
  evidence: ['lacuna persistente']
});
assert.equal(readyCalibration.status, 'READY_FOR_REVIEW');

const collecting = deriveMotorLabCandidateR472({
  proposalStatus: 'PROPOSED',
  proposalKind: 'CALIBRATION_WEIGHT',
  proposalRisk: 'LOW',
  autoPromotionEligible: false,
  confidence: 61,
  driftDetected: false,
  abStatus: 'COLLECTING',
  performanceStage: 'BENCHMARK',
  performanceRisk: 'MEDIO',
  evidence: []
});
assert.equal(collecting.status, 'COLLECTING');

console.log('R472 runtime aprovado: Production permanece travado; Experimental só observa; Candidate exige evidência e revisão humana.');
