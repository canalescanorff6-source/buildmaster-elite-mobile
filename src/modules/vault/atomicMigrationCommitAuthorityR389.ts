import type { AuthorityDecisionR386 } from './authorityProvenanceGateR386';
import type { SavedReadinessDecisionR387 } from './vaultReadinessAuthorityR387';
import type { IdentityLineageR388 } from './identityMigrationAuthorityR388';

export const ATOMIC_MIGRATION_COMMIT_R389_VERSION = '40.80-r389-atomic-migration-commit-v1' as const;

export type AuthorityCommitStampR389 = {
  evaluated?: boolean | null;
  version?: string | null;
  evidenceFingerprint?: string | null;
  evidenceFingerprintVersion?: string | null;
};

export type AtomicMigrationCommitInputR389 = {
  recordSnapshot: unknown;
  recordVersion: string;
  currentRecordVersion: string;
  lineage: IdentityLineageR388;
  authority: AuthorityDecisionR386 | null | undefined;
  readiness: SavedReadinessDecisionR387 | null | undefined;
  authorityStamp: AuthorityCommitStampR389 | null | undefined;
  currentAuthorityVersion: string;
  currentEvidenceFingerprint: string;
  currentEvidenceFingerprintVersion: string;
  migrationRequiresReauthorization?: boolean;
};

export type AtomicAuthoritySnapshotR389 = {
  commercialReady: boolean;
  commercialStatus: 'PRONTA' | 'REVISAR';
  originalPositionAuthoritative: boolean;
  usagePositionAllowed: boolean;
  roleFitAllowed: boolean;
  definitiveTop5Allowed: boolean;
  exactBudgetAllowed: boolean;
  blockers: string[];
};

export type AtomicReadinessSnapshotR389 = {
  authorityStatus: 'PRONTA' | 'REVISAR';
  progressStatus: 'completo' | 'pendente' | 'revisar';
  requiresReauthorization: false;
  persistedStatusAcceptedAsAuthority: false;
  recommendedCount: number;
  completedCount: number;
  blockers: string[];
};

export type AtomicMigrationCommitR389 = {
  version: typeof ATOMIC_MIGRATION_COMMIT_R389_VERSION;
  state: 'COMMITTED';
  commitId: string;
  commitDigest: string;
  recordVersion: string;
  recordDigest: string;
  identity: IdentityLineageR388;
  authorityStamp: {
    evaluated: true;
    version: string;
    evidenceFingerprint: string;
    evidenceFingerprintVersion: string;
  };
  authority: AtomicAuthoritySnapshotR389;
  readiness: AtomicReadinessSnapshotR389;
};

export type AtomicMigrationPreparationR389 = {
  canCommit: boolean;
  commit: AtomicMigrationCommitR389 | null;
  blockers: string[];
};

export type AtomicCommitVerificationContextR389 = {
  currentRecordVersion: string;
  currentAuthorityVersion: string;
  currentEvidenceFingerprint: string;
  currentEvidenceFingerprintVersion: string;
  currentAuthority?: AuthorityDecisionR386 | null;
  currentReadiness?: SavedReadinessDecisionR387 | null;
};

export type AtomicCommitVerificationR389 = {
  valid: boolean;
  blockers: string[];
};

export type AtomicSavedRecordR389<T> = {
  record: T;
  atomicCommit: AtomicMigrationCommitR389;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'en'));
}

function normalizedLineage(lineage: IdentityLineageR388): IdentityLineageR388 {
  const canonicalCardIdentity = clean(lineage.canonicalCardIdentity) || null;
  const canonicalSaveKey = clean(lineage.canonicalSaveKey) || null;
  return {
    canonicalCardIdentity,
    cardIdentityAliases: uniqueSorted(lineage.cardIdentityAliases ?? []),
    canonicalSaveKey,
    saveKeyAliases: uniqueSorted(lineage.saveKeyAliases ?? [])
  };
}

