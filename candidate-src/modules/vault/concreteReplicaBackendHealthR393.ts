import {
  DURABLE_STORAGE_ADAPTER_R392_VERSION,
  readDurableReplicaR392,
  serializeDurablePayloadR392,
  type DurableStorageAdapterR392,
  type DurableStorageSlotR392
} from './durableStorageAdapterR392';
import type { AtomicCommitVerificationContextR389 } from './atomicMigrationCommitAuthorityR389';
import type { VaultReplicaKindR390 } from './multiReplicaVaultConvergenceR390';

export const CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION = '40.80-r393-concrete-backend-health-v1' as const;

export type ReplicaHealthStateR393 = 'HEALTHY' | 'DEGRADED' | 'QUARANTINED' | 'UNAVAILABLE';
export type ReplicaHealthEventR393 =
  | 'VERIFIED_READ'
  | 'VERIFIED_WRITE'
  | 'PROBE_SUCCESS'
  | 'READ_FAILURE'
  | 'WRITE_FAILURE'
  | 'REMOVE_FAILURE'
  | 'CAPACITY_FAILURE'
  | 'READBACK_MISMATCH'
  | 'SEMANTIC_CORRUPTION'
  | 'ADAPTER_UNAVAILABLE';

export type ReplicaHealthR393 = {
  version: typeof CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION;
  replica: VaultReplicaKindR390;
  state: ReplicaHealthStateR393;
  revision: number;
  consecutiveFailures: number;
  integrityFailureStreak: number;
  probeSuccessStreak: number;
  totalFailures: number;
  totalVerifiedOperations: number;
  lastEvent: ReplicaHealthEventR393 | null;
  lastBlocker: string | null;
};

export type ReplicaOperationalPolicyR393 = {
  authorityReadable: boolean;
  writeEligible: boolean;
  repairEligible: boolean;
  health: ReplicaHealthStateR393;
  reasons: string[];
};

export type ReplicaHealthObservationR393 = {
  event: ReplicaHealthEventR393;
  blocker?: string | null;
};

export type ReplicaBackendPrimitivesR393 = {
  available(): boolean | Promise<boolean>;
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  maxPayloadBytes?: number | null | (() => number | null | Promise<number | null>);
};

export type ConcreteReplicaBackendR393 = {
  version: typeof CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION;
  replica: VaultReplicaKindR390;
  namespace: string;
  adapter: DurableStorageAdapterR392;
  refreshCapacity(): Promise<number | null>;
  probe(): Promise<{ ok: boolean; blockers: string[] }>;
  loadHealth(): Promise<{ health: ReplicaHealthR393; blockers: string[] }>;
  persistHealth(health: ReplicaHealthR393): Promise<{ persisted: boolean; blockers: string[] }>;
  keys: {
    committed: string;
    staged: string;
    probe: string;
    health: string;
  };
};

export type ReplicaHealthAuditR393<T> = {
  replica: VaultReplicaKindR390;
  health: ReplicaHealthR393;
  policy: ReplicaOperationalPolicyR393;
  committedVerified: boolean;
  stagedVerified: boolean;
  blockers: string[];
  durableState: Awaited<ReturnType<typeof readDurableReplicaR392<T>>>['state'];
};

const REPLICAS: VaultReplicaKindR390[] = ['native-internal', 'indexeddb', 'local-fallback'];
const TRANSIENT_DEGRADE_THRESHOLD = 2;
const TRANSIENT_QUARANTINE_THRESHOLD = 4;
const INTEGRITY_QUARANTINE_THRESHOLD = 2;
const PROBE_RECOVERY_THRESHOLD = 2;

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function safeNamespace(value: string) {
  const normalized = clean(value).replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 160);
  return normalized || 'buildmaster-vault';
}

function validReplica(replica: VaultReplicaKindR390) {
  return REPLICAS.includes(replica);
}

function isIntegrityEvent(event: ReplicaHealthEventR393) {
  return event === 'READBACK_MISMATCH' || event === 'SEMANTIC_CORRUPTION';
}

