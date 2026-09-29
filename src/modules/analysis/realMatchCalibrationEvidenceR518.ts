import type { MatchValidationRecord } from '../../lib/appEvolution';
import type { IntelligentLearningR470Analysis } from '../../lib/intelligentLearningR470';
import type { MotorLabLifecycleR472 } from '../../lib/motorLabLifecycleR472';
import type { BuildOutcomeCalibrationR460 } from '../matches/buildOutcomeCalibrationR460';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from './gameplayEngineR510';
import type {
  GameplayCalibrationBridgeR516,
  GameplayCalibrationPrimitiveCandidateR516,
} from './gameplayCalibrationBridgeR516';

export const REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION =
  '40.80-r518-real-match-calibration-evidence-v1' as const;

const MAX_R516_MULTIPLIER_R518 = 1.06;
const MIN_LOCAL_MATCHES_R518 = 8;
const MIN_LOCAL_SESSIONS_R518 = 3;
const MIN_STABLE_SHARE_R518 = 70;
const MIN_CURRENT_PATCH_SHARE_R518 = 80;
const MIN_R470_CONFIDENCE_R518 = 88;
const MIN_GLOBAL_MATCHES_R518 = 24;
const MIN_GLOBAL_SESSIONS_R518 = 6;
const MIN_GLOBAL_CONTEXTS_R518 = 3;
const MIN_GLOBAL_PRIMITIVE_FAMILIES_R518 = 3;
const MIN_GLOBAL_FUNCTIONAL_CONTEXTS_R518 = 3;

const PRIMITIVE_FAMILY_R518: Readonly<Record<GameplayActionIdR510, string>> = {
  shortCombination: 'CREATION',
  lineBreakingPass: 'CREATION',
  firstTouchUnderPressure: 'CONTROL_PROGRESSION',
  centralCarry: 'CONTROL_PROGRESSION',
  pressEscape: 'CONTROL_PROGRESSION',
  attackingMovement: 'ATTACK_FINISHING',
  finishingAction: 'ATTACK_FINISHING',
  duelShield: 'DUEL_DEFENSIVE',
  defensiveDuel: 'DUEL_DEFENSIVE',
  aerialDuel: 'AERIAL',
};

export type EvidenceOriginR518 = 'PERSISTED_REAL' | 'TEST_FIXTURE' | 'UNKNOWN';

export type RealMatchCalibrationStatusR518 =
  | 'INSUFFICIENT_EVIDENCE'
  | 'COLLECTING'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_R510_PROMOTION'
  | 'BLOCKED';

export type RealMatchCalibrationContextR518 = {
  contextKey: string;
  outcomeR460: BuildOutcomeCalibrationR460;
  learningR470: IntelligentLearningR470Analysis;
  lifecycleR472: MotorLabLifecycleR472;
  bridgeR516: GameplayCalibrationBridgeR516;
};

export type RealMatchCalibrationEvidenceInputR518 = {
  origin: EvidenceOriginR518;
  records: readonly MatchValidationRecord[];
  contexts: readonly RealMatchCalibrationContextR518[];
};

export type QualityGateR518 = {
  contextKey: string;
  id: string;
  passed: boolean;
  observed: string | number | boolean | null;
  required: string;
  reason: string;
};

export type RealMatchCalibrationEvidenceR518 = {
  version: typeof REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION;
  status: RealMatchCalibrationStatusR518;
  fingerprint: string;
  authority: {
    readOnly: true;
    productionWriteAllowed: false;
    automaticApplyAllowed: false;
    canCertifyR510: false;
    humanReviewRequired: true;
  };
  evidenceSummary: {
    origin: EvidenceOriginR518;
    totalRecords: number;
    totalContexts: number;
    readyContexts: number;
    distinctSessions: number;
  };
  qualityGates: QualityGateR518[];
  coverage: {
    contextCount: number;
    primitiveActions: GameplayActionIdR510[];
    primitiveFamilies: string[];
    usageFunctions: string[];
    functionalContexts: string[];
  };
  primitiveCandidates: GameplayCalibrationPrimitiveCandidateR516[];
  blockers: string[];
  missingRequirements: string[];
  audit: {
    targetR510Version: typeof GAMEPLAY_ENGINE_R510_VERSION;
    r510CalibrationStatus: typeof GAMEPLAY_ENGINE_R510_CALIBRATION.status;
    r510CertifiedForFinalWrite: typeof GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite;
    notes: string[];
  };
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ContextEvaluationR518 = {
  contextKey: string;
  ready: boolean;
  blocked: boolean;
  gates: QualityGateR518[];
  blockers: string[];
  missingRequirements: string[];
  candidates: GameplayCalibrationPrimitiveCandidateR516[];
  position: string;
  usageFunction: string;
};

function stableStringifyR518(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringifyR518(item)).join(',')}]`;
  }
  const entries = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringifyR518(item)}`);
  return `{${entries.join(',')}}`;
}

