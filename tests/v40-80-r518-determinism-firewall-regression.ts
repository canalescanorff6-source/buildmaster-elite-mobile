import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from '../src/modules/analysis/gameplayEngineR510';
import { buildRealMatchCalibrationEvidenceR518 } from '../src/modules/analysis/realMatchCalibrationEvidenceR518';

function contextR518(
  index: number,
  position: string,
  usageFunction: string,
  evidenceAction: string,
  primitive: GameplayActionIdR510,
  multiplier = 1.04,
) {
  const card = `det-card-${index}`;
  const generation = `det-gen-${index}`;
  return {
    contextKey: `${card}:${position}:${usageFunction}:${generation}`,
    cardOverall: 100,
    maxOverall: 105,
    GER: 103,
    outcomeR460: {
      version: '40.80-r460-build-outcome-learning-v1',
      status: 'ACTIVE',
      cardFingerprint: card,
      position,
      usageFunction,
      evidenceFingerprint: `det-evidence-${index}`,
      snapshotMatches: 8,
      compatibleMatches: 8,
      legacyMatches: 0,
      mismatchedFunctionMatches: 0,
      distinctSessions: 3,
      stableShare: 82,
      currentPatchShare: 91,
      confidenceScore: 95,
      directActionEvidenceRate: 100,
      currentGenerationSignatureR464: generation,
      generationMatchesR464: 8,
      excludedOtherGenerationMatchesR464: 0,
      actionLearningMultipliers: { [evidenceAction]: 1.05 },
      actions: [{
        id: evidenceAction,
        label: evidenceAction,
        status: 'PERSISTENT_GAP',
        demand: 92,
        projectedGain: 4,
        projectedScore: 84,
        observedScore: 40,
        effectiveMatches: 8,
        distinctSessions: 3,
        confidence: 94,
        learningMultiplier: 1.05,
        reason: 'Gap persistente.',
      }],
      reasons: [],
      safeguards: [],
    },
    learningR470: {
      version: '40.80-r470-intelligent-learning-foundation-v1',
      mode: 'LOCAL_STATISTICAL_FREE',
      externalApiRequired: false,
      cardIdentity: card,
      usageIdentity: `${position}:${usageFunction}`,
      evidenceIdentity: `det-evidence-${index}`,
      position,
      usageFunction,
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
      drift: { detected: false, delta: 0, note: 'Sem drift.' },
      evidenceRetention: 'HASH_ONLY',
      proposal: {
        kind: 'CALIBRATION_WEIGHT', risk: 'LOW', status: 'PROPOSED', autoPromotionEligible: true,
        reason: 'Pronto para revisão.', evidence: [`det-evidence-${index}`],
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
        stage: 'CANDIDATE', status: 'READY_FOR_REVIEW', proposalKind: 'CALIBRATION_WEIGHT',
        risk: 'LOW', eligibleForReview: true, reason: 'Pronto.', evidence: [`det-evidence-${index}`],
      },
      promotion: {
        automaticCodeMutation: false, automaticBuildMutation: false, humanApprovalRequired: true,
        zeroRedRequired: true, fullRegressionRequired: true, apkPublicationVerificationRequired: true,
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
        action: primitive,
        suggestedMultiplier: multiplier,
        evidenceActionIds: [evidenceAction],
      }],
      unsupportedEvidenceActions: [],
    },
  } as any;
}

function recordsR518() {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `det-record-${index + 1}`,
    sessionIdR462: `det-session-${(index % 6) + 1}`,
    playedAt: `2026-09-${String((index % 24) + 1).padStart(2, '0')}T12:00:00.000Z`,
    cardOverall: 99,
    maxOverall: 105,
    GER: 102,
  } as any));
}

function baseInput(multiplier = 1.04) {
  return {
    origin: 'PERSISTED_REAL' as const,
    records: recordsR518(),
    contexts: [
      contextR518(1, 'CMF', 'Orquestrador', 'short_creation', 'shortCombination', multiplier),
      contextR518(2, 'AMF', 'Infiltração', 'carry', 'centralCarry', 1.03),
      contextR518(3, 'CF', 'Artilheiro', 'finish_box', 'finishingAction', 1.05),
    ],
  };
}

const input = baseInput();
const expected = buildRealMatchCalibrationEvidenceR518(input);
assert.equal(expected.status, 'READY_FOR_R510_PROMOTION');

for (let index = 0; index < 100; index += 1) {
  assert.deepEqual(buildRealMatchCalibrationEvidenceR518(input), expected,
    '100 execuções idênticas precisam produzir o mesmo dossiê integralmente.');
}

const shuffled = {
  ...input,
  records: [...input.records].reverse(),
  contexts: [input.contexts[2], input.contexts[0], input.contexts[1]],
};
assert.deepEqual(buildRealMatchCalibrationEvidenceR518(shuffled), expected,
  'Ordem de chegada de records/contextos não pode mudar status, fingerprint ou cobertura.');

const changedGer = {
  ...input,
  records: input.records.map(record => ({ ...record, cardOverall: 12, maxOverall: 13, GER: 14 })),
  contexts: input.contexts.map(context => ({ ...context, cardOverall: 55, maxOverall: 56, GER: 57 })),
};
assert.deepEqual(buildRealMatchCalibrationEvidenceR518(changedGer), expected,
  'Alterar somente GER/Overall da carta não pode afetar a certificação funcional R518.');

const floatNoise = buildRealMatchCalibrationEvidenceR518(baseInput(1.0400000000003));
assert.equal(floatNoise.fingerprint, expected.fingerprint,
  'Ruído de ponto flutuante além da precisão canônica não pode mudar o fingerprint R518.');

const source = readFileSync(
  require.resolve('../src/modules/analysis/realMatchCalibrationEvidenceR518'),
  'utf8',
);
assert.equal(/\boverall\b|maxOverall|\bger\b/i.test(source), false,
  'O source R518 não pode usar GER/Overall da carta em decisão, cobertura ou fingerprint.');
assert.equal(/Date\.now\(|Math\.random\(/.test(source), false,
  'Fingerprint R518 não pode depender de relógio ou aleatoriedade.');

console.log('R518 determinismo aprovado: 100x, shuffle, precisão canônica e firewall GER/Overall.');