function isFailureEvent(event: ReplicaHealthEventR393) {
  return event === 'READ_FAILURE'
    || event === 'WRITE_FAILURE'
    || event === 'REMOVE_FAILURE'
    || event === 'CAPACITY_FAILURE'
    || event === 'READBACK_MISMATCH'
    || event === 'SEMANTIC_CORRUPTION';
}

function nextRevision(current: number) {
  if (!Number.isSafeInteger(current) || current < 0) return 0;
  return current >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : current + 1;
}

export function createReplicaHealthR393(replica: VaultReplicaKindR390, available = true): ReplicaHealthR393 {
  return {
    version: CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION,
    replica,
    state: available ? 'HEALTHY' : 'UNAVAILABLE',
    revision: 0,
    consecutiveFailures: 0,
    integrityFailureStreak: 0,
    probeSuccessStreak: 0,
    totalFailures: 0,
    totalVerifiedOperations: 0,
    lastEvent: available ? null : 'ADAPTER_UNAVAILABLE',
    lastBlocker: available ? null : 'adapter-unavailable'
  };
}

/**
 * Deterministic health reducer. Health is operational metadata only: it never
 * upgrades, downgrades, or rewrites R389/R390 authority. Quarantine blocks new
 * automatic writes but a verified committed record remains readable for rescue.
 */
export function observeReplicaHealthR393(
  current: ReplicaHealthR393,
  observation: ReplicaHealthObservationR393
): ReplicaHealthR393 {
  const event = observation.event;
  if (current.version !== CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION || !validReplica(current.replica)) {
    return { ...createReplicaHealthR393(current.replica, false), lastBlocker: 'health-record-invalid' };
  }

  const next: ReplicaHealthR393 = {
    ...current,
    revision: nextRevision(current.revision),
    lastEvent: event,
    lastBlocker: clean(observation.blocker) || null
  };

  if (event === 'ADAPTER_UNAVAILABLE') {
    return { ...next, state: 'UNAVAILABLE', consecutiveFailures: current.consecutiveFailures + 1, probeSuccessStreak: 0, totalFailures: current.totalFailures + 1 };
  }

  if (event === 'PROBE_SUCCESS') {
    const probeSuccessStreak = current.probeSuccessStreak + 1;
    let state = current.state;
    if ((current.state === 'QUARANTINED' || current.state === 'UNAVAILABLE') && probeSuccessStreak >= PROBE_RECOVERY_THRESHOLD) state = 'DEGRADED';
    else if (current.state === 'DEGRADED' && probeSuccessStreak >= PROBE_RECOVERY_THRESHOLD) state = 'HEALTHY';
    return {
      ...next,
      state,
      probeSuccessStreak,
      consecutiveFailures: state === 'HEALTHY' ? 0 : current.consecutiveFailures,
      integrityFailureStreak: state === 'HEALTHY' ? 0 : current.integrityFailureStreak,
      totalVerifiedOperations: current.totalVerifiedOperations + 1,
      lastBlocker: null
    };
  }

  if (event === 'VERIFIED_READ' || event === 'VERIFIED_WRITE') {
    // A successful ordinary operation clears transient failures but does not
    // rehabilitate quarantine. Quarantine requires explicit independent probes.
    const state = current.state === 'UNAVAILABLE' ? 'DEGRADED' : current.state;
    return {
      ...next,
      state,
      consecutiveFailures: state === 'QUARANTINED' ? current.consecutiveFailures : 0,
      integrityFailureStreak: state === 'QUARANTINED' ? current.integrityFailureStreak : 0,
      probeSuccessStreak: 0,
      totalVerifiedOperations: current.totalVerifiedOperations + 1,
      lastBlocker: null
    };
  }

  if (isFailureEvent(event)) {
    const consecutiveFailures = current.consecutiveFailures + 1;
    const integrityFailureStreak = isIntegrityEvent(event) ? current.integrityFailureStreak + 1 : 0;
    let state: ReplicaHealthStateR393 = current.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'HEALTHY';
    if (current.state === 'QUARANTINED'
      || integrityFailureStreak >= INTEGRITY_QUARANTINE_THRESHOLD
      || consecutiveFailures >= TRANSIENT_QUARANTINE_THRESHOLD) state = 'QUARANTINED';
    else if (consecutiveFailures >= TRANSIENT_DEGRADE_THRESHOLD || isIntegrityEvent(event)) state = 'DEGRADED';
    return {
      ...next,
      state,
      consecutiveFailures,
      integrityFailureStreak,
      probeSuccessStreak: 0,
      totalFailures: current.totalFailures + 1
    };
  }

  return next;
}