function hashFingerprintR518(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `r518-${hash.toString(16).padStart(8, '0')}`;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) target.push(value);
}

function gateR518(
  contextKey: string,
  id: string,
  passed: boolean,
  observed: string | number | boolean | null,
  required: string,
  reason: string,
): QualityGateR518 {
  return { contextKey, id, passed, observed, required, reason };
}

function completeContextR518(context: Partial<RealMatchCalibrationContextR518>): context is RealMatchCalibrationContextR518 {
  return Boolean(
    context
      && context.contextKey
      && context.outcomeR460
      && context.learningR470
      && context.lifecycleR472
      && context.bridgeR516,
  );
}

function recordSessionKeyR518(record: MatchValidationRecord): string {
  return String(record.sessionIdR462 || record.playedAt || record.id || '').trim();
}

export function evaluateContextR518(
  context: RealMatchCalibrationContextR518,
): ContextEvaluationR518 {
  const contextKey = String(context.contextKey || '').trim();
  const { outcomeR460: outcome, learningR470: learning, lifecycleR472: lifecycle, bridgeR516: bridge } = context;
  const blockers: string[] = [];
  const missingRequirements: string[] = [];
  const gates: QualityGateR518[] = [];

  const supportedPersistentGap = outcome.actions
    .filter(action => action.status === 'PERSISTENT_GAP')
    .some(action => bridge.primitiveCandidates.some(candidate => candidate.evidenceActionIds.includes(action.id)));

  const eligibleMatches = Math.min(Number(outcome.snapshotMatches || 0), Number(outcome.compatibleMatches || 0));
  const generationMatches = Number(outcome.generationMatchesR464 || 0);
  const generationCompatible = Boolean(String(outcome.currentGenerationSignatureR464 || '').trim())
    && generationMatches >= Number(outcome.snapshotMatches || 0);
  const r510TargetMatches = bridge.target.r510 === GAMEPLAY_ENGINE_R510_VERSION;
  const bridgeReadOnly = bridge.productionWriteAllowed === false
    && bridge.automaticApplyAllowed === false
    && bridge.humanReviewRequired === true;
  const multipliersWithinLimit = bridge.primitiveCandidates.every(candidate =>
    Number.isFinite(candidate.suggestedMultiplier)
      && candidate.suggestedMultiplier >= 1
      && candidate.suggestedMultiplier <= MAX_R516_MULTIPLIER_R518,
  );

  gates.push(
    gateR518(contextKey, 'R460_ACTIVE', outcome.status === 'ACTIVE', outcome.status, 'ACTIVE',
      'R460 precisa estar ACTIVE para sustentar calibração operacional.'),
    gateR518(contextKey, 'PERSISTENT_GAP_SUPPORTED', supportedPersistentGap, supportedPersistentGap,
      'true', 'É necessária ao menos uma lacuna PERSISTENT_GAP com tradução explícita R516.'),
    gateR518(contextKey, 'R470_CALIBRATION_PROPOSED',
      learning.proposal.status === 'PROPOSED' && learning.proposal.kind === 'CALIBRATION_WEIGHT',
      `${learning.proposal.status}/${learning.proposal.kind}`, 'PROPOSED/CALIBRATION_WEIGHT',
      'R470 deve propor CALIBRATION_WEIGHT; OBSERVE não autoriza readiness.'),
    gateR518(contextKey, 'R470_AUTO_PROMOTION_ELIGIBLE', learning.proposal.autoPromotionEligible === true,
      learning.proposal.autoPromotionEligible, 'true',
      'A elegibilidade R470 significa somente aptidão para revisão humana.'),
    gateR518(contextKey, 'R470_CONFIDENCE', Number(learning.confidence || 0) >= MIN_R470_CONFIDENCE_R518,
      Number(learning.confidence || 0), `>=${MIN_R470_CONFIDENCE_R518}`,
      'Confiança R470 abaixo do limiar local mantém coleta.'),
    gateR518(contextKey, 'R470_NO_DRIFT', learning.drift.detected === false, learning.drift.detected,
      'false', 'Drift ativo bloqueia promoção de evidência.'),
    gateR518(contextKey, 'R472_READY_FOR_REVIEW', lifecycle.candidate.status === 'READY_FOR_REVIEW',
      lifecycle.candidate.status, 'READY_FOR_REVIEW',
      'Lifecycle R472 precisa chegar a READY_FOR_REVIEW.'),
    gateR518(contextKey, 'R472_ELIGIBLE_FOR_REVIEW', lifecycle.candidate.eligibleForReview === true,
      lifecycle.candidate.eligibleForReview, 'true',
      'R472 precisa autorizar revisão humana do Candidate.'),
    gateR518(contextKey, 'MATCH_VOLUME', eligibleMatches >= MIN_LOCAL_MATCHES_R518, eligibleMatches,
      `>=${MIN_LOCAL_MATCHES_R518}`, 'O contexto precisa de oito partidas snapshot compatíveis.'),
    gateR518(contextKey, 'SESSION_DIVERSITY', Number(outcome.distinctSessions || 0) >= MIN_LOCAL_SESSIONS_R518,
      Number(outcome.distinctSessions || 0), `>=${MIN_LOCAL_SESSIONS_R518}`,
      'O contexto precisa repetir o sinal em pelo menos três sessões independentes.'),
    gateR518(contextKey, 'STABLE_SHARE', Number(outcome.stableShare || 0) >= MIN_STABLE_SHARE_R518,
      Number(outcome.stableShare || 0), `>=${MIN_STABLE_SHARE_R518}`,
      'A maior parte da evidência precisa vir de conexão estável.'),
    gateR518(contextKey, 'CURRENT_PATCH_SHARE', Number(outcome.currentPatchShare || 0) >= MIN_CURRENT_PATCH_SHARE_R518,
      Number(outcome.currentPatchShare || 0), `>=${MIN_CURRENT_PATCH_SHARE_R518}`,
      'A evidência precisa representar majoritariamente o patch atual.'),
    gateR518(contextKey, 'GENERATION_COMPATIBILITY', generationCompatible, generationMatches,
      `>= snapshotMatches (${Number(outcome.snapshotMatches || 0)})`,
      'Somente a geração atual da ficha pode fechar o gate local.'),
    gateR518(contextKey, 'R516_TARGET_VERSION', r510TargetMatches, bridge.target.r510,
      GAMEPLAY_ENGINE_R510_VERSION, 'O bridge R516 precisa apontar para a versão R510 vigente.'),
    gateR518(contextKey, 'R516_READ_ONLY', bridgeReadOnly, bridgeReadOnly, 'true',
      'R516 deve permanecer read-only e exigir revisão humana.'),
    gateR518(contextKey, 'R516_MULTIPLIER_LIMIT', multipliersWithinLimit,
      bridge.primitiveCandidates.length
        ? Math.max(...bridge.primitiveCandidates.map(candidate => candidate.suggestedMultiplier))
        : null,
      `1..${MAX_R516_MULTIPLIER_R518}`,
      'Candidatos R516 não podem ultrapassar o teto conservador de 6%.'),
  );

  if (learning.drift.detected) pushUnique(blockers, 'R470_DRIFT_DETECTED');
  if (lifecycle.candidate.status === 'BLOCKED') pushUnique(blockers, 'R472_LIFECYCLE_BLOCKED');
  if (!r510TargetMatches) pushUnique(blockers, 'R510_VERSION_MISMATCH');
  if (!bridgeReadOnly) pushUnique(blockers, 'R516_AUTHORITY_VIOLATION');
  if (!multipliersWithinLimit) pushUnique(blockers, 'R516_MULTIPLIER_OUT_OF_RANGE');

  for (const gate of gates) {
    if (!gate.passed && ![
      'R470_NO_DRIFT',
      'R516_TARGET_VERSION',
      'R516_READ_ONLY',
      'R516_MULTIPLIER_LIMIT',
    ].includes(gate.id)) {
      pushUnique(missingRequirements, gate.id);
    }
  }

  const blocked = blockers.length > 0;
  const ready = !blocked && gates.every(item => item.passed);

  return {
    contextKey,
    ready,
    blocked,
    gates,
    blockers,
    missingRequirements,
    candidates: ready ? bridge.primitiveCandidates.map(candidate => ({
      ...candidate,
      evidenceActionIds: [...candidate.evidenceActionIds].sort(),
    })) : [],
    position: String(outcome.position || '').trim(),
    usageFunction: String(outcome.usageFunction || '').trim(),
  };
}

