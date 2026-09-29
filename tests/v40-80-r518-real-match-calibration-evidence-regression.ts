import assert from 'node:assert/strict';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_SEED_POLICY,
  GAMEPLAY_ENGINE_R510_VERSION,
} from '../src/modules/analysis/gameplayEngineR510';
import {
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  buildRealMatchCalibrationEvidenceR518,
  type RealMatchCalibrationEvidenceInputR518,
} from '../src/modules/analysis/realMatchCalibrationEvidenceR518';

const seedBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY);
const calibrationBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION);

const emptyInput: RealMatchCalibrationEvidenceInputR518 = {
  origin: 'PERSISTED_REAL',
  records: [],
  contexts: [],
};

const empty = buildRealMatchCalibrationEvidenceR518(emptyInput);
assert.equal(
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  '40.80-r518-real-match-calibration-evidence-v1',
);
assert.equal(empty.version, REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION);
assert.equal(empty.status, 'INSUFFICIENT_EVIDENCE',
  'Sem partidas/contextos reais, R518 deve falhar fechado por evidência insuficiente.');
assert.equal(empty.authority.readOnly, true);
assert.equal(empty.authority.productionWriteAllowed, false);
assert.equal(empty.authority.automaticApplyAllowed, false);
assert.equal(empty.authority.canCertifyR510, false);
assert.equal(empty.authority.humanReviewRequired, true);
assert.equal(empty.evidenceSummary.origin, 'PERSISTED_REAL');
assert.equal(empty.evidenceSummary.totalRecords, 0);
assert.equal(empty.evidenceSummary.totalContexts, 0);
assert.deepEqual(empty.primitiveCandidates, []);
assert.ok(empty.missingRequirements.includes('REAL_MATCH_EVIDENCE_REQUIRED'));
assert.equal(typeof empty.fingerprint, 'string');
assert.ok(empty.fingerprint.length > 0);

const fixture = buildRealMatchCalibrationEvidenceR518({
  origin: 'TEST_FIXTURE',
  records: [{ id: 'fixture-record' } as any],
  contexts: [{ contextKey: 'fixture-context' } as any],
});
assert.ok(
  fixture.status === 'INSUFFICIENT_EVIDENCE' || fixture.status === 'COLLECTING',
  'Fixture sintética pode testar software, mas não pode declarar readiness operacional.',
);
assert.notEqual(fixture.status, 'READY_FOR_REVIEW');
assert.notEqual(fixture.status, 'READY_FOR_R510_PROMOTION');
assert.ok(fixture.blockers.includes('NON_PERSISTED_EVIDENCE'));

const unknown = buildRealMatchCalibrationEvidenceR518({
  origin: 'UNKNOWN',
  records: [{ id: 'unknown-record' } as any],
  contexts: [{ contextKey: 'unknown-context' } as any],
});
assert.equal(unknown.status, 'BLOCKED',
  'Origem desconhecida deve falhar fechado em vez de ser presumida como evidência real.');
assert.ok(unknown.blockers.includes('EVIDENCE_ORIGIN_UNKNOWN'));

const repeatA = buildRealMatchCalibrationEvidenceR518(emptyInput);
const repeatB = buildRealMatchCalibrationEvidenceR518(emptyInput);
assert.deepEqual(repeatA, repeatB,
  'Mesmo input básico deve produzir exatamente o mesmo dossiê R518.');
assert.equal(repeatA.fingerprint, repeatB.fingerprint);

type ContextOptions = {
  matches?: number;
  sessions?: number;
  stableShare?: number;
  currentPatchShare?: number;
  confidence?: number;
  drift?: boolean;
  lifecycleStatus?: 'NONE' | 'COLLECTING' | 'READY_FOR_REVIEW' | 'BLOCKED';
  eligibleForReview?: boolean;
  outcomeStatus?: string;
  persistentGap?: boolean;
  proposalStatus?: 'OBSERVE' | 'PROPOSED';
  proposalKind?: 'OBSERVE' | 'CALIBRATION_WEIGHT' | 'AB_CANDIDATE';
  autoPromotionEligible?: boolean;
  generationMatches?: number;
  candidateMultiplier?: number;
};