export function operationalPolicyR393(health: ReplicaHealthR393, committedVerified: boolean): ReplicaOperationalPolicyR393 {
  const reasons: string[] = [];
  if (!committedVerified) reasons.push('no-verified-committed-copy');
  if (health.state === 'DEGRADED') reasons.push('backend-degraded');
  if (health.state === 'QUARANTINED') reasons.push('backend-quarantined');
  if (health.state === 'UNAVAILABLE') reasons.push('backend-unavailable');
  return {
    // Valid data can be a rescue source even if the medium itself is unhealthy.
    authorityReadable: committedVerified,
    writeEligible: health.state === 'HEALTHY' || health.state === 'DEGRADED',
    repairEligible: health.state === 'HEALTHY',
    health: health.state,
    reasons
  };
}

function blockersToHealthEvent(blockers: readonly string[]): ReplicaHealthObservationR393 | null {
  const normalized = blockers.map(clean);
  if (normalized.some((item) => item.includes('byte-mismatch') || item.includes('not-canonical'))) {
    return { event: 'READBACK_MISMATCH', blocker: normalized.find((item) => item.includes('byte-mismatch') || item.includes('not-canonical')) };
  }
  if (normalized.some((item) => item.includes('semantic') || item.includes('invalid') || item.includes('not-current-or-valid'))) {
    return { event: 'SEMANTIC_CORRUPTION', blocker: normalized.find((item) => item.includes('semantic') || item.includes('invalid') || item.includes('not-current-or-valid')) };
  }
  if (normalized.some((item) => item.includes('capacity') || item.includes('quota'))) {
    return { event: 'CAPACITY_FAILURE', blocker: normalized.find((item) => item.includes('capacity') || item.includes('quota')) };
  }
  if (normalized.some((item) => item.includes('read'))) return { event: 'READ_FAILURE', blocker: normalized.find((item) => item.includes('read')) };
  if (normalized.some((item) => item.includes('replace') || item.includes('write'))) return { event: 'WRITE_FAILURE', blocker: normalized.find((item) => item.includes('replace') || item.includes('write')) };
  if (normalized.some((item) => item.includes('delete') || item.includes('remove') || item.includes('cleanup'))) return { event: 'REMOVE_FAILURE', blocker: normalized.find((item) => item.includes('delete') || item.includes('remove') || item.includes('cleanup')) };
  return normalized.length ? { event: 'READ_FAILURE', blocker: normalized[0] } : null;
}

export function healthFromDurableOutcomeR393(
  current: ReplicaHealthR393,
  input: { verified?: boolean; blockers?: readonly string[]; operation: 'read' | 'write' | 'remove' }
): ReplicaHealthR393 {
  if (input.verified) {
    return observeReplicaHealthR393(current, { event: input.operation === 'read' ? 'VERIFIED_READ' : 'VERIFIED_WRITE' });
  }
  const classified = blockersToHealthEvent(input.blockers ?? []);
  if (classified) return observeReplicaHealthR393(current, classified);
  const fallback: ReplicaHealthEventR393 = input.operation === 'read' ? 'READ_FAILURE' : input.operation === 'remove' ? 'REMOVE_FAILURE' : 'WRITE_FAILURE';
  return observeReplicaHealthR393(current, { event: fallback });
}

function slotKey(namespace: string, replica: VaultReplicaKindR390, slot: DurableStorageSlotR392) {
  return `${safeNamespace(namespace)}::${replica}::r393::${slot}`;
}

function probeKey(namespace: string, replica: VaultReplicaKindR390) {
  return `${safeNamespace(namespace)}::${replica}::r393::health-probe`;
}

function healthKey(namespace: string, replica: VaultReplicaKindR390) {
  return `${safeNamespace(namespace)}::${replica}::r393::health-state`;
}

