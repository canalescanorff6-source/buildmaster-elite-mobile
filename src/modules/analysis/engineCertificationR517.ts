import {
  CARD_TRUTH_LAYER_R501_VERSION,
  type CardTruthCertificationR501,
} from './cardTruthLayerR501';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
} from './gameplayEngineR510';
import { GOLDEN_CARD_LAB_R513_VERSION } from './goldenCardLabR513';

export const ENGINE_CERTIFICATION_R517_VERSION = '40.80-r517-engine-certification-v1' as const;

export type EngineCertificationStatusR517 =
  | 'ENGINE_CERTIFIED'
  | 'EXPERIMENTAL_VALIDATED'
  | 'PROVISIONAL'
  | 'BLOCKED';

export type IntegritySignalR517 = {
  valid: boolean;
  reason: string;
};

export type GoldenDeterminismEvidenceR517 = {
  version: typeof GOLDEN_CARD_LAB_R513_VERSION;
  status: 'PASS' | 'FAIL';
  deterministic: boolean;
};

export type GoldenStabilityEvidenceR517 = {
  version: typeof GOLDEN_CARD_LAB_R513_VERSION;
  status: 'PASS' | 'REVIEW';
};

export type RollbackEvidenceR517 = {
  certified: boolean;
  engineVersion: string;
};

export type RollbackDescriptorR517 = {
  available: boolean;
  engineVersion: string | null;
};

export type EngineCertificationInputR517 = {
  cardTruth: CardTruthCertificationR501;
  golden: {
    determinism: GoldenDeterminismEvidenceR517;
    stability: GoldenStabilityEvidenceR517;
  };
  integrity: {
    pp: IntegritySignalR517;
    dna: IntegritySignalR517;
    skills: IntegritySignalR517;
    impeto: IntegritySignalR517;
  };
  rollbackEvidence?: RollbackEvidenceR517 | null;
};

export type EngineCertificationR517 = {
  version: typeof ENGINE_CERTIFICATION_R517_VERSION;
  status: EngineCertificationStatusR517;
  blockers: string[];
  reasons: string[];
  authorities: {
    cardTruth: typeof CARD_TRUTH_LAYER_R501_VERSION;
    gameplay: typeof GAMEPLAY_ENGINE_R510_VERSION;
    golden: typeof GOLDEN_CARD_LAB_R513_VERSION;
  };
  rollback: RollbackDescriptorR517;
  fingerprint: string;
  productionWriteAllowed: false;
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function stableStringifyR517(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringifyR517(item)).join(',')}]`;
  }
  const entries = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringifyR517(item)}`);
  return `{${entries.join(',')}}`;
}

function hashFingerprintR517(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `r517-${hash.toString(16).padStart(8, '0')}`;
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) target.push(value);
}

function rollbackDescriptorR517(input: EngineCertificationInputR517): RollbackDescriptorR517 {
  const version = input.rollbackEvidence?.engineVersion?.trim() ?? '';
  if (input.rollbackEvidence?.certified === true && version.length > 0) {
    return {
      available: true,
      engineVersion: version,
    };
  }
  return {
    available: false,
    engineVersion: null,
  };
}