function contextFixture(options: ContextOptions = {}) {
  const matches = options.matches ?? 8;
  const sessions = options.sessions ?? 3;
  const persistentGap = options.persistentGap ?? true;
  const candidateMultiplier = options.candidateMultiplier ?? 1.04;
  return {
    contextKey: 'card-1:CMF:orquestrador:gen-1',
    outcomeR460: {
      version: '40.80-r460-build-outcome-learning-v1',
      status: options.outcomeStatus ?? 'ACTIVE',
      cardFingerprint: 'card-1',
      position: 'CMF',
      usageFunction: 'Orquestrador',
      evidenceFingerprint: 'evidence-1',
      snapshotMatches: matches,
      compatibleMatches: matches,
      legacyMatches: 0,
      mismatchedFunctionMatches: 0,
      distinctSessions: sessions,
      stableShare: options.stableShare ?? 70,
      currentPatchShare: options.currentPatchShare ?? 80,
      confidenceScore: 95,
      directActionEvidenceRate: 100,
      currentGenerationSignatureR464: 'gen-1',
      generationMatchesR464: options.generationMatches ?? matches,
      excludedOtherGenerationMatchesR464: 0,
      actionLearningMultipliers: { short_creation: 1.06 },
      actions: [{
        id: 'short_creation',
        label: 'Tabela / passe curto',
        status: persistentGap ? 'PERSISTENT_GAP' : 'VALIDATED',
        demand: 95,
        projectedGain: 4.5,
        projectedScore: 86,
        observedScore: 42,
        effectiveMatches: matches,
        distinctSessions: sessions,
        confidence: 95,
        learningMultiplier: 1.06,
        reason: 'Gap persistente de passe curto.',
      }],
      reasons: [],
      safeguards: [],
    },
    learningR470: {
      version: '40.80-r470-intelligent-learning-foundation-v1',
      mode: 'LOCAL_STATISTICAL_FREE',
      externalApiRequired: false,
      cardIdentity: 'card-1',
      usageIdentity: 'CMF:orquestrador',
      evidenceIdentity: 'evidence-1',
      position: 'CMF',
      usageFunction: 'Orquestrador',
      predictedPerformance: 70,
      confidence: options.confidence ?? 88,
      confidenceLevel: 'HIGH',
      scopes: [],
      experiment: {
        status: 'NO_TEST',
        armA: { rawMatches: 0, effectiveMatches: 0, distinctSessions: 0, score: null },
        armB: { rawMatches: 0, effectiveMatches: 0, distinctSessions: 0, score: null },
        difference: null,
        evidenceLeadingArm: null,
        confidence: 0,
        note: 'Sem A/B.',
      },
      drift: {
        detected: options.drift ?? false,
        delta: options.drift ? 12 : 0,
        note: options.drift ? 'Drift detectado.' : 'Sem drift.',
      },
      evidenceRetention: 'HASH_ONLY',
      proposal: {
        kind: options.proposalKind ?? 'CALIBRATION_WEIGHT',
        risk: 'LOW',
        status: options.proposalStatus ?? 'PROPOSED',
        autoPromotionEligible: options.autoPromotionEligible ?? true,
        reason: 'Candidato para revisão humana.',
        evidence: ['evidence-1'],
      },
      safeguards: [],
    },
    lifecycleR472: {
      version: '40.80-r472-motor-lab-lifecycle-v1',
      production: { stage: 'PRODUCTION', authority: 'R119_R126_R128', locked: true },
      experimental: {
        stage: 'EXPERIMENTAL',
        active: true,
        readOnly: true,
        source: 'R470_R90',
        confidence: options.confidence ?? 88,
        abStatus: 'NO_TEST',
        evidenceStage: 'TESTADA',
      },
      candidate: {
        stage: 'CANDIDATE',
        status: options.lifecycleStatus ?? 'READY_FOR_REVIEW',
        proposalKind: options.proposalKind ?? 'CALIBRATION_WEIGHT',
        risk: 'LOW',
        eligibleForReview: options.eligibleForReview ?? true,
        reason: 'Candidate pronto para revisão humana.',
        evidence: ['evidence-1'],
      },
      promotion: {
        automaticCodeMutation: false,
        automaticBuildMutation: false,
        humanApprovalRequired: true,
        zeroRedRequired: true,
        fullRegressionRequired: true,
        apkPublicationVerificationRequired: true,
      },
    },
    bridgeR516: {
      version: '40.80-r516-real-match-calibration-contract-v1',
      mode: 'READ_ONLY_EXPERIMENTAL',
      status: persistentGap ? 'CANDIDATE' : 'OBSERVE',
      source: {
        r460: '40.80-r460-build-outcome-learning-v1',
        r470: '40.80-r470-intelligent-learning-foundation-v1',
      },
      target: {
        r510: GAMEPLAY_ENGINE_R510_VERSION,
        r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
        certifiedForFinalWrite: false,
      },
      productionWriteAllowed: false,
      automaticApplyAllowed: false,
      humanReviewRequired: true,
      primitiveCandidates: persistentGap ? [{
        action: 'shortCombination',
        suggestedMultiplier: candidateMultiplier,
        evidenceActionIds: ['short_creation'],
      }] : [],
      unsupportedEvidenceActions: [],
    },
  } as any;
}