function validHealthRecord(value: unknown, replica: VaultReplicaKindR390): value is ReplicaHealthR393 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<ReplicaHealthR393>;
  return item.version === CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION
    && item.replica === replica
    && ['HEALTHY', 'DEGRADED', 'QUARANTINED', 'UNAVAILABLE'].includes(String(item.state))
    && Number.isSafeInteger(item.revision) && Number(item.revision) >= 0
    && Number.isSafeInteger(item.consecutiveFailures) && Number(item.consecutiveFailures) >= 0
    && Number.isSafeInteger(item.integrityFailureStreak) && Number(item.integrityFailureStreak) >= 0
    && Number.isSafeInteger(item.probeSuccessStreak) && Number(item.probeSuccessStreak) >= 0
    && Number.isSafeInteger(item.totalFailures) && Number(item.totalFailures) >= 0
    && Number.isSafeInteger(item.totalVerifiedOperations) && Number(item.totalVerifiedOperations) >= 0;
}

function corruptedHealthR393(replica: VaultReplicaKindR390, blocker: string): ReplicaHealthR393 {
  return {
    ...createReplicaHealthR393(replica),
    state: 'QUARANTINED',
    consecutiveFailures: TRANSIENT_QUARANTINE_THRESHOLD,
    integrityFailureStreak: INTEGRITY_QUARANTINE_THRESHOLD,
    totalFailures: 1,
    lastEvent: 'SEMANTIC_CORRUPTION',
    lastBlocker: blocker
  };
}

