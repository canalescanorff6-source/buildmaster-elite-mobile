import type { AtomicCommitVerificationContextR389 } from './atomicMigrationCommitAuthorityR389';
import {
  convergeVaultReplicasR390,
  type VaultConvergenceDecisionR390,
  type VaultReplicaEnvelopeR390,
  type VaultReplicaKindR390
} from './multiReplicaVaultConvergenceR390';
import {
  CRASH_SAFE_REPLICA_WRITE_R391_VERSION,
  promoteArmedReplicaR391,
  recoverCrashSafeReplicasR391,
  stageCrashSafeReplicaWriteR391,
  type CrashSafeReplicaStateR391,
  type CrashSafeStageR391,
  type CrashSafeWritePlanR391
} from './crashSafeReplicaWriteR391';

export const DURABLE_STORAGE_ADAPTER_R392_VERSION = '40.80-r392-durable-storage-readback-v1' as const;

export type DurableStorageSlotR392 = 'committed' | 'staged';

/**
 * Backend contract used by R392.
 * `replace` must replace ONE physical slot atomically from the backend point of view
 * (IndexedDB transaction, temp-file+rename, or equivalent). R392 never trusts the
 * resolved promise alone: every write is read back and revalidated before promotion.
 */
export type DurableStorageAdapterR392 = {
  version: typeof DURABLE_STORAGE_ADAPTER_R392_VERSION;
  replica: VaultReplicaKindR390;
  maxPayloadBytes?: number | null;
  read(slot: DurableStorageSlotR392): Promise<string | null>;
  replace(slot: DurableStorageSlotR392, payload: string): Promise<void>;
  remove(slot: DurableStorageSlotR392): Promise<void>;
};

export type DurableWriteReceiptR392 = {
  verified: boolean;
  replica: VaultReplicaKindR390;
  slot: DurableStorageSlotR392;
  bytes: number;
  payloadDigest: string | null;
  blockers: string[];
};

export type DurableReplicaReadR392<T> = {
  replica: VaultReplicaKindR390;
  state: CrashSafeReplicaStateR391<T>;
  committedVerified: boolean;
  stagedVerified: boolean;
  blockers: string[];
};

export type DurableStageResultR392<T> = {
  staged: boolean;
  state: CrashSafeReplicaStateR391<T>;
  receipt: DurableWriteReceiptR392 | null;
  blockers: string[];
};

export type DurableArmedStageResultR392<T> = {
  armedPersisted: boolean;
  state: CrashSafeReplicaStateR391<T>;
  receipt: DurableWriteReceiptR392 | null;
  blockers: string[];
};

export type DurablePromotionResultR392<T> = {
  promoted: boolean;
  ambiguousCommitWrite: boolean;
  cleanupPending: boolean;
  state: CrashSafeReplicaStateR391<T>;
  committedReceipt: DurableWriteReceiptR392 | null;
  blockers: string[];
  warnings: string[];
};

export type DurableRepairResultR392<T> = {
  repaired: boolean;
  state: CrashSafeReplicaStateR391<T>;
  receipt: DurableWriteReceiptR392 | null;
  blockers: string[];
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function utf8Bytes(value: string) {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) count += 1;
    else if (code <= 0x7ff) count += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        count += 4;
        index += 1;
      } else count += 3;
    } else count += 3;
  }
  return count;
}

