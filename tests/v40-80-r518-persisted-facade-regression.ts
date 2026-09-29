import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setActiveAccountIdentity } from '../src/lib/accountStorage';
import {
  persistMatchValidationRepositoryR137,
  readMatchValidationRepositoryR137,
} from '../src/modules/matches/matchValidationRepositoryR137';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from '../src/modules/analysis/gameplayEngineR510';
import * as analysisFacade from '../src/modules/analysis/index';
import {
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  buildPersistedRealMatchCalibrationEvidenceR518,
  buildRealMatchCalibrationEvidenceR518,
} from '../src/modules/analysis/realMatchCalibrationEvidenceR518';

class MemoryStorage {
  private readonly store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(String(key), String(value)); }
}

const storage = new MemoryStorage();
(globalThis as any).window = {
  localStorage: storage,
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
};
if (typeof (globalThis as any).CustomEvent !== 'function') {
  (globalThis as any).CustomEvent = class CustomEventMock {
    type: string;
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

setActiveAccountIdentity({
  id: 'r518-persisted-test',
  username: 'r518-test',
  role: 'user',
  mode: 'local',
});

function recordsR518() {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `persisted-r518-${index + 1}`,
    cardFingerprint: `persisted-card-${(index % 3) + 1}`,
    targetPosition: ['CMF', 'AMF', 'CF'][index % 3],
    playedAt: `2026-09-${String((index % 24) + 1).padStart(2, '0')}T12:00:00.000Z`,
    sessionIdR462: `persisted-session-${(index % 6) + 1}`,
    buildSignature: 'persisted-build',
    minutes: 90,
    overallRating: 3,
    passing: 3,
    movement: 3,
    finishing: 3,
    defending: 3,
    physical: 3,
    stamina: 3,
  } as any));
}

function contextR518(
  index: number,
  position: string,
  usageFunction: string,
  evidenceAction: string,
  primitive: GameplayActionIdR510,
) {
  const card = `persisted-card-${index}`;
  const generation = `persisted-gen-${index}`;
  return {
    contextKey: `${card}:${position}:${usageFunction}:${generation}`,
    outcomeR460: {
      version: '40.80-r460-build-outcome-learning-v1', status: 'ACTIVE', cardFingerprint: card,
      position, usageFunction, evidenceFingerprint: `persisted-evidence-${index}`,
      snapshotMatches: 8, compatibleMatches: 8, legacyMatches: 0, mismatchedFunctionMatches: 0,
      distinctSessions: 3, stableShare: 82, currentPatchShare: 91, confidenceScore: 95,
      directActionEvidenceRate: 100, currentGenerationSignatureR464: generation,
      generationMatchesR464: 8, excludedOtherGenerationMatchesR464: 0,
      actionLearningMultipliers: { [evidenceAction]: 1.05 },
      actions: [{
        id: evidenceAction, label: evidenceAction, status: 'PERSISTENT_GAP', demand: 92,
        projectedGain: 4, projectedScore: 84, observedScore: 40, effectiveMatches: 8,
        distinctSessions: 3, confidence: 94, learningMultiplier: 1.05, reason: 'Gap persistente.',
      }],
      reasons: [], safeguards: [],
    },
    learningR470: {
      version: '40.80-r470-intelligent-learning-foundation-v1', mode: 'LOCAL_STATISTICAL_FREE',
      externalApiRequired: false, cardIdentity: card, usageIdentity: `${position}:${usageFunction}`,
      evidenceIdentity: `persisted-evidence-${index}`, position, usageFunction,
      predictedPerformance: 70, confidence: 92, confidenceLevel: 'HIGH', scopes: [],
      experiment: {
        status: 'NO_TEST', armA: { rawMatches: 0, effectiveMatches: 0, distinctSessions: 0, score: null },
        armB: { rawMatches: 0, effectiveMatches: 0, distinctSessions: 0, score: null },
        difference: null, evidenceLeadingArm: null, confidence: 0, note: 'Sem A/B.',
      },
      drift: { detected: false, delta: 0, note: 'Sem drift.' }, evidenceRetention: 'HASH_ONLY',
      proposal: {
        kind: 'CALIBRATION_WEIGHT', risk: 'LOW', status: 'PROPOSED', autoPromotionEligible: true,
        reason: 'Pronto para revisão.', evidence: [`persisted-evidence-${index}`],
      },
      safeguards: [],
    },
    lifecycleR472: {
      version: '40.80-r472-motor-lab-lifecycle-v1',
      production: { stage: 'PRODUCTION', authority: 'R119_R126_R128', locked: true },
      experimental: {
        stage: 'EXPERIMENTAL', active: true, readOnly: true, source: 'R470_R90', confidence: 92,
        abStatus: 'NO_TEST', evidenceStage: 'TESTADA',
      },
      candidate: {
        stage: 'CANDIDATE', status: 'READY_FOR_REVIEW', proposalKind: 'CALIBRATION_WEIGHT', risk: 'LOW',
        eligibleForReview: true, reason: 'Pronto.', evidence: [`persisted-evidence-${index}`],
      },
      promotion: {
        automaticCodeMutation: false, automaticBuildMutation: false, humanApprovalRequired: true,
        zeroRedRequired: true, fullRegressionRequired: true, apkPublicationVerificationRequired: true,
      },
    },
    bridgeR516: {
      version: '40.80-r516-real-match-calibration-contract-v1', mode: 'READ_ONLY_EXPERIMENTAL', status: 'CANDIDATE',
      source: {
        r460: '40.80-r460-build-outcome-learning-v1',
        r470: '40.80-r470-intelligent-learning-foundation-v1',
      },
      target: {
        r510: GAMEPLAY_ENGINE_R510_VERSION,
        r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
        certifiedForFinalWrite: false,
      },
      productionWriteAllowed: false, automaticApplyAllowed: false, humanReviewRequired: true,
      primitiveCandidates: [{ action: primitive, suggestedMultiplier: 1.04, evidenceActionIds: [evidenceAction] }],
      unsupportedEvidenceActions: [],
    },
  } as any;
}

