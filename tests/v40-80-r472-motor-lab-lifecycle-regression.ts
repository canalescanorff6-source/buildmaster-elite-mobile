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

// R516 fecha a cadeia de evidência real imediatamente após o lifecycle R472.
// O import é intencional: o workflow de PR já executa test:r472, portanto
// qualquer regressão na ponte R460 → R470 → R510/R511 → R472 quebra este gate.
require('./v40-80-r516-real-match-calibration-bridge-regression.ts');

console.log('R472 runtime aprovado: Production permanece travado; Experimental só observa; Candidate exige evidência e revisão humana; R516 também protegido.');