function canonicalJson(value: unknown, seen = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('R392 non-finite number');
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (typeof value === 'undefined') return 'null';
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('R392 circular reference');
    seen.add(value);
    const body = `[${value.map((item) => canonicalJson(item, seen)).join(',')}]`;
    seen.delete(value);
    return body;
  }
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (seen.has(object)) throw new Error('R392 circular reference');
    const prototype = Object.getPrototypeOf(object);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('R392 non-plain object');
    seen.add(object);
    const body = Object.keys(object)
      .filter((key) => object[key] !== undefined && typeof object[key] !== 'function' && typeof object[key] !== 'symbol')
      .sort((a, b) => a.localeCompare(b, 'en'))
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key], seen)}`)
      .join(',');
    seen.delete(object);
    return `{${body}}`;
  }
  throw new Error(`R392 unsupported value type: ${typeof value}`);
}

export function durablePayloadDigestR392(value: unknown) {
  const payload = canonicalJson(value);
  return `storage-r392-${fnv1a(payload)}`;
}

export function serializeDurablePayloadR392(value: unknown) {
  return canonicalJson(value);
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function validAdapter(adapter: DurableStorageAdapterR392) {
  return adapter.version === DURABLE_STORAGE_ADAPTER_R392_VERSION
    && ['native-internal', 'indexeddb', 'local-fallback'].includes(adapter.replica)
    && typeof adapter.read === 'function'
    && typeof adapter.replace === 'function'
    && typeof adapter.remove === 'function';
}

function parseCanonicalPayload(raw: string): { value: unknown | null; blocker: string | null } {
  try {
    const value = JSON.parse(raw) as unknown;
    if (serializeDurablePayloadR392(value) !== raw) return { value: null, blocker: 'readback-not-canonical' };
    return { value, blocker: null };
  } catch {
    return { value: null, blocker: 'readback-json-invalid' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validStageShape<T>(value: unknown, replica: VaultReplicaKindR390): value is CrashSafeStageR391<T> {
  if (!isRecord(value)) return false;
  if (value.version !== CRASH_SAFE_REPLICA_WRITE_R391_VERSION) return false;
  if (value.replica !== replica) return false;
  if (value.state !== 'STAGED' && value.state !== 'ARMED') return false;
  if (!clean(value.transactionId)) return false;
  if (!Number.isSafeInteger(value.targetGeneration) || Number(value.targetGeneration) < 1) return false;
  if (!isRecord(value.base) || !Number.isSafeInteger(value.base.generation) || Number(value.base.generation) < 1) return false;
  if (!clean(value.base.commitId) || !clean(value.base.commitDigest) || !clean(value.base.recordDigest)) return false;
  if (!isRecord(value.target)) return false;
  const target = value.target as unknown as VaultReplicaEnvelopeR390<T>;
  return target.replica === replica && target.generation === value.targetGeneration;
}

function committedValid<T>(replica: VaultReplicaKindR390, value: unknown, context: AtomicCommitVerificationContextR389) {
  if (!isRecord(value)) return false;
  const envelope = value as unknown as VaultReplicaEnvelopeR390<T>;
  const convergence = convergeVaultReplicasR390([{ replica, envelope }], context);
  return convergence.converged
    && convergence.selected?.replica === replica
    && convergence.selected?.sealed.atomicCommit.commitId === envelope.sealed?.atomicCommit?.commitId;
}

function stageTargetValid<T>(stage: CrashSafeStageR391<T>, context: AtomicCommitVerificationContextR389) {
  const convergence = convergeVaultReplicasR390([{ replica: stage.replica, envelope: stage.target }], context);
  return convergence.converged
    && convergence.generation === stage.targetGeneration
    && convergence.selected?.sealed.atomicCommit.commitId === stage.target.sealed.atomicCommit.commitId;
}

async function writeReadBackR392(
  adapter: DurableStorageAdapterR392,
  slot: DurableStorageSlotR392,
  value: unknown,
  validator: (value: unknown) => boolean
): Promise<{ receipt: DurableWriteReceiptR392; value: unknown | null }> {
  const blockers: string[] = [];
  if (!validAdapter(adapter)) blockers.push('adapter-invalid');
  let payload = '';
  try {
    payload = serializeDurablePayloadR392(value);
  } catch {
    blockers.push('payload-not-canonicalizable');
  }
  const bytes = payload ? utf8Bytes(payload) : 0;
  if (payload && Number.isFinite(adapter.maxPayloadBytes ?? NaN) && Number(adapter.maxPayloadBytes) >= 0 && bytes > Number(adapter.maxPayloadBytes)) {
    blockers.push('payload-exceeds-adapter-capacity');
  }
  if (blockers.length) {
    return { receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: null, blockers: unique(blockers) }, value: null };
  }

  try {
    await adapter.replace(slot, payload);
  } catch {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: ['backend-replace-failed'] },
      value: null
    };
  }

  let raw: string | null = null;
  try {
    raw = await adapter.read(slot);
  } catch {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: ['readback-failed'] },
      value: null
    };
  }
  if (raw === null) {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: ['readback-missing'] },
      value: null
    };
  }
  if (raw !== payload) {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: ['readback-byte-mismatch'] },
      value: null
    };
  }
  const parsed = parseCanonicalPayload(raw);
  if (parsed.blocker || parsed.value === null) {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: [parsed.blocker ?? 'readback-invalid'] },
      value: null
    };
  }
  if (!validator(parsed.value)) {
    return {
      receipt: { verified: false, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: ['readback-semantic-validation-failed'] },
      value: parsed.value
    };
  }
  return {
    receipt: { verified: true, replica: adapter.replica, slot, bytes, payloadDigest: durablePayloadDigestR392(value), blockers: [] },
    value: parsed.value
  };
}

/** Reads both physical slots. Invalid data is quarantined, never coerced into authority. */
export async function readDurableReplicaR392<T>(
  adapter: DurableStorageAdapterR392,
  context: AtomicCommitVerificationContextR389
): Promise<DurableReplicaReadR392<T>> {
  const blockers: string[] = [];
  let committed: VaultReplicaEnvelopeR390<T> | null = null;
  let staged: CrashSafeStageR391<T> | null = null;
  let committedVerified = false;
  let stagedVerified = false;

  if (!validAdapter(adapter)) {
    return {
      replica: adapter.replica,
      state: { version: CRASH_SAFE_REPLICA_WRITE_R391_VERSION, replica: adapter.replica, committed: null, staged: null },
      committedVerified: false,
      stagedVerified: false,
      blockers: ['adapter-invalid']
    };
  }

  try {
    const raw = await adapter.read('committed');
    if (raw !== null) {
      const parsed = parseCanonicalPayload(raw);
      if (parsed.blocker || !parsed.value || !committedValid<T>(adapter.replica, parsed.value, context)) {
        blockers.push(parsed.blocker ?? 'committed-readback-invalid');
      } else {
        committed = parsed.value as VaultReplicaEnvelopeR390<T>;
        committedVerified = true;
      }
    }
  } catch {
    blockers.push('committed-read-failed');
  }

  try {
    const raw = await adapter.read('staged');
    if (raw !== null) {
      const parsed = parseCanonicalPayload(raw);
      if (parsed.blocker || !parsed.value || !validStageShape<T>(parsed.value, adapter.replica)) {
        blockers.push(parsed.blocker ?? 'staged-readback-invalid');
      } else {
        const candidate = parsed.value as CrashSafeStageR391<T>;
        if (!stageTargetValid(candidate, context)) blockers.push('staged-target-not-current-or-valid');
        else {
          staged = candidate;
          stagedVerified = true;
        }
      }
    }
  } catch {
    blockers.push('staged-read-failed');
  }

  return {
    replica: adapter.replica,
    state: { version: CRASH_SAFE_REPLICA_WRITE_R391_VERSION, replica: adapter.replica, committed, staged },
    committedVerified,
    stagedVerified,
    blockers: unique(blockers)
  };
}

/** Persists only the STAGED slot. The committed slot is never rewritten here. */
export async function durablyStageReplicaR392<T>(
  adapter: DurableStorageAdapterR392,
  state: CrashSafeReplicaStateR391<T>,
  plan: CrashSafeWritePlanR391<T>,
  context: AtomicCommitVerificationContextR389
): Promise<DurableStageResultR392<T>> {
  if (adapter.replica !== state.replica) return { staged: false, state, receipt: null, blockers: ['adapter-replica-mismatch'] };
  const mutation = stageCrashSafeReplicaWriteR391(state, plan);
  if (!mutation.accepted || !mutation.state.staged) return { staged: false, state, receipt: null, blockers: mutation.blockers };
  const result = await writeReadBackR392(
    adapter,
    'staged',
    mutation.state.staged,
    (value) => validStageShape<T>(value, adapter.replica) && stageTargetValid(value as CrashSafeStageR391<T>, context)
  );
  if (!result.receipt.verified || !result.value) return { staged: false, state, receipt: result.receipt, blockers: result.receipt.blockers };
  return {
    staged: true,
    state: { ...state, staged: result.value as CrashSafeStageR391<T> },
    receipt: result.receipt,
    blockers: []
  };
}

/** Persists an already ARMED R391 stage and proves that exact certificate survived storage. */
export async function durablyPersistArmedStageR392<T>(
  adapter: DurableStorageAdapterR392,
  state: CrashSafeReplicaStateR391<T>,
  context: AtomicCommitVerificationContextR389
): Promise<DurableArmedStageResultR392<T>> {
  if (adapter.replica !== state.replica) return { armedPersisted: false, state, receipt: null, blockers: ['adapter-replica-mismatch'] };
  if (!state.staged || state.staged.state !== 'ARMED' || !clean(state.staged.promotionCertificate)) {
    return { armedPersisted: false, state, receipt: null, blockers: ['armed-stage-missing'] };
  }
  const result = await writeReadBackR392(
    adapter,
    'staged',
    state.staged,
    (value) => validStageShape<T>(value, adapter.replica)
      && (value as CrashSafeStageR391<T>).state === 'ARMED'
      && clean((value as CrashSafeStageR391<T>).promotionCertificate) === clean(state.staged?.promotionCertificate)
      && stageTargetValid(value as CrashSafeStageR391<T>, context)
  );
  if (!result.receipt.verified || !result.value) return { armedPersisted: false, state, receipt: result.receipt, blockers: result.receipt.blockers };
  return {
    armedPersisted: true,
    state: { ...state, staged: result.value as CrashSafeStageR391<T> },
    receipt: result.receipt,
    blockers: []
  };
}

/**
 * Writes the new COMMITTED slot, then reads it back and validates it under R390/R389.
 * STAGED is deleted only after that verification. A cleanup failure is safe: startup
 * recovery will see the committed target and clear the obsolete stage later.
 */
export async function durablyPromoteReplicaR392<T>(
  adapter: DurableStorageAdapterR392,
  state: CrashSafeReplicaStateR391<T>,
  canonical: VaultConvergenceDecisionR390<T>,
  context: AtomicCommitVerificationContextR389
): Promise<DurablePromotionResultR392<T>> {
  if (adapter.replica !== state.replica) {
    return { promoted: false, ambiguousCommitWrite: false, cleanupPending: false, state, committedReceipt: null, blockers: ['adapter-replica-mismatch'], warnings: [] };
  }
  const logical = promoteArmedReplicaR391(state, canonical, context);
  if (!logical.accepted || !logical.state.committed) {
    return { promoted: false, ambiguousCommitWrite: false, cleanupPending: false, state, committedReceipt: null, blockers: logical.blockers, warnings: [] };
  }
  const target = logical.state.committed;
  const result = await writeReadBackR392(
    adapter,
    'committed',
    target,
    (value) => committedValid<T>(adapter.replica, value, context)
  );
  if (!result.receipt.verified || !result.value) {
    return {
      promoted: false,
      ambiguousCommitWrite: true,
      cleanupPending: true,
      state,
      committedReceipt: result.receipt,
      blockers: result.receipt.blockers,
      warnings: ['committed-write-not-proven; preserve-stage-and-recover-on-next-read']
    };
  }

  const verifiedCommitted = result.value as VaultReplicaEnvelopeR390<T>;
  let cleanupPending = false;
  const warnings: string[] = [];
  try {
    await adapter.remove('staged');
    const after = await adapter.read('staged');
    if (after !== null) {
      cleanupPending = true;
      warnings.push('stage-cleanup-readback-not-empty');
    }
  } catch {
    cleanupPending = true;
    warnings.push('stage-cleanup-failed');
  }

  return {
    promoted: true,
    ambiguousCommitWrite: false,
    cleanupPending,
    state: {
      ...state,
      committed: verifiedCommitted,
      staged: cleanupPending ? state.staged : null
    },
    committedReceipt: result.receipt,
    blockers: [],
    warnings
  };
}

/** Safe R390 mirror repair: writes the already-authorized canonical envelope exactly. */
export async function durablyRepairCommittedReplicaR392<T>(
  adapter: DurableStorageAdapterR392,
  state: CrashSafeReplicaStateR391<T>,
  canonicalEnvelope: VaultReplicaEnvelopeR390<T>,
  context: AtomicCommitVerificationContextR389
): Promise<DurableRepairResultR392<T>> {
  if (adapter.replica !== state.replica || canonicalEnvelope.replica !== adapter.replica) {
    return { repaired: false, state, receipt: null, blockers: ['repair-replica-mismatch'] };
  }
  const result = await writeReadBackR392(adapter, 'committed', canonicalEnvelope, (value) => committedValid<T>(adapter.replica, value, context));
  if (!result.receipt.verified || !result.value) return { repaired: false, state, receipt: result.receipt, blockers: result.receipt.blockers };
  return { repaired: true, state: { ...state, committed: result.value as VaultReplicaEnvelopeR390<T> }, receipt: result.receipt, blockers: [] };
}

/** Deletes a stage only when deletion is itself read back. It never touches committed. */
export async function durablyClearStageR392<T>(
  adapter: DurableStorageAdapterR392,
  state: CrashSafeReplicaStateR391<T>
): Promise<{ cleared: boolean; state: CrashSafeReplicaStateR391<T>; blockers: string[] }> {
  if (adapter.replica !== state.replica) return { cleared: false, state, blockers: ['adapter-replica-mismatch'] };
  try {
    await adapter.remove('staged');
    const after = await adapter.read('staged');
    if (after !== null) return { cleared: false, state, blockers: ['stage-delete-readback-not-empty'] };
    return { cleared: true, state: { ...state, staged: null }, blockers: [] };
  } catch {
    return { cleared: false, state, blockers: ['stage-delete-failed'] };
  }
}

/** Convenience startup view: durable read first, then R391 recovery over verified slots only. */
export async function recoverDurableReplicasR392<T>(
  adapters: readonly DurableStorageAdapterR392[],
  context: AtomicCommitVerificationContextR389
) {
  const reads = await Promise.all(adapters.map((adapter) => readDurableReplicaR392<T>(adapter, context)));
  const recovery = recoverCrashSafeReplicasR391(reads.map((item) => item.state), context);
  return {
    reads,
    recovery,
    blockers: unique([...reads.flatMap((item) => item.blockers), ...recovery.blockers])
  };
}