function aggregateCandidatesR518(
  evaluations: readonly ContextEvaluationR518[],
): GameplayCalibrationPrimitiveCandidateR516[] {
  const rows = new Map<GameplayActionIdR510, GameplayCalibrationPrimitiveCandidateR516>();
  for (const evaluation of evaluations) {
    for (const candidate of evaluation.candidates) {
      const previous = rows.get(candidate.action);
      if (!previous) {
        rows.set(candidate.action, {
          action: candidate.action,
          suggestedMultiplier: candidate.suggestedMultiplier,
          evidenceActionIds: [...candidate.evidenceActionIds],
        });
        continue;
      }
      previous.suggestedMultiplier = Math.max(previous.suggestedMultiplier, candidate.suggestedMultiplier);
      previous.evidenceActionIds = sortedUnique([
        ...previous.evidenceActionIds,
        ...candidate.evidenceActionIds,
      ]);
    }
  }
  return [...rows.values()]
    .map(candidate => ({ ...candidate, evidenceActionIds: sortedUnique(candidate.evidenceActionIds) }))
    .sort((left, right) => left.action.localeCompare(right.action));
}

function addGlobalRequirementR518(
  missingRequirements: string[],
  id: string,
  passed: boolean,
): void {
  if (!passed) pushUnique(missingRequirements, id);
}