async function resolveCapacity(primitives: ReplicaBackendPrimitivesR393) {
  const value = typeof primitives.maxPayloadBytes === 'function' ? await primitives.maxPayloadBytes() : primitives.maxPayloadBytes;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Concrete R392 adapter over one backend's raw string primitives. It intentionally
 * uses separate physical keys for committed, staged and probe data.
 */
export function createConcreteReplicaBackendR393(
  replica: VaultReplicaKindR390,
  namespace: string,
  primitives: ReplicaBackendPrimitivesR393
): ConcreteReplicaBackendR393 {
  const keys = {
    committed: slotKey(namespace, replica, 'committed'),
    staged: slotKey(namespace, replica, 'staged'),
    probe: probeKey(namespace, replica),
    health: healthKey(namespace, replica)
  };
  const adapter: DurableStorageAdapterR392 = {
    version: DURABLE_STORAGE_ADAPTER_R392_VERSION,
    replica,
    maxPayloadBytes: null,
    async read(slot) {
      if (!(await primitives.available())) throw new Error('R393 backend unavailable');
      adapter.maxPayloadBytes = await resolveCapacity(primitives);
      return primitives.read(keys[slot]);
    },
    async replace(slot, payload) {
      if (!(await primitives.available())) throw new Error('R393 backend unavailable');
      adapter.maxPayloadBytes = await resolveCapacity(primitives);
      if (adapter.maxPayloadBytes !== null && new TextEncoder().encode(payload).byteLength > adapter.maxPayloadBytes) throw new Error('R393 backend capacity exceeded');
      await primitives.write(keys[slot], payload);
    },
    async remove(slot) {
      if (!(await primitives.available())) throw new Error('R393 backend unavailable');
      await primitives.remove(keys[slot]);
    }
  };

  return {
    version: CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION,
    replica,
    namespace: safeNamespace(namespace),
    adapter,
    keys,
    async refreshCapacity() {
      adapter.maxPayloadBytes = await resolveCapacity(primitives);
      return adapter.maxPayloadBytes ?? null;
    },

    async loadHealth() {
      if (!(await primitives.available())) return { health: createReplicaHealthR393(replica, false), blockers: ['adapter-unavailable'] };
      let raw: string | null = null;
      try { raw = await primitives.read(keys.health); } catch { return { health: corruptedHealthR393(replica, 'health-read-failed'), blockers: ['health-read-failed'] }; }
      if (raw === null) return { health: createReplicaHealthR393(replica, true), blockers: [] };
      try {
        const value = JSON.parse(raw) as unknown;
        if (serializeDurablePayloadR392(value) !== raw || !validHealthRecord(value, replica)) {
          return { health: corruptedHealthR393(replica, 'health-record-invalid'), blockers: ['health-record-invalid'] };
        }
        return { health: value as ReplicaHealthR393, blockers: [] };
      } catch {
        return { health: corruptedHealthR393(replica, 'health-record-invalid'), blockers: ['health-record-invalid'] };
      }
    },
    async persistHealth(health) {
      if (!validHealthRecord(health, replica)) return { persisted: false, blockers: ['health-record-invalid'] };
      if (!(await primitives.available())) return { persisted: false, blockers: ['adapter-unavailable'] };
      const payload = serializeDurablePayloadR392(health);
      try {
        await primitives.write(keys.health, payload);
        const readback = await primitives.read(keys.health);
        if (readback !== payload) return { persisted: false, blockers: ['health-readback-mismatch'] };
        return { persisted: true, blockers: [] };
      } catch {
        return { persisted: false, blockers: ['health-write-or-read-failed'] };
      }
    },
    async probe() {
      const blockers: string[] = [];
      if (!(await primitives.available())) return { ok: false, blockers: ['adapter-unavailable'] };
      const payload = serializeDurablePayloadR392({ version: CONCRETE_REPLICA_BACKEND_HEALTH_R393_VERSION, replica, probe: 'read-write-remove' });
      try {
        await primitives.write(keys.probe, payload);
        const readback = await primitives.read(keys.probe);
        if (readback !== payload) blockers.push('probe-readback-mismatch');
      } catch {
        blockers.push('probe-write-or-read-failed');
      }
      try {
        await primitives.remove(keys.probe);
        const after = await primitives.read(keys.probe);
        if (after !== null) blockers.push('probe-cleanup-not-empty');
      } catch {
        blockers.push('probe-cleanup-failed');
      }
      return { ok: blockers.length === 0, blockers: unique(blockers) };
    }
  };
}

export function createNativeInternalBackendR393(namespace: string, primitives: ReplicaBackendPrimitivesR393) {
  return createConcreteReplicaBackendR393('native-internal', namespace, primitives);
}
export function createIndexedDbBackendR393(namespace: string, primitives: ReplicaBackendPrimitivesR393) {
  return createConcreteReplicaBackendR393('indexeddb', namespace, primitives);
}
export function createLocalFallbackBackendR393(namespace: string, primitives: ReplicaBackendPrimitivesR393) {
  return createConcreteReplicaBackendR393('local-fallback', namespace, primitives);
}

export async function probeAndUpdateHealthR393(backend: ConcreteReplicaBackendR393, health: ReplicaHealthR393) {
  const result = await backend.probe();
  if (result.ok) return { result, health: observeReplicaHealthR393(health, { event: 'PROBE_SUCCESS' }) };
  const classified = blockersToHealthEvent(result.blockers) ?? { event: 'WRITE_FAILURE' as const, blocker: result.blockers[0] ?? 'probe-failed' };
  return { result, health: observeReplicaHealthR393(health, classified) };
}

export async function auditReplicaHealthR393<T>(
  backend: ConcreteReplicaBackendR393,
  currentHealth: ReplicaHealthR393,
  context: AtomicCommitVerificationContextR389
): Promise<ReplicaHealthAuditR393<T>> {
  let available = false;
  try {
    // `readDurableReplicaR392` will do the authoritative slot reads. This availability
    // probe is operational only and cannot create authority.
    const probe = await backend.probe();
    available = probe.ok;
  } catch {
    available = false;
  }
  let health = available
    ? observeReplicaHealthR393(currentHealth, { event: 'PROBE_SUCCESS' })
    : observeReplicaHealthR393(currentHealth, { event: 'ADAPTER_UNAVAILABLE', blocker: 'probe-failed' });

  const durable = await readDurableReplicaR392<T>(backend.adapter, context);
  health = durable.committedVerified
    ? observeReplicaHealthR393(health, { event: 'VERIFIED_READ' })
    : healthFromDurableOutcomeR393(health, { verified: false, blockers: durable.blockers, operation: 'read' });

  return {
    replica: backend.replica,
    health,
    policy: operationalPolicyR393(health, durable.committedVerified),
    committedVerified: durable.committedVerified,
    stagedVerified: durable.stagedVerified,
    blockers: unique(durable.blockers),
    durableState: durable.state
  };
}