function canonicalJson(value: unknown, seen = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('R389 record contains non-finite number');
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (typeof value === 'undefined') return 'null';
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('R389 record contains circular reference');
    seen.add(value);
    const body = `[${value.map((item) => canonicalJson(item, seen)).join(',')}]`;
    seen.delete(value);
    return body;
  }
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (seen.has(object)) throw new Error('R389 record contains circular reference');
    const prototype = Object.getPrototypeOf(object);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('R389 record contains non-plain object');
    seen.add(object);
    const body = Object.keys(object)
      .filter((key) => object[key] !== undefined && typeof object[key] !== 'function' && typeof object[key] !== 'symbol')
      .sort((a, b) => a.localeCompare(b, 'en'))
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key], seen)}`)
      .join(',');
    seen.delete(object);
    return `{${body}}`;
  }
  throw new Error(`R389 record contains unsupported value type: ${typeof value}`);
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

export function atomicRecordDigestR389(record: unknown) {
  return `record-r389-${fnv1a(canonicalJson(record))}`;
}

function authoritySnapshot(authority: AuthorityDecisionR386): AtomicAuthoritySnapshotR389 {
  return {
    commercialReady: authority.commercialReady === true,
    commercialStatus: authority.commercialStatus,
    originalPositionAuthoritative: authority.originalPositionAuthoritative === true,
    usagePositionAllowed: authority.usagePositionAllowed === true,
    roleFitAllowed: authority.roleFitAllowed === true,
    definitiveTop5Allowed: authority.definitiveTop5Allowed === true,
    exactBudgetAllowed: authority.exactBudgetAllowed === true,
    blockers: uniqueSorted(authority.blockers ?? [])
  };
}

function readinessSnapshot(readiness: SavedReadinessDecisionR387): AtomicReadinessSnapshotR389 {
  return {
    authorityStatus: readiness.authorityStatus,
    progressStatus: readiness.progressStatus,
    requiresReauthorization: false,
    persistedStatusAcceptedAsAuthority: false,
    recommendedCount: Math.max(0, Math.trunc(readiness.recommendedCount)),
    completedCount: Math.max(0, Math.trunc(readiness.completedCount)),
    blockers: uniqueSorted(readiness.blockers ?? [])
  };
}

function commitCore(commit: Omit<AtomicMigrationCommitR389, 'commitId' | 'commitDigest'>) {
  return canonicalJson(commit);
}

function buildCommit(input: AtomicMigrationCommitInputR389): AtomicMigrationCommitR389 {
  const lineage = normalizedLineage(input.lineage);
  const authority = authoritySnapshot(input.authority as AuthorityDecisionR386);
  const readiness = readinessSnapshot(input.readiness as SavedReadinessDecisionR387);
  const core: Omit<AtomicMigrationCommitR389, 'commitId' | 'commitDigest'> = {
    version: ATOMIC_MIGRATION_COMMIT_R389_VERSION,
    state: 'COMMITTED',
    recordVersion: input.recordVersion,
    recordDigest: atomicRecordDigestR389(input.recordSnapshot),
    identity: lineage,
    authorityStamp: {
      evaluated: true,
      version: input.currentAuthorityVersion,
      evidenceFingerprint: input.currentEvidenceFingerprint,
      evidenceFingerprintVersion: input.currentEvidenceFingerprintVersion
    },
    authority,
    readiness
  };
  const serialized = commitCore(core);
  const commitId = `vault-r389-${fnv1a(`id|${serialized}`)}`;
  const commitDigest = `commit-r389-${fnv1a(`digest|${serialized}|${commitId}`)}`;
  return { ...core, commitId, commitDigest };
}

function currentStampMatches(input: AtomicMigrationCommitInputR389) {
  return input.authorityStamp?.evaluated === true
    && clean(input.authorityStamp.version) === clean(input.currentAuthorityVersion)
    && clean(input.authorityStamp.evidenceFingerprint) === clean(input.currentEvidenceFingerprint)
    && clean(input.authorityStamp.evidenceFingerprintVersion) === clean(input.currentEvidenceFingerprintVersion);
}

function statusConsistent(authority: AuthorityDecisionR386, readiness: SavedReadinessDecisionR387) {
  return authority.commercialStatus === readiness.authorityStatus
    && authority.commercialReady === (readiness.authorityStatus === 'PRONTA');
}

/**
 * R389 prepares one immutable migration commit envelope. There is no field-by-field
 * promotion API: the caller either persists the complete sealed record or preserves
 * the previous committed generation unchanged.
 */
export function prepareAtomicMigrationCommitR389(input: AtomicMigrationCommitInputR389): AtomicMigrationPreparationR389 {
  const blockers: string[] = [];
  const lineage = normalizedLineage(input.lineage);
  const authority = input.authority ?? null;
  const readiness = input.readiness ?? null;
  const recordVersion = clean(input.recordVersion);
  const currentRecordVersion = clean(input.currentRecordVersion);
  const currentAuthorityVersion = clean(input.currentAuthorityVersion);
  const evidenceFingerprint = clean(input.currentEvidenceFingerprint);
  const evidenceFingerprintVersion = clean(input.currentEvidenceFingerprintVersion);

  if (!authority) blockers.push('authority-decision-missing');
  if (!readiness) blockers.push('readiness-decision-missing');
  if (!recordVersion || recordVersion !== currentRecordVersion) blockers.push('record-version-stale-or-missing');
  if (!currentAuthorityVersion) blockers.push('authority-version-missing');
  if (!evidenceFingerprint) blockers.push('evidence-fingerprint-missing');
  if (!evidenceFingerprintVersion) blockers.push('evidence-fingerprint-version-missing');
  if (!currentStampMatches(input)) blockers.push('authority-stamp-not-bound-to-current-evidence');
  if (!lineage.canonicalCardIdentity) blockers.push('canonical-card-identity-missing');
  if (!lineage.canonicalSaveKey) blockers.push('canonical-save-key-missing');
  if (lineage.canonicalCardIdentity && !lineage.cardIdentityAliases.includes(lineage.canonicalCardIdentity)) blockers.push('canonical-card-identity-not-in-lineage');
  if (lineage.canonicalSaveKey && !lineage.saveKeyAliases.includes(lineage.canonicalSaveKey)) blockers.push('canonical-save-key-not-in-lineage');
  if (input.migrationRequiresReauthorization === true) blockers.push('migration-still-requires-reauthorization');

  if (readiness) {
    if (readiness.requiresReauthorization) blockers.push('readiness-still-requires-reauthorization');
    if (readiness.persistedStatusAcceptedAsAuthority !== false) blockers.push('persisted-status-used-as-authority');
    if (readiness.completedCount > readiness.recommendedCount) blockers.push('skill-progress-count-invalid');
    if (readiness.authorityStatus === 'REVISAR' && readiness.progressStatus !== 'revisar') blockers.push('review-authority-has-nonreview-progress');
  }
  if (authority && readiness && !statusConsistent(authority, readiness)) blockers.push('authority-readiness-status-mismatch');

  try {
    atomicRecordDigestR389(input.recordSnapshot);
  } catch {
    blockers.push('record-snapshot-not-canonicalizable');
  }

  const uniqueBlockers = Array.from(new Set(blockers));
  if (uniqueBlockers.length) return { canCommit: false, commit: null, blockers: uniqueBlockers };
  return { canCommit: true, commit: buildCommit(input), blockers: [] };
}

function expectedCommitDigest(commit: AtomicMigrationCommitR389) {
  const core: Omit<AtomicMigrationCommitR389, 'commitId' | 'commitDigest'> = {
    version: commit.version,
    state: commit.state,
    recordVersion: commit.recordVersion,
    recordDigest: commit.recordDigest,
    identity: normalizedLineage(commit.identity),
    authorityStamp: { ...commit.authorityStamp },
    authority: {
      ...commit.authority,
      blockers: uniqueSorted(commit.authority.blockers ?? [])
    },
    readiness: {
      ...commit.readiness,
      blockers: uniqueSorted(commit.readiness.blockers ?? [])
    }
  };
  const serialized = commitCore(core);
  const commitId = `vault-r389-${fnv1a(`id|${serialized}`)}`;
  const commitDigest = `commit-r389-${fnv1a(`digest|${serialized}|${commitId}`)}`;
  return { commitId, commitDigest };
}

function sameAuthoritySnapshot(left: AtomicAuthoritySnapshotR389, right: AuthorityDecisionR386) {
  return canonicalJson(left) === canonicalJson(authoritySnapshot(right));
}

function sameReadinessSnapshot(left: AtomicReadinessSnapshotR389, right: SavedReadinessDecisionR387) {
  if (right.requiresReauthorization || right.persistedStatusAcceptedAsAuthority !== false) return false;
  return canonicalJson(left) === canonicalJson(readinessSnapshot(right));
}

/**
 * A persisted R389 commit is usable only when its envelope, record payload and current
 * evidence/authority versions all agree. Any partial or stale state is quarantined.
 */
export function verifyAtomicMigrationCommitR389(
  commit: AtomicMigrationCommitR389 | null | undefined,
  recordSnapshot: unknown,
  context: AtomicCommitVerificationContextR389
): AtomicCommitVerificationR389 {
  const blockers: string[] = [];
  if (!commit || typeof commit !== 'object') return { valid: false, blockers: ['atomic-commit-missing'] };

  if (commit.version !== ATOMIC_MIGRATION_COMMIT_R389_VERSION) blockers.push('atomic-commit-version-stale');
  if (commit.state !== 'COMMITTED') blockers.push('atomic-commit-not-committed');
  if (clean(commit.recordVersion) !== clean(context.currentRecordVersion)) blockers.push('record-version-stale');
  if (clean(commit.authorityStamp.version) !== clean(context.currentAuthorityVersion)) blockers.push('authority-version-stale');
  if (commit.authorityStamp.evaluated !== true) blockers.push('authority-stamp-not-evaluated');
  if (clean(commit.authorityStamp.evidenceFingerprint) !== clean(context.currentEvidenceFingerprint)) blockers.push('evidence-fingerprint-stale');
  if (clean(commit.authorityStamp.evidenceFingerprintVersion) !== clean(context.currentEvidenceFingerprintVersion)) blockers.push('evidence-fingerprint-version-stale');

  try {
    if (commit.recordDigest !== atomicRecordDigestR389(recordSnapshot)) blockers.push('record-digest-mismatch');
  } catch {
    blockers.push('record-snapshot-not-canonicalizable');
  }

  const expected = expectedCommitDigest(commit);
  if (commit.commitId !== expected.commitId) blockers.push('commit-id-mismatch');
  if (commit.commitDigest !== expected.commitDigest) blockers.push('commit-digest-mismatch');

  const identity = normalizedLineage(commit.identity);
  if (!identity.canonicalCardIdentity || !identity.cardIdentityAliases.includes(identity.canonicalCardIdentity)) blockers.push('canonical-card-lineage-invalid');
  if (!identity.canonicalSaveKey || !identity.saveKeyAliases.includes(identity.canonicalSaveKey)) blockers.push('canonical-save-lineage-invalid');
  if (commit.readiness.requiresReauthorization !== false) blockers.push('committed-readiness-requires-reauthorization');
  if (commit.readiness.persistedStatusAcceptedAsAuthority !== false) blockers.push('committed-persisted-status-used-as-authority');
  if (commit.readiness.completedCount > commit.readiness.recommendedCount) blockers.push('committed-skill-progress-count-invalid');
  if (commit.readiness.authorityStatus === 'REVISAR' && commit.readiness.progressStatus !== 'revisar') blockers.push('committed-review-progress-invalid');
  if (commit.authority.commercialStatus !== commit.readiness.authorityStatus) blockers.push('committed-authority-readiness-status-mismatch');
  if (commit.authority.commercialReady !== (commit.readiness.authorityStatus === 'PRONTA')) blockers.push('committed-commercial-ready-mismatch');

  if (context.currentAuthority && !sameAuthoritySnapshot(commit.authority, context.currentAuthority)) blockers.push('authority-snapshot-stale');
  if (context.currentReadiness && !sameReadinessSnapshot(commit.readiness, context.currentReadiness)) blockers.push('readiness-snapshot-stale');

  const uniqueBlockers = Array.from(new Set(blockers));
  return { valid: uniqueBlockers.length === 0, blockers: uniqueBlockers };
}

export function sealAtomicSavedRecordR389<T>(record: T, commit: AtomicMigrationCommitR389): AtomicSavedRecordR389<T> {
  const digest = atomicRecordDigestR389(record);
  if (digest !== commit.recordDigest) throw new Error('R389 commit does not match record snapshot');
  return { record, atomicCommit: commit };
}

export function acceptAtomicSavedRecordR389<T>(
  value: AtomicSavedRecordR389<T> | null | undefined,
  context: AtomicCommitVerificationContextR389
): { accepted: boolean; record: T | null; blockers: string[] } {
  if (!value || typeof value !== 'object' || !('record' in value) || !('atomicCommit' in value)) {
    return { accepted: false, record: null, blockers: ['atomic-saved-record-missing'] };
  }
  const verification = verifyAtomicMigrationCommitR389(value.atomicCommit, value.record, context);
  return verification.valid
    ? { accepted: true, record: value.record, blockers: [] }
    : { accepted: false, record: null, blockers: verification.blockers };
}
