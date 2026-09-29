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
  };
  qualityGates: QualityGateR518[];
  coverage: {
    contextCount: number;
    primitiveActions: GameplayActionIdR510[];
    primitiveFamilies: string[];
    usageFunctions: string[];
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

export function buildRealMatchCalibrationEvidenceR518(
  input: RealMatchCalibrationEvidenceInputR518,
): RealMatchCalibrationEvidenceR518 {
  const blockers: string[] = [];
  const missingRequirements: string[] = [];
  const contextKeys = sortedUnique(input.contexts.map(context => String(context.contextKey ?? '').trim()));
  const recordIds = sortedUnique(input.records.map(record => String(record.id ?? '').trim()));

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

  const fingerprintPayload: JsonValue = {
    version: REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
    origin: input.origin,
    contextKeys,
    recordIds,
    totalRecords: input.records.length,
    totalContexts: input.contexts.length,
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
    },
    qualityGates: [],
    coverage: {
      contextCount: contextKeys.length,
      primitiveActions: [],
      primitiveFamilies: [],
      usageFunctions: [],
    },
    primitiveCandidates: [],
    blockers,
    missingRequirements,
    audit: {
      targetR510Version: GAMEPLAY_ENGINE_R510_VERSION,
      r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
      r510CertifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
      notes: [
        'R518 v1 é somente leitura e não aplica calibração automaticamente.',
        'READY_FOR_R510_PROMOTION permanece indisponível nesta etapa inicial.',
      ],
    },
  };
}