function recordsFixture(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `real-${index + 1}` } as any));
}

function localDossier(options: ContextOptions = {}) {
  const matches = options.matches ?? 8;
  return buildRealMatchCalibrationEvidenceR518({
    origin: 'PERSISTED_REAL',
    records: recordsFixture(matches),
    contexts: [contextFixture(options)],
  });
}

const localReady = localDossier();
assert.equal(localReady.status, 'READY_FOR_REVIEW',
  'Um contexto forte pode chegar a revisão humana, mas ainda não promove a R510 globalmente.');
assert.notEqual(localReady.status, 'READY_FOR_R510_PROMOTION');
assert.equal(localReady.authority.canCertifyR510, false);
assert.ok(localReady.primitiveCandidates.some(item => item.action === 'shortCombination'));

const sevenMatches = localDossier({ matches: 7 });
assert.equal(sevenMatches.status, 'COLLECTING');
assert.equal(sevenMatches.qualityGates.find(gate => gate.id === 'MATCH_VOLUME')?.passed, false);
assert.equal(localDossier({ matches: 8 }).status, 'READY_FOR_REVIEW');

const twoSessions = localDossier({ sessions: 2 });
assert.equal(twoSessions.status, 'COLLECTING');
assert.equal(twoSessions.qualityGates.find(gate => gate.id === 'SESSION_DIVERSITY')?.passed, false);
assert.equal(localDossier({ sessions: 3 }).status, 'READY_FOR_REVIEW');

assert.equal(localDossier({ stableShare: 69 }).status, 'COLLECTING');
assert.equal(localDossier({ stableShare: 70 }).status, 'READY_FOR_REVIEW');
assert.equal(localDossier({ currentPatchShare: 79 }).status, 'COLLECTING');
assert.equal(localDossier({ currentPatchShare: 80 }).status, 'READY_FOR_REVIEW');
assert.equal(localDossier({ confidence: 87 }).status, 'COLLECTING');
assert.equal(localDossier({ confidence: 88 }).status, 'READY_FOR_REVIEW');

const drifted = localDossier({ drift: true });
assert.equal(drifted.status, 'BLOCKED');
assert.ok(drifted.blockers.includes('R470_DRIFT_DETECTED'));

assert.equal(localDossier({ lifecycleStatus: 'COLLECTING' }).status, 'COLLECTING');
assert.equal(localDossier({ eligibleForReview: false }).status, 'COLLECTING');
assert.equal(localDossier({ persistentGap: false }).status, 'COLLECTING');
assert.equal(localDossier({ proposalStatus: 'OBSERVE', proposalKind: 'OBSERVE', autoPromotionEligible: false }).status, 'COLLECTING');
assert.equal(localDossier({ generationMatches: 7 }).status, 'COLLECTING');

const outOfRange = localDossier({ candidateMultiplier: 1.061 });
assert.equal(outOfRange.status, 'BLOCKED');
assert.ok(outOfRange.blockers.includes('R516_MULTIPLIER_OUT_OF_RANGE'));

assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY), seedBefore,
  'R518 não pode mutar a seed policy R510.');
assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION), calibrationBefore,
  'R518 não pode mutar o estado oficial de calibração R510.');
assert.equal(GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite, false,
  'Este change-set não pode promover R510 silenciosamente.');

console.log('R518 aprovado: origem explícita, gates locais fail-closed e autoridade read-only.');
