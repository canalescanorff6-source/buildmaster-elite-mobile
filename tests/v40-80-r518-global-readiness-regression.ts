import assert from 'node:assert/strict';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from '../src/modules/analysis/gameplayEngineR510';
import { buildRealMatchCalibrationEvidenceR518 } from '../src/modules/analysis/realMatchCalibrationEvidenceR518';

type ContextFixtureR518 = {
  key: string;
  card: string;
  position: string;
  usageFunction: string;
  evidenceAction: string;
  primitive: GameplayActionIdR510;
  drift?: boolean;
  lifecycleBlocked?: boolean;
};

function contextFixtureR518(input: ContextFixtureR518) {
  const generation = `gen-${input.card}`;
  return {
    contextKey: input.key,
    outcomeR460: {
      version: '40.80-r460-build-outcome-learning-v1',
      status: 'ACTIVE',
      cardFingerprint: input.card,
      position: input.position,
      usageFunction: input.usageFunction,
      evidenceFingerprint: `evidence-${input.card}`,
      snapshotMatches: 8,
      compatibleMatches: 8,
      legacyMatches: 0,
      mismatchedFunctionMatches: 0,
      distinctSessions: 3,
      stableShare: 80,
      currentPatchShare: 90,
      confidenceScore: 95,
      directActionEvidenceRate: 100,
      currentGenerationSignatureR464: generation,
      generationMatchesR464: 8,
      excludedOtherGenerationMatchesR464: 0,
      actionLearningMultipliers: { [input.evidenceAction]: 1.05 },
      actions: [{
        id: input.evidenceAction,
        label: input.evidenceAction,
        status: 'PERSISTENT_GAP',
        demand: 92,
        projectedGain: 4,
        projectedScore: 84,
        observedScore: 40,
        effectiveMatches: 8,
        distinctSessions: 3,
        confidence: 94,
        learningMultiplier: 1.05,
        reason: 'Sinal persistente para calibração.',
      }],
      reasons: [],
      safeguards: [],
    },
    learningR470: {
      version: '40.80-r470-intelligent-learning-foundation-v1',
      mode: 'LOCAL_STATISTICAL_FREE',
      externalApiRequired: false,
      cardIdentity: input.card,
      usageIdentity: `${input.position}:${input.usageFunction}`,
      evidenceIdentity: `evidence-${input.card}`,
      position: input.position,
      usageFunction: input.usageFunction,
      predictedPerformance: 70,
      confidence: 92,
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
        detected: input.drift ?? false,
        delta: input.drift ? 12 : 0,
        note: input.drift ? 'Drift detectado.' : 'Sem drift.',
      },
      evidenceRetention: 'HASH_ONLY',
      proposal: {
        kind: 'CALIBRATION_WEIGHT',
        risk: 'LOW',
        status: 'PROPOSED',
        autoPromotionEligible: true,
        reason: 'Evidência pronta para revisão humana.',
        evidence: [`evidence-${input.card}`],
      },
      safeguards: [],
    },
    lifecycleR472: {
      version: '40.80-r472-motor-lab-lifecycle-v1',
      production: { stage: 'PRODUCTION', authority: 'R119_R126_R128', locked: true },
      experimental: {
        stage: 'EXPERIMENTAL', active: true, readOnly: true, source: 'R470_R90',
        confidence: 92, abStatus: 'NO_TEST', evidenceStage: 'TESTADA',
      },
      candidate: {
        stage: 'CANDIDATE',
        status: input.lifecycleBlocked ? 'BLOCKED' : 'READY_FOR_REVIEW',
        proposalKind: 'CALIBRATION_WEIGHT',
        risk: input.lifecycleBlocked ? 'HIGH' : 'LOW',
        eligibleForReview: !input.lifecycleBlocked,
        reason: input.lifecycleBlocked ? 'Candidate bloqueado.' : 'Candidate pronto para revisão humana.',
        evidence: [`evidence-${input.card}`],
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
      status: 'CANDIDATE',
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
      primitiveCandidates: [{
        action: input.primitive,
        suggestedMultiplier: 1.04,
        evidenceActionIds: [input.evidenceAction],
      }],
      unsupportedEvidenceActions: [],
    },
  } as any;
}

function recordsR518(count: number, sessions: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `global-real-${index + 1}`,
    sessionIdR462: `global-session-${(index % sessions) + 1}`,
    playedAt: `2026-09-${String((index % 24) + 1).padStart(2, '0')}T12:00:00.000Z`,
  } as any));
}