export function buildRealMatchCalibrationEvidenceR518(
  input: RealMatchCalibrationEvidenceInputR518,
): RealMatchCalibrationEvidenceR518 {
  const blockers: string[] = [];
  const missingRequirements: string[] = [];
  const contextKeys = sortedUnique(input.contexts.map(context => String(context.contextKey ?? '').trim()));
  const recordIds = sortedUnique(input.records.map(record => String(record.id ?? '').trim()));
  const recordSessions = sortedUnique(input.records.map(recordSessionKeyR518));
  const evaluations: ContextEvaluationR518[] = [];

  let status: RealMatchCalibrationStatusR518 = 'COLLECTING';

  if (input.origin === 'UNKNOWN') {
    blockers.push('EVIDENCE_ORIGIN_UNKNOWN');
    status = 'BLOCKED';
  } else if (input.origin === 'TEST_FIXTURE') {
    blockers.push('NON_PERSISTED_EVIDENCE');
  }

  if (input.records.length === 0 || input.contexts.length === 0) {
    missingRequirements.push('REAL_MATCH_EVIDENCE_REQUIRED');
    if (status !== 'BLOCKED') status = 'INSUFFICIENT_EVIDENCE';
  }

  if (input.origin === 'TEST_FIXTURE' && status === 'COLLECTING') {
    missingRequirements.push('PERSISTED_REAL_EVIDENCE_REQUIRED');
  }

  if (input.origin === 'PERSISTED_REAL' && input.records.length > 0 && input.contexts.length > 0) {
    for (const rawContext of input.contexts) {
      if (!completeContextR518(rawContext)) {
        pushUnique(blockers, 'CONTEXT_CONTRACT_INCOMPLETE');
        continue;
      }
      const evaluation = evaluateContextR518(rawContext);
      evaluations.push(evaluation);
      evaluation.blockers.forEach(blocker => pushUnique(blockers, blocker));
      evaluation.missingRequirements.forEach(requirement => pushUnique(missingRequirements, requirement));
    }
  }

  const readyEvaluations = evaluations.filter(evaluation => evaluation.ready);
  const primitiveCandidates = aggregateCandidatesR518(readyEvaluations);
  const primitiveActions = primitiveCandidates.map(candidate => candidate.action);
  const primitiveFamilies = sortedUnique(
    primitiveActions.map(action => PRIMITIVE_FAMILY_R518[action]),
  );
  const usageFunctions = sortedUnique(readyEvaluations.map(evaluation => evaluation.usageFunction));
  const functionalContexts = sortedUnique(
    readyEvaluations.map(evaluation => `${evaluation.position}:${evaluation.usageFunction}`),
  );
  const qualityGates = evaluations
    .flatMap(evaluation => evaluation.gates)
    .sort((left, right) => left.contextKey.localeCompare(right.contextKey) || left.id.localeCompare(right.id));

  const globalMatchVolumePass = input.records.length >= MIN_GLOBAL_MATCHES_R518;
  const globalSessionDiversityPass = recordSessions.length >= MIN_GLOBAL_SESSIONS_R518;
  const globalContextDiversityPass = readyEvaluations.length >= MIN_GLOBAL_CONTEXTS_R518;
  const globalPrimitiveCoveragePass = primitiveFamilies.length >= MIN_GLOBAL_PRIMITIVE_FAMILIES_R518;
  const globalFunctionalDiversityPass = functionalContexts.length >= MIN_GLOBAL_FUNCTIONAL_CONTEXTS_R518;

  if (input.origin === 'PERSISTED_REAL' && readyEvaluations.length > 0) {
    addGlobalRequirementR518(missingRequirements, 'GLOBAL_MATCH_VOLUME', globalMatchVolumePass);
    addGlobalRequirementR518(missingRequirements, 'GLOBAL_SESSION_DIVERSITY', globalSessionDiversityPass);
    addGlobalRequirementR518(missingRequirements, 'GLOBAL_CONTEXT_DIVERSITY', globalContextDiversityPass);
    addGlobalRequirementR518(missingRequirements, 'GLOBAL_PRIMITIVE_FAMILY_COVERAGE', globalPrimitiveCoveragePass);
    addGlobalRequirementR518(missingRequirements, 'GLOBAL_FUNCTION_POSITION_DIVERSITY', globalFunctionalDiversityPass);
  }

  const globalReady = input.origin === 'PERSISTED_REAL'
    && blockers.length === 0
    && globalMatchVolumePass
    && globalSessionDiversityPass
    && globalContextDiversityPass
    && globalPrimitiveCoveragePass
    && globalFunctionalDiversityPass;

  if (input.origin === 'PERSISTED_REAL' && input.records.length > 0 && input.contexts.length > 0) {
    if (blockers.length > 0) {
      status = 'BLOCKED';
    } else if (globalReady) {
      status = 'READY_FOR_R510_PROMOTION';
    } else if (readyEvaluations.length > 0) {
      status = 'READY_FOR_REVIEW';
    } else {
      status = 'COLLECTING';
    }
  }

  const fingerprintPayload: JsonValue = {
    version: REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
    origin: input.origin,
    contextKeys,
    recordIds,
    recordSessions,
    totalRecords: input.records.length,
    totalContexts: input.contexts.length,
    readyContexts: readyEvaluations.length,
    qualityGates: qualityGates.map(gate => ({
      contextKey: gate.contextKey,
      id: gate.id,
      passed: gate.passed,
      observed: gate.observed,
      required: gate.required,
    })),
    coverage: {
      primitiveActions,
      primitiveFamilies,
      usageFunctions,
      functionalContexts,
    },
    primitiveCandidates: primitiveCandidates.map(candidate => ({
      action: candidate.action,
      suggestedMultiplier: candidate.suggestedMultiplier,
      evidenceActionIds: candidate.evidenceActionIds,
    })),
    blockers: [...blockers].sort(),
    missingRequirements: [...missingRequirements].sort(),
    targetR510Version: GAMEPLAY_ENGINE_R510_VERSION,
    r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
    r510CertifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
    status,
  };

  return {
    version: REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
    status,
    fingerprint: hashFingerprintR518(stableStringifyR518(fingerprintPayload)),
    authority: {
      readOnly: true,
      productionWriteAllowed: false,
      automaticApplyAllowed: false,
      canCertifyR510: false,
      humanReviewRequired: true,
    },
    evidenceSummary: {
      origin: input.origin,
      totalRecords: input.records.length,
      totalContexts: input.contexts.length,
      readyContexts: readyEvaluations.length,
      distinctSessions: recordSessions.length,
    },
    qualityGates,
    coverage: {
      contextCount: contextKeys.length,
      primitiveActions,
      primitiveFamilies,
      usageFunctions,
      functionalContexts,
    },
    primitiveCandidates,
    blockers: [...blockers].sort(),
    missingRequirements: [...missingRequirements].sort(),
    audit: {
      targetR510Version: GAMEPLAY_ENGINE_R510_VERSION,
      r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
      r510CertifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
      notes: [
        'R518 v1 é somente leitura e não aplica calibração automaticamente.',
        'READY_FOR_R510_PROMOTION significa apenas evidência suficiente para revisão humana de um change-set futuro.',
      ],
    },
  };
}