export function buildEngineCertificationR517(
  input: EngineCertificationInputR517,
): EngineCertificationR517 {
  const blockers: string[] = [];
  const reasons: string[] = [];
  let hardBlocked = false;

  const cardTruthFinal = input.cardTruth.state === 'FINAL_CERTIFIED'
    && input.cardTruth.canFinalize === true;

  if (input.cardTruth.state === 'BLOCKED_INSUFFICIENT_DATA') {
    pushUnique(blockers, 'R501_CARD_TRUTH_BLOCKED');
    pushUnique(reasons, 'R501 bloqueou a carta por evidência insuficiente ou conflitante.');
    hardBlocked = true;
  } else if (!cardTruthFinal) {
    pushUnique(blockers, 'R501_NOT_FINAL_CERTIFIED');
    pushUnique(reasons, 'R501 ainda não atingiu FINAL_CERTIFIED com autorização de finalização.');
  }

  const integrityChecks: Array<{
    signal: IntegritySignalR517;
    blocker: string;
    fallbackReason: string;
  }> = [
    {
      signal: input.integrity.pp,
      blocker: 'PP_INTEGRITY_FAILED',
      fallbackReason: 'Integridade de PP não comprovada.',
    },
    {
      signal: input.integrity.dna,
      blocker: 'DNA_INTEGRITY_FAILED',
      fallbackReason: 'Preservação de DNA não comprovada.',
    },
    {
      signal: input.integrity.skills,
      blocker: 'SKILL_INTEGRITY_FAILED',
      fallbackReason: 'Integridade de skills não comprovada.',
    },
    {
      signal: input.integrity.impeto,
      blocker: 'IMPETO_INTEGRITY_FAILED',
      fallbackReason: 'Integridade de Ímpeto não comprovada.',
    },
  ];

  for (const check of integrityChecks) {
    if (check.signal.valid) continue;
    pushUnique(blockers, check.blocker);
    pushUnique(reasons, check.signal.reason.trim() || check.fallbackReason);
    hardBlocked = true;
  }

  const determinismPass = input.golden.determinism.version === GOLDEN_CARD_LAB_R513_VERSION
    && input.golden.determinism.status === 'PASS'
    && input.golden.determinism.deterministic === true;
  if (!determinismPass) {
    pushUnique(blockers, 'GOLDEN_DETERMINISM_FAILED');
    pushUnique(reasons, 'Golden R513 não comprovou determinismo para esta evidência.');
    hardBlocked = true;
  }

  const stabilityPass = input.golden.stability.version === GOLDEN_CARD_LAB_R513_VERSION
    && input.golden.stability.status === 'PASS';
  if (!stabilityPass) {
    pushUnique(blockers, 'GOLDEN_STABILITY_FAILED');
    pushUnique(reasons, 'Golden R513 não comprovou estabilidade para esta evidência.');
    hardBlocked = true;
  }

  const gameplayCertified = Boolean(GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite);
  if (!gameplayCertified) {
    pushUnique(blockers, 'R510_CALIBRATION_NOT_CERTIFIED');
    pushUnique(reasons, 'R510 permanece em calibração provisória e não pode autorizar certificação final.');
  }

  let status: EngineCertificationStatusR517;
  if (hardBlocked) {
    status = 'BLOCKED';
  } else if (!cardTruthFinal) {
    status = 'PROVISIONAL';
  } else if (!gameplayCertified) {
    status = 'EXPERIMENTAL_VALIDATED';
  } else {
    status = 'ENGINE_CERTIFIED';
  }

  const rollback = rollbackDescriptorR517(input);
  const fingerprintPayload: JsonValue = {
    certificationVersion: ENGINE_CERTIFICATION_R517_VERSION,
    authorities: {
      cardTruth: CARD_TRUTH_LAYER_R501_VERSION,
      gameplay: GAMEPLAY_ENGINE_R510_VERSION,
      golden: GOLDEN_CARD_LAB_R513_VERSION,
    },
    cardTruth: {
      state: input.cardTruth.state,
      confidencePercent: input.cardTruth.confidencePercent,
      criticalState: input.cardTruth.criticalState,
      trainingBudgetState: input.cardTruth.trainingBudgetState,
      levelState: input.cardTruth.levelState,
      canFinalize: input.cardTruth.canFinalize,
    },
    golden: {
      determinismVersion: input.golden.determinism.version,
      determinismStatus: input.golden.determinism.status,
      deterministic: input.golden.determinism.deterministic,
      stabilityVersion: input.golden.stability.version,
      stabilityStatus: input.golden.stability.status,
    },
    integrity: {
      pp: input.integrity.pp.valid,
      dna: input.integrity.dna.valid,
      skills: input.integrity.skills.valid,
      impeto: input.integrity.impeto.valid,
    },
    gameplayCalibration: {
      status: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
      provenance: GAMEPLAY_ENGINE_R510_CALIBRATION.provenance,
      officialGameData: GAMEPLAY_ENGINE_R510_CALIBRATION.officialGameData,
      certifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
    },
    rollback,
    status,
    blockers,
  };

  return {
    version: ENGINE_CERTIFICATION_R517_VERSION,
    status,
    blockers,
    reasons,
    authorities: {
      cardTruth: CARD_TRUTH_LAYER_R501_VERSION,
      gameplay: GAMEPLAY_ENGINE_R510_VERSION,
      golden: GOLDEN_CARD_LAB_R513_VERSION,
    },
    rollback,
    fingerprint: hashFingerprintR517(stableStringifyR517(fingerprintPayload)),
    productionWriteAllowed: false,
  };
}