const creation = contextFixtureR518({
  key: 'card-creation:CMF:orquestrador:gen-1',
  card: 'card-creation', position: 'CMF', usageFunction: 'Orquestrador',
  evidenceAction: 'short_creation', primitive: 'shortCombination',
});
const control = contextFixtureR518({
  key: 'card-control:AMF:infiltracao:gen-2',
  card: 'card-control', position: 'AMF', usageFunction: 'Infiltração',
  evidenceAction: 'carry', primitive: 'centralCarry',
});
const attack = contextFixtureR518({
  key: 'card-attack:CF:artilheiro:gen-3',
  card: 'card-attack', position: 'CF', usageFunction: 'Artilheiro',
  evidenceAction: 'finish_box', primitive: 'finishingAction',
});

const single = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(8, 3), contexts: [creation],
});
assert.equal(single.status, 'READY_FOR_REVIEW',
  'Uma única carta/função forte nunca pode promover a calibração global da R510.');

const full = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(24, 6), contexts: [creation, control, attack],
});
assert.equal(full.status, 'READY_FOR_R510_PROMOTION',
  'Três contextos independentes e diversos, com 24 partidas/6 sessões, podem fechar readiness global.');
assert.equal(full.authority.canCertifyR510, false);
assert.equal(full.authority.productionWriteAllowed, false);
assert.equal(full.authority.automaticApplyAllowed, false);
assert.equal(full.authority.humanReviewRequired, true);
assert.equal(full.coverage.primitiveFamilies.length, 3);
assert.equal(full.coverage.functionalContexts.length, 3);

const twentyThree = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(23, 6), contexts: [creation, control, attack],
});
assert.equal(twentyThree.status, 'READY_FOR_REVIEW');
assert.ok(twentyThree.missingRequirements.includes('GLOBAL_MATCH_VOLUME'));

const fiveSessions = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(24, 5), contexts: [creation, control, attack],
});
assert.equal(fiveSessions.status, 'READY_FOR_REVIEW');
assert.ok(fiveSessions.missingRequirements.includes('GLOBAL_SESSION_DIVERSITY'));

const twoContexts = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(24, 6), contexts: [creation, control],
});
assert.equal(twoContexts.status, 'READY_FOR_REVIEW');
assert.ok(twoContexts.missingRequirements.includes('GLOBAL_CONTEXT_DIVERSITY'));

const secondCreationFamily = contextFixtureR518({
  key: 'card-creation-2:DMF:primeiro-volante:gen-4',
  card: 'card-creation-2', position: 'DMF', usageFunction: '1º Volante',
  evidenceAction: 'through_creation', primitive: 'lineBreakingPass',
});
const onlyTwoFamilies = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(24, 6), contexts: [creation, secondCreationFamily, control],
});
assert.equal(onlyTwoFamilies.status, 'READY_FOR_REVIEW');
assert.ok(onlyTwoFamilies.missingRequirements.includes('GLOBAL_PRIMITIVE_FAMILY_COVERAGE'));

const sameFunctionalContext = contextFixtureR518({
  key: 'card-attack-2:CMF:orquestrador:gen-5',
  card: 'card-attack-2', position: 'CMF', usageFunction: 'Orquestrador',
  evidenceAction: 'finish_box', primitive: 'finishingAction',
});
const onlyTwoFunctionalContexts = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL', records: recordsR518(24, 6), contexts: [creation, control, sameFunctionalContext],
});
assert.equal(onlyTwoFunctionalContexts.status, 'READY_FOR_REVIEW');
assert.ok(onlyTwoFunctionalContexts.missingRequirements.includes('GLOBAL_FUNCTION_POSITION_DIVERSITY'));

const driftedGlobal = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL',
  records: recordsR518(24, 6),
  contexts: [creation, control, contextFixtureR518({
    key: 'card-drift:CF:artilheiro:gen-drift', card: 'card-drift', position: 'CF', usageFunction: 'Artilheiro',
    evidenceAction: 'finish_box', primitive: 'finishingAction', drift: true,
  })],
});
assert.equal(driftedGlobal.status, 'BLOCKED');
assert.ok(driftedGlobal.blockers.includes('R470_DRIFT_DETECTED'));

const blockedLifecycleGlobal = buildRealMatchCalibrationEvidenceR518({
  origin: 'PERSISTED_REAL',
  records: recordsR518(24, 6),
  contexts: [creation, control, contextFixtureR518({
    key: 'card-blocked:CF:artilheiro:gen-blocked', card: 'card-blocked', position: 'CF', usageFunction: 'Artilheiro',
    evidenceAction: 'finish_box', primitive: 'finishingAction', lifecycleBlocked: true,
  })],
});
assert.equal(blockedLifecycleGlobal.status, 'BLOCKED');
assert.ok(blockedLifecycleGlobal.blockers.includes('R472_LIFECYCLE_BLOCKED'));

console.log('R518 global readiness aprovado: diversidade impede promoção por uma única carta/função e mantém autoridade read-only.');