const records = recordsR518();
const contexts = [
  contextR518(1, 'CMF', 'Orquestrador', 'short_creation', 'shortCombination'),
  contextR518(2, 'AMF', 'Infiltração', 'carry', 'centralCarry'),
  contextR518(3, 'CF', 'Artilheiro', 'finish_box', 'finishingAction'),
];

const synthetic = buildRealMatchCalibrationEvidenceR518({
  origin: 'TEST_FIXTURE', records, contexts,
});
assert.notEqual(synthetic.status, 'READY_FOR_R510_PROMOTION',
  'Mesmo dataset logicamente forte não pode ser promovido quando sua origem é TEST_FIXTURE.');
assert.ok(synthetic.blockers.includes('NON_PERSISTED_EVIDENCE'));

const persisted = persistMatchValidationRepositoryR137(records);
assert.equal(persisted.persisted, true, 'Pré-condição: a evidência deve ser realmente gravada pelo R137.');
assert.equal(readMatchValidationRepositoryR137().length, 24,
  'Pré-condição: o wrapper precisa ler as 24 partidas da fonte R137 escopada por conta.');

const operational = buildPersistedRealMatchCalibrationEvidenceR518(contexts);
assert.equal(operational.status, 'READY_FOR_R510_PROMOTION');
assert.equal(operational.evidenceSummary.origin, 'PERSISTED_REAL');
assert.equal(operational.evidenceSummary.totalRecords, 24);
assert.equal(operational.authority.readOnly, true);
assert.equal(operational.authority.productionWriteAllowed, false);
assert.equal(operational.authority.canCertifyR510, false);

const unknown = buildRealMatchCalibrationEvidenceR518({
  origin: 'UNKNOWN', records, contexts,
});
assert.equal(unknown.status, 'BLOCKED');

assert.equal(analysisFacade.REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION);
assert.equal(typeof analysisFacade.buildRealMatchCalibrationEvidenceR518, 'function');
assert.equal(typeof analysisFacade.buildPersistedRealMatchCalibrationEvidenceR518, 'function');
assert.equal(typeof analysisFacade.evaluateContextR518, 'function');

const source = readFileSync(
  require.resolve('../src/modules/analysis/realMatchCalibrationEvidenceR518'),
  'utf8',
);
assert.equal(/persistMatchValidationRepositoryR137|writeAccountStorage|writeMatch|saveMatch/i.test(source), false,
  'O adaptador R518 pode ler R137, mas não pode ganhar qualquer caminho de persistência.');
assert.ok(/readMatchValidationRepositoryR137/.test(source),
  'Origem PERSISTED_REAL operacional deve vir explicitamente do leitor R137.');

console.log('R518 persisted facade aprovado: TEST_FIXTURE não promove, R137 real pode alimentar readiness e a fachada permanece read-only.');
